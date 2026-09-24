use tauri::State;

use crate::db::{timeline_repo, DbManager};
use crate::models::{
    AppError, CreateTimelineEventInput, TimelineEvent, TimelineFilter, UpdateTimelineEventInput,
};

#[tauri::command]
pub fn get_timeline_events(
    db: State<DbManager>,
    project_id: String,
    filter: Option<TimelineFilter>,
) -> Result<Vec<TimelineEvent>, AppError> {
    db.with_conn(|conn| timeline_repo::list_timeline_events(conn, &project_id, filter))
}

#[tauri::command]
pub fn get_timeline_event(db: State<DbManager>, id: String) -> Result<TimelineEvent, AppError> {
    db.with_conn(|conn| timeline_repo::get_timeline_event(conn, &id))
}

#[tauri::command]
pub fn create_timeline_event(
    db: State<DbManager>,
    input: CreateTimelineEventInput,
) -> Result<TimelineEvent, AppError> {
    db.with_conn(|conn| timeline_repo::create_timeline_event(conn, input))
}

#[tauri::command]
pub fn update_timeline_event(
    db: State<DbManager>,
    id: String,
    input: UpdateTimelineEventInput,
) -> Result<TimelineEvent, AppError> {
    db.with_conn(|conn| timeline_repo::update_timeline_event(conn, &id, input))
}

#[tauri::command]
pub fn delete_timeline_event(db: State<DbManager>, id: String) -> Result<bool, AppError> {
    db.with_conn(|conn| timeline_repo::delete_timeline_event(conn, &id))
}
