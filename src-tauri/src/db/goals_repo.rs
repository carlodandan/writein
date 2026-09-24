use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use crate::models::{AppError, CreateWritingGoalInput, UpdateWritingGoalInput, WritingGoal};

pub fn create_goal(
    conn: &Connection,
    input: CreateWritingGoalInput,
) -> Result<WritingGoal, AppError> {
    if input.target_words <= 0 {
        return Err(AppError::Validation(
            "Target words must be greater than zero".to_string(),
        ));
    }

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    // Deactivate existing goals of same type before creating a new one
    conn.execute(
        "UPDATE writing_goals SET is_active = 0 WHERE project_id = ?1 AND goal_type = ?2",
        params![input.project_id, input.goal_type],
    )?;

    conn.execute(
        "INSERT INTO writing_goals (id, project_id, goal_type, target_words, current_words, start_date, end_date, is_active, created_at)
         VALUES (?1, ?2, ?3, ?4, 0, ?5, ?6, 1, ?7)",
        params![
            id,
            input.project_id,
            input.goal_type,
            input.target_words,
            input.start_date,
            input.end_date,
            now
        ],
    )?;

    get_goal(conn, &id)
}

pub fn get_goal(conn: &Connection, id: &str) -> Result<WritingGoal, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, goal_type, target_words, current_words, start_date, end_date, is_active, created_at
         FROM writing_goals WHERE id = ?1",
    )?;

    let g = stmt
        .query_row(params![id], |row| {
            Ok(WritingGoal {
                id: row.get(0)?,
                project_id: row.get(1)?,
                goal_type: row.get(2)?,
                target_words: row.get(3)?,
                current_words: row.get(4)?,
                start_date: row.get(5)?,
                end_date: row.get(6)?,
                is_active: row.get::<_, i64>(7)? != 0,
                created_at: row.get(8)?,
            })
        })
        .optional()?;

    g.ok_or_else(|| AppError::NotFound(format!("Writing goal '{}' not found", id)))
}

pub fn list_goals(conn: &Connection, project_id: &str) -> Result<Vec<WritingGoal>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, goal_type, target_words, current_words, start_date, end_date, is_active, created_at
         FROM writing_goals
         WHERE project_id = ?1
         ORDER BY created_at DESC",
    )?;

    let iter = stmt.query_map(params![project_id], |row| {
        Ok(WritingGoal {
            id: row.get(0)?,
            project_id: row.get(1)?,
            goal_type: row.get(2)?,
            target_words: row.get(3)?,
            current_words: row.get(4)?,
            start_date: row.get(5)?,
            end_date: row.get(6)?,
            is_active: row.get::<_, i64>(7)? != 0,
            created_at: row.get(8)?,
        })
    })?;

    let mut result = Vec::new();
    for item in iter {
        result.push(item?);
    }
    Ok(result)
}

pub fn update_goal(
    conn: &Connection,
    id: &str,
    input: UpdateWritingGoalInput,
) -> Result<WritingGoal, AppError> {
    let existing = get_goal(conn, id)?;

    let target_words = input.target_words.unwrap_or(existing.target_words);
    let current_words = input.current_words.unwrap_or(existing.current_words);
    let is_active = input.is_active.unwrap_or(existing.is_active);
    let start_date = input.start_date.or(existing.start_date);
    let end_date = input.end_date.or(existing.end_date);

    conn.execute(
        "UPDATE writing_goals SET
            target_words = ?1,
            current_words = ?2,
            is_active = ?3,
            start_date = ?4,
            end_date = ?5
         WHERE id = ?6",
        params![
            target_words,
            current_words,
            is_active as i64,
            start_date,
            end_date,
            id
        ],
    )?;

    get_goal(conn, id)
}

pub fn delete_goal(conn: &Connection, id: &str) -> Result<bool, AppError> {
    let rows = conn.execute("DELETE FROM writing_goals WHERE id = ?1", params![id])?;
    Ok(rows > 0)
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::db::migrations::run_migrations;
    use crate::db::project_repo::create_project;
    use crate::models::CreateProjectInput;

    fn setup() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();
        conn
    }

    #[test]
    fn test_writing_goals_crud() {
        let conn = setup();
        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Goals Test Novel".into(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: None,
            },
        )
        .unwrap();

        // Create daily goal
        let goal = create_goal(
            &conn,
            CreateWritingGoalInput {
                project_id: proj.id.clone(),
                goal_type: "daily".into(),
                target_words: 500,
                start_date: Some("2026-09-19".into()),
                end_date: None,
            },
        )
        .unwrap();

        assert_eq!(goal.goal_type, "daily");
        assert_eq!(goal.target_words, 500);
        assert_eq!(goal.current_words, 0);
        assert!(goal.is_active);

        // Update progress
        let updated = update_goal(
            &conn,
            &goal.id,
            UpdateWritingGoalInput {
                target_words: None,
                current_words: Some(350),
                is_active: None,
                start_date: None,
                end_date: None,
            },
        )
        .unwrap();
        assert_eq!(updated.current_words, 350);

        // Creating a new goal of same type deactivates the old one
        let goal2 = create_goal(
            &conn,
            CreateWritingGoalInput {
                project_id: proj.id.clone(),
                goal_type: "daily".into(),
                target_words: 1000,
                start_date: None,
                end_date: None,
            },
        )
        .unwrap();
        let old = get_goal(&conn, &goal.id).unwrap();
        assert!(!old.is_active, "old goal should be deactivated");
        assert!(goal2.is_active);

        // List
        let goals = list_goals(&conn, &proj.id).unwrap();
        assert_eq!(goals.len(), 2);

        // Delete
        assert!(delete_goal(&conn, &goal2.id).unwrap());
        let goals_after = list_goals(&conn, &proj.id).unwrap();
        assert_eq!(goals_after.len(), 1);
    }
}
