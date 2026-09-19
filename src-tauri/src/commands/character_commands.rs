use tauri::State;

use crate::db::{character_repo, DbManager};
use crate::models::{
    AppError, Character, CharacterRelationshipWithNames, CreateCharacterInput,
    CreateRelationshipInput, UpdateCharacterInput, UpdateRelationshipInput,
};

#[tauri::command]
pub fn get_characters(
    db: State<DbManager>,
    project_id: String,
) -> Result<Vec<Character>, AppError> {
    db.with_conn(|conn| character_repo::list_characters(conn, &project_id))
}

#[tauri::command]
pub fn get_character(db: State<DbManager>, id: String) -> Result<Character, AppError> {
    db.with_conn(|conn| character_repo::get_character(conn, &id))
}

#[tauri::command]
pub fn create_character(
    db: State<DbManager>,
    input: CreateCharacterInput,
) -> Result<Character, AppError> {
    db.with_conn(|conn| character_repo::create_character(conn, input))
}

#[tauri::command]
pub fn update_character(
    db: State<DbManager>,
    id: String,
    input: UpdateCharacterInput,
) -> Result<Character, AppError> {
    db.with_conn(|conn| character_repo::update_character(conn, &id, input))
}

#[tauri::command]
pub fn delete_character(db: State<DbManager>, id: String) -> Result<bool, AppError> {
    db.with_conn(|conn| character_repo::delete_character(conn, &id))
}

#[tauri::command]
pub fn get_character_relationships(
    db: State<DbManager>,
    project_id: String,
) -> Result<Vec<CharacterRelationshipWithNames>, AppError> {
    db.with_conn(|conn| character_repo::list_relationships(conn, &project_id))
}

#[tauri::command]
pub fn create_character_relationship(
    db: State<DbManager>,
    input: CreateRelationshipInput,
) -> Result<CharacterRelationshipWithNames, AppError> {
    db.with_conn(|conn| character_repo::create_relationship(conn, input))
}

#[tauri::command]
pub fn update_character_relationship(
    db: State<DbManager>,
    id: String,
    input: UpdateRelationshipInput,
) -> Result<CharacterRelationshipWithNames, AppError> {
    db.with_conn(|conn| character_repo::update_relationship(conn, &id, input))
}

#[tauri::command]
pub fn delete_character_relationship(db: State<DbManager>, id: String) -> Result<bool, AppError> {
    db.with_conn(|conn| character_repo::delete_relationship(conn, &id))
}
