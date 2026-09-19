use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use crate::models::{AppError, SetEntityTagsInput, Tag, TagWithUsageCount};

pub fn normalize_tag_name(name: &str) -> String {
    name.trim().trim_start_matches('#').to_lowercase()
}

pub fn get_or_create_tag(
    conn: &Connection,
    project_id: &str,
    name: &str,
    color: Option<&str>,
) -> Result<Tag, AppError> {
    let clean_name = normalize_tag_name(name);
    if clean_name.is_empty() {
        return Err(AppError::Validation("Tag name cannot be empty".to_string()));
    }

    let mut stmt = conn.prepare("SELECT id, project_id, name, color FROM tags WHERE project_id = ?1 AND LOWER(name) = LOWER(?2)")?;
    let existing = stmt
        .query_row(params![project_id, clean_name], |row| {
            Ok(Tag {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                color: row.get(3)?,
            })
        })
        .optional()?;

    if let Some(tag) = existing {
        return Ok(tag);
    }

    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO tags (id, project_id, name, color) VALUES (?1, ?2, ?3, ?4)",
        params![id, project_id, clean_name, color],
    )?;

    Ok(Tag {
        id,
        project_id: project_id.to_string(),
        name: clean_name,
        color: color.map(|s| s.to_string()),
    })
}

pub fn list_tags(
    conn: &Connection,
    project_id: &str,
) -> Result<Vec<TagWithUsageCount>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT t.id, t.project_id, t.name, t.color, COUNT(et.id) as usage_count
         FROM tags t
         LEFT JOIN entity_tags et ON et.tag_id = t.id
         WHERE t.project_id = ?1
         GROUP BY t.id
         ORDER BY usage_count DESC, t.name ASC",
    )?;

    let iter = stmt.query_map(params![project_id], |row| {
        Ok(TagWithUsageCount {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            color: row.get(3)?,
            usage_count: row.get(4)?,
        })
    })?;

    let mut result = Vec::new();
    for item in iter {
        result.push(item?);
    }
    Ok(result)
}

pub fn rename_tag(conn: &Connection, id: &str, new_name: &str) -> Result<Tag, AppError> {
    let clean = normalize_tag_name(new_name);
    if clean.is_empty() {
        return Err(AppError::Validation("Tag name cannot be empty".to_string()));
    }

    conn.execute(
        "UPDATE tags SET name = ?1 WHERE id = ?2",
        params![clean, id],
    )?;

    let mut stmt = conn.prepare("SELECT id, project_id, name, color FROM tags WHERE id = ?1")?;
    let tag = stmt.query_row(params![id], |row| {
        Ok(Tag {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            color: row.get(3)?,
        })
    })?;

    Ok(tag)
}

pub fn delete_tag(conn: &Connection, id: &str) -> Result<bool, AppError> {
    // Delete tag associations
    conn.execute("DELETE FROM entity_tags WHERE tag_id = ?1", params![id])?;
    let rows = conn.execute("DELETE FROM tags WHERE id = ?1", params![id])?;
    Ok(rows > 0)
}

pub fn get_entity_tags(
    conn: &Connection,
    entity_type: &str,
    entity_id: &str,
) -> Result<Vec<Tag>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT t.id, t.project_id, t.name, t.color
         FROM tags t
         JOIN entity_tags et ON et.tag_id = t.id
         WHERE et.entity_type = ?1 AND et.entity_id = ?2
         ORDER BY t.name ASC",
    )?;

    let iter = stmt.query_map(params![entity_type, entity_id], |row| {
        Ok(Tag {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            color: row.get(3)?,
        })
    })?;

    let mut result = Vec::new();
    for item in iter {
        result.push(item?);
    }
    Ok(result)
}

pub fn set_entity_tags(
    conn: &Connection,
    input: SetEntityTagsInput,
) -> Result<Vec<Tag>, AppError> {
    // Remove existing links
    conn.execute(
        "DELETE FROM entity_tags WHERE entity_type = ?1 AND entity_id = ?2",
        params![input.entity_type, input.entity_id],
    )?;

    let mut result = Vec::new();
    for name in input.tag_names {
        if let Ok(tag) = get_or_create_tag(conn, &input.project_id, &name, None) {
            let link_id = Uuid::new_v4().to_string();
            let _ = conn.execute(
                "INSERT INTO entity_tags (id, tag_id, entity_type, entity_id) VALUES (?1, ?2, ?3, ?4)",
                params![link_id, tag.id, input.entity_type, input.entity_id],
            );
            result.push(tag);
        }
    }

    Ok(result)
}

pub fn assign_tag(
    conn: &Connection,
    project_id: &str,
    entity_type: &str,
    entity_id: &str,
    tag_name: &str,
) -> Result<Tag, AppError> {
    let tag = get_or_create_tag(conn, project_id, tag_name, None)?;
    let exists: bool = conn
        .query_row(
            "SELECT 1 FROM entity_tags WHERE tag_id = ?1 AND entity_type = ?2 AND entity_id = ?3",
            params![tag.id, entity_type, entity_id],
            |_| Ok(true),
        )
        .unwrap_or(false);

    if !exists {
        let link_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO entity_tags (id, tag_id, entity_type, entity_id) VALUES (?1, ?2, ?3, ?4)",
            params![link_id, tag.id, entity_type, entity_id],
        )?;
    }
    Ok(tag)
}

pub fn remove_tag(
    conn: &Connection,
    entity_type: &str,
    entity_id: &str,
    tag_id: &str,
) -> Result<bool, AppError> {
    let rows = conn.execute(
        "DELETE FROM entity_tags WHERE tag_id = ?1 AND entity_type = ?2 AND entity_id = ?3",
        params![tag_id, entity_type, entity_id],
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
    fn test_tags_crud_and_entity_linking() {
        let conn = setup_test_db();
        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Tagging Novel".into(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: None,
            },
        )
        .unwrap();

        // Normalization: leading hash and casing
        let tag1 = get_or_create_tag(&conn, &proj.id, "#Main-Character", None).unwrap();
        assert_eq!(tag1.name, "main-character");

        // Deduplication
        let tag1_dup = get_or_create_tag(&conn, &proj.id, "main-character", None).unwrap();
        assert_eq!(tag1.id, tag1_dup.id);

        // Link entity
        let tags = set_entity_tags(
            &conn,
            SetEntityTagsInput {
                project_id: proj.id.clone(),
                entity_type: "character".into(),
                entity_id: "char-123".into(),
                tag_names: vec!["#Main-Character".into(), "noir".into()],
            },
        )
        .unwrap();
        assert_eq!(tags.len(), 2);

        let list = list_tags(&conn, &proj.id).unwrap();
        assert_eq!(list.len(), 2);
        assert_eq!(list[0].usage_count, 1);

        // Safe delete tag: removes association but does not error
        let deleted = delete_tag(&conn, &tag1.id).unwrap();
        assert!(deleted);

        let remaining_entity_tags = get_entity_tags(&conn, "character", "char-123").unwrap();
        assert_eq!(remaining_entity_tags.len(), 1);
        assert_eq!(remaining_entity_tags[0].name, "noir");
    }

    #[test]
    fn test_assign_and_remove_tag_explicitly() {
        let conn = setup_test_db();
        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Tag Ops".into(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: None,
            },
        )
        .unwrap();

        // Assign tag
        let tag = assign_tag(&conn, &proj.id, "character", "char-456", "clue").unwrap();
        assert_eq!(tag.name, "clue");

        let tags = get_entity_tags(&conn, "character", "char-456").unwrap();
        assert_eq!(tags.len(), 1);
        assert_eq!(tags[0].id, tag.id);

        // Remove tag
        let removed = remove_tag(&conn, "character", "char-456", &tag.id).unwrap();
        assert!(removed);

        let after_tags = get_entity_tags(&conn, "character", "char-456").unwrap();
        assert!(after_tags.is_empty());
    }
}
