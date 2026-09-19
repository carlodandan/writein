use tauri::State;

use crate::db::{location_repo, DbManager};
use crate::models::{AppError, CreateLocationInput, Location, UpdateLocationInput};

#[tauri::command]
pub fn get_locations(
    db: State<DbManager>,
    project_id: String,
) -> Result<Vec<Location>, AppError> {
    db.with_conn(|conn| location_repo::list_locations(conn, &project_id))
}

#[tauri::command]
pub fn get_location(db: State<DbManager>, id: String) -> Result<Location, AppError> {
    db.with_conn(|conn| location_repo::get_location(conn, &id))
}

#[tauri::command]
pub fn create_location(
    db: State<DbManager>,
    input: CreateLocationInput,
) -> Result<Location, AppError> {
    db.with_conn(|conn| location_repo::create_location(conn, input))
}

#[tauri::command]
pub fn update_location(
    db: State<DbManager>,
    id: String,
    input: UpdateLocationInput,
) -> Result<Location, AppError> {
    db.with_conn(|conn| location_repo::update_location(conn, &id, input))
}

#[tauri::command]
pub fn delete_location(db: State<DbManager>, id: String) -> Result<bool, AppError> {
    db.with_conn(|conn| location_repo::delete_location(conn, &id))
}
