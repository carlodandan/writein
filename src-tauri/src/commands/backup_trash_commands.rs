use tauri::State;
use crate::db::{backup_repo, trash_repo, DbManager};
use crate::models::{AppError, BackupFileInfo, BackupResult, Project, TrashItem};

/// Lists the trashed items that belong to a project.
#[tauri::command]
pub fn list_trash(
    db: State<DbManager>,
    project_id: String,
) -> Result<Vec<TrashItem>, AppError> {
    db.with_conn(|conn| trash_repo::list_trash(conn, &project_id))
}

/// Moves an entity into a project's trash while retaining its display title.
#[tauri::command]
pub fn move_to_trash(
    db: State<DbManager>,
    project_id: String,
    entity_type: String,
    entity_id: String,
    title: String,
) -> Result<TrashItem, AppError> {
    db.with_conn(|conn| {
        trash_repo::move_to_trash(conn, &project_id, &entity_type, &entity_id, &title)
    })
}

/// Restores a trashed entity to its active state.
#[tauri::command]
pub fn restore_from_trash(
    db: State<DbManager>,
    trash_id: String,
) -> Result<bool, AppError> {
    db.with_conn(|conn| trash_repo::restore_from_trash(conn, &trash_id))
}

/// Permanently deletes a single trashed entity.
#[tauri::command]
pub fn delete_permanently(
    db: State<DbManager>,
    trash_id: String,
) -> Result<bool, AppError> {
    db.with_conn(|conn| trash_repo::delete_permanently(conn, &trash_id))
}

/// Permanently deletes every trashed entity for a project.
#[tauri::command]
pub fn empty_trash(
    db: State<DbManager>,
    project_id: String,
) -> Result<i64, AppError> {
    db.with_conn(|conn| trash_repo::empty_trash(conn, &project_id))
}

/// Creates a portable backup of the requested project.
#[tauri::command]
pub fn create_project_backup(
    db: State<DbManager>,
    project_id: String,
) -> Result<BackupResult, AppError> {
    let base_dir = db.base_dir().to_path_buf();
    db.with_conn(|conn| backup_repo::create_project_backup(conn, &base_dir, &project_id))
}

/// Restores a project from its serialized backup payload.
#[tauri::command]
pub fn restore_project_backup(
    db: State<DbManager>,
    backup_json: String,
) -> Result<Project, AppError> {
    db.with_conn(|conn| backup_repo::restore_project_backup(conn, &backup_json))
}

/// Lists saved backup files, optionally restricted to one project.
#[tauri::command]
pub fn list_backups(
    db: State<DbManager>,
    project_id: Option<String>,
) -> Result<Vec<BackupFileInfo>, AppError> {
    let base_dir = db.base_dir().to_path_buf();
    backup_repo::list_backups(&base_dir, project_id.as_deref())
}

/// Deletes a saved backup file by name.
#[tauri::command]
pub fn delete_backup_file(
    db: State<DbManager>,
    file_name: String,
) -> Result<bool, AppError> {
    let base_dir = db.base_dir().to_path_buf();
    backup_repo::delete_backup_file(&base_dir, &file_name)
}
