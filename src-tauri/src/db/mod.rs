pub mod attachment_repo;
pub mod backup_repo;
pub mod character_repo;
pub mod cross_link_repo;
pub mod export_repo;
pub mod goals_repo;
pub mod location_repo;
pub mod manuscript_repo;
pub mod migrations;
pub mod note_repo;
pub mod project_repo;
pub mod search_repo;
pub mod session_repo;
pub mod settings_repo;
pub mod tag_repo;
pub mod timeline_repo;
pub mod trash_repo;
pub mod version_repo;
pub mod worldbuilding_repo;

use rusqlite::Connection;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use crate::models::AppError;

pub struct DbManager {
    base_dir: PathBuf,
    conn: Mutex<Connection>,
}

impl DbManager {
    pub fn base_dir(&self) -> &Path {
        &self.base_dir
    }
    pub fn new(app_data_dir: &Path) -> Result<Self, AppError> {
        let base_dir = app_data_dir.join("WriteIn");
        let projects_dir = base_dir.join("projects");
        let settings_dir = base_dir.join("settings");

        fs::create_dir_all(&base_dir)?;
        fs::create_dir_all(&projects_dir)?;
        fs::create_dir_all(&settings_dir)?;

        let db_path = base_dir.join("app.db");
        let mut conn = Connection::open(&db_path)?;

        // Performance and safety pragmas
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA foreign_keys = ON;
             PRAGMA synchronous = NORMAL;",
        )?;

        migrations::run_migrations(&mut conn)?;

        Ok(Self {
            base_dir,
            conn: Mutex::new(conn),
        })
    }

    /// Open an in-memory database instance for testing
    #[allow(dead_code)]
    pub fn in_memory() -> Result<Self, AppError> {
        let mut conn = Connection::open_in_memory()?;
        conn.execute_batch(
            "PRAGMA foreign_keys = ON;
             PRAGMA synchronous = NORMAL;",
        )?;
        migrations::run_migrations(&mut conn)?;

        Ok(Self {
            base_dir: PathBuf::from("in_memory"),
            conn: Mutex::new(conn),
        })
    }

    pub fn with_conn<F, R>(&self, f: F) -> Result<R, AppError>
    where
        F: FnOnce(&Connection) -> Result<R, AppError>,
    {
        let conn = self
            .conn
            .lock()
            .map_err(|e| AppError::Internal(format!("Database lock error: {}", e)))?;
        f(&conn)
    }

    pub fn with_conn_mut<F, R>(&self, f: F) -> Result<R, AppError>
    where
        F: FnOnce(&mut Connection) -> Result<R, AppError>,
    {
        let mut conn = self
            .conn
            .lock()
            .map_err(|e| AppError::Internal(format!("Database lock error: {}", e)))?;
        f(&mut conn)
    }

    pub fn ensure_project_directories(&self, project_id: &str) -> Result<PathBuf, AppError> {
        let project_dir = self.base_dir.join("projects").join(project_id);
        fs::create_dir_all(&project_dir)?;
        fs::create_dir_all(project_dir.join("attachments"))?;
        fs::create_dir_all(project_dir.join("versions"))?;
        fs::create_dir_all(project_dir.join("backups"))?;
        Ok(project_dir)
    }
}
