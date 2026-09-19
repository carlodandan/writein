use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;
use chrono::Utc;

use crate::models::{
    AppError, CreateNodeInput, DocumentContent, ManuscriptNode, MoveNodeInput, NodeType,
    ReorderItem, SaveDocumentInput, UpdateNodeInput,
};

pub fn get_manuscript_tree(
    conn: &Connection,
    project_id: &str,
) -> Result<Vec<ManuscriptNode>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, parent_id, node_type, title, synopsis,
                sort_order, status, word_count, created_at, updated_at, archived_at
         FROM manuscript_nodes
         WHERE project_id = ?1 AND archived_at IS NULL
         ORDER BY sort_order ASC, created_at ASC",
    )?;

    let node_iter = stmt.query_map(params![project_id], |row| {
        let type_str: String = row.get(3)?;
        Ok(ManuscriptNode {
            id: row.get(0)?,
            project_id: row.get(1)?,
            parent_id: row.get(2)?,
            node_type: NodeType::from_str(&type_str),
            title: row.get(4)?,
            synopsis: row.get(5)?,
            sort_order: row.get(6)?,
            status: row.get(7)?,
            word_count: row.get(8)?,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
            archived_at: row.get(11)?,
        })
    })?;

    let mut nodes = Vec::new();
    for n in node_iter {
        nodes.push(n?);
    }
    Ok(nodes)
}

pub fn get_node(conn: &Connection, id: &str) -> Result<ManuscriptNode, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, parent_id, node_type, title, synopsis,
                sort_order, status, word_count, created_at, updated_at, archived_at
         FROM manuscript_nodes
         WHERE id = ?1",
    )?;

    let node = stmt
        .query_row(params![id], |row| {
            let type_str: String = row.get(3)?;
            Ok(ManuscriptNode {
                id: row.get(0)?,
                project_id: row.get(1)?,
                parent_id: row.get(2)?,
                node_type: NodeType::from_str(&type_str),
                title: row.get(4)?,
                synopsis: row.get(5)?,
                sort_order: row.get(6)?,
                status: row.get(7)?,
                word_count: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
                archived_at: row.get(11)?,
            })
        })
        .optional()?;

    node.ok_or_else(|| AppError::NotFound(format!("Manuscript node {} not found", id)))
}

pub fn create_node(conn: &Connection, input: CreateNodeInput) -> Result<ManuscriptNode, AppError> {
    if input.title.trim().is_empty() {
        return Err(AppError::Validation("Node title cannot be empty".to_string()));
    }

    validate_hierarchy_rules(conn, &input.node_type, input.parent_id.as_deref())?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    // Calculate next sort_order within the parent
    let max_sort: i64 = match &input.parent_id {
        Some(pid) => conn.query_row(
            "SELECT COALESCE(MAX(sort_order), 0) FROM manuscript_nodes WHERE project_id = ?1 AND parent_id = ?2",
            params![input.project_id, pid],
            |r| r.get(0),
        )?,
        None => conn.query_row(
            "SELECT COALESCE(MAX(sort_order), 0) FROM manuscript_nodes WHERE project_id = ?1 AND parent_id IS NULL",
            params![input.project_id],
            |r| r.get(0),
        )?,
    };

    let next_sort = max_sort + 1;

    conn.execute(
        "INSERT INTO manuscript_nodes (
            id, project_id, parent_id, node_type, title, synopsis,
            order_index, sort_order, status, word_count, created_at, updated_at, archived_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            id,
            input.project_id,
            input.parent_id,
            input.node_type.as_str(),
            input.title.trim(),
            input.synopsis,
            next_sort,
            next_sort,
            "draft",
            0,
            now,
            now,
            Option::<String>::None
        ],
    )?;

    // Create corresponding blank document content
    let doc_id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO documents (
            id, node_id, content_json, content_text, word_count, character_count, last_edited_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![doc_id, id, "", "", 0, 0, now],
    )?;

    get_node(conn, &id)
}

pub fn update_node(
    conn: &Connection,
    id: &str,
    input: UpdateNodeInput,
) -> Result<ManuscriptNode, AppError> {
    let existing = get_node(conn, id)?;
    let now = Utc::now().to_rfc3339();

    let title = input.title.unwrap_or(existing.title);
    let synopsis = input.synopsis.or(existing.synopsis);
    let status = input.status.unwrap_or(existing.status);
    let sort_order = input.sort_order.unwrap_or(existing.sort_order);

    if title.trim().is_empty() {
        return Err(AppError::Validation("Node title cannot be empty".to_string()));
    }

    if let Some(ref new_parent) = input.parent_id {
        validate_move(conn, id, Some(new_parent.as_str()))?;
    }

    let parent_id = input.parent_id.or(existing.parent_id);

    conn.execute(
        "UPDATE manuscript_nodes SET
            title = ?1,
            synopsis = ?2,
            status = ?3,
            sort_order = ?4,
            order_index = ?4,
            parent_id = ?5,
            updated_at = ?6
         WHERE id = ?7",
        params![title.trim(), synopsis, status, sort_order, parent_id, now, id],
    )?;

    get_node(conn, id)
}

pub fn delete_node(conn: &Connection, id: &str) -> Result<(), AppError> {
    let node = get_node(conn, id)?;
    conn.execute("DELETE FROM manuscript_nodes WHERE id = ?1", params![id])?;

    // Refresh project word count after deleting node
    recalculate_project_word_count(conn, &node.project_id)?;

    Ok(())
}

pub fn duplicate_node(conn: &Connection, id: &str) -> Result<ManuscriptNode, AppError> {
    let original = get_node(conn, id)?;
    let new_title = format!("{} (Copy)", original.title);

    let created = create_node(
        conn,
        CreateNodeInput {
            project_id: original.project_id.clone(),
            parent_id: original.parent_id.clone(),
            node_type: original.node_type.clone(),
            title: new_title,
            synopsis: original.synopsis.clone(),
        },
    )?;

    // Duplicate document content if present
    if let Ok(orig_doc) = get_document(conn, id) {
        save_document(
            conn,
            SaveDocumentInput {
                node_id: created.id.clone(),
                content_json: orig_doc.content_json,
                content_text: orig_doc.content_text,
                word_count: orig_doc.word_count,
                character_count: orig_doc.character_count,
            },
        )?;
    }

    // Recursively duplicate child nodes
    let mut stmt = conn.prepare(
        "SELECT id FROM manuscript_nodes WHERE parent_id = ?1 AND archived_at IS NULL ORDER BY sort_order ASC",
    )?;
    let child_ids: Vec<String> = stmt
        .query_map(params![id], |r| r.get(0))?
        .filter_map(|r| r.ok())
        .collect();

    for child_id in child_ids {
        duplicate_child_node(conn, &child_id, &created.id, &created.project_id)?;
    }

    get_node(conn, &created.id)
}

fn duplicate_child_node(
    conn: &Connection,
    child_id: &str,
    new_parent_id: &str,
    project_id: &str,
) -> Result<(), AppError> {
    let child = get_node(conn, child_id)?;
    let new_child = create_node(
        conn,
        CreateNodeInput {
            project_id: project_id.to_string(),
            parent_id: Some(new_parent_id.to_string()),
            node_type: child.node_type.clone(),
            title: child.title.clone(),
            synopsis: child.synopsis.clone(),
        },
    )?;

    if let Ok(orig_doc) = get_document(conn, child_id) {
        save_document(
            conn,
            SaveDocumentInput {
                node_id: new_child.id.clone(),
                content_json: orig_doc.content_json,
                content_text: orig_doc.content_text,
                word_count: orig_doc.word_count,
                character_count: orig_doc.character_count,
            },
        )?;
    }

    // Recursively handle any nested children
    let mut stmt = conn.prepare(
        "SELECT id FROM manuscript_nodes WHERE parent_id = ?1 AND archived_at IS NULL ORDER BY sort_order ASC",
    )?;
    let grand_children: Vec<String> = stmt
        .query_map(params![child_id], |r| r.get(0))?
        .filter_map(|r| r.ok())
        .collect();

    for g_id in grand_children {
        duplicate_child_node(conn, &g_id, &new_child.id, project_id)?;
    }

    Ok(())
}

pub fn move_node(conn: &Connection, input: MoveNodeInput) -> Result<ManuscriptNode, AppError> {
    validate_move(conn, &input.node_id, input.target_parent_id.as_deref())?;

    let now = Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE manuscript_nodes SET
            parent_id = ?1,
            sort_order = ?2,
            order_index = ?2,
            updated_at = ?3
         WHERE id = ?4",
        params![
            input.target_parent_id,
            input.target_sort_order,
            now,
            input.node_id
        ],
    )?;

    get_node(conn, &input.node_id)
}

pub fn reorder_nodes(conn: &Connection, items: Vec<ReorderItem>) -> Result<(), AppError> {
    let now = Utc::now().to_rfc3339();
    for item in items {
        conn.execute(
            "UPDATE manuscript_nodes SET
                sort_order = ?1,
                order_index = ?1,
                parent_id = ?2,
                updated_at = ?3
             WHERE id = ?4",
            params![item.sort_order, item.parent_id, now, item.id],
        )?;
    }
    Ok(())
}

pub fn get_document(conn: &Connection, node_id: &str) -> Result<DocumentContent, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, node_id, content_json, content_text, word_count, character_count, last_edited_at
         FROM documents
         WHERE node_id = ?1",
    )?;

    let doc = stmt
        .query_row(params![node_id], |row| {
            Ok(DocumentContent {
                id: row.get(0)?,
                node_id: row.get(1)?,
                content_json: row.get(2)?,
                content_text: row.get(3)?,
                word_count: row.get(4)?,
                character_count: row.get(5)?,
                last_edited_at: row.get(6)?,
            })
        })
        .optional()?;

    match doc {
        Some(d) => Ok(d),
        None => {
            // Create default blank document
            let id = Uuid::new_v4().to_string();
            let now = Utc::now().to_rfc3339();
            conn.execute(
                "INSERT INTO documents (
                    id, node_id, content_json, content_text, word_count, character_count, last_edited_at
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![id, node_id, "", "", 0, 0, now],
            )?;
            Ok(DocumentContent {
                id,
                node_id: node_id.to_string(),
                content_json: String::new(),
                content_text: String::new(),
                word_count: 0,
                character_count: 0,
                last_edited_at: now,
            })
        }
    }
}

pub fn save_document(
    conn: &Connection,
    input: SaveDocumentInput,
) -> Result<DocumentContent, AppError> {
    let now = Utc::now().to_rfc3339();

    // Check if document exists
    let exists: bool = conn.query_row(
        "SELECT COUNT(*) FROM documents WHERE node_id = ?1",
        params![input.node_id],
        |r| r.get::<_, i64>(0),
    )? > 0;

    if exists {
        conn.execute(
            "UPDATE documents SET
                content_json = ?1,
                content_text = ?2,
                word_count = ?3,
                character_count = ?4,
                last_edited_at = ?5
             WHERE node_id = ?6",
            params![
                input.content_json,
                input.content_text,
                input.word_count,
                input.character_count,
                now,
                input.node_id
            ],
        )?;
    } else {
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO documents (
                id, node_id, content_json, content_text, word_count, character_count, last_edited_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                id,
                input.node_id,
                input.content_json,
                input.content_text,
                input.word_count,
                input.character_count,
                now
            ],
        )?;
    }

    // Update node's word count
    conn.execute(
        "UPDATE manuscript_nodes SET word_count = ?1, updated_at = ?2 WHERE id = ?3",
        params![input.word_count, now, input.node_id],
    )?;

    // Fetch node to get project_id
    let node = get_node(conn, &input.node_id)?;
    recalculate_project_word_count(conn, &node.project_id)?;

    get_document(conn, &input.node_id)
}

fn recalculate_project_word_count(conn: &Connection, project_id: &str) -> Result<(), AppError> {
    let total_words: i64 = conn.query_row(
        "SELECT COALESCE(SUM(word_count), 0) FROM manuscript_nodes WHERE project_id = ?1 AND archived_at IS NULL",
        params![project_id],
        |r| r.get(0),
    )?;

    conn.execute(
        "UPDATE projects SET current_word_count = ?1, updated_at = ?2 WHERE id = ?3",
        params![total_words, Utc::now().to_rfc3339(), project_id],
    )?;

    Ok(())
}

fn validate_hierarchy_rules(
    conn: &Connection,
    node_type: &NodeType,
    parent_id: Option<&str>,
) -> Result<(), AppError> {
    match node_type {
        NodeType::Part => {
            if parent_id.is_some() {
                return Err(AppError::Validation(
                    "A Part cannot be placed inside another node; it must be at the root of the manuscript.".to_string(),
                ));
            }
        }
        NodeType::Chapter => {
            if let Some(pid) = parent_id {
                let parent = get_node(conn, pid)?;
                if parent.node_type != NodeType::Part {
                    return Err(AppError::Validation(
                        "A Chapter can only be placed at the root or inside a Part.".to_string(),
                    ));
                }
            }
        }
        NodeType::Scene => {
            if let Some(pid) = parent_id {
                let parent = get_node(conn, pid)?;
                if parent.node_type != NodeType::Chapter {
                    return Err(AppError::Validation(
                        "A Scene must be placed inside a Chapter.".to_string(),
                    ));
                }
            }
        }
    }
    Ok(())
}

fn validate_move(
    conn: &Connection,
    node_id: &str,
    target_parent_id: Option<&str>,
) -> Result<(), AppError> {
    let node = get_node(conn, node_id)?;

    if let Some(target_pid) = target_parent_id {
        // Prevent moving a node into itself
        if node_id == target_pid {
            return Err(AppError::Validation(
                "Cannot move a node into itself.".to_string(),
            ));
        }

        // Prevent cycle: target_parent cannot be a descendant of node_id
        let mut curr_pid = Some(target_pid.to_string());
        while let Some(pid) = curr_pid {
            if pid == node_id {
                return Err(AppError::Validation(
                    "Cannot move a node into one of its own descendants.".to_string(),
                ));
            }
            let parent_node = get_node(conn, &pid)?;
            curr_pid = parent_node.parent_id;
        }
    }

    validate_hierarchy_rules(conn, &node.node_type, target_parent_id)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::migrations::run_migrations;
    use crate::db::project_repo::create_project;
    use crate::models::CreateProjectInput;

    fn setup_test_db() -> (Connection, String) {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();

        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Test Novel".to_string(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: Some(50000),
            },
        )
        .unwrap();

        (conn, proj.id)
    }

    #[test]
    fn test_create_and_query_tree() {
        let (conn, project_id) = setup_test_db();

        let part1 = create_node(
            &conn,
            CreateNodeInput {
                project_id: project_id.clone(),
                parent_id: None,
                node_type: NodeType::Part,
                title: "Part I: The Beginning".to_string(),
                synopsis: None,
            },
        )
        .unwrap();

        let chap1 = create_node(
            &conn,
            CreateNodeInput {
                project_id: project_id.clone(),
                parent_id: Some(part1.id.clone()),
                node_type: NodeType::Chapter,
                title: "Chapter 01".to_string(),
                synopsis: None,
            },
        )
        .unwrap();

        let scene1 = create_node(
            &conn,
            CreateNodeInput {
                project_id: project_id.clone(),
                parent_id: Some(chap1.id.clone()),
                node_type: NodeType::Scene,
                title: "Scene 01".to_string(),
                synopsis: None,
            },
        )
        .unwrap();

        let tree = get_manuscript_tree(&conn, &project_id).unwrap();
        assert_eq!(tree.len(), 3);
        assert_eq!(tree[0].id, part1.id);
        assert_eq!(tree[1].id, chap1.id);
        assert_eq!(tree[2].id, scene1.id);
    }

    #[test]
    fn test_hierarchy_validation_rules() {
        let (conn, project_id) = setup_test_db();

        let chap = create_node(
            &conn,
            CreateNodeInput {
                project_id: project_id.clone(),
                parent_id: None,
                node_type: NodeType::Chapter,
                title: "Root Chapter".to_string(),
                synopsis: None,
            },
        )
        .unwrap();

        // Scene cannot contain a Part
        let invalid_part = create_node(
            &conn,
            CreateNodeInput {
                project_id: project_id.clone(),
                parent_id: Some(chap.id.clone()),
                node_type: NodeType::Part,
                title: "Nested Part".to_string(),
                synopsis: None,
            },
        );
        assert!(invalid_part.is_err());
    }

    #[test]
    fn test_cycle_prevention() {
        let (conn, project_id) = setup_test_db();

        let part = create_node(
            &conn,
            CreateNodeInput {
                project_id: project_id.clone(),
                parent_id: None,
                node_type: NodeType::Part,
                title: "Part I".to_string(),
                synopsis: None,
            },
        )
        .unwrap();

        let chap = create_node(
            &conn,
            CreateNodeInput {
                project_id: project_id.clone(),
                parent_id: Some(part.id.clone()),
                node_type: NodeType::Chapter,
                title: "Chapter 1".to_string(),
                synopsis: None,
            },
        )
        .unwrap();

        // Attempting to move part into chap (its descendant) must fail
        let move_result = move_node(
            &conn,
            MoveNodeInput {
                node_id: part.id.clone(),
                target_parent_id: Some(chap.id.clone()),
                target_sort_order: 1,
            },
        );
        assert!(move_result.is_err());
    }

    #[test]
    fn test_save_document_and_word_count_rollup() {
        let (conn, project_id) = setup_test_db();

        let chap = create_node(
            &conn,
            CreateNodeInput {
                project_id: project_id.clone(),
                parent_id: None,
                node_type: NodeType::Chapter,
                title: "Chapter 1".to_string(),
                synopsis: None,
            },
        )
        .unwrap();

        let saved = save_document(
            &conn,
            SaveDocumentInput {
                node_id: chap.id.clone(),
                content_json: r#"{"type":"doc","content":[{"type":"paragraph"}]}"#.to_string(),
                content_text: "The quick brown fox jumps over the lazy dog.".to_string(),
                word_count: 9,
                character_count: 44,
            },
        )
        .unwrap();

        assert_eq!(saved.word_count, 9);

        // Verify project current_word_count rolled up
        let proj: i64 = conn
            .query_row(
                "SELECT current_word_count FROM projects WHERE id = ?1",
                params![project_id],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(proj, 9);
    }

    #[test]
    fn test_duplicate_chapter() {
        let (conn, project_id) = setup_test_db();

        let chap = create_node(
            &conn,
            CreateNodeInput {
                project_id: project_id.clone(),
                parent_id: None,
                node_type: NodeType::Chapter,
                title: "Chapter 01".to_string(),
                synopsis: None,
            },
        )
        .unwrap();

        let _scene = create_node(
            &conn,
            CreateNodeInput {
                project_id: project_id.clone(),
                parent_id: Some(chap.id.clone()),
                node_type: NodeType::Scene,
                title: "Scene 01".to_string(),
                synopsis: None,
            },
        )
        .unwrap();

        let dup = duplicate_node(&conn, &chap.id).unwrap();
        assert_eq!(dup.title, "Chapter 01 (Copy)");

        let tree = get_manuscript_tree(&conn, &project_id).unwrap();
        // Original chap + scene + duplicated chap + duplicated scene = 4 nodes
        assert_eq!(tree.len(), 4);
    }
}
