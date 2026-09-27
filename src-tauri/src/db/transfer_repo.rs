use base64::Engine;
use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use uuid::Uuid;

use crate::db::attachment_repo::{detect_file_type, detect_mime_type, list_attachments, sanitize_filename};
use crate::db::character_repo::{create_character, list_characters, list_relationships};
use crate::db::goals_repo::list_goals;
use crate::db::location_repo::{create_location, list_locations};
use crate::db::manuscript_repo::{
    create_node, get_document, get_manuscript_tree, recalculate_project_word_count, save_document,
};
use crate::db::note_repo::{create_note, list_notes};
use crate::db::project_repo::{create_project, list_projects};
use crate::db::settings_repo::{get_setting, save_setting};
use crate::db::tag_repo::list_tags;
use crate::db::timeline_repo::{create_timeline_event, list_timeline_events};
use crate::db::worldbuilding_repo::{create_worldbuilding_entry, list_worldbuilding_entries};
use crate::models::{
    AppError, AttachmentTransferItem, CharacterRelationship, CreateCharacterInput,
    CreateLocationInput, CreateNodeInput, CreateNoteInput, CreateProjectInput,
    CreateTimelineEventInput, CreateWorldbuildingInput, LibraryTransferData,
    LibraryTransferPackage, NodeType, SaveDocumentInput, Tag, TransferLogItem,
    TransferManifest, TransferStats,
};

pub fn get_or_create_device_id(conn: &Connection) -> Result<String, AppError> {
    if let Ok(Some(existing_id)) = get_setting(conn, "device_id") {
        let trimmed = existing_id.trim();
        if !trimmed.is_empty() {
            return Ok(trimmed.to_string());
        }
    }

    let new_id = Uuid::new_v4().to_string();
    let _ = save_setting(conn, "device_id", &new_id);
    Ok(new_id)
}

pub fn log_transfer(
    conn: &Connection,
    session_id: &str,
    direction: &str,
    peer_device_id: Option<&str>,
    stats: &TransferStats,
) -> Result<TransferLogItem, AppError> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let stats_json = serde_json::to_string(stats).unwrap_or_else(|_| "{}".to_string());

    conn.execute(
        "INSERT INTO transfer_logs (id, session_id, direction, peer_device_id, stats_json, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![id, session_id, direction, peer_device_id, stats_json, now],
    )?;

    Ok(TransferLogItem {
        id,
        session_id: session_id.to_string(),
        direction: direction.to_string(),
        peer_device_id: peer_device_id.map(|s| s.to_string()),
        stats_json,
        created_at: now,
    })
}

pub fn list_transfer_logs(conn: &Connection) -> Result<Vec<TransferLogItem>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, session_id, direction, peer_device_id, stats_json, created_at
         FROM transfer_logs
         ORDER BY created_at DESC
         LIMIT 50",
    )?;

    let iter = stmt.query_map([], |row| {
        Ok(TransferLogItem {
            id: row.get(0)?,
            session_id: row.get(1)?,
            direction: row.get(2)?,
            peer_device_id: row.get(3)?,
            stats_json: row.get(4)?,
            created_at: row.get(5)?,
        })
    })?;

    let mut logs = Vec::new();
    for l in iter {
        logs.push(l?);
    }
    Ok(logs)
}

pub fn export_library_transfer_package(
    conn: &Connection,
    base_dir: &Path,
) -> Result<LibraryTransferPackage, AppError> {
    let source_device_id = get_or_create_device_id(conn)?;
    let projects = list_projects(conn)?;

    let mut all_nodes = Vec::new();
    let mut all_documents = HashMap::new();
    let mut all_characters = Vec::new();
    let mut all_relationships = Vec::new();
    let mut all_locations = Vec::new();
    let mut all_worldbuilding = Vec::new();
    let mut all_timeline = Vec::new();
    let mut all_notes = Vec::new();
    let mut all_tags = Vec::new();
    let mut all_goals = Vec::new();
    let mut all_attachments = Vec::new();

    for proj in &projects {
        let tree = get_manuscript_tree(conn, &proj.id)?;
        for node in &tree {
            if let Ok(doc) = get_document(conn, &node.id) {
                all_documents.insert(node.id.clone(), doc);
            }
        }
        all_nodes.extend(tree);

        all_characters.extend(list_characters(conn, &proj.id)?);

        let relationships = list_relationships(conn, &proj.id)?
            .into_iter()
            .map(|r| CharacterRelationship {
                id: r.id,
                project_id: r.project_id,
                character_a_id: r.character_a_id,
                character_b_id: r.character_b_id,
                relation_type: r.relation_type,
                description: r.description,
                created_at: r.created_at,
            });
        all_relationships.extend(relationships);

        all_locations.extend(list_locations(conn, &proj.id)?);
        all_worldbuilding.extend(list_worldbuilding_entries(conn, &proj.id, None)?);
        all_timeline.extend(list_timeline_events(conn, &proj.id, None)?);
        all_notes.extend(list_notes(conn, &proj.id, None, false)?);
        let tags = list_tags(conn, &proj.id)?
            .into_iter()
            .map(|t| Tag {
                id: t.id,
                project_id: t.project_id,
                name: t.name,
                color: t.color,
            });
        all_tags.extend(tags);
        all_goals.extend(list_goals(conn, &proj.id)?);

        if let Ok(raw_attachments) = list_attachments(conn, &proj.id, None, None) {
            for att in raw_attachments {
                let project_attachment_file = base_dir
                    .join("projects")
                    .join(&proj.id)
                    .join("attachments")
                    .join(&att.id)
                    .join(&att.file_name);

                let target_path = if project_attachment_file.exists() {
                    project_attachment_file
                } else {
                    Path::new(&att.file_path).to_path_buf()
                };

                let base64_data = if target_path.exists() {
                    fs::read(&target_path)
                        .ok()
                        .map(|bytes| base64::engine::general_purpose::STANDARD.encode(&bytes))
                } else {
                    None
                };

                all_attachments.push(AttachmentTransferItem {
                    attachment: att,
                    base64_data,
                });
            }
        }
    }

    let chapters_count = all_nodes
        .iter()
        .filter(|n| n.node_type == NodeType::Chapter)
        .count() as i64;

    let stats = TransferStats {
        projects_count: projects.len() as i64,
        documents_count: all_documents.len() as i64,
        chapters_count,
        characters_count: all_characters.len() as i64,
        locations_count: all_locations.len() as i64,
        timeline_count: all_timeline.len() as i64,
        notes_count: all_notes.len() as i64,
        worldbuilding_count: all_worldbuilding.len() as i64,
        attachments_count: all_attachments.len() as i64,
    };

    let manifest = TransferManifest {
        format_version: "1.0.0".to_string(),
        writein_version: "4.1.0".to_string(),
        source_device_id,
        created_at: Utc::now().to_rfc3339(),
        stats: stats.clone(),
        checksum_sha256: None,
    };

    let _ = log_transfer(
        conn,
        &Uuid::new_v4().to_string(),
        "outgoing",
        None,
        &stats,
    );

    Ok(LibraryTransferPackage {
        manifest,
        data: LibraryTransferData {
            projects,
            nodes: all_nodes,
            documents: all_documents,
            characters: all_characters,
            relationships: all_relationships,
            locations: all_locations,
            worldbuilding: all_worldbuilding,
            timeline: all_timeline,
            notes: all_notes,
            tags: all_tags,
            writing_goals: all_goals,
            attachments: all_attachments,
        },
    })
}

pub fn import_library_transfer_package(
    conn: &mut Connection,
    base_dir: &Path,
    package_json: &str,
) -> Result<TransferStats, AppError> {
    let package: LibraryTransferPackage = serde_json::from_str(package_json)
        .map_err(|e| AppError::Validation(format!("Invalid transfer package: {}", e)))?;

    if package.manifest.format_version != "1.0.0" {
        return Err(AppError::Validation(format!(
            "Unsupported transfer format version: {}",
            package.manifest.format_version
        )));
    }

    let tx = conn.transaction()?;

    let mut project_id_map: HashMap<String, String> = HashMap::new();

    // 1. Process Projects
    for old_proj in package.data.projects {
        let existing: Option<String> = tx
            .query_row(
                "SELECT id FROM projects WHERE id = ?1 OR title = ?2",
                params![old_proj.id, old_proj.title],
                |row| row.get(0),
            )
            .optional()?;

        let new_title = if existing.is_some() {
            format!("{} (Transferred)", old_proj.title)
        } else {
            old_proj.title.clone()
        };

        let created_proj = create_project(
            &tx,
            CreateProjectInput {
                title: new_title,
                subtitle: old_proj.subtitle,
                author: old_proj.author,
                description: old_proj.description,
                genre: old_proj.genre,
                target_word_count: Some(old_proj.target_word_count),
            },
        )?;

        project_id_map.insert(old_proj.id, created_proj.id);
    }

    // 2. Process Manuscript Nodes & Documents
    let mut node_id_map: HashMap<String, String> = HashMap::new();
    let mut pending_nodes = package.data.nodes;

    while !pending_nodes.is_empty() {
        let mut next_pass = Vec::new();
        let mut made_progress = false;

        for old_node in pending_nodes {
            let mapped_project_id = match project_id_map.get(&old_node.project_id) {
                Some(p_id) => p_id.clone(),
                None => continue,
            };

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
                    project_id: mapped_project_id,
                    parent_id,
                    node_type: old_node.node_type,
                    title: old_node.title,
                    synopsis: old_node.synopsis,
                },
            )?;

            node_id_map.insert(old_node.id.clone(), created_node.id.clone());

            if let Some(doc) = package.data.documents.get(&old_node.id) {
                save_document(
                    &tx,
                    SaveDocumentInput {
                        node_id: created_node.id,
                        content_json: doc.content_json.clone(),
                        content_text: doc.content_text.clone(),
                        word_count: doc.word_count,
                        character_count: doc.character_count,
                    },
                )?;
            }
            made_progress = true;
        }

        if !made_progress && !next_pass.is_empty() {
            return Err(AppError::Validation(
                "Manuscript hierarchy contains circular reference or missing parent".to_string(),
            ));
        }
        pending_nodes = next_pass;
    }

    // 3. Process Characters
    let mut char_id_map: HashMap<String, String> = HashMap::new();
    for c in package.data.characters {
        if let Some(mapped_proj_id) = project_id_map.get(&c.project_id) {
            let created = create_character(
                &tx,
                CreateCharacterInput {
                    project_id: mapped_proj_id.clone(),
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
            char_id_map.insert(c.id, created.id);
        }
    }

    // 4. Process Character Relationships
    for rel in package.data.relationships {
        if let (Some(mapped_proj_id), Some(new_a), Some(new_b)) = (
            project_id_map.get(&rel.project_id),
            char_id_map.get(&rel.character_a_id),
            char_id_map.get(&rel.character_b_id),
        ) {
            let rel_id = Uuid::new_v4().to_string();
            let now = Utc::now().to_rfc3339();
            let _ = tx.execute(
                "INSERT INTO character_relationships (
                    id, project_id, character_a_id, character_b_id, relation_type, description, created_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    rel_id,
                    mapped_proj_id,
                    new_a,
                    new_b,
                    rel.relation_type,
                    rel.description,
                    now
                ],
            );
        }
    }

    // 5. Process Locations
    let mut loc_id_map: HashMap<String, String> = HashMap::new();
    for loc in package.data.locations {
        if let Some(mapped_proj_id) = project_id_map.get(&loc.project_id) {
            let created = create_location(
                &tx,
                CreateLocationInput {
                    project_id: mapped_proj_id.clone(),
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
            loc_id_map.insert(loc.id, created.id);
        }
    }

    // 6. Process Worldbuilding
    for wb in package.data.worldbuilding {
        if let Some(mapped_proj_id) = project_id_map.get(&wb.project_id) {
            create_worldbuilding_entry(
                &tx,
                CreateWorldbuildingInput {
                    project_id: mapped_proj_id.clone(),
                    category: wb.category,
                    title: wb.title,
                    content: Some(wb.content),
                    tags: wb.tags,
                },
            )?;
        }
    }

    // 7. Process Timeline
    for tl in package.data.timeline {
        if let Some(mapped_proj_id) = project_id_map.get(&tl.project_id) {
            let remapped_loc_id = tl.location_id.and_then(|id| loc_id_map.get(&id).cloned());
            let remapped_chapter_id = tl
                .related_chapter_id
                .and_then(|id| node_id_map.get(&id).cloned());
            let remapped_char_ids = tl
                .character_ids
                .into_iter()
                .filter_map(|cid| char_id_map.get(&cid).cloned())
                .collect();

            create_timeline_event(
                &tx,
                CreateTimelineEventInput {
                    project_id: mapped_proj_id.clone(),
                    title: tl.title,
                    event_date: tl.event_date,
                    date_value: tl.date_value,
                    date_label: tl.date_label,
                    time_value: tl.time_value,
                    order_index: Some(tl.order_index),
                    description: tl.description,
                    location_id: remapped_loc_id,
                    importance: Some(tl.importance),
                    related_chapter_id: remapped_chapter_id,
                    character_ids: Some(remapped_char_ids),
                    tags: tl.tags,
                },
            )?;
        }
    }

    // 8. Process Notes
    for n in package.data.notes {
        if let Some(mapped_proj_id) = project_id_map.get(&n.project_id) {
            create_note(
                &tx,
                CreateNoteInput {
                    project_id: mapped_proj_id.clone(),
                    category: Some(n.category),
                    title: n.title,
                    content: Some(n.content),
                    tags: n.tags,
                },
            )?;
        }
    }

    // 9. Process Tags
    for tag in package.data.tags {
        if let Some(mapped_proj_id) = project_id_map.get(&tag.project_id) {
            let tag_id = Uuid::new_v4().to_string();
            let _ = tx.execute(
                "INSERT INTO tags (id, project_id, name, color) VALUES (?1, ?2, ?3, ?4)
                 ON CONFLICT(project_id, name) DO NOTHING",
                params![tag_id, mapped_proj_id, tag.name, tag.color],
            );
        }
    }

    // 10. Process Writing Goals
    for g in package.data.writing_goals {
        if let Some(mapped_proj_id) = project_id_map.get(&g.project_id) {
            let goal_id = Uuid::new_v4().to_string();
            let now = Utc::now().to_rfc3339();
            let _ = tx.execute(
                "INSERT INTO writing_goals (
                    id, project_id, goal_type, target_words, current_words,
                    start_date, end_date, is_active, created_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    goal_id,
                    mapped_proj_id,
                    g.goal_type,
                    g.target_words,
                    g.current_words,
                    g.start_date,
                    g.end_date,
                    if g.is_active { 1 } else { 0 },
                    now
                ],
            );
        }
    }

    // 11. Process Attachments and write physical files to disk
    for item in package.data.attachments {
        let att = item.attachment;
        if let Some(mapped_proj_id) = project_id_map.get(&att.project_id) {
            let new_att_id = Uuid::new_v4().to_string();
            let safe_name = sanitize_filename(&att.file_name)?;
            let now = Utc::now().to_rfc3339();

            let remapped_entity_id = match att.entity_type.as_deref() {
                Some("character") => att.entity_id.and_then(|id| char_id_map.get(&id).cloned()),
                Some("location") => att.entity_id.and_then(|id| loc_id_map.get(&id).cloned()),
                Some("manuscript") | Some("chapter") => {
                    att.entity_id.and_then(|id| node_id_map.get(&id).cloned())
                }
                _ => att.entity_id,
            };

            let project_attachment_dir = base_dir
                .join("projects")
                .join(mapped_proj_id)
                .join("attachments")
                .join(&new_att_id);

            let disk_file_path = project_attachment_dir.join(&safe_name);
            let relative_path = format!("attachments/{}/{}", new_att_id, safe_name);

            if let Some(base64_str) = item.base64_data {
                if let Ok(file_bytes) =
                    base64::engine::general_purpose::STANDARD.decode(base64_str.trim())
                {
                    let _ = fs::create_dir_all(&project_attachment_dir);
                    let _ = fs::write(&disk_file_path, file_bytes);
                }
            }

            let ext = Path::new(&safe_name)
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("");
            let file_type = if att.file_type.is_empty() {
                detect_file_type(ext).to_string()
            } else {
                att.file_type
            };
            let mime_type = att
                .mime_type
                .unwrap_or_else(|| detect_mime_type(ext).to_string());

            let _ = tx.execute(
                "INSERT INTO attachments (
                    id, project_id, file_name, file_path, relative_path, file_type, mime_type,
                    file_size, entity_type, entity_id, description, created_at, updated_at
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                params![
                    new_att_id,
                    mapped_proj_id,
                    safe_name,
                    disk_file_path.to_string_lossy().to_string(),
                    relative_path,
                    file_type,
                    mime_type,
                    att.file_size,
                    att.entity_type,
                    remapped_entity_id,
                    att.description,
                    now,
                    now
                ],
            );
        }
    }

    // Recalculate word counts for each newly mapped project
    for new_proj_id in project_id_map.values() {
        let _ = recalculate_project_word_count(&tx, new_proj_id);
    }

    // Log the incoming transfer
    let _ = log_transfer(
        &tx,
        &Uuid::new_v4().to_string(),
        "incoming",
        Some(&package.manifest.source_device_id),
        &package.manifest.stats,
    );

    tx.commit()?;
    Ok(package.manifest.stats)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::migrations::run_migrations;
    use crate::models::{CreateNodeInput, CreateProjectInput, NodeType};
    use rusqlite::Connection;

    fn setup_test_db() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();
        conn
    }

    #[test]
    fn test_device_id_generation_and_persistence() {
        let conn = setup_test_db();
        let dev1 = get_or_create_device_id(&conn).unwrap();
        assert!(!dev1.is_empty());

        let dev2 = get_or_create_device_id(&conn).unwrap();
        assert_eq!(dev1, dev2);
    }

    #[test]
    fn test_library_export_and_import_roundtrip() {
        let conn_a = setup_test_db();
        let temp_dir_a = std::env::temp_dir().join("writein_test_export_a");
        let temp_dir_b = std::env::temp_dir().join("writein_test_export_b");
        let _ = fs::create_dir_all(&temp_dir_a);
        let _ = fs::create_dir_all(&temp_dir_b);

        let proj = create_project(
            &conn_a,
            CreateProjectInput {
                title: "Galactic Chronicle".into(),
                subtitle: Some("Starfarers".into()),
                author: Some("Arthur C.".into()),
                description: Some("Space exploration epic".into()),
                genre: Some("Sci-Fi".into()),
                target_word_count: Some(80000),
            },
        )
        .unwrap();

        let ch = create_node(
            &conn_a,
            CreateNodeInput {
                project_id: proj.id.clone(),
                parent_id: None,
                node_type: NodeType::Chapter,
                title: "Chapter 1: The Launch".into(),
                synopsis: Some("Rocket takes off".into()),
            },
        )
        .unwrap();

        save_document(
            &conn_a,
            SaveDocumentInput {
                node_id: ch.id.clone(),
                content_json: "{\"type\":\"doc\"}".into(),
                content_text: "The engines ignited with deafening roar.".into(),
                word_count: 6,
                character_count: 40,
            },
        )
        .unwrap();

        let package = export_library_transfer_package(&conn_a, &temp_dir_a).unwrap();
        assert_eq!(package.manifest.stats.projects_count, 1);
        assert_eq!(package.manifest.stats.chapters_count, 1);
        assert_eq!(package.manifest.stats.documents_count, 1);

        let package_json = serde_json::to_string(&package).unwrap();

        // Import on Machine B
        let mut conn_b = setup_test_db();
        let imported_stats =
            import_library_transfer_package(&mut conn_b, &temp_dir_b, &package_json).unwrap();
        assert_eq!(imported_stats.projects_count, 1);

        let projs_b = list_projects(&conn_b).unwrap();
        assert_eq!(projs_b.len(), 1);
        assert_eq!(projs_b[0].title, "Galactic Chronicle");

        let nodes_b = get_manuscript_tree(&conn_b, &projs_b[0].id).unwrap();
        assert_eq!(nodes_b.len(), 1);
        assert_eq!(nodes_b[0].title, "Chapter 1: The Launch");

        let doc_b = get_document(&conn_b, &nodes_b[0].id).unwrap();
        assert_eq!(doc_b.content_text, "The engines ignited with deafening roar.");

        // Safe collision test: re-importing the same package should safely rename
        let reimport_stats =
            import_library_transfer_package(&mut conn_b, &temp_dir_b, &package_json).unwrap();
        assert_eq!(reimport_stats.projects_count, 1);

        let all_b = list_projects(&conn_b).unwrap();
        assert_eq!(all_b.len(), 2);
        assert!(all_b.iter().any(|p| p.title == "Galactic Chronicle (Transferred)"));
    }
}
