use crate::db::{goals_repo, DbManager};
use crate::models::{AppError, CreateWritingGoalInput, UpdateWritingGoalInput, WritingGoal};
use tauri::State;

/// Lists the writing goals configured for a project.
#[tauri::command]
pub fn get_writing_goals(
    db: State<DbManager>,
    project_id: String,
) -> Result<Vec<WritingGoal>, AppError> {
    db.with_conn(|conn| goals_repo::list_goals(conn, &project_id))
}

/// Creates a writing goal from the supplied input.
#[tauri::command]
pub fn create_writing_goal(
    db: State<DbManager>,
    input: CreateWritingGoalInput,
) -> Result<WritingGoal, AppError> {
    db.with_conn(|conn| goals_repo::create_goal(conn, input))
}

/// Updates an existing writing goal.
#[tauri::command]
pub fn update_writing_goal(
    db: State<DbManager>,
    id: String,
    input: UpdateWritingGoalInput,
) -> Result<WritingGoal, AppError> {
    db.with_conn(|conn| goals_repo::update_goal(conn, &id, input))
}

/// Deletes a writing goal by identifier.
#[tauri::command]
pub fn delete_writing_goal(db: State<DbManager>, id: String) -> Result<bool, AppError> {
    db.with_conn(|conn| goals_repo::delete_goal(conn, &id))
}
