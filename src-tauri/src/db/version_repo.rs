use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use crate::models::{AppError, DocumentVersion};

/// Insert a new snapshot. Auto-increments version_num within the document.
pub fn create_snapshot(
    conn: &Connection,
    document_id: &str,
    node_id: &str,
    snapshot_text: &str,
    word_count: i64,
) -> Result<DocumentVersion, AppError> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    // Determine next version number
    let version_num: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(version_num), 0) + 1 FROM document_versions WHERE document_id = ?1",
            params![document_id],
            |row| row.get(0),
        )
        .unwrap_or(1);

    conn.execute(
        "INSERT INTO document_versions (id, document_id, node_id, version_num, snapshot_text, word_count, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, document_id, node_id, version_num, snapshot_text, word_count, now],
    )?;

    // Keep only the last 50 snapshots per document
    prune_old_snapshots(conn, document_id, 50)?;

    get_snapshot(conn, &id)
}

/// Get a single snapshot by ID.
pub fn get_snapshot(conn: &Connection, id: &str) -> Result<DocumentVersion, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, document_id, node_id, version_num, snapshot_text, word_count, created_at
         FROM document_versions WHERE id = ?1",
    )?;

    let v = stmt
        .query_row(params![id], |row| {
            Ok(DocumentVersion {
                id: row.get(0)?,
                document_id: row.get(1)?,
                node_id: row.get(2)?,
                version_num: row.get(3)?,
                snapshot_text: row.get(4)?,
                word_count: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .optional()?;

    v.ok_or_else(|| AppError::NotFound(format!("Document version '{}' not found", id)))
}

/// List all snapshots for a node, newest first. snapshot_text is omitted for list performance.
pub fn list_snapshots(conn: &Connection, node_id: &str) -> Result<Vec<DocumentVersion>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, document_id, node_id, version_num, '' AS snapshot_text, word_count, created_at
         FROM document_versions
         WHERE node_id = ?1
         ORDER BY version_num DESC",
    )?;

    let iter = stmt.query_map(params![node_id], |row| {
        Ok(DocumentVersion {
            id: row.get(0)?,
            document_id: row.get(1)?,
            node_id: row.get(2)?,
            version_num: row.get(3)?,
            snapshot_text: row.get(4)?,
            word_count: row.get(5)?,
            created_at: row.get(6)?,
        })
    })?;

    let mut result = Vec::new();
    for item in iter {
        result.push(item?);
    }
    Ok(result)
}

/// Get full snapshot content (with text).
pub fn get_snapshot_content(conn: &Connection, id: &str) -> Result<DocumentVersion, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, document_id, node_id, version_num, snapshot_text, word_count, created_at
         FROM document_versions WHERE id = ?1",
    )?;

    let v = stmt
        .query_row(params![id], |row| {
            Ok(DocumentVersion {
                id: row.get(0)?,
                document_id: row.get(1)?,
                node_id: row.get(2)?,
                version_num: row.get(3)?,
                snapshot_text: row.get(4)?,
                word_count: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .optional()?;

    v.ok_or_else(|| AppError::NotFound(format!("Document version '{}' not found", id)))
}

/// Delete a specific snapshot.
pub fn delete_snapshot(conn: &Connection, id: &str) -> Result<bool, AppError> {
    let rows = conn.execute("DELETE FROM document_versions WHERE id = ?1", params![id])?;
    Ok(rows > 0)
}

/// Delete snapshots beyond the keep_count newest per document.
fn prune_old_snapshots(
    conn: &Connection,
    document_id: &str,
    keep_count: i64,
) -> Result<(), AppError> {
    conn.execute(
        "DELETE FROM document_versions
         WHERE document_id = ?1
           AND id NOT IN (
               SELECT id FROM document_versions
               WHERE document_id = ?1
               ORDER BY version_num DESC
               LIMIT ?2
           )",
        params![document_id, keep_count],
    )?;
    Ok(())
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::db::manuscript_repo;
    use crate::db::migrations::run_migrations;
    use crate::db::project_repo::create_project;
    use crate::models::{CreateNodeInput, CreateProjectInput, NodeType, SaveDocumentInput};

    fn setup() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();
        conn
    }

    #[test]
    fn test_version_snapshot_crud() {
        let conn = setup();

        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Version Test Novel".into(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: None,
            },
        )
        .unwrap();

        // Create a chapter node + document
        let node = manuscript_repo::create_node(
            &conn,
            CreateNodeInput {
                project_id: proj.id.clone(),
                parent_id: None,
                node_type: NodeType::Chapter,
                title: "Chapter One".into(),
                synopsis: None,
            },
        )
        .unwrap();

        let doc = manuscript_repo::save_document(
            &conn,
            SaveDocumentInput {
                node_id: node.id.clone(),
                content_json: "{\"type\":\"doc\"}".into(),
                content_text: "The sea was calm and grey.".into(),
                word_count: 6,
                character_count: 26,
            },
        )
        .unwrap();

        // Create first snapshot
        let v1 =
            create_snapshot(&conn, &doc.id, &node.id, "The sea was calm and grey.", 6).unwrap();
        assert_eq!(v1.version_num, 1);
        assert_eq!(v1.word_count, 6);

        // Create second snapshot
        let v2 = create_snapshot(
            &conn,
            &doc.id,
            &node.id,
            "The sea was dark and stormy now.",
            7,
        )
        .unwrap();
        assert_eq!(v2.version_num, 2);

        // List shows newest first
        let list = list_snapshots(&conn, &node.id).unwrap();
        assert_eq!(list.len(), 2);
        assert_eq!(list[0].version_num, 2);
        assert_eq!(list[1].version_num, 1);

        // List omits snapshot_text for performance
        assert!(list[0].snapshot_text.is_empty());

        // Full content fetch
        let full = get_snapshot_content(&conn, &v1.id).unwrap();
        assert_eq!(full.snapshot_text, "The sea was calm and grey.");

        // Delete
        let deleted = delete_snapshot(&conn, &v1.id).unwrap();
        assert!(deleted);
        let list_after = list_snapshots(&conn, &node.id).unwrap();
        assert_eq!(list_after.len(), 1);
    }
}
