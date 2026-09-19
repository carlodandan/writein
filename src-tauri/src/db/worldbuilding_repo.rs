use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use crate::models::{
    AppError, CreateWorldbuildingInput, UpdateWorldbuildingInput, WorldbuildingEntry,
};

pub fn create_worldbuilding_entry(
    conn: &Connection,
    input: CreateWorldbuildingInput,
) -> Result<WorldbuildingEntry, AppError> {
    if input.title.trim().is_empty() {
        return Err(AppError::Validation(
            "Worldbuilding entry title cannot be empty".to_string(),
        ));
    }
    let category = if input.category.trim().is_empty() {
        "General".to_string()
    } else {
        input.category.trim().to_string()
    };

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let content = input.content.unwrap_or_default();

    conn.execute(
        "INSERT INTO worldbuilding_entries (
            id, project_id, category, title, content, tags, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
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

    get_worldbuilding_entry(conn, &id)
}

pub fn get_worldbuilding_entry(conn: &Connection, id: &str) -> Result<WorldbuildingEntry, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, category, title, content, tags, created_at, updated_at
         FROM worldbuilding_entries
         WHERE id = ?1",
    )?;

    let entry = stmt
        .query_row(params![id], |row| {
            Ok(WorldbuildingEntry {
                id: row.get(0)?,
                project_id: row.get(1)?,
                category: row.get(2)?,
                title: row.get(3)?,
                content: row.get(4)?,
                tags: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .optional()?;

    entry.ok_or_else(|| AppError::NotFound(format!("Worldbuilding entry with id '{}' not found", id)))
}

pub fn list_worldbuilding_entries(
    conn: &Connection,
    project_id: &str,
    category: Option<&str>,
) -> Result<Vec<WorldbuildingEntry>, AppError> {
    match category {
        Some(cat) if !cat.trim().is_empty() && cat != "All" => {
            let mut stmt = conn.prepare(
                "SELECT id, project_id, category, title, content, tags, created_at, updated_at
                 FROM worldbuilding_entries
                 WHERE project_id = ?1 AND category = ?2
                 ORDER BY title ASC",
            )?;

            let iter = stmt.query_map(params![project_id, cat.trim()], |row| {
                Ok(WorldbuildingEntry {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    category: row.get(2)?,
                    title: row.get(3)?,
                    content: row.get(4)?,
                    tags: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })?;

            let mut result = Vec::new();
            for item in iter {
                result.push(item?);
            }
            Ok(result)
        }
        _ => {
            let mut stmt = conn.prepare(
                "SELECT id, project_id, category, title, content, tags, created_at, updated_at
                 FROM worldbuilding_entries
                 WHERE project_id = ?1
                 ORDER BY category ASC, title ASC",
            )?;

            let iter = stmt.query_map(params![project_id], |row| {
                Ok(WorldbuildingEntry {
                    id: row.get(0)?,
                    project_id: row.get(1)?,
                    category: row.get(2)?,
                    title: row.get(3)?,
                    content: row.get(4)?,
                    tags: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })?;

            let mut result = Vec::new();
            for item in iter {
                result.push(item?);
            }
            Ok(result)
        }
    }
}

pub fn update_worldbuilding_entry(
    conn: &Connection,
    id: &str,
    input: UpdateWorldbuildingInput,
) -> Result<WorldbuildingEntry, AppError> {
    let existing = get_worldbuilding_entry(conn, id)?;
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

    conn.execute(
        "UPDATE worldbuilding_entries SET
            category = ?1,
            title = ?2,
            content = ?3,
            tags = ?4,
            updated_at = ?5
         WHERE id = ?6",
        params![category, title, content, tags, now, id],
    )?;

    get_worldbuilding_entry(conn, id)
}

pub fn delete_worldbuilding_entry(conn: &Connection, id: &str) -> Result<bool, AppError> {
    let rows = conn.execute(
        "DELETE FROM worldbuilding_entries WHERE id = ?1",
        params![id],
    )?;
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
    fn test_worldbuilding_crud_and_category_filtering() {
        let conn = setup_test_db();
        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Worldbuilding Test Novel".into(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: None,
            },
        )
        .unwrap();

        let magic_entry = create_worldbuilding_entry(
            &conn,
            CreateWorldbuildingInput {
                project_id: proj.id.clone(),
                category: "Magic System".into(),
                title: "The Three Aethers".into(),
                content: Some("Channeling raw elemental currents requires crystal conduits.".into()),
                tags: Some("magic,rules".into()),
            },
        )
        .unwrap();

        let faction_entry = create_worldbuilding_entry(
            &conn,
            CreateWorldbuildingInput {
                project_id: proj.id.clone(),
                category: "Factions".into(),
                title: "The Guild of Iron Vows".into(),
                content: Some("Mercenaries pledged to protect trade routes.".into()),
                tags: Some("guild,allies".into()),
            },
        )
        .unwrap();

        assert_eq!(magic_entry.category, "Magic System");
        assert_eq!(faction_entry.title, "The Guild of Iron Vows");

        // Filter by Magic System
        let magic_list = list_worldbuilding_entries(&conn, &proj.id, Some("Magic System")).unwrap();
        assert_eq!(magic_list.len(), 1);
        assert_eq!(magic_list[0].id, magic_entry.id);

        // List all
        let all_list = list_worldbuilding_entries(&conn, &proj.id, None).unwrap();
        assert_eq!(all_list.len(), 2);

        // Update
        let updated = update_worldbuilding_entry(
            &conn,
            &magic_entry.id,
            UpdateWorldbuildingInput {
                category: None,
                title: Some("The Four Aethers".into()),
                content: None,
                tags: None,
            },
        )
        .unwrap();
        assert_eq!(updated.title, "The Four Aethers");

        // Delete
        let deleted = delete_worldbuilding_entry(&conn, &faction_entry.id).unwrap();
        assert!(deleted);
        let remaining = list_worldbuilding_entries(&conn, &proj.id, None).unwrap();
        assert_eq!(remaining.len(), 1);
    }
}
