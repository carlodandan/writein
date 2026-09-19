use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use crate::models::{AppError, CreateNoteInput, Note, UpdateNoteInput};

pub fn create_note(conn: &Connection, input: CreateNoteInput) -> Result<Note, AppError> {
    if input.title.trim().is_empty() {
        return Err(AppError::Validation("Note title cannot be empty".to_string()));
    }

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let category = input.category.filter(|c| !c.trim().is_empty()).unwrap_or_else(|| "Ideas".to_string());
    let content = input.content.unwrap_or_default();

    conn.execute(
        "INSERT INTO notes (
            id, project_id, category, title, content, tags, archived_at, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, NULL, ?7, ?8)",
        params![
            id,
            input.project_id,
            category,
            input.title.trim(),
            content,
            input.tags,
            now,
            now
        ],
    )?;

    get_note(conn, &id)
}

pub fn get_note(conn: &Connection, id: &str) -> Result<Note, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, category, title, content, tags, archived_at, created_at, updated_at
         FROM notes
         WHERE id = ?1",
    )?;

    let note = stmt
        .query_row(params![id], |row| {
            Ok(Note {
                id: row.get(0)?,
                project_id: row.get(1)?,
                category: row.get(2)?,
                title: row.get(3)?,
                content: row.get(4)?,
                tags: row.get(5)?,
                archived_at: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
        .optional()?;

    note.ok_or_else(|| AppError::NotFound(format!("Note with id '{}' not found", id)))
}

pub fn list_notes(
    conn: &Connection,
    project_id: &str,
    category: Option<&str>,
    include_archived: bool,
) -> Result<Vec<Note>, AppError> {
    let mut sql = "SELECT id, project_id, category, title, content, tags, archived_at, created_at, updated_at FROM notes WHERE project_id = ?1".to_string();
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(project_id.to_string())];

    if !include_archived {
        sql.push_str(" AND archived_at IS NULL");
    }

    if let Some(cat) = category {
        if !cat.trim().is_empty() && cat != "All" && cat != "Archived" {
            sql.push_str(" AND category = ?");
            params_vec.push(Box::new(cat.to_string()));
        } else if cat == "Archived" {
            // Only archived
            sql = "SELECT id, project_id, category, title, content, tags, archived_at, created_at, updated_at FROM notes WHERE project_id = ?1 AND archived_at IS NOT NULL".to_string();
        }
    }

    sql.push_str(" ORDER BY updated_at DESC, created_at DESC");

    let mut stmt = conn.prepare(&sql)?;
    let slice_params: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();

    let iter = stmt.query_map(slice_params.as_slice(), |row| {
        Ok(Note {
            id: row.get(0)?,
            project_id: row.get(1)?,
            category: row.get(2)?,
            title: row.get(3)?,
            content: row.get(4)?,
            tags: row.get(5)?,
            archived_at: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?;

    let mut result = Vec::new();
    for item in iter {
        result.push(item?);
    }
    Ok(result)
}

pub fn update_note(
    conn: &Connection,
    id: &str,
    input: UpdateNoteInput,
) -> Result<Note, AppError> {
    let existing = get_note(conn, id)?;
    let now = Utc::now().to_rfc3339();

    let category = input
        .category
        .map(|c| c.trim().to_string())
        .filter(|c| !c.is_empty())
        .unwrap_or(existing.category);

    let title = input
        .title
        .map(|t| t.trim().to_string())
        .filter(|t| !t.is_empty())
        .unwrap_or(existing.title);

    let content = input.content.unwrap_or(existing.content);
    let tags = input.tags.or(existing.tags);

    let archived_at = match input.archived {
        Some(true) => Some(now.clone()),
        Some(false) => None,
        None => existing.archived_at,
    };

    conn.execute(
        "UPDATE notes SET
            category = ?1,
            title = ?2,
            content = ?3,
            tags = ?4,
            archived_at = ?5,
            updated_at = ?6
         WHERE id = ?7",
        params![category, title, content, tags, archived_at, now, id],
    )?;

    get_note(conn, id)
}

pub fn toggle_archive_note(conn: &Connection, id: &str) -> Result<Note, AppError> {
    let existing = get_note(conn, id)?;
    let now = Utc::now().to_rfc3339();
    let new_archived = if existing.archived_at.is_some() {
        None
    } else {
        Some(now.clone())
    };

    conn.execute(
        "UPDATE notes SET archived_at = ?1, updated_at = ?2 WHERE id = ?3",
        params![new_archived, now, id],
    )?;

    get_note(conn, id)
}

pub fn delete_note(conn: &Connection, id: &str) -> Result<bool, AppError> {
    let rows = conn.execute("DELETE FROM notes WHERE id = ?1", params![id])?;
    Ok(rows > 0)
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::db::migrations::run_migrations;
    use crate::db::project_repo::create_project;
    use crate::models::CreateProjectInput;

    fn setup_test_db() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();
        conn
    }

    #[test]
    fn test_note_crud_and_archiving() {
        let conn = setup_test_db();
        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Notes Test Novel".into(),
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
                category: Some("Dialogue".into()),
                title: "Vance's Pier Monologue".into(),
                content: Some("I never trusted the sea, and I never trusted men who smell of salt water.".into()),
                tags: Some("vance,monologue".into()),
            },
        )
        .unwrap();

        assert_eq!(note.title, "Vance's Pier Monologue");
        assert_eq!(note.category, "Dialogue");
        assert!(note.archived_at.is_none());

        // List active
        let active = list_notes(&conn, &proj.id, Some("Dialogue"), false).unwrap();
        assert_eq!(active.len(), 1);

        // Archive
        let archived = toggle_archive_note(&conn, &note.id).unwrap();
        assert!(archived.archived_at.is_some());

        // Should not appear in active
        let active_after = list_notes(&conn, &proj.id, None, false).unwrap();
        assert_eq!(active_after.len(), 0);

        // Should appear in archived list
        let archived_list = list_notes(&conn, &proj.id, Some("Archived"), true).unwrap();
        assert_eq!(archived_list.len(), 1);

        // Unarchive
        let restored = toggle_archive_note(&conn, &note.id).unwrap();
        assert!(restored.archived_at.is_none());

        // Delete
        let deleted = delete_note(&conn, &note.id).unwrap();
        assert!(deleted);
    }
}
