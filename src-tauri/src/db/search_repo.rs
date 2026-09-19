use rusqlite::{params, Connection};

use crate::models::{AppError, SearchResponse, SearchResultItem};

pub fn global_search(
    conn: &Connection,
    project_id: &str,
    query: &str,
) -> Result<SearchResponse, AppError> {
    let clean_query = query.trim();
    if clean_query.is_empty() {
        return Ok(SearchResponse {
            query: "".to_string(),
            items: Vec::new(),
            total_count: 0,
        });
    }

    let pattern = format!("%{}%", clean_query);
    let mut items = Vec::new();

    // 1. Characters
    {
        let mut stmt = conn.prepare(
            "SELECT id, name, role, description, personality, background
             FROM characters
             WHERE project_id = ?1 AND (
                 name LIKE ?2 OR nickname LIKE ?2 OR description LIKE ?2 OR
                 personality LIKE ?2 OR background LIKE ?2 OR tags LIKE ?2
             )
             ORDER BY name ASC LIMIT 10",
        )?;
        let rows = stmt.query_map(params![project_id, pattern], |row| {
            let id: String = row.get(0)?;
            let name: String = row.get(1)?;
            let role: String = row.get(2)?;
            let desc: Option<String> = row.get(3)?;
            let personality: Option<String> = row.get(4)?;
            let background: Option<String> = row.get(5)?;

            let snippet = desc.or(personality).or(background);

            Ok(SearchResultItem {
                id: id.clone(),
                entity_type: "character".to_string(),
                title: name,
                subtitle: Some(format!("Character • {}", role)),
                snippet,
                target_tab: "characters".to_string(),
                target_id: id,
            })
        })?;
        for r in rows {
            items.push(r?);
        }
    }

    // 2. Manuscript Nodes & Documents
    {
        let mut stmt = conn.prepare(
            "SELECT mn.id, mn.title, mn.node_type, mn.synopsis, d.content_text
             FROM manuscript_nodes mn
             LEFT JOIN documents d ON d.node_id = mn.id
             WHERE mn.project_id = ?1 AND (
                 mn.title LIKE ?2 OR mn.synopsis LIKE ?2 OR d.content_text LIKE ?2
             )
             ORDER BY mn.order_index ASC LIMIT 10",
        )?;
        let rows = stmt.query_map(params![project_id, pattern], |row| {
            let id: String = row.get(0)?;
            let title: String = row.get(1)?;
            let node_type: String = row.get(2)?;
            let synopsis: Option<String> = row.get(3)?;
            let text: Option<String> = row.get(4)?;

            let snippet = synopsis.or_else(|| {
                text.map(|t| {
                    if t.len() > 140 {
                        format!("{}...", &t[..140])
                    } else {
                        t
                    }
                })
            });

            Ok(SearchResultItem {
                id: id.clone(),
                entity_type: "manuscript".to_string(),
                title,
                subtitle: Some(format!("Manuscript • {}", node_type)),
                snippet,
                target_tab: "manuscript".to_string(),
                target_id: id,
            })
        })?;
        for r in rows {
            items.push(r?);
        }
    }

    // 3. Locations
    {
        let mut stmt = conn.prepare(
            "SELECT id, name, location_type, description, atmosphere
             FROM locations
             WHERE project_id = ?1 AND (
                 name LIKE ?2 OR location_type LIKE ?2 OR description LIKE ?2 OR atmosphere LIKE ?2
             )
             ORDER BY name ASC LIMIT 10",
        )?;
        let rows = stmt.query_map(params![project_id, pattern], |row| {
            let id: String = row.get(0)?;
            let name: String = row.get(1)?;
            let loc_type: Option<String> = row.get(2)?;
            let desc: Option<String> = row.get(3)?;
            let atmosphere: Option<String> = row.get(4)?;

            let snippet = atmosphere.or(desc);

            Ok(SearchResultItem {
                id: id.clone(),
                entity_type: "location".to_string(),
                title: name,
                subtitle: Some(format!("Location • {}", loc_type.unwrap_or_else(|| "Setting".into()))),
                snippet,
                target_tab: "locations".to_string(),
                target_id: id,
            })
        })?;
        for r in rows {
            items.push(r?);
        }
    }

    // 4. Worldbuilding
    {
        let mut stmt = conn.prepare(
            "SELECT id, title, category, content
             FROM worldbuilding_entries
             WHERE project_id = ?1 AND (
                 title LIKE ?2 OR category LIKE ?2 OR content LIKE ?2
             )
             ORDER BY title ASC LIMIT 10",
        )?;
        let rows = stmt.query_map(params![project_id, pattern], |row| {
            let id: String = row.get(0)?;
            let title: String = row.get(1)?;
            let category: String = row.get(2)?;
            let content: String = row.get(3)?;

            let snippet = if content.len() > 140 {
                Some(format!("{}...", &content[..140]))
            } else if !content.is_empty() {
                Some(content)
            } else {
                None
            };

            Ok(SearchResultItem {
                id: id.clone(),
                entity_type: "worldbuilding".to_string(),
                title,
                subtitle: Some(format!("Worldbuilding • {}", category)),
                snippet,
                target_tab: "worldbuilding".to_string(),
                target_id: id,
            })
        })?;
        for r in rows {
            items.push(r?);
        }
    }

    // 5. Timeline
    {
        let mut stmt = conn.prepare(
            "SELECT id, title, date_label, description, importance
             FROM timeline_events
             WHERE project_id = ?1 AND (
                 title LIKE ?2 OR date_label LIKE ?2 OR description LIKE ?2
             )
             ORDER BY date_value ASC LIMIT 10",
        )?;
        let rows = stmt.query_map(params![project_id, pattern], |row| {
            let id: String = row.get(0)?;
            let title: String = row.get(1)?;
            let date_label: Option<String> = row.get(2)?;
            let desc: Option<String> = row.get(3)?;
            let importance: String = row.get(4)?;

            Ok(SearchResultItem {
                id: id.clone(),
                entity_type: "timeline".to_string(),
                title,
                subtitle: Some(format!("Timeline • {} ({})", date_label.unwrap_or_default(), importance)),
                snippet: desc,
                target_tab: "timeline".to_string(),
                target_id: id,
            })
        })?;
        for r in rows {
            items.push(r?);
        }
    }

    // 6. Notes
    {
        let mut stmt = conn.prepare(
            "SELECT id, title, category, content
             FROM notes
             WHERE project_id = ?1 AND (
                 title LIKE ?2 OR category LIKE ?2 OR content LIKE ?2
             )
             ORDER BY updated_at DESC LIMIT 10",
        )?;
        let rows = stmt.query_map(params![project_id, pattern], |row| {
            let id: String = row.get(0)?;
            let title: String = row.get(1)?;
            let category: String = row.get(2)?;
            let content: String = row.get(3)?;

            let snippet = if content.len() > 140 {
                Some(format!("{}...", &content[..140]))
            } else if !content.is_empty() {
                Some(content)
            } else {
                None
            };

            Ok(SearchResultItem {
                id: id.clone(),
                entity_type: "note".to_string(),
                title,
                subtitle: Some(format!("Note • {}", category)),
                snippet,
                target_tab: "notes".to_string(),
                target_id: id,
            })
        })?;
        for r in rows {
            items.push(r?);
        }
    }

    let total_count = items.len();
    Ok(SearchResponse {
        query: clean_query.to_string(),
        items,
        total_count,
    })
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::db::character_repo::create_character;
    use crate::db::migrations::run_migrations;
    use crate::db::note_repo::create_note;
    use crate::db::project_repo::create_project;
    use crate::models::{CreateCharacterInput, CreateNoteInput, CreateProjectInput};

    fn setup_test_db() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();
        conn
    }

    #[test]
    fn test_global_search_across_entities() {
        let conn = setup_test_db();
        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Search Novel".into(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: None,
            },
        )
        .unwrap();

        // Create character named Maria
        create_character(
            &conn,
            CreateCharacterInput {
                project_id: proj.id.clone(),
                name: "Maria Santos".into(),
                nickname: None,
                role: Some("protagonist".into()),
                age: None,
                description: Some("Observant detective".into()),
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

        // Create note about Maria
        create_note(
            &conn,
            CreateNoteInput {
                project_id: proj.id.clone(),
                category: Some("Plot".into()),
                title: "Maria's Lost Locket".into(),
                content: Some("Found in the grandfather clock.".into()),
                tags: None,
            },
        )
        .unwrap();

        let res = global_search(&conn, &proj.id, "Maria").unwrap();
        assert_eq!(res.total_count, 2);
        assert!(res.items.iter().any(|i| i.entity_type == "character"));
        assert!(res.items.iter().any(|i| i.entity_type == "note"));
    }

    #[test]
    fn test_realistic_search_dataset_with_maria() {
        let conn = setup_test_db();
        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "The Accident Investigation".into(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: None,
            },
        )
        .unwrap();

        // 1. Characters: Maria Santos, Carlo Reyes, Anna Cruz
        for name in &["Maria Santos", "Carlo Reyes", "Anna Cruz"] {
            create_character(
                &conn,
                CreateCharacterInput {
                    project_id: proj.id.clone(),
                    name: (*name).into(),
                    nickname: None,
                    role: Some("Cast".into()),
                    age: None,
                    description: Some(format!("Profile of {}", name)),
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
        }

        // 2. Chapters: The Meeting, The Accident, The Return
        for title in &["The Meeting", "The Accident", "The Return"] {
            crate::db::manuscript_repo::create_node(
                &conn,
                crate::models::CreateNodeInput {
                    project_id: proj.id.clone(),
                    parent_id: None,
                    node_type: crate::models::NodeType::Chapter,
                    title: (*title).into(),
                    synopsis: None,
                },
            )
            .unwrap();
        }

        // 3. Timeline: Maria meets Carlo, The Accident, Maria leaves the city
        for title in &["Maria meets Carlo", "The Accident", "Maria leaves the city"] {
            crate::db::timeline_repo::create_timeline_event(
                &conn,
                crate::models::CreateTimelineEventInput {
                    project_id: proj.id.clone(),
                    title: (*title).into(),
                    event_date: Some("Day 1".into()),
                    date_value: None,
                    date_label: None,
                    time_value: None,
                    order_index: None,
                    description: Some("Key event in chronology".into()),
                    location_id: None,
                    importance: Some("normal".into()),
                    related_chapter_id: None,
                    character_ids: None,
                    tags: None,
                },
            )
            .unwrap();
        }

        // 4. Notes: Maria's Secret Diary
        create_note(
            &conn,
            CreateNoteInput {
                project_id: proj.id.clone(),
                category: Some("Ideas".into()),
                title: "Maria's Secret Diary".into(),
                content: Some("Clues recovered from the old house".into()),
                tags: None,
            },
        )
        .unwrap();

        // A. Search "Maria" - should find across characters, timeline events, and notes
        let maria_results = global_search(&conn, &proj.id, "Maria").unwrap();
        assert!(maria_results.total_count >= 4);
        assert!(maria_results.items.iter().any(|i| i.entity_type == "character" && i.title.contains("Maria")));
        assert!(maria_results.items.iter().any(|i| i.entity_type == "timeline" && i.title.contains("Maria meets Carlo")));
        assert!(maria_results.items.iter().any(|i| i.entity_type == "timeline" && i.title.contains("Maria leaves the city")));
        assert!(maria_results.items.iter().any(|i| i.entity_type == "note" && i.title.contains("Maria's Secret Diary")));

        // B. Case-insensitivity: "maria" vs "MARIA"
        let lower_results = global_search(&conn, &proj.id, "maria").unwrap();
        let upper_results = global_search(&conn, &proj.id, "MARIA").unwrap();
        assert_eq!(lower_results.total_count, maria_results.total_count);
        assert_eq!(upper_results.total_count, maria_results.total_count);

        // C. Partial matching: "Accid" matches "The Accident"
        let accid_results = global_search(&conn, &proj.id, "Accid").unwrap();
        assert!(accid_results.total_count >= 2);
        assert!(accid_results.items.iter().any(|i| i.entity_type == "manuscript" && i.title == "The Accident"));
        assert!(accid_results.items.iter().any(|i| i.entity_type == "timeline" && i.title == "The Accident"));

        // D. Non-existent query
        let empty_results = global_search(&conn, &proj.id, "xyzabc999nonexistent").unwrap();
        assert_eq!(empty_results.total_count, 0);
        assert!(empty_results.items.is_empty());
    }

    #[test]
    fn test_search_performance_with_large_dataset() {
        let conn = setup_test_db();
        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Mega Epic Fantasy".into(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: Some(500000),
            },
        )
        .unwrap();

        // Populate in transaction for speed:
        // 500 manuscript nodes, 500 timeline events, 500 notes, 200 characters, 200 locations, 1000 tags
        conn.execute_batch("BEGIN TRANSACTION;").unwrap();

        // 200 characters
        for i in 1..=200 {
            conn.execute(
                "INSERT INTO characters (id, project_id, name, role, created_at, updated_at) VALUES (?1, ?2, ?3, 'protagonist', datetime('now'), datetime('now'))",
                params![format!("char-{}", i), proj.id, format!("Hero Character Number {}", i)],
            ).unwrap();
        }

        // 200 locations
        for i in 1..=200 {
            conn.execute(
                "INSERT INTO locations (id, project_id, name, location_type, created_at, updated_at) VALUES (?1, ?2, ?3, 'Citadel', datetime('now'), datetime('now'))",
                params![format!("loc-{}", i), proj.id, format!("Ancient Fortress Sector {}", i)],
            ).unwrap();
        }

        // 500 manuscript nodes
        for i in 1..=500 {
            conn.execute(
                "INSERT INTO manuscript_nodes (id, project_id, node_type, title, order_index, created_at, updated_at) VALUES (?1, ?2, 'chapter', ?3, ?4, datetime('now'), datetime('now'))",
                params![format!("node-{}", i), proj.id, format!("Chapter {}: The Journey Through Realm {}", i, i), i],
            ).unwrap();
        }

        // 500 timeline events
        for i in 1..=500 {
            conn.execute(
                "INSERT INTO timeline_events (id, project_id, title, order_index, created_at) VALUES (?1, ?2, ?3, ?4, datetime('now'))",
                params![format!("tl-{}", i), proj.id, format!("Event {}: Clash of Swords at Year {}", i, 1000 + i), i],
            ).unwrap();
        }

        // 500 notes
        for i in 1..=500 {
            conn.execute(
                "INSERT INTO notes (id, project_id, category, title, content, created_at, updated_at) VALUES (?1, ?2, 'Ideas', ?3, ?4, datetime('now'), datetime('now'))",
                params![format!("note-{}", i), proj.id, format!("Note {}: Deep Lore Reflection", i), format!("Comprehensive notes regarding ancient history index {}", i)],
            ).unwrap();
        }

        // 1,000 tags
        for i in 1..=1000 {
            conn.execute(
                "INSERT INTO tags (id, project_id, name) VALUES (?1, ?2, ?3)",
                params![format!("tag-{}", i), proj.id, format!("tag-marker-{}", i)],
            ).unwrap();
        }

        conn.execute_batch("COMMIT;").unwrap();

        // Benchmark global search on this 2,900+ item database
        let start = std::time::Instant::now();
        let search_res = global_search(&conn, &proj.id, "Hero Character Number 150").unwrap();
        let duration = start.elapsed();

        assert_eq!(search_res.total_count, 1);
        assert_eq!(search_res.items[0].title, "Hero Character Number 150");
        // Verify fast SQLite search performance (< 50ms)
        assert!(duration.as_millis() < 50, "Search took too long: {:?}", duration);

        // Search for partial chapter query across 500 chapters
        let start2 = std::time::Instant::now();
        let ch_res = global_search(&conn, &proj.id, "Realm 42").unwrap();
        let duration2 = start2.elapsed();
        assert!(ch_res.total_count >= 1);
        assert!(duration2.as_millis() < 50, "Chapter search took too long: {:?}", duration2);
    }
}
