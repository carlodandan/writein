use chrono::Utc;
use rusqlite::Connection;
use std::collections::HashMap;
use std::fs;
use std::path::Path;

use crate::db::character_repo::{create_character, list_characters};
use crate::db::location_repo::{create_location, list_locations};
use crate::db::manuscript_repo::{
    create_node, get_document, get_manuscript_tree, recalculate_project_word_count, save_document,
};
use crate::db::note_repo::{create_note, list_notes};
use crate::db::project_repo::{create_project, get_project};
use crate::db::settings_repo::get_all_settings;
use crate::db::timeline_repo::{create_timeline_event, list_timeline_events};
use crate::db::worldbuilding_repo::{create_worldbuilding_entry, list_worldbuilding_entries};
use crate::models::{
    AppError, BackupFileInfo, BackupResult, CreateCharacterInput, CreateLocationInput,
    CreateNodeInput, CreateNoteInput, CreateProjectInput, CreateTimelineEventInput,
    CreateWorldbuildingInput, Project, ProjectBackupBundle, SaveDocumentInput,
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
    let locations = list_locations(conn, project_id)?;
    let worldbuilding = list_worldbuilding_entries(conn, project_id, None)?;
    let timeline = list_timeline_events(conn, project_id, None)?;
    let notes = list_notes(conn, project_id, None, false)?;
    let settings = get_all_settings(conn)?;

    let bundle = ProjectBackupBundle {
        version: "1.0.0".to_string(),
        exported_at: Utc::now().to_rfc3339(),
        project: project.clone(),
        nodes: tree,
        documents,
        characters,
        relationships: Vec::new(),
        locations,
        worldbuilding,
        timeline,
        notes,
        writing_goals: Vec::new(),
        writing_sessions: Vec::new(),
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
    conn: &Connection,
    backup_json: &str,
) -> Result<Project, AppError> {
    let bundle: ProjectBackupBundle = serde_json::from_str(backup_json)
        .map_err(|e| AppError::Validation(format!("Invalid .writein backup file: {}", e)))?;

    // Create a new project with restored title
    let new_title = format!("{} (Restored)", bundle.project.title);
    let new_proj = create_project(
        conn,
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

    // Sort nodes to ensure parents are created before children
    let mut sorted_nodes = bundle.nodes.clone();
    sorted_nodes.sort_by_key(|n| if n.parent_id.is_none() { 0 } else { 1 });

    for old_node in sorted_nodes {
        let parent_id = old_node.parent_id.and_then(|p| node_id_map.get(&p).cloned());

        let created_node = create_node(
            conn,
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
            let _ = save_document(
                conn,
                SaveDocumentInput {
                    node_id: created_node.id.clone(),
                    content_json: doc.content_json.clone(),
                    content_text: doc.content_text.clone(),
                    word_count: doc.word_count,
                    character_count: doc.character_count,
                },
            );
        }
    }

    // Restore characters
    for c in bundle.characters {
        let _ = create_character(
            conn,
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
        );
    }

    // Restore locations
    for loc in bundle.locations {
        let _ = create_location(
            conn,
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
        );
    }

    // Restore worldbuilding
    for entry in bundle.worldbuilding {
        let _ = create_worldbuilding_entry(
            conn,
            CreateWorldbuildingInput {
                project_id: new_proj.id.clone(),
                category: entry.category,
                title: entry.title,
                content: Some(entry.content),
                tags: entry.tags,
            },
        );
    }

    // Restore timeline
    for event in bundle.timeline {
        let _ = create_timeline_event(
            conn,
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
        );
    }

    // Restore notes
    for note in bundle.notes {
        let _ = create_note(
            conn,
            CreateNoteInput {
                project_id: new_proj.id.clone(),
                category: Some(note.category),
                title: note.title,
                content: Some(note.content),
                tags: note.tags,
            },
        );
    }

    recalculate_project_word_count(conn, &new_proj.id)?;

    get_project(conn, &new_proj.id)
}

pub fn list_backups(base_dir: &Path, _project_id: Option<&str>) -> Result<Vec<BackupFileInfo>, AppError> {
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

    fn setup_test_db() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();
        conn
    }

    #[test]
    fn test_backup_and_restore_roundtrip() {
        let conn = setup_test_db();
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

        let ch = create_node(
            &conn,
            CreateNodeInput {
                project_id: proj.id.clone(),
                parent_id: None,
                node_type: NodeType::Chapter,
                title: "Chapter 1: The Storm".into(),
                synopsis: None,
            },
        )
        .unwrap();

        save_document(
            &conn,
            SaveDocumentInput {
                node_id: ch.id.clone(),
                content_json: String::new(),
                content_text: "Lightning struck the high spires.".into(),
                word_count: 5,
                character_count: 34,
            },
        )
        .unwrap();

        let temp_dir = std::env::temp_dir().join("writein_backup_test");
        let _ = fs::create_dir_all(&temp_dir);

        // 1. Create backup
        let backup = create_project_backup(&conn, &temp_dir, &proj.id).unwrap();
        assert!(backup.content_json.contains("Original Epic"));
        assert!(backup.content_json.contains("Lightning struck the high spires."));

        // 2. Restore backup
        let restored_proj = restore_project_backup(&conn, &backup.content_json).unwrap();
        assert_eq!(restored_proj.title, "Original Epic (Restored)");

        // Verify tree in restored project
        let restored_tree = get_manuscript_tree(&conn, &restored_proj.id).unwrap();
        assert_eq!(restored_tree.len(), 1);
        assert_eq!(restored_tree[0].title, "Chapter 1: The Storm");

        // 3. List backups
        let list = list_backups(&temp_dir, None).unwrap();
        assert!(list.iter().any(|b| b.file_name == backup.file_name));

        // 4. Delete backup
        let deleted = delete_backup_file(&temp_dir, &backup.file_name).unwrap();
        assert!(deleted);
    }
}
