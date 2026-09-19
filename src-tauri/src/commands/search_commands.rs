use tauri::State;

use crate::db::{search_repo, DbManager};
use crate::models::{AppError, SearchResponse};

#[tauri::command]
pub fn global_search(
    db: State<DbManager>,
    project_id: String,
    query: String,
) -> Result<SearchResponse, AppError> {
    db.with_conn(|conn| search_repo::global_search(conn, &project_id, &query))
}

#[tauri::command]
pub fn search_project(
    db: State<DbManager>,
    project_id: String,
    query: String,
) -> Result<SearchResponse, AppError> {
    db.with_conn(|conn| search_repo::global_search(conn, &project_id, &query))
}
