use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use crate::models::{
    AppError, CreateTimelineEventInput, TimelineEvent, TimelineFilter,
    UpdateTimelineEventInput,
};

pub fn create_timeline_event(
    conn: &Connection,
    input: CreateTimelineEventInput,
) -> Result<TimelineEvent, AppError> {
    if input.title.trim().is_empty() {
        return Err(AppError::Validation("Event title cannot be empty".to_string()));
    }

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let importance = input.importance.unwrap_or_else(|| "normal".to_string());
    let order_index = input.order_index.unwrap_or(0);

    // Fallback date values
    let date_val = input.date_value.or_else(|| input.event_date.clone());
    let date_lbl = input.date_label.or_else(|| date_val.clone());

    conn.execute(
        "INSERT INTO timeline_events (
            id, project_id, title, event_date, date_value, date_label, time_value,
            order_index, description, location_id, importance, related_chapter_id,
            tags, created_at, updated_at
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15
        )",
        params![
            id,
            input.project_id,
            input.title.trim(),
            input.event_date,
            date_val,
            date_lbl,
            input.time_value,
            order_index,
            input.description,
            input.location_id,
            importance,
            input.related_chapter_id,
            input.tags,
            now,
            now
        ],
    )?;

    // Link characters if provided
    if let Some(char_ids) = input.character_ids {
        for char_id in char_ids {
            let link_id = Uuid::new_v4().to_string();
            let _ = conn.execute(
                "INSERT OR IGNORE INTO timeline_event_characters (id, event_id, character_id) VALUES (?1, ?2, ?3)",
                params![link_id, id, char_id],
            );
        }
    }

    get_timeline_event(conn, &id)
}

pub fn get_timeline_event(conn: &Connection, id: &str) -> Result<TimelineEvent, AppError> {
    let mut stmt = conn.prepare(
        "SELECT te.id, te.project_id, te.title, te.event_date, te.date_value, te.date_label,
                te.time_value, te.order_index, te.description, te.location_id, l.name,
                te.importance, te.related_chapter_id, mn.title, te.tags, te.created_at, te.updated_at
         FROM timeline_events te
         LEFT JOIN locations l ON l.id = te.location_id
         LEFT JOIN manuscript_nodes mn ON mn.id = te.related_chapter_id
         WHERE te.id = ?1",
    )?;

    let base_event = stmt
        .query_row(params![id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, Option<String>>(6)?,
                row.get::<_, i64>(7)?,
                row.get::<_, Option<String>>(8)?,
                row.get::<_, Option<String>>(9)?,
                row.get::<_, Option<String>>(10)?,
                row.get::<_, String>(11)?,
                row.get::<_, Option<String>>(12)?,
                row.get::<_, Option<String>>(13)?,
                row.get::<_, Option<String>>(14)?,
                row.get::<_, String>(15)?,
                row.get::<_, String>(16)?,
            ))
        })
        .optional()?;

    let (
        eid,
        project_id,
        title,
        event_date,
        date_value,
        date_label,
        time_value,
        order_index,
        description,
        location_id,
        location_name,
        importance,
        related_chapter_id,
        chapter_title,
        tags,
        created_at,
        updated_at,
    ) = base_event
        .ok_or_else(|| AppError::NotFound(format!("Timeline event '{}' not found", id)))?;

    // Query character participants
    let mut char_stmt = conn.prepare(
        "SELECT c.id, c.name
         FROM timeline_event_characters tec
         JOIN characters c ON c.id = tec.character_id
         WHERE tec.event_id = ?1
         ORDER BY c.name ASC",
    )?;

    let char_rows = char_stmt.query_map(params![id], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;

    let mut character_ids = Vec::new();
    let mut character_names = Vec::new();
    for r in char_rows {
        let (cid, cname) = r?;
        character_ids.push(cid);
        character_names.push(cname);
    }

    Ok(TimelineEvent {
        id: eid,
        project_id,
        title,
        event_date,
        date_value,
        date_label,
        time_value,
        order_index,
        description,
        location_id,
        location_name,
        importance,
        related_chapter_id,
        chapter_title,
        character_ids,
        character_names,
        tags,
        created_at,
        updated_at,
    })
}

pub fn list_timeline_events(
    conn: &Connection,
    project_id: &str,
    filter: Option<TimelineFilter>,
) -> Result<Vec<TimelineEvent>, AppError> {
    let mut sql = "
        SELECT te.id
        FROM timeline_events te
        WHERE te.project_id = ?1
    "
    .to_string();

    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(project_id.to_string())];

    if let Some(ref f) = filter {
        if let Some(ref cid) = f.character_id {
            if !cid.trim().is_empty() && cid != "all" {
                sql.push_str(" AND EXISTS (SELECT 1 FROM timeline_event_characters tec WHERE tec.event_id = te.id AND tec.character_id = ?)");
                params_vec.push(Box::new(cid.clone()));
            }
        }
        if let Some(ref lid) = f.location_id {
            if !lid.trim().is_empty() && lid != "all" {
                sql.push_str(" AND te.location_id = ?");
                params_vec.push(Box::new(lid.clone()));
            }
        }
        if let Some(ref rcid) = f.related_chapter_id {
            if !rcid.trim().is_empty() && rcid != "all" {
                sql.push_str(" AND te.related_chapter_id = ?");
                params_vec.push(Box::new(rcid.clone()));
            }
        }
        if let Some(ref imp) = f.importance {
            if !imp.trim().is_empty() && imp != "all" {
                sql.push_str(" AND te.importance = ?");
                params_vec.push(Box::new(imp.clone()));
            }
        }
        if let Some(ref tag) = f.tag {
            if !tag.trim().is_empty() && tag != "all" {
                sql.push_str(" AND (te.tags LIKE ? OR EXISTS (SELECT 1 FROM entity_tags et JOIN tags t ON t.id = et.tag_id WHERE et.entity_id = te.id AND et.entity_type = 'timeline' AND t.name = ?))");
                params_vec.push(Box::new(format!("%{}%", tag)));
                params_vec.push(Box::new(tag.clone()));
            }
        }
        if let Some(ref q) = f.search_query {
            if !q.trim().is_empty() {
                sql.push_str(" AND (te.title LIKE ? OR te.description LIKE ? OR te.date_label LIKE ?)");
                let pattern = format!("%{}%", q.trim());
                params_vec.push(Box::new(pattern.clone()));
                params_vec.push(Box::new(pattern.clone()));
                params_vec.push(Box::new(pattern));
            }
        }
    }

    let is_desc = filter
        .as_ref()
        .and_then(|f| f.sort_direction.as_deref())
        .map(|s| s.eq_ignore_ascii_case("desc"))
        .unwrap_or(false);

    if is_desc {
        sql.push_str(" ORDER BY te.date_value DESC, te.order_index DESC, te.created_at DESC");
    } else {
        sql.push_str(" ORDER BY te.date_value ASC, te.order_index ASC, te.created_at ASC");
    }

    let mut stmt = conn.prepare(&sql)?;
    let slice_params: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();

    let ids: Vec<String> = stmt
        .query_map(slice_params.as_slice(), |row| row.get(0))?
        .filter_map(|r| r.ok())
        .collect();

    let mut events = Vec::new();
    for id in ids {
        if let Ok(ev) = get_timeline_event(conn, &id) {
            events.push(ev);
        }
    }

    Ok(events)
}

pub fn update_timeline_event(
    conn: &Connection,
    id: &str,
    input: UpdateTimelineEventInput,
) -> Result<TimelineEvent, AppError> {
    let existing = get_timeline_event(conn, id)?;
    let now = Utc::now().to_rfc3339();

    let title = input
        .title
        .map(|t| t.trim().to_string())
        .filter(|t| !t.is_empty())
        .unwrap_or(existing.title);

    let event_date = input.event_date.or(existing.event_date);
    let date_value = input.date_value.or(existing.date_value);
    let date_label = input.date_label.or(existing.date_label);
    let time_value = input.time_value.or(existing.time_value);
    let order_index = input.order_index.unwrap_or(existing.order_index);
    let description = input.description.or(existing.description);
    let location_id = input.location_id.or(existing.location_id);
    let importance = input.importance.unwrap_or(existing.importance);
    let related_chapter_id = input.related_chapter_id.or(existing.related_chapter_id);
    let tags = input.tags.or(existing.tags);

    conn.execute(
        "UPDATE timeline_events SET
            title = ?1,
            event_date = ?2,
            date_value = ?3,
            date_label = ?4,
            time_value = ?5,
            order_index = ?6,
            description = ?7,
            location_id = ?8,
            importance = ?9,
            related_chapter_id = ?10,
            tags = ?11,
            updated_at = ?12
         WHERE id = ?13",
        params![
            title,
            event_date,
            date_value,
            date_label,
            time_value,
            order_index,
            description,
            location_id,
            importance,
            related_chapter_id,
            tags,
            now,
            id
        ],
    )?;

    // Update characters if specified
    if let Some(char_ids) = input.character_ids {
        conn.execute(
            "DELETE FROM timeline_event_characters WHERE event_id = ?1",
            params![id],
        )?;
        for char_id in char_ids {
            let link_id = Uuid::new_v4().to_string();
            let _ = conn.execute(
                "INSERT OR IGNORE INTO timeline_event_characters (id, event_id, character_id) VALUES (?1, ?2, ?3)",
                params![link_id, id, char_id],
            );
        }
    }

    get_timeline_event(conn, id)
}

pub fn delete_timeline_event(conn: &Connection, id: &str) -> Result<bool, AppError> {
    let rows = conn.execute("DELETE FROM timeline_events WHERE id = ?1", params![id])?;
    Ok(rows > 0)
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::db::character_repo::create_character;
    use crate::db::migrations::run_migrations;
    use crate::db::project_repo::create_project;
    use crate::models::{CreateCharacterInput, CreateProjectInput};

    fn setup_test_db() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();
        conn
    }

    #[test]
    fn test_timeline_crud_and_sorting() {
        let conn = setup_test_db();
        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Timeline Chronology Novel".into(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: None,
            },
        )
        .unwrap();

        let char_a = create_character(
            &conn,
            CreateCharacterInput {
                project_id: proj.id.clone(),
                name: "Maria Santos".into(),
                nickname: None,
                role: Some("protagonist".into()),
                age: None,
                description: None,
                personality: None,
                appearance: None,
                background: None,
                motivations: None,
                fears: None,
                goals: None,
                notes: None,
                avatar_path: None,
                tags: None,
                custom_fields_json: None,
            },
        )
        .unwrap();

        // Event 2 (chronologically second: Year 2)
        let ev2 = create_timeline_event(
            &conn,
            CreateTimelineEventInput {
                project_id: proj.id.clone(),
                title: "The Pier Confrontation".into(),
                event_date: None,
                date_value: Some("0002.06.00".into()),
                date_label: Some("Year 2 — Summer".into()),
                time_value: Some("Midnight".into()),
                order_index: Some(2),
                description: Some("Meeting on the docks".into()),
                location_id: None,
                importance: Some("critical".into()),
                related_chapter_id: None,
                character_ids: Some(vec![char_a.id.clone()]),
                tags: Some("climax,pier".into()),
            },
        )
        .unwrap();

        // Event 1 (chronologically first: Year 1)
        let ev1 = create_timeline_event(
            &conn,
            CreateTimelineEventInput {
                project_id: proj.id.clone(),
                title: "Maria Arrives in Town".into(),
                event_date: None,
                date_value: Some("0001.01.15".into()),
                date_label: Some("Year 1 — Frost 15".into()),
                time_value: Some("Morning".into()),
                order_index: Some(1),
                description: Some("Train pulls into the station".into()),
                location_id: None,
                importance: Some("high".into()),
                related_chapter_id: None,
                character_ids: Some(vec![char_a.id.clone()]),
                tags: Some("intro".into()),
            },
        )
        .unwrap();

        // Check ascending sort
        let asc_list = list_timeline_events(&conn, &proj.id, None).unwrap();
        assert_eq!(asc_list.len(), 2);
        assert_eq!(asc_list[0].id, ev1.id);
        assert_eq!(asc_list[1].id, ev2.id);
        assert_eq!(asc_list[0].character_names, vec!["Maria Santos"]);

        // Check descending sort
        let desc_list = list_timeline_events(
            &conn,
            &proj.id,
            Some(TimelineFilter {
                character_id: None,
                location_id: None,
                related_chapter_id: None,
                importance: None,
                tag: None,
                search_query: None,
                sort_direction: Some("desc".into()),
            }),
        )
        .unwrap();
        assert_eq!(desc_list[0].id, ev2.id);
        assert_eq!(desc_list[1].id, ev1.id);

        // Filter by character Maria
        let filtered = list_timeline_events(
            &conn,
            &proj.id,
            Some(TimelineFilter {
                character_id: Some(char_a.id.clone()),
                location_id: None,
                related_chapter_id: None,
                importance: None,
                tag: None,
                search_query: None,
                sort_direction: None,
            }),
        )
        .unwrap();
        assert_eq!(filtered.len(), 2);
    }
}
