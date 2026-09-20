use tauri::State;
use crate::db::{export_repo, DbManager};
use crate::models::{
    AppError, CommitImportInput, CompileOptions, CompileResult, ManuscriptNode,
    StoryBibleExportResult,
};

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
    db.with_conn(|conn| export_repo::commit_imported_manuscript(conn, input))
}
