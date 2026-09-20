use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use crate::db::manuscript_repo::recalculate_project_word_count;
use crate::models::{AppError, TrashItem};

pub fn list_trash(conn: &Connection, project_id: &str) -> Result<Vec<TrashItem>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, entity_type, entity_id, entity_name, deleted_at
         FROM trash_items
         WHERE project_id = ?1
         ORDER BY deleted_at DESC",
    )?;

    let iter = stmt.query_map(params![project_id], |row| {
        Ok(TrashItem {
            id: row.get(0)?,
            project_id: row.get(1)?,
            entity_type: row.get(2)?,
            entity_id: row.get(3)?,
            title: row.get(4)?,
            deleted_at: row.get(5)?,
        })
    })?;

    let mut result = Vec::new();
    for item in iter {
        result.push(item?);
    }
    Ok(result)
}

pub fn move_to_trash(
    conn: &Connection,
    project_id: &str,
    entity_type: &str,
    entity_id: &str,
    title: &str,
) -> Result<TrashItem, AppError> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    // 1. Soft-delete entity by setting archived_at
    match entity_type {
        "manuscript" => {
            conn.execute(
                "UPDATE manuscript_nodes SET archived_at = ?1 WHERE id = ?2",
                params![now, entity_id],
            )?;
            let _ = recalculate_project_word_count(conn, project_id);
        }
        "character" => {
            conn.execute(
                "UPDATE characters SET archived_at = ?1 WHERE id = ?2",
                params![now, entity_id],
            )?;
        }
        "location" => {
            conn.execute(
                "UPDATE locations SET archived_at = ?1 WHERE id = ?2",
                params![now, entity_id],
            )?;
        }
        "note" => {
            conn.execute(
                "UPDATE notes SET archived_at = ?1 WHERE id = ?2",
                params![now, entity_id],
            )?;
        }
        _ => {}
    }

    // 2. Insert into trash_items
    conn.execute(
        "INSERT INTO trash_items (id, project_id, entity_type, entity_id, entity_name, original_data_json, deleted_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, project_id, entity_type, entity_id, title, "{}", now],
    )?;

    Ok(TrashItem {
        id,
        project_id: project_id.to_string(),
        entity_type: entity_type.to_string(),
        entity_id: entity_id.to_string(),
        title: title.to_string(),
        deleted_at: now,
    })
}

pub fn restore_from_trash(conn: &Connection, trash_id: &str) -> Result<bool, AppError> {
    let item: Option<(String, String, String)> = conn
        .query_row(
            "SELECT project_id, entity_type, entity_id FROM trash_items WHERE id = ?1",
            params![trash_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .optional()?;

    let (project_id, entity_type, entity_id) = match item {
        Some(t) => t,
        None => return Ok(false),
    };

    // Unarchive entity
    match entity_type.as_str() {
        "manuscript" => {
            conn.execute(
                "UPDATE manuscript_nodes SET archived_at = NULL WHERE id = ?1",
                params![entity_id],
            )?;
            let _ = recalculate_project_word_count(conn, &project_id);
        }
        "character" => {
            conn.execute(
                "UPDATE characters SET archived_at = NULL WHERE id = ?1",
                params![entity_id],
            )?;
        }
        "location" => {
            conn.execute(
                "UPDATE locations SET archived_at = NULL WHERE id = ?1",
                params![entity_id],
            )?;
        }
        "note" => {
            conn.execute(
                "UPDATE notes SET archived_at = NULL WHERE id = ?1",
                params![entity_id],
            )?;
        }
        _ => {}
    }

    conn.execute("DELETE FROM trash_items WHERE id = ?1", params![trash_id])?;
    Ok(true)
}

pub fn delete_permanently(conn: &Connection, trash_id: &str) -> Result<bool, AppError> {
    let item: Option<(String, String, String)> = conn
        .query_row(
            "SELECT project_id, entity_type, entity_id FROM trash_items WHERE id = ?1",
            params![trash_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .optional()?;

    let (project_id, entity_type, entity_id) = match item {
        Some(t) => t,
        None => return Ok(false),
    };

    // Hard delete entity
    match entity_type.as_str() {
        "manuscript" => {
            conn.execute("DELETE FROM manuscript_nodes WHERE id = ?1", params![entity_id])?;
            let _ = recalculate_project_word_count(conn, &project_id);
        }
        "character" => {
            conn.execute("DELETE FROM characters WHERE id = ?1", params![entity_id])?;
        }
        "location" => {
            conn.execute("DELETE FROM locations WHERE id = ?1", params![entity_id])?;
        }
        "note" => {
            conn.execute("DELETE FROM notes WHERE id = ?1", params![entity_id])?;
        }
        _ => {}
    }

    conn.execute("DELETE FROM trash_items WHERE id = ?1", params![trash_id])?;
    Ok(true)
}

pub fn empty_trash(conn: &Connection, project_id: &str) -> Result<i64, AppError> {
    let items = list_trash(conn, project_id)?;
    let count = items.len() as i64;
    for item in items {
        delete_permanently(conn, &item.id)?;
    }
    Ok(count)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::migrations::run_migrations;
    use crate::db::project_repo::create_project;
    use crate::db::note_repo::create_note;
    use crate::models::{CreateNoteInput, CreateProjectInput};

    fn setup_test_db() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();
        conn
    }

    #[test]
    fn test_trash_lifecycle() {
        let conn = setup_test_db();
        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Trash Test Book".into(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: None,
            },
        )
        .unwrap();

        let note = create_note(
            &conn,
            CreateNoteInput {
                project_id: proj.id.clone(),
                title: "Important Clue".into(),
                content: Some("The clock stopped at 11:15.".into()),
                category: Some("Clues".into()),
                tags: None,
            },
        )
        .unwrap();

        // 1. Move note to trash
        let trash_item = move_to_trash(&conn, &proj.id, "note", &note.id, &note.title).unwrap();
        assert_eq!(trash_item.title, "Important Clue");

        // List trash
        let list = list_trash(&conn, &proj.id).unwrap();
        assert_eq!(list.len(), 1);

        // 2. Restore note from trash
        let restored = restore_from_trash(&conn, &trash_item.id).unwrap();
        assert!(restored);

        let list_after_restore = list_trash(&conn, &proj.id).unwrap();
        assert_eq!(list_after_restore.len(), 0);

        // 3. Move to trash and delete permanently
        let trash_again = move_to_trash(&conn, &proj.id, "note", &note.id, &note.title).unwrap();
        let deleted = delete_permanently(&conn, &trash_again.id).unwrap();
        assert!(deleted);

        let list_after_delete = list_trash(&conn, &proj.id).unwrap();
        assert_eq!(list_after_delete.len(), 0);
    }
}
