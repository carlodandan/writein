use rusqlite::{params, Connection};
use crate::models::{AppError, RelatedContentItem, RelatedContentResponse};

pub fn get_related_content(
    conn: &Connection,
    project_id: &str,
    entity_type: &str,
    entity_id: &str,
) -> Result<RelatedContentResponse, AppError> {
    let mut chapters = Vec::new();
    let mut characters = Vec::new();
    let mut locations = Vec::new();
    let mut timeline_events = Vec::new();
    let mut notes = Vec::new();
    let mut attachments = Vec::new();

    // 1. Attachments linked directly to this entity
    {
        let mut stmt = conn.prepare(
            "SELECT id, file_name, file_type, file_size, description
             FROM attachments
             WHERE project_id = ?1 AND entity_type = ?2 AND entity_id = ?3
             ORDER BY created_at DESC",
        )?;
        let rows = stmt.query_map(params![project_id, entity_type, entity_id], |row| {
            let id: String = row.get(0)?;
            let file_name: String = row.get(1)?;
            let file_type: String = row.get(2)?;
            let size: i64 = row.get(3)?;
            let desc: Option<String> = row.get(4)?;

            Ok(RelatedContentItem {
                id: id.clone(),
                entity_type: "attachment".to_string(),
                title: file_name,
                subtitle: desc.or_else(|| Some(format!("{:.1} KB", size as f64 / 1024.0))),
                badge: Some(file_type.to_uppercase()),
                target_tab: "references".to_string(),
                target_id: id,
            })
        })?;

        for r in rows {
            attachments.push(r?);
        }
    }

    match entity_type {
        "character" => {
            // A. Timeline events where character participates
            let mut stmt = conn.prepare(
                "SELECT te.id, te.title, te.date_label, te.date_value, te.importance
                 FROM timeline_events te
                 JOIN timeline_event_characters tec ON te.id = tec.event_id
                 WHERE tec.character_id = ?1 AND te.project_id = ?2
                 ORDER BY te.order_index ASC",
            )?;
            let rows = stmt.query_map(params![entity_id, project_id], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let date_label: Option<String> = row.get(2)?;
                let date_value: Option<String> = row.get(3)?;
                let importance: Option<String> = row.get(4)?;

                Ok(RelatedContentItem {
                    id: id.clone(),
                    entity_type: "timeline".to_string(),
                    title,
                    subtitle: date_label.or(date_value),
                    badge: importance,
                    target_tab: "timeline".to_string(),
                    target_id: id,
                })
            })?;
            for r in rows {
                timeline_events.push(r?);
            }

            // B. Chapters where character's events occur
            let mut ch_stmt = conn.prepare(
                "SELECT DISTINCT mn.id, mn.title, mn.node_type, mn.status
                 FROM manuscript_nodes mn
                 JOIN timeline_events te ON mn.id = te.related_chapter_id
                 JOIN timeline_event_characters tec ON te.id = tec.event_id
                 WHERE tec.character_id = ?1 AND mn.project_id = ?2",
            )?;
            let ch_rows = ch_stmt.query_map(params![entity_id, project_id], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let node_type: String = row.get(2)?;
                let status: String = row.get(3)?;

                Ok(RelatedContentItem {
                    id: id.clone(),
                    entity_type: "chapter".to_string(),
                    title,
                    subtitle: Some(format!("Appears in {}", node_type)),
                    badge: Some(status),
                    target_tab: "manuscript".to_string(),
                    target_id: id,
                })
            })?;
            for r in ch_rows {
                chapters.push(r?);
            }

            // C. Locations where character's events occur
            let mut loc_stmt = conn.prepare(
                "SELECT DISTINCT l.id, l.name, l.location_type
                 FROM locations l
                 JOIN timeline_events te ON l.id = te.location_id
                 JOIN timeline_event_characters tec ON te.id = tec.event_id
                 WHERE tec.character_id = ?1 AND l.project_id = ?2",
            )?;
            let loc_rows = loc_stmt.query_map(params![entity_id, project_id], |row| {
                let id: String = row.get(0)?;
                let name: String = row.get(1)?;
                let loc_type: Option<String> = row.get(2)?;

                Ok(RelatedContentItem {
                    id: id.clone(),
                    entity_type: "location".to_string(),
                    title: name,
                    subtitle: loc_type,
                    badge: Some("Setting".to_string()),
                    target_tab: "locations".to_string(),
                    target_id: id,
                })
            })?;
            for r in loc_rows {
                locations.push(r?);
            }

            // D. Related Characters via character_relationships
            let mut rel_stmt = conn.prepare(
                "SELECT c.id, c.name, c.role, cr.relation_type
                 FROM character_relationships cr
                 JOIN characters c ON (c.id = CASE WHEN cr.character_a_id = ?1 THEN cr.character_b_id ELSE cr.character_a_id END)
                 WHERE (cr.character_a_id = ?1 OR cr.character_b_id = ?1) AND cr.project_id = ?2",
            )?;
            let rel_rows = rel_stmt.query_map(params![entity_id, project_id], |row| {
                let id: String = row.get(0)?;
                let name: String = row.get(1)?;
                let role: String = row.get(2)?;
                let relation: String = row.get(3)?;

                Ok(RelatedContentItem {
                    id: id.clone(),
                    entity_type: "character".to_string(),
                    title: name,
                    subtitle: Some(relation),
                    badge: Some(role),
                    target_tab: "characters".to_string(),
                    target_id: id,
                })
            })?;
            for r in rel_rows {
                characters.push(r?);
            }

            // E. Notes mentioning character
            if let Ok(char_name) = conn.query_row::<String, _, _>(
                "SELECT name FROM characters WHERE id = ?1",
                params![entity_id],
                |row| row.get(0),
            ) {
                if !char_name.trim().is_empty() {
                    let first_name = char_name.split_whitespace().next().unwrap_or(&char_name);
                    let pattern_full = format!("%{}%", char_name.trim());
                    let pattern_first = format!("%{}%", first_name.trim());
                    if let Ok(mut note_stmt) = conn.prepare(
                        "SELECT id, title, category FROM notes WHERE project_id = ?1 AND (title LIKE ?2 OR content LIKE ?2 OR title LIKE ?3 OR content LIKE ?3) ORDER BY updated_at DESC LIMIT 10",
                    ) {
                        if let Ok(note_rows) = note_stmt.query_map(params![project_id, pattern_full, pattern_first], |row| {
                            let id: String = row.get(0)?;
                            let title: String = row.get(1)?;
                            let category: String = row.get(2)?;
                            Ok(RelatedContentItem {
                                id: id.clone(),
                                entity_type: "note".to_string(),
                                title,
                                subtitle: Some(format!("Category: {}", category)),
                                badge: Some("Note".to_string()),
                                target_tab: "notes".to_string(),
                                target_id: id,
                            })
                        }) {
                            for r in note_rows.flatten() {
                                notes.push(r);
                            }
                        }
                    }
                }
            }
        }

        "location" => {
            // A. Timeline events occurring at this location
            let mut stmt = conn.prepare(
                "SELECT te.id, te.title, te.date_label, te.date_value, te.importance
                 FROM timeline_events te
                 WHERE te.location_id = ?1 AND te.project_id = ?2
                 ORDER BY te.order_index ASC",
            )?;
            let rows = stmt.query_map(params![entity_id, project_id], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let date_label: Option<String> = row.get(2)?;
                let date_value: Option<String> = row.get(3)?;
                let importance: Option<String> = row.get(4)?;

                Ok(RelatedContentItem {
                    id: id.clone(),
                    entity_type: "timeline".to_string(),
                    title,
                    subtitle: date_label.or(date_value),
                    badge: importance,
                    target_tab: "timeline".to_string(),
                    target_id: id,
                })
            })?;
            for r in rows {
                timeline_events.push(r?);
            }

            // B. Characters participating in events at this location
            let mut char_stmt = conn.prepare(
                "SELECT DISTINCT c.id, c.name, c.role
                 FROM characters c
                 JOIN timeline_event_characters tec ON c.id = tec.character_id
                 JOIN timeline_events te ON tec.event_id = te.id
                 WHERE te.location_id = ?1 AND c.project_id = ?2",
            )?;
            let char_rows = char_stmt.query_map(params![entity_id, project_id], |row| {
                let id: String = row.get(0)?;
                let name: String = row.get(1)?;
                let role: String = row.get(2)?;

                Ok(RelatedContentItem {
                    id: id.clone(),
                    entity_type: "character".to_string(),
                    title: name,
                    subtitle: Some("Present at location".to_string()),
                    badge: Some(role),
                    target_tab: "characters".to_string(),
                    target_id: id,
                })
            })?;
            for r in char_rows {
                characters.push(r?);
            }

            // C. Chapters featuring events at this location
            let mut ch_stmt = conn.prepare(
                "SELECT DISTINCT mn.id, mn.title, mn.node_type, mn.status
                 FROM manuscript_nodes mn
                 JOIN timeline_events te ON mn.id = te.related_chapter_id
                 WHERE te.location_id = ?1 AND mn.project_id = ?2",
            )?;
            let ch_rows = ch_stmt.query_map(params![entity_id, project_id], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let node_type: String = row.get(2)?;
                let status: String = row.get(3)?;

                Ok(RelatedContentItem {
                    id: id.clone(),
                    entity_type: "chapter".to_string(),
                    title,
                    subtitle: Some(format!("Setting for {}", node_type)),
                    badge: Some(status),
                    target_tab: "manuscript".to_string(),
                    target_id: id,
                })
            })?;
            for r in ch_rows {
                chapters.push(r?);
            }

            // D. Notes mentioning location
            if let Ok(loc_name) = conn.query_row::<String, _, _>(
                "SELECT name FROM locations WHERE id = ?1",
                params![entity_id],
                |row| row.get(0),
            ) {
                if !loc_name.trim().is_empty() {
                    let pattern = format!("%{}%", loc_name.trim());
                    if let Ok(mut note_stmt) = conn.prepare(
                        "SELECT id, title, category FROM notes WHERE project_id = ?1 AND (title LIKE ?2 OR content LIKE ?2) ORDER BY updated_at DESC LIMIT 10",
                    ) {
                        if let Ok(note_rows) = note_stmt.query_map(params![project_id, pattern], |row| {
                            let id: String = row.get(0)?;
                            let title: String = row.get(1)?;
                            let category: String = row.get(2)?;
                            Ok(RelatedContentItem {
                                id: id.clone(),
                                entity_type: "note".to_string(),
                                title,
                                subtitle: Some(format!("Category: {}", category)),
                                badge: Some("Note".to_string()),
                                target_tab: "notes".to_string(),
                                target_id: id,
                            })
                        }) {
                            for r in note_rows.flatten() {
                                notes.push(r);
                            }
                        }
                    }
                }
            }
        }

        "chapter" | "manuscript" => {
            // A. Timeline events tied to this chapter
            let mut stmt = conn.prepare(
                "SELECT te.id, te.title, te.date_label, te.date_value, te.importance
                 FROM timeline_events te
                 WHERE te.related_chapter_id = ?1 AND te.project_id = ?2
                 ORDER BY te.order_index ASC",
            )?;
            let rows = stmt.query_map(params![entity_id, project_id], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let date_label: Option<String> = row.get(2)?;
                let date_value: Option<String> = row.get(3)?;
                let importance: Option<String> = row.get(4)?;

                Ok(RelatedContentItem {
                    id: id.clone(),
                    entity_type: "timeline".to_string(),
                    title,
                    subtitle: date_label.or(date_value),
                    badge: importance,
                    target_tab: "timeline".to_string(),
                    target_id: id,
                })
            })?;
            for r in rows {
                timeline_events.push(r?);
            }

            // B. Characters in this chapter via timeline
            let mut char_stmt = conn.prepare(
                "SELECT DISTINCT c.id, c.name, c.role
                 FROM characters c
                 JOIN timeline_event_characters tec ON c.id = tec.character_id
                 JOIN timeline_events te ON tec.event_id = te.id
                 WHERE te.related_chapter_id = ?1 AND c.project_id = ?2",
            )?;
            let char_rows = char_stmt.query_map(params![entity_id, project_id], |row| {
                let id: String = row.get(0)?;
                let name: String = row.get(1)?;
                let role: String = row.get(2)?;

                Ok(RelatedContentItem {
                    id: id.clone(),
                    entity_type: "character".to_string(),
                    title: name,
                    subtitle: Some("Appears in chapter".to_string()),
                    badge: Some(role),
                    target_tab: "characters".to_string(),
                    target_id: id,
                })
            })?;
            for r in char_rows {
                characters.push(r?);
            }

            // C. Locations in this chapter via timeline
            let mut loc_stmt = conn.prepare(
                "SELECT DISTINCT l.id, l.name, l.location_type
                 FROM locations l
                 JOIN timeline_events te ON l.id = te.location_id
                 WHERE te.related_chapter_id = ?1 AND l.project_id = ?2",
            )?;
            let loc_rows = loc_stmt.query_map(params![entity_id, project_id], |row| {
                let id: String = row.get(0)?;
                let name: String = row.get(1)?;
                let loc_type: Option<String> = row.get(2)?;

                Ok(RelatedContentItem {
                    id: id.clone(),
                    entity_type: "location".to_string(),
                    title: name,
                    subtitle: loc_type,
                    badge: Some("Setting".to_string()),
                    target_tab: "locations".to_string(),
                    target_id: id,
                })
            })?;
            for r in loc_rows {
                locations.push(r?);
            }

            // D. Notes mentioning chapter title
            if let Ok(ch_title) = conn.query_row::<String, _, _>(
                "SELECT title FROM manuscript_nodes WHERE id = ?1",
                params![entity_id],
                |row| row.get(0),
            ) {
                if !ch_title.trim().is_empty() {
                    let pattern = format!("%{}%", ch_title.trim());
                    if let Ok(mut note_stmt) = conn.prepare(
                        "SELECT id, title, category FROM notes WHERE project_id = ?1 AND (title LIKE ?2 OR content LIKE ?2) ORDER BY updated_at DESC LIMIT 10",
                    ) {
                        if let Ok(note_rows) = note_stmt.query_map(params![project_id, pattern], |row| {
                            let id: String = row.get(0)?;
                            let title: String = row.get(1)?;
                            let category: String = row.get(2)?;
                            Ok(RelatedContentItem {
                                id: id.clone(),
                                entity_type: "note".to_string(),
                                title,
                                subtitle: Some(format!("Category: {}", category)),
                                badge: Some("Note".to_string()),
                                target_tab: "notes".to_string(),
                                target_id: id,
                            })
                        }) {
                            for r in note_rows.flatten() {
                                notes.push(r);
                            }
                        }
                    }
                }
            }
        }

        "note" => {
            // Check if note mentions any characters in project
            if let Ok((ntitle, ncontent)) = conn.query_row::<(String, String), _, _>(
                "SELECT title, content FROM notes WHERE id = ?1",
                params![entity_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            ) {
                let full_text = format!("{} {}", ntitle, ncontent).to_lowercase();
                if let Ok(mut char_stmt) = conn.prepare("SELECT id, name, role FROM characters WHERE project_id = ?1") {
                    if let Ok(char_rows) = char_stmt.query_map(params![project_id], |row| {
                        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?))
                    }) {
                        for r in char_rows.flatten() {
                            let (cid, cname, crole) = r;
                            if !cname.trim().is_empty() && full_text.contains(&cname.to_lowercase()) {
                                characters.push(RelatedContentItem {
                                    id: cid.clone(),
                                    entity_type: "character".to_string(),
                                    title: cname,
                                    subtitle: Some("Mentioned in note".to_string()),
                                    badge: Some(crole),
                                    target_tab: "characters".to_string(),
                                    target_id: cid,
                                });
                            }
                        }
                    }
                }
            }
        }

        _ => {}
    }

    Ok(RelatedContentResponse {
        entity_type: entity_type.to_string(),
        entity_id: entity_id.to_string(),
        chapters,
        characters,
        locations,
        timeline_events,
        notes,
        attachments,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::migrations::run_migrations;

    #[test]
    fn test_cross_link_query() {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();

        // Seed project
        conn.execute(
            "INSERT INTO projects (id, title, status, target_word_count, current_word_count, created_at, updated_at)
             VALUES ('proj-1', 'Novel', 'idea', 50000, 0, datetime('now'), datetime('now'))",
            [],
        ).unwrap();

        // Seed character
        conn.execute(
            "INSERT INTO characters (id, project_id, name, role, created_at, updated_at)
             VALUES ('char-1', 'proj-1', 'Maria Santos', 'protagonist', datetime('now'), datetime('now'))",
            [],
        ).unwrap();

        // Seed chapter
        conn.execute(
            "INSERT INTO manuscript_nodes (id, project_id, node_type, title, sort_order, created_at, updated_at)
             VALUES ('chap-4', 'proj-1', 'chapter', 'Chapter 04', 1, datetime('now'), datetime('now'))",
            [],
        ).unwrap();

        // Seed location
        conn.execute(
            "INSERT INTO locations (id, project_id, name, location_type, created_at, updated_at)
             VALUES ('loc-1', 'proj-1', 'Old House', 'Residence', datetime('now'), datetime('now'))",
            [],
        ).unwrap();

        // Seed timeline event
        conn.execute(
            "INSERT INTO timeline_events (id, project_id, title, location_id, related_chapter_id, date_label, created_at, updated_at)
             VALUES ('ev-1', 'proj-1', 'The Accident', 'loc-1', 'chap-4', 'Winter Mid', datetime('now'), datetime('now'))",
            [],
        ).unwrap();

        // Link Maria to event
        conn.execute(
            "INSERT INTO timeline_event_characters (id, event_id, character_id)
             VALUES ('tec-1', 'ev-1', 'char-1')",
            [],
        ).unwrap();

        // Link attachment to Maria
        conn.execute(
            "INSERT INTO attachments (id, project_id, file_name, file_path, relative_path, file_type, file_size, entity_type, entity_id, created_at, updated_at)
             VALUES ('att-1', 'proj-1', 'maria.png', 'C:/fake/maria.png', 'attachments/att-1/maria.png', 'image', 1024, 'character', 'char-1', datetime('now'), datetime('now'))",
            [],
        ).unwrap();

        // Query related content for Maria
        let related = get_related_content(&conn, "proj-1", "character", "char-1").unwrap();
        assert_eq!(related.timeline_events.len(), 1);
        assert_eq!(related.timeline_events[0].title, "The Accident");

        assert_eq!(related.chapters.len(), 1);
        assert_eq!(related.chapters[0].title, "Chapter 04");

        assert_eq!(related.locations.len(), 1);
        assert_eq!(related.locations[0].title, "Old House");

        assert_eq!(related.attachments.len(), 1);
        assert_eq!(related.attachments[0].title, "maria.png");
    }
}
