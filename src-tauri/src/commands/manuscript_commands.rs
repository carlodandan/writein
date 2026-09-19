use tauri::State;
use crate::db::{manuscript_repo, DbManager};
use crate::models::{
    AppError, CreateNodeInput, DocumentContent, ManuscriptNode, MoveNodeInput, ReorderItem,
    SaveDocumentInput, UpdateNodeInput,
};

#[tauri::command]
pub fn get_manuscript_tree(
    db: State<DbManager>,
    project_id: String,
) -> Result<Vec<ManuscriptNode>, AppError> {
    db.with_conn(|conn| manuscript_repo::get_manuscript_tree(conn, &project_id))
}

#[tauri::command]
pub fn get_manuscript_node(
    db: State<DbManager>,
    id: String,
) -> Result<ManuscriptNode, AppError> {
    db.with_conn(|conn| manuscript_repo::get_node(conn, &id))
}

#[tauri::command]
pub fn create_manuscript_node(
    db: State<DbManager>,
    input: CreateNodeInput,
) -> Result<ManuscriptNode, AppError> {
    db.with_conn(|conn| manuscript_repo::create_node(conn, input))
}

#[tauri::command]
pub fn update_manuscript_node(
    db: State<DbManager>,
    id: String,
    input: UpdateNodeInput,
) -> Result<ManuscriptNode, AppError> {
    db.with_conn(|conn| manuscript_repo::update_node(conn, &id, input))
}

#[tauri::command]
pub fn delete_manuscript_node(db: State<DbManager>, id: String) -> Result<(), AppError> {
    db.with_conn(|conn| manuscript_repo::delete_node(conn, &id))
}

#[tauri::command]
pub fn duplicate_manuscript_node(
    db: State<DbManager>,
    id: String,
) -> Result<ManuscriptNode, AppError> {
    db.with_conn(|conn| manuscript_repo::duplicate_node(conn, &id))
}

#[tauri::command]
pub fn move_manuscript_node(
    db: State<DbManager>,
    input: MoveNodeInput,
) -> Result<ManuscriptNode, AppError> {
    db.with_conn(|conn| manuscript_repo::move_node(conn, input))
}

#[tauri::command]
pub fn reorder_manuscript_nodes(
    db: State<DbManager>,
    items: Vec<ReorderItem>,
) -> Result<(), AppError> {
    db.with_conn(|conn| manuscript_repo::reorder_nodes(conn, items))
}

#[tauri::command]
pub fn get_document(
    db: State<DbManager>,
    node_id: String,
) -> Result<DocumentContent, AppError> {
    db.with_conn(|conn| manuscript_repo::get_document(conn, &node_id))
}

#[tauri::command]
pub fn save_document(
    db: State<DbManager>,
    input: SaveDocumentInput,
) -> Result<DocumentContent, AppError> {
    db.with_conn(|conn| manuscript_repo::save_document(conn, input))
}
