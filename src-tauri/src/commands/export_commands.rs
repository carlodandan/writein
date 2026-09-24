use crate::db::{export_repo, DbManager};
use crate::models::{
    AppError, CommitImportInput, CompileOptions, CompileResult, ManuscriptNode,
    StoryBibleExportResult,
};
use tauri::State;

/// Compiles the selected project manuscript using the supplied export options.
#[tauri::command]
pub fn compile_manuscript(
    db: State<DbManager>,
    project_id: String,
    options: CompileOptions,
) -> Result<CompileResult, AppError> {
    let base_dir = db.base_dir().to_path_buf();
    db.with_conn(|conn| export_repo::compile_manuscript(conn, &base_dir, &project_id, options))
}

/// Exports a project's Story Bible in the requested format.
#[tauri::command]
pub fn export_story_bible(
    db: State<DbManager>,
    project_id: String,
    format: Option<String>,
) -> Result<StoryBibleExportResult, AppError> {
    let base_dir = db.base_dir().to_path_buf();
    let fmt = format.unwrap_or_else(|| "markdown".to_string());
    db.with_conn(|conn| export_repo::export_story_bible(conn, &base_dir, &project_id, &fmt))
}

/// Persists a previously parsed manuscript import into the project database.
#[tauri::command]
pub fn commit_imported_manuscript(
    db: State<DbManager>,
    input: CommitImportInput,
) -> Result<Vec<ManuscriptNode>, AppError> {
    db.with_conn_mut(|conn| export_repo::commit_imported_manuscript(conn, input))
}

/// Saves an exported file (text or binary base64) directly to the specified path on disk.
#[tauri::command]
pub fn save_exported_file(
    file_path: String,
    content_text: Option<String>,
    content_base64: Option<String>,
) -> Result<String, AppError> {
    use base64::prelude::*;
    use std::fs;
    use std::path::PathBuf;

    let target_path = PathBuf::from(&file_path);
    if let Some(parent) = target_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| AppError::Internal(format!("Failed to create directories: {}", e)))?;
    }

    if let Some(b64) = content_base64 {
        let bytes = BASE64_STANDARD
            .decode(b64.trim())
            .map_err(|e| AppError::Internal(format!("Failed to decode base64: {}", e)))?;
        fs::write(&target_path, bytes)
            .map_err(|e| AppError::Internal(format!("Failed to write binary file: {}", e)))?;
    } else if let Some(text) = content_text {
        fs::write(&target_path, text)
            .map_err(|e| AppError::Internal(format!("Failed to write text file: {}", e)))?;
    } else {
        return Err(AppError::Internal("No content provided to save".into()));
    }

    Ok(target_path.to_string_lossy().to_string())
}

/// Reveals a file in the system file manager.
#[tauri::command]
pub fn reveal_in_folder(file_path: String) -> Result<bool, AppError> {
    use std::path::PathBuf;

    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err(AppError::NotFound(format!("Path '{}' does not exist", file_path)));
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path.to_string_lossy()])
            .spawn()
            .map_err(|e| AppError::Internal(format!("Failed to launch explorer: {}", e)))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path.to_string_lossy()])
            .spawn()
            .map_err(|e| AppError::Internal(format!("Failed to launch finder: {}", e)))?;
    }

    #[cfg(target_os = "linux")]
    {
        let parent = path.parent().unwrap_or(&path);
        std::process::Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| AppError::Internal(format!("Failed to launch file manager: {}", e)))?;
    }

    Ok(true)
}

/// Resolves the default user download or documents directory.
#[tauri::command]
pub fn get_default_export_dir(app: tauri::AppHandle) -> Result<String, AppError> {
    use tauri::Manager;

    if let Ok(dir) = app.path().download_dir() {
        return Ok(dir.to_string_lossy().to_string());
    }
    if let Ok(dir) = app.path().document_dir() {
        return Ok(dir.to_string_lossy().to_string());
    }
    Ok(std::env::temp_dir().to_string_lossy().to_string())
}
