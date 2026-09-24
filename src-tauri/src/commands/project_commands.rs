use crate::db::{project_repo, DbManager};
use crate::models::{AppError, CreateProjectInput, Project, ProjectSummary, UpdateProjectInput};
use tauri::State;

#[tauri::command]
pub fn get_projects(db: State<DbManager>) -> Result<Vec<Project>, AppError> {
    db.with_conn(|conn| project_repo::list_projects(conn))
}

#[tauri::command]
pub fn get_project(db: State<DbManager>, id: String) -> Result<Project, AppError> {
    db.with_conn(|conn| project_repo::get_project(conn, &id))
}

#[tauri::command]
pub fn create_project(
    db: State<DbManager>,
    input: CreateProjectInput,
) -> Result<Project, AppError> {
    let project = db.with_conn(|conn| project_repo::create_project(conn, input))?;
    // Ensure the project directories (attachments, versions, backups) are created
    let _ = db.ensure_project_directories(&project.id);
    Ok(project)
}

#[tauri::command]
pub fn update_project(
    db: State<DbManager>,
    id: String,
    input: UpdateProjectInput,
) -> Result<Project, AppError> {
    db.with_conn(|conn| project_repo::update_project(conn, &id, input))
}

#[tauri::command]
pub fn delete_project(db: State<DbManager>, id: String) -> Result<(), AppError> {
    db.with_conn(|conn| project_repo::delete_project(conn, &id))
}

#[tauri::command]
pub fn get_project_summary(db: State<DbManager>, id: String) -> Result<ProjectSummary, AppError> {
    db.with_conn(|conn| project_repo::get_project_summary(conn, &id))
}
