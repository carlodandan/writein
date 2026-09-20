use std::collections::HashMap;
use tauri::State;
use crate::db::{settings_repo, DbManager};
use crate::models::{AppError, Setting};

/// Retrieves a saved application setting by key.
#[tauri::command]
pub fn get_setting(
    db: State<DbManager>,
    key: String,
) -> Result<Option<String>, AppError> {
    db.with_conn(|conn| settings_repo::get_setting(conn, &key))
}

/// Creates or replaces a saved application setting.
#[tauri::command]
pub fn save_setting(
    db: State<DbManager>,
    key: String,
    value: String,
) -> Result<Setting, AppError> {
    db.with_conn(|conn| settings_repo::save_setting(conn, &key, &value))
}

/// Returns all saved application settings as key-value pairs.
#[tauri::command]
pub fn get_all_settings(
    db: State<DbManager>,
) -> Result<HashMap<String, String>, AppError> {
    db.with_conn(|conn| settings_repo::get_all_settings(conn))
}

/// Deletes a saved application setting by key.
#[tauri::command]
pub fn delete_setting(
    db: State<DbManager>,
    key: String,
) -> Result<bool, AppError> {
    db.with_conn(|conn| settings_repo::delete_setting(conn, &key))
}
