use chrono::Utc;
use rusqlite::Connection;
use std::collections::HashMap;
use std::fs;
use std::path::Path;

use crate::db::character_repo::{create_character, list_characters, list_relationships};
use crate::db::goals_repo::list_goals;
use crate::db::location_repo::{create_location, list_locations};
use crate::db::manuscript_repo::{
    create_node, get_document, get_manuscript_tree, recalculate_project_word_count, save_document,
};
use crate::db::note_repo::{create_note, list_notes};
use crate::db::project_repo::{create_project, get_project};
use crate::db::session_repo::list_sessions;
use crate::db::settings_repo::get_all_settings;
use crate::db::timeline_repo::{create_timeline_event, list_timeline_events};
use crate::db::worldbuilding_repo::{create_worldbuilding_entry, list_worldbuilding_entries};
use crate::models::{
    AppError, BackupFileInfo, BackupResult, CharacterRelationship, CreateCharacterInput,
    CreateLocationInput, CreateNodeInput, CreateNoteInput, CreateProjectInput,
    CreateTimelineEventInput, CreateWorldbuildingInput, Project, ProjectBackupBundle,
    SaveDocumentInput,
};

pub fn create_project_backup(
    conn: &Connection,
    base_dir: &Path,
    project_id: &str,
) -> Result<BackupResult, AppError> {
    let project = get_project(conn, project_id)?;
    let tree = get_manuscript_tree(conn, project_id)?;

    let mut documents = HashMap::new();
    for node in &tree {
        if let Ok(doc) = get_document(conn, &node.id) {
            documents.insert(node.id.clone(), doc);
        }
    }

    let characters = list_characters(conn, project_id)?;
    let relationships = list_relationships(conn, project_id)?
        .into_iter()
        .map(|relationship| CharacterRelationship {
            id: relationship.id,
            project_id: relationship.project_id,
            character_a_id: relationship.character_a_id,
            character_b_id: relationship.character_b_id,
            relation_type: relationship.relation_type,
            description: relationship.description,
            created_at: relationship.created_at,
        })
        .collect();
    let locations = list_locations(conn, project_id)?;
    let worldbuilding = list_worldbuilding_entries(conn, project_id, None)?;
    let timeline = list_timeline_events(conn, project_id, None)?;
    let notes = list_notes(conn, project_id, None, false)?;
    let writing_goals = list_goals(conn, project_id)?;
    let writing_sessions = list_sessions(conn, project_id, -1)?;
    let settings = get_all_settings(conn)?;

    let bundle = ProjectBackupBundle {
        version: "1.0.0".to_string(),
        exported_at: Utc::now().to_rfc3339(),
        project: project.clone(),
        nodes: tree,
        documents,
        characters,
        relationships,
        locations,
        worldbuilding,
        timeline,
        notes,
        writing_goals,
        writing_sessions,
        settings,
    };

    let content_json = serde_json::to_string_pretty(&bundle)
        .map_err(|e| AppError::Internal(format!("Failed to serialize backup: {}", e)))?;

    let safe_title: String = project
        .title
        .to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '_' })
        .collect();
    let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
    let file_name = format!("{safe_title}_{timestamp}.writein");

    let backups_dir = base_dir.join("backups");
    let _ = fs::create_dir_all(&backups_dir);
    let file_path = backups_dir.join(&file_name);

    let path_str = if fs::write(&file_path, &content_json).is_ok() {
        Some(file_path.to_string_lossy().to_string())
    } else {
        None
    };

    Ok(BackupResult {
        file_name,
        file_path: path_str,
        content_json,
    })
}

pub fn restore_project_backup(
    conn: &mut Connection,
    backup_json: &str,
) -> Result<Project, AppError> {
    let bundle: ProjectBackupBundle = serde_json::from_str(backup_json)
        .map_err(|e| AppError::Validation(format!("Invalid .writein backup file: {}", e)))?;
    let tx = conn.transaction()?;

    // Create a new project with restored title
    let new_title = format!("{} (Restored)", bundle.project.title);
    let new_proj = create_project(
        &tx,
        CreateProjectInput {
            title: new_title,
            subtitle: bundle.project.subtitle,
            author: bundle.project.author,
            description: bundle.project.description,
            genre: bundle.project.genre,
            target_word_count: Some(bundle.project.target_word_count),
        },
    )?;

    // Map old node IDs to new node IDs
    let mut node_id_map: HashMap<String, String> = HashMap::new();

    // Process nodes in passes so a node is only created after its parent. If no
    // node can be processed, the backup contains a cycle or a missing parent.
    let mut pending_nodes = bundle.nodes.clone();
    while !pending_nodes.is_empty() {
        let mut next_pass = Vec::new();
        let mut made_progress = false;

        for old_node in pending_nodes {
            let parent_id = match old_node.parent_id.as_ref() {
                Some(old_parent_id) => match node_id_map.get(old_parent_id) {
                    Some(new_parent_id) => Some(new_parent_id.clone()),
                    None => {
                        next_pass.push(old_node);
                        continue;
                    }
                },
                None => None,
            };

            let created_node = create_node(
                &tx,
                CreateNodeInput {
                    project_id: new_proj.id.clone(),
                    parent_id,
                    node_type: old_node.node_type,
                    title: old_node.title,
                    synopsis: old_node.synopsis,
                },
            )?;

            node_id_map.insert(old_node.id.clone(), created_node.id.clone());

            // Restore document content if exists
            if let Some(doc) = bundle.documents.get(&old_node.id) {
                save_document(
                    &tx,
                    SaveDocumentInput {
                        node_id: created_node.id.clone(),
                        content_json: doc.content_json.clone(),
                        content_text: doc.content_text.clone(),
                        word_count: doc.word_count,
                        character_count: doc.character_count,
                    },
                )?;
            }
            made_progress = true;
        }

        if !made_progress {
            return Err(AppError::Validation(
                "Backup manuscript hierarchy contains a cycle or missing parent".to_string(),
            ));
        }
        pending_nodes = next_pass;
    }

    // Restore characters
    for c in bundle.characters {
        create_character(
            &tx,
            CreateCharacterInput {
                project_id: new_proj.id.clone(),
                name: c.name,
                nickname: c.nickname,
                role: Some(c.role),
                age: c.age,
                description: c.description,
                personality: c.personality,
                appearance: c.appearance,
                background: c.background,
                motivations: c.motivations,
                fears: c.fears,
                goals: c.goals,
                notes: c.notes,
                avatar_path: c.avatar_path,
                tags: c.tags,
                custom_fields_json: c.custom_fields_json,
            },
        )?;
    }

    // Restore locations
    for loc in bundle.locations {
        create_location(
            &tx,
            CreateLocationInput {
                project_id: new_proj.id.clone(),
                name: loc.name,
                location_type: loc.location_type,
                description: loc.description,
                appearance: loc.appearance,
                atmosphere: loc.atmosphere,
                inhabitants: loc.inhabitants,
                notes: loc.notes,
                map_path: loc.map_path,
                tags: loc.tags,
            },
        )?;
    }

    // Restore worldbuilding
    for entry in bundle.worldbuilding {
        create_worldbuilding_entry(
            &tx,
            CreateWorldbuildingInput {
                project_id: new_proj.id.clone(),
                category: entry.category,
                title: entry.title,
                content: Some(entry.content),
                tags: entry.tags,
            },
        )?;
    }

    // Restore timeline
    for event in bundle.timeline {
        create_timeline_event(
            &tx,
            CreateTimelineEventInput {
                project_id: new_proj.id.clone(),
                title: event.title,
                event_date: event.event_date,
                date_value: event.date_value,
                date_label: event.date_label,
                time_value: event.time_value,
                order_index: Some(event.order_index),
                description: event.description,
                location_id: event.location_id,
                importance: Some(event.importance),
                related_chapter_id: event.related_chapter_id,
                character_ids: Some(event.character_ids),
                tags: event.tags,
            },
        )?;
    }

    // Restore notes
    for note in bundle.notes {
        create_note(
            &tx,
            CreateNoteInput {
                project_id: new_proj.id.clone(),
                category: Some(note.category),
                title: note.title,
                content: Some(note.content),
                tags: note.tags,
            },
        )?;
    }

    recalculate_project_word_count(&tx, &new_proj.id)?;

    let restored_project = get_project(&tx, &new_proj.id)?;
    tx.commit()?;
    Ok(restored_project)
}

pub fn list_backups(
    base_dir: &Path,
    _project_id: Option<&str>,
) -> Result<Vec<BackupFileInfo>, AppError> {
    let backups_dir = base_dir.join("backups");
    if !backups_dir.exists() {
        return Ok(Vec::new());
    }

    let entries = fs::read_dir(&backups_dir)
        .map_err(|e| AppError::Internal(format!("Failed to read backups directory: {}", e)))?;

    let mut result = Vec::new();
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("writein") {
            let meta = entry.metadata().ok();
            let size = meta.as_ref().map(|m| m.len()).unwrap_or(0);
            let created = meta
                .and_then(|m| m.created().ok())
                .map(|t| chrono::DateTime::<Utc>::from(t).to_rfc3339())
                .unwrap_or_else(|| Utc::now().to_rfc3339());

            result.push(BackupFileInfo {
                file_name: entry.file_name().to_string_lossy().to_string(),
                file_path: path.to_string_lossy().to_string(),
                file_size_bytes: size,
                created_at: created,
            });
        }
    }

    result.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(result)
}

pub fn delete_backup_file(base_dir: &Path, file_name: &str) -> Result<bool, AppError> {
    // Sanitize filename against directory traversal
    if file_name.contains('/') || file_name.contains('\\') || file_name.contains("..") {
        return Err(AppError::Validation("Invalid backup file name".into()));
    }

    let file_path = base_dir.join("backups").join(file_name);
    if file_path.exists() {
        fs::remove_file(file_path)?;
        Ok(true)
    } else {
        Ok(false)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::migrations::run_migrations;
    use crate::models::{CreateNodeInput, CreateProjectInput, NodeType, SaveDocumentInput};
    use rusqlite::params;

    fn setup_test_db() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();
        conn
    }

    #[test]
    fn test_backup_and_restore_roundtrip() {
        let mut conn = setup_test_db();
        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Original Epic".into(),
                subtitle: Some("A Legend".into()),
                author: Some("Brandon S.".into()),
                description: Some("An epic tale.".into()),
                genre: Some("High Fantasy".into()),
                target_word_count: Some(100000),
            },
        )
        .unwrap();

        let part = create_node(
            &conn,
            CreateNodeInput {
                project_id: proj.id.clone(),
                parent_id: None,
                node_type: NodeType::Part,
                title: "Part One".into(),
                synopsis: None,
            },
        )
        .unwrap();
        let ch = create_node(
            &conn,
            CreateNodeInput {
                project_id: proj.id.clone(),
                parent_id: Some(part.id.clone()),
                node_type: NodeType::Chapter,
                title: "Chapter 1: The Storm".into(),
                synopsis: None,
            },
        )
        .unwrap();
        let scene = create_node(
            &conn,
            CreateNodeInput {
                project_id: proj.id.clone(),
                parent_id: Some(ch.id.clone()),
                node_type: NodeType::Scene,
                title: "The Lightning".into(),
                synopsis: None,
            },
        )
        .unwrap();

        save_document(
            &conn,
            SaveDocumentInput {
                node_id: scene.id.clone(),
                content_json: String::new(),
                content_text: "Lightning struck the high spires.".into(),
                word_count: 5,
                character_count: 34,
            },
        )
        .unwrap();

        conn.execute(
            "INSERT INTO characters (id, project_id, name, role, created_at, updated_at)
             VALUES ('char-a', ?1, 'A', 'protagonist', 'now', 'now'),
                    ('char-b', ?1, 'B', 'supporting', 'now', 'now')",
            params![proj.id],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO character_relationships
             (id, project_id, character_a_id, character_b_id, relation_type, created_at)
             VALUES ('rel', ?1, 'char-a', 'char-b', 'ally', 'now')",
            params![proj.id],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO writing_goals
             (id, project_id, goal_type, target_words, current_words, is_active, created_at)
             VALUES ('goal', ?1, 'daily', 500, 25, 1, 'now')",
            params![proj.id],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO writing_sessions
             (id, project_id, node_id, started_at, duration_seconds, words_written)
             VALUES ('session', ?1, ?2, 'now', 60, 25)",
            params![proj.id, scene.id],
        )
        .unwrap();

        let temp_dir = std::env::temp_dir().join("writein_backup_test");
        let _ = fs::create_dir_all(&temp_dir);

        // 1. Create backup
        let backup = create_project_backup(&conn, &temp_dir, &proj.id).unwrap();
        assert!(backup.content_json.contains("Original Epic"));
        assert!(backup
            .content_json
            .contains("Lightning struck the high spires."));
        let mut bundle: ProjectBackupBundle = serde_json::from_str(&backup.content_json).unwrap();
        assert_eq!(bundle.relationships.len(), 1);
        assert_eq!(bundle.writing_goals.len(), 1);
        assert_eq!(bundle.writing_sessions.len(), 1);

        // 2. Restore a deliberately child-first archive.
        bundle.nodes.reverse();
        let child_first_json = serde_json::to_string(&bundle).unwrap();
        let restored_proj = restore_project_backup(&mut conn, &child_first_json).unwrap();
        assert_eq!(restored_proj.title, "Original Epic (Restored)");

        // Verify tree in restored project
        let restored_tree = get_manuscript_tree(&conn, &restored_proj.id).unwrap();
        assert_eq!(restored_tree.len(), 3);
        let restored_part = restored_tree
            .iter()
            .find(|n| n.title == "Part One")
            .unwrap();
        let restored_chapter = restored_tree
            .iter()
            .find(|n| n.title == "Chapter 1: The Storm")
            .unwrap();
        let restored_scene = restored_tree
            .iter()
            .find(|n| n.title == "The Lightning")
            .unwrap();
        assert_eq!(restored_chapter.parent_id.as_ref(), Some(&restored_part.id));
        assert_eq!(
            restored_scene.parent_id.as_ref(),
            Some(&restored_chapter.id)
        );

        // A cyclic archive must fail without leaving its newly-created project behind.
        let project_count_before: i64 = conn
            .query_row("SELECT COUNT(*) FROM projects", [], |row| row.get(0))
            .unwrap();
        bundle.nodes[0].parent_id = Some(bundle.nodes[0].id.clone());
        let cyclic_json = serde_json::to_string(&bundle).unwrap();
        assert!(restore_project_backup(&mut conn, &cyclic_json).is_err());
        let project_count_after: i64 = conn
            .query_row("SELECT COUNT(*) FROM projects", [], |row| row.get(0))
            .unwrap();
        assert_eq!(project_count_after, project_count_before);

        // 3. List backups
        let list = list_backups(&temp_dir, None).unwrap();
        assert!(list.iter().any(|b| b.file_name == backup.file_name));

        // 4. Delete backup
        let deleted = delete_backup_file(&temp_dir, &backup.file_name).unwrap();
        assert!(deleted);
    }
}
