use crate::db::{export_repo, DbManager};
use crate::models::{
    AppError, CommitImportInput, CompileOptions, CompileResult, ManuscriptNode,
    StoryBibleExportResult,
};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;
use tauri_plugin_dialog::DialogExt;
use uuid::Uuid;

#[derive(Default)]
pub struct ExportSelections(Mutex<HashMap<String, PathBuf>>);

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportSelection {
    token: String,
    file_path: String,
}

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

/// Opens the native save dialog and keeps its selection on the Rust side.
#[tauri::command]
pub async fn select_export_path(
    app: tauri::AppHandle,
    selections: State<'_, ExportSelections>,
    default_path: String,
    filter_name: String,
    extensions: Vec<String>,
) -> Result<Option<ExportSelection>, AppError> {
    let default_path = PathBuf::from(default_path);
    let mut dialog = app.dialog().file();
    if let Some(parent) = default_path.parent().filter(|p| !p.as_os_str().is_empty()) {
        dialog = dialog.set_directory(parent);
    }
    if let Some(name) = default_path.file_name() {
        dialog = dialog.set_file_name(name.to_string_lossy().to_string());
    }
    if !extensions.is_empty() {
        let extensions: Vec<&str> = extensions.iter().map(String::as_str).collect();
        dialog = dialog.add_filter(filter_name, &extensions);
    }

    let Some(path) = dialog.blocking_save_file() else {
        return Ok(None);
    };
    let path = path
        .into_path()
        .map_err(|e| AppError::Internal(format!("Invalid save path: {}", e)))?;
    let token = Uuid::new_v4().to_string();
    selections
        .0
        .lock()
        .map_err(|_| AppError::Internal("Export selections unavailable".into()))?
        .insert(token.clone(), path.clone());
    Ok(Some(ExportSelection {
        token,
        file_path: path.to_string_lossy().to_string(),
    }))
}

/// Saves an exported file only to a path selected in the native dialog.
#[tauri::command]
pub fn save_exported_file(
    selections: State<ExportSelections>,
    selection_token: String,
    content_text: Option<String>,
    content_base64: Option<String>,
) -> Result<String, AppError> {
    write_export_selection(&selections, &selection_token, content_text, content_base64)
}

fn write_export_selection(
    selections: &ExportSelections,
    selection_token: &str,
    content_text: Option<String>,
    content_base64: Option<String>,
) -> Result<String, AppError> {
    use base64::prelude::*;
    use std::fs;

    let bytes = if let Some(b64) = content_base64 {
        BASE64_STANDARD
            .decode(b64.trim())
            .map_err(|e| AppError::Internal(format!("Failed to decode base64: {}", e)))?
    } else if let Some(text) = content_text {
        text.into_bytes()
    } else {
        return Err(AppError::Internal("No content provided to save".into()));
    };

    let target_path = selections
        .0
        .lock()
        .map_err(|_| AppError::Internal("Export selections unavailable".into()))?
        .remove(selection_token)
        .ok_or_else(|| AppError::Internal("No matching save dialog selection".into()))?;
    fs::write(&target_path, bytes)
        .map_err(|e| AppError::Internal(format!("Failed to write exported file: {}", e)))?;

    Ok(target_path.to_string_lossy().to_string())
}

#[cfg(test)]
mod export_save_tests {
    use super::*;

    #[test]
    fn writes_only_once_to_a_native_dialog_selection() {
        let path = std::env::temp_dir().join(format!("writein-export-{}.txt", Uuid::new_v4()));
        let selections = ExportSelections::default();
        let token = Uuid::new_v4().to_string();
        selections
            .0
            .lock()
            .unwrap()
            .insert(token.clone(), path.clone());

        assert!(
            write_export_selection(&selections, "unselected", Some("wrong".into()), None).is_err()
        );
        assert!(!path.exists());
        assert_eq!(
            write_export_selection(&selections, &token, Some("selected".into()), None).unwrap(),
            path.to_string_lossy()
        );
        assert_eq!(std::fs::read_to_string(&path).unwrap(), "selected");
        assert!(write_export_selection(&selections, &token, Some("again".into()), None).is_err());
        assert_eq!(std::fs::read_to_string(&path).unwrap(), "selected");
        std::fs::remove_file(path).unwrap();
    }
}

/// Reveals a file in the system file manager.
#[tauri::command]
pub fn reveal_in_folder(file_path: String) -> Result<bool, AppError> {
    use std::path::PathBuf;

    let path = PathBuf::from(&file_path);
    if !path.exists() {
        return Err(AppError::NotFound(format!(
            "Path '{}' does not exist",
            file_path
        )));
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
