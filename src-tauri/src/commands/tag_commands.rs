use tauri::State;

use crate::db::{tag_repo, DbManager};
use crate::models::{AppError, CreateTagInput, SetEntityTagsInput, Tag, TagWithUsageCount};

#[tauri::command]
pub fn get_tags(
    db: State<DbManager>,
    project_id: String,
) -> Result<Vec<TagWithUsageCount>, AppError> {
    db.with_conn(|conn| tag_repo::list_tags(conn, &project_id))
}

#[tauri::command]
pub fn create_tag(db: State<DbManager>, input: CreateTagInput) -> Result<Tag, AppError> {
    db.with_conn(|conn| {
        tag_repo::get_or_create_tag(conn, &input.project_id, &input.name, input.color.as_deref())
    })
}

#[tauri::command]
pub fn rename_tag(
    db: State<DbManager>,
    id: String,
    new_name: String,
) -> Result<Tag, AppError> {
    db.with_conn(|conn| tag_repo::rename_tag(conn, &id, &new_name))
}

#[tauri::command]
pub fn delete_tag(db: State<DbManager>, id: String) -> Result<bool, AppError> {
    db.with_conn(|conn| tag_repo::delete_tag(conn, &id))
}

#[tauri::command]
pub fn get_entity_tags(
    db: State<DbManager>,
    entity_type: String,
    entity_id: String,
) -> Result<Vec<Tag>, AppError> {
    db.with_conn(|conn| tag_repo::get_entity_tags(conn, &entity_type, &entity_id))
}

#[tauri::command]
pub fn update_tag(
    db: State<DbManager>,
    id: String,
    new_name: String,
) -> Result<Tag, AppError> {
    db.with_conn(|conn| tag_repo::rename_tag(conn, &id, &new_name))
}

#[tauri::command]
pub fn assign_tag(
    db: State<DbManager>,
    project_id: String,
    entity_type: String,
    entity_id: String,
    tag_name: String,
) -> Result<Tag, AppError> {
    db.with_conn(|conn| {
        tag_repo::assign_tag(conn, &project_id, &entity_type, &entity_id, &tag_name)
    })
}

#[tauri::command]
pub fn remove_tag(
    db: State<DbManager>,
    entity_type: String,
    entity_id: String,
    tag_id: String,
) -> Result<bool, AppError> {
    db.with_conn(|conn| {
        tag_repo::remove_tag(conn, &entity_type, &entity_id, &tag_id)
    })
}

#[tauri::command]
pub fn set_entity_tags(
    db: State<DbManager>,
    input: SetEntityTagsInput,
) -> Result<Vec<Tag>, AppError> {
    db.with_conn(|conn| tag_repo::set_entity_tags(conn, input))
}
