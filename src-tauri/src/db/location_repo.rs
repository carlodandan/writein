use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use crate::models::{AppError, CreateLocationInput, Location, UpdateLocationInput};

pub fn create_location(
    conn: &Connection,
    input: CreateLocationInput,
) -> Result<Location, AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::Validation(
            "Location name cannot be empty".to_string(),
        ));
    }

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO locations (
            id, project_id, name, location_type, description,
            appearance, atmosphere, inhabitants, notes, map_path, tags,
            created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            id,
            input.project_id,
            input.name.trim(),
            input.location_type,
            input.description,
            input.appearance,
            input.atmosphere,
            input.inhabitants,
            input.notes,
            input.map_path,
            input.tags,
            now,
            now
        ],
    )?;

    get_location(conn, &id)
}

pub fn get_location(conn: &Connection, id: &str) -> Result<Location, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, name, location_type, description,
                appearance, atmosphere, inhabitants, notes, map_path, tags,
                created_at, updated_at
         FROM locations
         WHERE id = ?1",
    )?;

    let location = stmt
        .query_row(params![id], |row| {
            Ok(Location {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                location_type: row.get(3)?,
                description: row.get(4)?,
                appearance: row.get(5)?,
                atmosphere: row.get(6)?,
                inhabitants: row.get(7)?,
                notes: row.get(8)?,
                map_path: row.get(9)?,
                tags: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })
        .optional()?;

    location.ok_or_else(|| AppError::NotFound(format!("Location with id '{}' not found", id)))
}

pub fn list_locations(conn: &Connection, project_id: &str) -> Result<Vec<Location>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, name, location_type, description,
                appearance, atmosphere, inhabitants, notes, map_path, tags,
                created_at, updated_at
         FROM locations
         WHERE project_id = ?1
         ORDER BY name ASC",
    )?;

    let iter = stmt.query_map(params![project_id], |row| {
        Ok(Location {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            location_type: row.get(3)?,
            description: row.get(4)?,
            appearance: row.get(5)?,
            atmosphere: row.get(6)?,
            inhabitants: row.get(7)?,
            notes: row.get(8)?,
            map_path: row.get(9)?,
            tags: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    })?;

    let mut result = Vec::new();
    for item in iter {
        result.push(item?);
    }
    Ok(result)
}

pub fn update_location(
    conn: &Connection,
    id: &str,
    input: UpdateLocationInput,
) -> Result<Location, AppError> {
    let existing = get_location(conn, id)?;
    let now = Utc::now().to_rfc3339();

    let name = input
        .name
        .map(|n| n.trim().to_string())
        .filter(|n| !n.is_empty())
        .unwrap_or(existing.name);
    let location_type = input.location_type.or(existing.location_type);
    let description = input.description.or(existing.description);
    let appearance = input.appearance.or(existing.appearance);
    let atmosphere = input.atmosphere.or(existing.atmosphere);
    let inhabitants = input.inhabitants.or(existing.inhabitants);
    let notes = input.notes.or(existing.notes);
    let map_path = input.map_path.or(existing.map_path);
    let tags = input.tags.or(existing.tags);

    conn.execute(
        "UPDATE locations SET
            name = ?1,
            location_type = ?2,
            description = ?3,
            appearance = ?4,
            atmosphere = ?5,
            inhabitants = ?6,
            notes = ?7,
            map_path = ?8,
            tags = ?9,
            updated_at = ?10
         WHERE id = ?11",
        params![
            name,
            location_type,
            description,
            appearance,
            atmosphere,
            inhabitants,
            notes,
            map_path,
            tags,
            now,
            id
        ],
    )?;

    get_location(conn, id)
}

pub fn delete_location(conn: &Connection, id: &str) -> Result<bool, AppError> {
    let rows = conn.execute("DELETE FROM locations WHERE id = ?1", params![id])?;
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
    fn test_location_crud() {
        let conn = setup_test_db();
        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Location Test Novel".into(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: None,
            },
        )
        .unwrap();

        let loc = create_location(
            &conn,
            CreateLocationInput {
                project_id: proj.id.clone(),
                name: "The Grand Library of Oakhaven".into(),
                location_type: Some("Archive / Sanctuary".into()),
                description: Some("Centuries-old stone library high in the mountains".into()),
                appearance: Some("Towering bookshelves reaching into cathedral vaults".into()),
                atmosphere: Some("Smell of aged parchment, echoes of whispered secrets".into()),
                inhabitants: Some("Archivist Brother Thomas".into()),
                notes: Some("Forbidden annex on lower basement level 3".into()),
                map_path: None,
                tags: Some("lore,magic,sanctuary".into()),
            },
        )
        .unwrap();

        assert_eq!(loc.name, "The Grand Library of Oakhaven");
        assert_eq!(loc.location_type.as_deref(), Some("Archive / Sanctuary"));

        let list = list_locations(&conn, &proj.id).unwrap();
        assert_eq!(list.len(), 1);

        let updated = update_location(
            &conn,
            &loc.id,
            UpdateLocationInput {
                name: Some("The Citadel Library of Oakhaven".into()),
                location_type: None,
                description: None,
                appearance: None,
                atmosphere: None,
                inhabitants: None,
                notes: None,
                map_path: None,
                tags: None,
            },
        )
        .unwrap();

        assert_eq!(updated.name, "The Citadel Library of Oakhaven");

        let deleted = delete_location(&conn, &loc.id).unwrap();
        assert!(deleted);

        let list_after = list_locations(&conn, &proj.id).unwrap();
        assert_eq!(list_after.len(), 0);
    }
}
