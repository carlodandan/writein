use tauri::State;

use crate::db::{worldbuilding_repo, DbManager};
use crate::models::{
    AppError, CreateWorldbuildingInput, UpdateWorldbuildingInput, WorldbuildingEntry,
};

#[tauri::command]
pub fn get_worldbuilding_entries(
    db: State<DbManager>,
    project_id: String,
    category: Option<String>,
) -> Result<Vec<WorldbuildingEntry>, AppError> {
    db.with_conn(|conn| {
        worldbuilding_repo::list_worldbuilding_entries(conn, &project_id, category.as_deref())
    })
}

#[tauri::command]
pub fn get_worldbuilding_entry(
    db: State<DbManager>,
    id: String,
) -> Result<WorldbuildingEntry, AppError> {
    db.with_conn(|conn| worldbuilding_repo::get_worldbuilding_entry(conn, &id))
}

#[tauri::command]
pub fn create_worldbuilding_entry(
    db: State<DbManager>,
    input: CreateWorldbuildingInput,
) -> Result<WorldbuildingEntry, AppError> {
    db.with_conn(|conn| worldbuilding_repo::create_worldbuilding_entry(conn, input))
}

#[tauri::command]
pub fn update_worldbuilding_entry(
    db: State<DbManager>,
    id: String,
    input: UpdateWorldbuildingInput,
) -> Result<WorldbuildingEntry, AppError> {
    db.with_conn(|conn| worldbuilding_repo::update_worldbuilding_entry(conn, &id, input))
}

#[tauri::command]
pub fn delete_worldbuilding_entry(db: State<DbManager>, id: String) -> Result<bool, AppError> {
    db.with_conn(|conn| worldbuilding_repo::delete_worldbuilding_entry(conn, &id))
}
