use tauri::State;
use crate::db::{session_repo, DbManager};
use crate::models::{AppError, SessionStats, WritingSession};

#[tauri::command]
pub fn start_writing_session(
    db: State<DbManager>,
    project_id: String,
    node_id: Option<String>,
) -> Result<WritingSession, AppError> {
    db.with_conn(|conn| session_repo::start_session(conn, &project_id, node_id.as_deref()))
}

#[tauri::command]
pub fn end_writing_session(
    db: State<DbManager>,
    session_id: String,
    words_written: i64,
    duration_seconds: i64,
) -> Result<WritingSession, AppError> {
    db.with_conn(|conn| {
        session_repo::end_session(conn, &session_id, words_written, duration_seconds)
    })
}

#[tauri::command]
pub fn list_writing_sessions(
    db: State<DbManager>,
    project_id: String,
    limit: Option<i64>,
) -> Result<Vec<WritingSession>, AppError> {
    let lim = limit.unwrap_or(20);
    db.with_conn(|conn| session_repo::list_sessions(conn, &project_id, lim))
}

#[tauri::command]
pub fn get_session_stats(
    db: State<DbManager>,
    project_id: String,
) -> Result<SessionStats, AppError> {
    db.with_conn(|conn| session_repo::get_session_stats(conn, &project_id))
}
