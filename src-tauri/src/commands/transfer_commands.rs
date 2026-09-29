use crate::db::{transfer_repo, DbManager};
use crate::models::{AppError, LibraryTransferPackage, TransferLogItem, TransferStats};
use tauri::State;

/// Retrieves or initializes this installation's persistent device UUID.
#[tauri::command]
pub fn get_device_id(db: State<DbManager>) -> Result<String, AppError> {
    db.with_conn(|conn| transfer_repo::get_or_create_device_id(conn))
}

/// Packages the entire WriteIn novel library (all projects, nodes, documents,
/// worldbuilding, timeline, and attachments) for encrypted device transfer.
#[tauri::command]
pub async fn export_library_transfer_package(
    db: State<'_, DbManager>,
) -> Result<LibraryTransferPackage, AppError> {
    let base_dir = db.base_dir().to_path_buf();
    db.with_conn(|conn| transfer_repo::export_library_transfer_package(conn, &base_dir))
}

/// Validates, unpacks, and safely imports an incoming library package into local SQLite.
/// Conflicting project titles or IDs are safely renamed to prevent data loss.
#[tauri::command]
pub async fn import_library_transfer_package(
    db: State<'_, DbManager>,
    package_json: String,
) -> Result<TransferStats, AppError> {
    let base_dir = db.base_dir().to_path_buf();
    db.with_conn_mut(|conn| {
        transfer_repo::import_library_transfer_package(conn, &base_dir, &package_json)
    })
}

/// Lists recent incoming/outgoing transfer audit logs.
#[tauri::command]
pub fn list_transfer_logs(db: State<DbManager>) -> Result<Vec<TransferLogItem>, AppError> {
    db.with_conn(|conn| transfer_repo::list_transfer_logs(conn))
}
