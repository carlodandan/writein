use tauri::State;
use crate::db::{manuscript_repo, version_repo, DbManager};
use crate::models::{AppError, DocumentContent, DocumentVersion, SaveDocumentInput};

#[tauri::command]
pub fn list_document_versions(
    db: State<DbManager>,
    node_id: String,
) -> Result<Vec<DocumentVersion>, AppError> {
    db.with_conn(|conn| version_repo::list_snapshots(conn, &node_id))
}

#[tauri::command]
pub fn get_document_version(
    db: State<DbManager>,
    version_id: String,
) -> Result<DocumentVersion, AppError> {
    db.with_conn(|conn| version_repo::get_snapshot_content(conn, &version_id))
}

#[tauri::command]
pub fn create_document_snapshot(
    db: State<DbManager>,
    document_id: String,
    node_id: String,
    snapshot_text: String,
    word_count: i64,
) -> Result<DocumentVersion, AppError> {
    db.with_conn(|conn| {
        version_repo::create_snapshot(conn, &document_id, &node_id, &snapshot_text, word_count)
    })
}

#[tauri::command]
pub fn restore_document_version(
    db: State<DbManager>,
    node_id: String,
    version_id: String,
) -> Result<DocumentContent, AppError> {
    db.with_conn(|conn| {
        let snapshot = version_repo::get_snapshot_content(conn, &version_id)?;

        // Ensure current document exists, and snapshot current state before restoring
        if let Ok(current_doc) = manuscript_repo::get_document(conn, &node_id) {
            if !current_doc.content_text.trim().is_empty() {
                let _ = version_repo::create_snapshot(
                    conn,
                    &current_doc.id,
                    &node_id,
                    &current_doc.content_text,
                    current_doc.word_count,
                );
            }
        }

        // Restore snapshot text into document
        let char_count = snapshot.snapshot_text.chars().count() as i64;
        manuscript_repo::save_document(
            conn,
            SaveDocumentInput {
                node_id: node_id.clone(),
                content_json: String::new(), // Will be reset/re-parsed by TipTap on load
                content_text: snapshot.snapshot_text,
                word_count: snapshot.word_count,
                character_count: char_count,
            },
        )
    })
}

#[tauri::command]
pub fn delete_document_version(
    db: State<DbManager>,
    version_id: String,
) -> Result<bool, AppError> {
    db.with_conn(|conn| version_repo::delete_snapshot(conn, &version_id))
}
