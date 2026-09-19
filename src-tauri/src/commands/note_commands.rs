use tauri::State;

use crate::db::{note_repo, DbManager};
use crate::models::{AppError, CreateNoteInput, Note, UpdateNoteInput};

#[tauri::command]
pub fn get_notes(
    db: State<DbManager>,
    project_id: String,
    category: Option<String>,
    include_archived: Option<bool>,
) -> Result<Vec<Note>, AppError> {
    db.with_conn(|conn| {
        note_repo::list_notes(
            conn,
            &project_id,
            category.as_deref(),
            include_archived.unwrap_or(false),
        )
    })
}

#[tauri::command]
pub fn get_note(db: State<DbManager>, id: String) -> Result<Note, AppError> {
    db.with_conn(|conn| note_repo::get_note(conn, &id))
}

#[tauri::command]
pub fn create_note(db: State<DbManager>, input: CreateNoteInput) -> Result<Note, AppError> {
    db.with_conn(|conn| note_repo::create_note(conn, input))
}

#[tauri::command]
pub fn update_note(
    db: State<DbManager>,
    id: String,
    input: UpdateNoteInput,
) -> Result<Note, AppError> {
    db.with_conn(|conn| note_repo::update_note(conn, &id, input))
}

#[tauri::command]
pub fn toggle_archive_note(db: State<DbManager>, id: String) -> Result<Note, AppError> {
    db.with_conn(|conn| note_repo::toggle_archive_note(conn, &id))
}

#[tauri::command]
pub fn delete_note(db: State<DbManager>, id: String) -> Result<bool, AppError> {
    db.with_conn(|conn| note_repo::delete_note(conn, &id))
}
