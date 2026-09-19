use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;
use chrono::Utc;

use crate::models::{
    AppError, CreateProjectInput, Project, ProjectStatus, ProjectSummary, UpdateProjectInput,
};

pub fn create_project(conn: &Connection, input: CreateProjectInput) -> Result<Project, AppError> {
    if input.title.trim().is_empty() {
        return Err(AppError::Validation("Project title cannot be empty".to_string()));
    }

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let status = ProjectStatus::Idea;
    let target_words = input.target_word_count.unwrap_or(50000);

    conn.execute(
        "INSERT INTO projects (
            id, title, subtitle, author, description, genre, status,
            target_word_count, current_word_count, cover_image, project_notes,
            created_at, updated_at, archived_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        params![
            id,
            input.title.trim(),
            input.subtitle,
            input.author,
            input.description,
            input.genre,
            status.as_str(),
            target_words,
            0,
            Option::<String>::None,
            Option::<String>::None,
            now,
            now,
            Option::<String>::None
        ],
    )?;

    get_project(conn, &id)
}

pub fn list_projects(conn: &Connection) -> Result<Vec<Project>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, title, subtitle, author, description, genre, status,
                target_word_count, current_word_count, cover_image, project_notes,
                created_at, updated_at, archived_at
         FROM projects
         ORDER BY updated_at DESC",
    )?;

    let project_iter = stmt.query_map([], |row| {
        let status_str: String = row.get(6)?;
        Ok(Project {
            id: row.get(0)?,
            title: row.get(1)?,
            subtitle: row.get(2)?,
            author: row.get(3)?,
            description: row.get(4)?,
            genre: row.get(5)?,
            status: ProjectStatus::from_str(&status_str),
            target_word_count: row.get(7)?,
            current_word_count: row.get(8)?,
            cover_image: row.get(9)?,
            project_notes: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
            archived_at: row.get(13)?,
        })
    })?;

    let mut projects = Vec::new();
    for p in project_iter {
        projects.push(p?);
    }
    Ok(projects)
}

pub fn get_project(conn: &Connection, id: &str) -> Result<Project, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, title, subtitle, author, description, genre, status,
                target_word_count, current_word_count, cover_image, project_notes,
                created_at, updated_at, archived_at
         FROM projects
         WHERE id = ?1",
    )?;

    let project = stmt
        .query_row(params![id], |row| {
            let status_str: String = row.get(6)?;
            Ok(Project {
                id: row.get(0)?,
                title: row.get(1)?,
                subtitle: row.get(2)?,
                author: row.get(3)?,
                description: row.get(4)?,
                genre: row.get(5)?,
                status: ProjectStatus::from_str(&status_str),
                target_word_count: row.get(7)?,
                current_word_count: row.get(8)?,
                cover_image: row.get(9)?,
                project_notes: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
                archived_at: row.get(13)?,
            })
        })
        .optional()?;

    project.ok_or_else(|| AppError::NotFound(format!("Project with ID {} not found", id)))
}

pub fn update_project(
    conn: &Connection,
    id: &str,
    input: UpdateProjectInput,
) -> Result<Project, AppError> {
    let existing = get_project(conn, id)?;
    let now = Utc::now().to_rfc3339();

    let title = input.title.unwrap_or(existing.title);
    let subtitle = input.subtitle.or(existing.subtitle);
    let author = input.author.or(existing.author);
    let description = input.description.or(existing.description);
    let genre = input.genre.or(existing.genre);
    let status = input.status.unwrap_or(existing.status);
    let target_word_count = input.target_word_count.unwrap_or(existing.target_word_count);
    let project_notes = input.project_notes.or(existing.project_notes);

    if title.trim().is_empty() {
        return Err(AppError::Validation("Project title cannot be empty".to_string()));
    }

    conn.execute(
        "UPDATE projects SET
            title = ?1,
            subtitle = ?2,
            author = ?3,
            description = ?4,
            genre = ?5,
            status = ?6,
            target_word_count = ?7,
            project_notes = ?8,
            updated_at = ?9
         WHERE id = ?10",
        params![
            title.trim(),
            subtitle,
            author,
            description,
            genre,
            status.as_str(),
            target_word_count,
            project_notes,
            now,
            id
        ],
    )?;

    get_project(conn, id)
}

pub fn delete_project(conn: &Connection, id: &str) -> Result<(), AppError> {
    let rows_affected = conn.execute("DELETE FROM projects WHERE id = ?1", params![id])?;
    if rows_affected == 0 {
        return Err(AppError::NotFound(format!("Project with ID {} not found", id)));
    }
    Ok(())
}

pub fn get_project_summary(conn: &Connection, id: &str) -> Result<ProjectSummary, AppError> {
    let project = get_project(conn, id)?;

    let chapter_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM manuscript_nodes WHERE project_id = ?1 AND node_type = 'chapter'",
            params![id],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let scene_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM manuscript_nodes WHERE project_id = ?1 AND node_type = 'scene'",
            params![id],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let character_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM characters WHERE project_id = ?1",
            params![id],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let location_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM locations WHERE project_id = ?1",
            params![id],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let note_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM notes WHERE project_id = ?1",
            params![id],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let last_edited_chapter_title: Option<String> = conn
        .query_row(
            "SELECT title FROM manuscript_nodes WHERE project_id = ?1 ORDER BY updated_at DESC LIMIT 1",
            params![id],
            |r| r.get(0),
        )
        .optional()
        .unwrap_or(None);

    Ok(ProjectSummary {
        project,
        chapter_count,
        scene_count,
        character_count,
        location_count,
        note_count,
        last_edited_chapter_title,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::migrations::run_migrations;
    use rusqlite::Connection;

    fn setup_test_db() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();
        conn
    }

    #[test]
    fn test_create_and_get_project() {
        let conn = setup_test_db();
        let input = CreateProjectInput {
            title: "The Whispering Woods".to_string(),
            subtitle: Some("Book 1".to_string()),
            author: Some("A. Writer".to_string()),
            description: Some("A mystery fantasy".to_string()),
            genre: Some("Fantasy".to_string()),
            target_word_count: Some(75000),
        };

        let created = create_project(&conn, input).expect("Failed to create project");
        assert_eq!(created.title, "The Whispering Woods");
        assert_eq!(created.target_word_count, 75000);
        assert_eq!(created.status, ProjectStatus::Idea);

        let retrieved = get_project(&conn, &created.id).expect("Failed to get project");
        assert_eq!(retrieved.id, created.id);
        assert_eq!(retrieved.title, "The Whispering Woods");
    }

    #[test]
    fn test_empty_title_validation() {
        let conn = setup_test_db();
        let input = CreateProjectInput {
            title: "   ".to_string(),
            subtitle: None,
            author: None,
            description: None,
            genre: None,
            target_word_count: None,
        };

        let result = create_project(&conn, input);
        assert!(result.is_err(), "Empty title should fail validation");
    }

    #[test]
    fn test_update_project() {
        let conn = setup_test_db();
        let created = create_project(
            &conn,
            CreateProjectInput {
                title: "Draft Novel".to_string(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: None,
            },
        )
        .unwrap();

        let updated = update_project(
            &conn,
            &created.id,
            UpdateProjectInput {
                title: Some("Final Novel Title".to_string()),
                subtitle: Some("Sub".to_string()),
                author: None,
                description: None,
                genre: Some("Sci-Fi".to_string()),
                status: Some(ProjectStatus::Writing),
                target_word_count: Some(85000),
                project_notes: Some("Writing daily chapters".to_string()),
            },
        )
        .unwrap();

        assert_eq!(updated.title, "Final Novel Title");
        assert_eq!(updated.genre.as_deref(), Some("Sci-Fi"));
        assert_eq!(updated.status, ProjectStatus::Writing);
        assert_eq!(updated.target_word_count, 85000);
    }

    #[test]
    fn test_delete_project() {
        let conn = setup_test_db();
        let created = create_project(
            &conn,
            CreateProjectInput {
                title: "To Be Deleted".to_string(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: None,
            },
        )
        .unwrap();

        let del_res = delete_project(&conn, &created.id);
        assert!(del_res.is_ok());

        let get_res = get_project(&conn, &created.id);
        assert!(get_res.is_err());
    }

    #[test]
    fn test_list_projects() {
        let conn = setup_test_db();
        for i in 1..=3 {
            create_project(
                &conn,
                CreateProjectInput {
                    title: format!("Project {}", i),
                    subtitle: None,
                    author: None,
                    description: None,
                    genre: None,
                    target_word_count: None,
                },
            )
            .unwrap();
        }

        let list = list_projects(&conn).unwrap();
        assert_eq!(list.len(), 3);
    }
}
