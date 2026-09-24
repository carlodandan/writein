use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use crate::models::{AppError, SessionStats, WritingSession};

pub fn start_session(
    conn: &Connection,
    project_id: &str,
    node_id: Option<&str>,
) -> Result<WritingSession, AppError> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO writing_sessions (id, project_id, node_id, started_at, ended_at, duration_seconds, words_written)
         VALUES (?1, ?2, ?3, ?4, NULL, 0, 0)",
        params![id, project_id, node_id, now],
    )?;

    get_session(conn, &id)
}

pub fn get_session(conn: &Connection, id: &str) -> Result<WritingSession, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, node_id, started_at, ended_at, duration_seconds, words_written
         FROM writing_sessions WHERE id = ?1",
    )?;

    let s = stmt
        .query_row(params![id], |row| {
            Ok(WritingSession {
                id: row.get(0)?,
                project_id: row.get(1)?,
                node_id: row.get(2)?,
                started_at: row.get(3)?,
                ended_at: row.get(4)?,
                duration_seconds: row.get(5)?,
                words_written: row.get(6)?,
            })
        })
        .optional()?;

    s.ok_or_else(|| AppError::NotFound(format!("Writing session '{}' not found", id)))
}

pub fn end_session(
    conn: &Connection,
    session_id: &str,
    words_written: i64,
    duration_seconds: i64,
) -> Result<WritingSession, AppError> {
    let now = Utc::now().to_rfc3339();

    let rows = conn.execute(
        "UPDATE writing_sessions SET ended_at = ?1, words_written = ?2, duration_seconds = ?3 WHERE id = ?4",
        params![now, words_written, duration_seconds, session_id],
    )?;

    if rows == 0 {
        return Err(AppError::NotFound(format!(
            "Writing session '{}' not found",
            session_id
        )));
    }

    get_session(conn, session_id)
}

pub fn list_sessions(
    conn: &Connection,
    project_id: &str,
    limit: i64,
) -> Result<Vec<WritingSession>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, node_id, started_at, ended_at, duration_seconds, words_written
         FROM writing_sessions
         WHERE project_id = ?1
         ORDER BY started_at DESC
         LIMIT ?2",
    )?;

    let iter = stmt.query_map(params![project_id, limit], |row| {
        Ok(WritingSession {
            id: row.get(0)?,
            project_id: row.get(1)?,
            node_id: row.get(2)?,
            started_at: row.get(3)?,
            ended_at: row.get(4)?,
            duration_seconds: row.get(5)?,
            words_written: row.get(6)?,
        })
    })?;

    let mut result = Vec::new();
    for item in iter {
        result.push(item?);
    }
    Ok(result)
}

pub fn get_session_stats(conn: &Connection, project_id: &str) -> Result<SessionStats, AppError> {
    // Today's words (UTC date prefix match)
    let today_date = Utc::now().format("%Y-%m-%d").to_string();

    let today_words: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(words_written), 0) FROM writing_sessions
             WHERE project_id = ?1 AND started_at LIKE ?2 AND ended_at IS NOT NULL",
            params![project_id, format!("{}%", today_date)],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let today_sessions: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM writing_sessions
             WHERE project_id = ?1 AND started_at LIKE ?2 AND ended_at IS NOT NULL",
            params![project_id, format!("{}%", today_date)],
            |row| row.get(0),
        )
        .unwrap_or(0);

    // This week (last 7 days)
    let week_words: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(words_written), 0) FROM writing_sessions
             WHERE project_id = ?1
               AND started_at >= datetime('now', '-7 days')
               AND ended_at IS NOT NULL",
            params![project_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    // All time
    let all_time_words: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(words_written), 0) FROM writing_sessions
             WHERE project_id = ?1 AND ended_at IS NOT NULL",
            params![project_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let total_sessions: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM writing_sessions WHERE project_id = ?1 AND ended_at IS NOT NULL",
            params![project_id],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let avg_session_words = if total_sessions > 0 {
        all_time_words / total_sessions
    } else {
        0
    };

    Ok(SessionStats {
        today_words,
        week_words,
        all_time_words,
        today_sessions,
        avg_session_words,
    })
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::db::migrations::run_migrations;
    use crate::db::project_repo::create_project;
    use crate::models::CreateProjectInput;

    fn setup() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();
        conn
    }

    #[test]
    fn test_writing_session_start_and_end() {
        let conn = setup();
        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Session Test".into(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: None,
            },
        )
        .unwrap();

        // Start session
        let session = start_session(&conn, &proj.id, None).unwrap();
        assert!(session.ended_at.is_none());
        assert_eq!(session.words_written, 0);

        // End session
        let ended = end_session(&conn, &session.id, 342, 1800).unwrap();
        assert!(ended.ended_at.is_some());
        assert_eq!(ended.words_written, 342);
        assert_eq!(ended.duration_seconds, 1800);

        // List
        let sessions = list_sessions(&conn, &proj.id, 10).unwrap();
        assert_eq!(sessions.len(), 1);

        // Stats
        let stats = get_session_stats(&conn, &proj.id).unwrap();
        assert_eq!(stats.today_words, 342);
        assert_eq!(stats.today_sessions, 1);
        assert_eq!(stats.all_time_words, 342);
        assert_eq!(stats.avg_session_words, 342);
    }
}
