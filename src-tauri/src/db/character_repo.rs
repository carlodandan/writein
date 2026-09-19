use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use uuid::Uuid;

use crate::models::{
    AppError, Character, CharacterRelationshipWithNames, CharacterRole,
    CreateCharacterInput, CreateRelationshipInput, UpdateCharacterInput,
    UpdateRelationshipInput,
};

pub fn create_character(
    conn: &Connection,
    input: CreateCharacterInput,
) -> Result<Character, AppError> {
    if input.name.trim().is_empty() {
        return Err(AppError::Validation("Character name cannot be empty".to_string()));
    }

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let role = input
        .role
        .map(|r| CharacterRole::from_str(&r).as_str().to_string())
        .unwrap_or_else(|| "supporting".to_string());

    conn.execute(
        "INSERT INTO characters (
            id, project_id, name, nickname, role, age, description,
            personality, appearance, background, motivations, fears,
            goals, notes, avatar_path, tags, custom_fields_json,
            created_at, updated_at
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19
        )",
        params![
            id,
            input.project_id,
            input.name.trim(),
            input.nickname,
            role,
            input.age,
            input.description,
            input.personality,
            input.appearance,
            input.background,
            input.motivations,
            input.fears,
            input.goals,
            input.notes,
            input.avatar_path,
            input.tags,
            input.custom_fields_json,
            now,
            now
        ],
    )?;

    get_character(conn, &id)
}

pub fn get_character(conn: &Connection, id: &str) -> Result<Character, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, name, nickname, role, age, description,
                personality, appearance, background, motivations, fears,
                goals, notes, avatar_path, tags, custom_fields_json,
                created_at, updated_at
         FROM characters
         WHERE id = ?1",
    )?;

    let character = stmt
        .query_row(params![id], |row| {
            Ok(Character {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                nickname: row.get(3)?,
                role: row.get(4)?,
                age: row.get(5)?,
                description: row.get(6)?,
                personality: row.get(7)?,
                appearance: row.get(8)?,
                background: row.get(9)?,
                motivations: row.get(10)?,
                fears: row.get(11)?,
                goals: row.get(12)?,
                notes: row.get(13)?,
                avatar_path: row.get(14)?,
                tags: row.get(15)?,
                custom_fields_json: row.get(16)?,
                created_at: row.get(17)?,
                updated_at: row.get(18)?,
            })
        })
        .optional()?;

    character.ok_or_else(|| AppError::NotFound(format!("Character with id '{}' not found", id)))
}

pub fn list_characters(conn: &Connection, project_id: &str) -> Result<Vec<Character>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, name, nickname, role, age, description,
                personality, appearance, background, motivations, fears,
                goals, notes, avatar_path, tags, custom_fields_json,
                created_at, updated_at
         FROM characters
         WHERE project_id = ?1
         ORDER BY 
            CASE role 
                WHEN 'protagonist' THEN 1 
                WHEN 'antagonist' THEN 2 
                WHEN 'supporting' THEN 3 
                ELSE 4 
            END ASC,
            name ASC",
    )?;

    let iter = stmt.query_map(params![project_id], |row| {
        Ok(Character {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            nickname: row.get(3)?,
            role: row.get(4)?,
            age: row.get(5)?,
            description: row.get(6)?,
            personality: row.get(7)?,
            appearance: row.get(8)?,
            background: row.get(9)?,
            motivations: row.get(10)?,
            fears: row.get(11)?,
            goals: row.get(12)?,
            notes: row.get(13)?,
            avatar_path: row.get(14)?,
            tags: row.get(15)?,
            custom_fields_json: row.get(16)?,
            created_at: row.get(17)?,
            updated_at: row.get(18)?,
        })
    })?;

    let mut result = Vec::new();
    for item in iter {
        result.push(item?);
    }
    Ok(result)
}

pub fn update_character(
    conn: &Connection,
    id: &str,
    input: UpdateCharacterInput,
) -> Result<Character, AppError> {
    let existing = get_character(conn, id)?;
    let now = Utc::now().to_rfc3339();

    let name = input
        .name
        .map(|n| n.trim().to_string())
        .filter(|n| !n.is_empty())
        .unwrap_or(existing.name);

    let nickname = input.nickname.or(existing.nickname);
    let role = input
        .role
        .map(|r| CharacterRole::from_str(&r).as_str().to_string())
        .unwrap_or(existing.role);
    let age = input.age.or(existing.age);
    let description = input.description.or(existing.description);
    let personality = input.personality.or(existing.personality);
    let appearance = input.appearance.or(existing.appearance);
    let background = input.background.or(existing.background);
    let motivations = input.motivations.or(existing.motivations);
    let fears = input.fears.or(existing.fears);
    let goals = input.goals.or(existing.goals);
    let notes = input.notes.or(existing.notes);
    let avatar_path = input.avatar_path.or(existing.avatar_path);
    let tags = input.tags.or(existing.tags);
    let custom_fields_json = input.custom_fields_json.or(existing.custom_fields_json);

    conn.execute(
        "UPDATE characters SET
            name = ?1,
            nickname = ?2,
            role = ?3,
            age = ?4,
            description = ?5,
            personality = ?6,
            appearance = ?7,
            background = ?8,
            motivations = ?9,
            fears = ?10,
            goals = ?11,
            notes = ?12,
            avatar_path = ?13,
            tags = ?14,
            custom_fields_json = ?15,
            updated_at = ?16
         WHERE id = ?17",
        params![
            name,
            nickname,
            role,
            age,
            description,
            personality,
            appearance,
            background,
            motivations,
            fears,
            goals,
            notes,
            avatar_path,
            tags,
            custom_fields_json,
            now,
            id
        ],
    )?;

    get_character(conn, id)
}

pub fn delete_character(conn: &Connection, id: &str) -> Result<bool, AppError> {
    let rows = conn.execute("DELETE FROM characters WHERE id = ?1", params![id])?;
    Ok(rows > 0)
}

// ==========================================
// CHARACTER RELATIONSHIPS
// ==========================================

pub fn list_relationships(
    conn: &Connection,
    project_id: &str,
) -> Result<Vec<CharacterRelationshipWithNames>, AppError> {
    let mut stmt = conn.prepare(
        "SELECT cr.id, cr.project_id, cr.character_a_id, ca.name,
                cr.character_b_id, cb.name, cr.relation_type,
                cr.description, cr.created_at
         FROM character_relationships cr
         JOIN characters ca ON ca.id = cr.character_a_id
         JOIN characters cb ON cb.id = cr.character_b_id
         WHERE cr.project_id = ?1
         ORDER BY cr.created_at DESC",
    )?;

    let iter = stmt.query_map(params![project_id], |row| {
        Ok(CharacterRelationshipWithNames {
            id: row.get(0)?,
            project_id: row.get(1)?,
            character_a_id: row.get(2)?,
            character_a_name: row.get(3)?,
            character_b_id: row.get(4)?,
            character_b_name: row.get(5)?,
            relation_type: row.get(6)?,
            description: row.get(7)?,
            created_at: row.get(8)?,
        })
    })?;

    let mut result = Vec::new();
    for item in iter {
        result.push(item?);
    }
    Ok(result)
}

pub fn get_relationship(
    conn: &Connection,
    id: &str,
) -> Result<CharacterRelationshipWithNames, AppError> {
    let mut stmt = conn.prepare(
        "SELECT cr.id, cr.project_id, cr.character_a_id, ca.name,
                cr.character_b_id, cb.name, cr.relation_type,
                cr.description, cr.created_at
         FROM character_relationships cr
         JOIN characters ca ON ca.id = cr.character_a_id
         JOIN characters cb ON cb.id = cr.character_b_id
         WHERE cr.id = ?1",
    )?;

    let rel = stmt
        .query_row(params![id], |row| {
            Ok(CharacterRelationshipWithNames {
                id: row.get(0)?,
                project_id: row.get(1)?,
                character_a_id: row.get(2)?,
                character_a_name: row.get(3)?,
                character_b_id: row.get(4)?,
                character_b_name: row.get(5)?,
                relation_type: row.get(6)?,
                description: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .optional()?;

    rel.ok_or_else(|| AppError::NotFound(format!("Relationship with id '{}' not found", id)))
}

pub fn create_relationship(
    conn: &Connection,
    input: CreateRelationshipInput,
) -> Result<CharacterRelationshipWithNames, AppError> {
    if input.character_a_id == input.character_b_id {
        return Err(AppError::Validation(
            "Cannot create a relationship between the same character".to_string(),
        ));
    }
    if input.relation_type.trim().is_empty() {
        return Err(AppError::Validation(
            "Relationship type cannot be empty".to_string(),
        ));
    }

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO character_relationships (
            id, project_id, character_a_id, character_b_id, relation_type, description, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            id,
            input.project_id,
            input.character_a_id,
            input.character_b_id,
            input.relation_type.trim(),
            input.description,
            now
        ],
    )?;

    get_relationship(conn, &id)
}

pub fn update_relationship(
    conn: &Connection,
    id: &str,
    input: UpdateRelationshipInput,
) -> Result<CharacterRelationshipWithNames, AppError> {
    let existing = get_relationship(conn, id)?;

    let relation_type = input
        .relation_type
        .map(|r| r.trim().to_string())
        .filter(|r| !r.is_empty())
        .unwrap_or(existing.relation_type);
    let description = input.description.or(existing.description);

    conn.execute(
        "UPDATE character_relationships SET
            relation_type = ?1,
            description = ?2
         WHERE id = ?3",
        params![relation_type, description, id],
    )?;

    get_relationship(conn, id)
}

pub fn delete_relationship(conn: &Connection, id: &str) -> Result<bool, AppError> {
    let rows = conn.execute(
        "DELETE FROM character_relationships WHERE id = ?1",
        params![id],
    )?;
    Ok(rows > 0)
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::db::migrations::run_migrations;
    use crate::db::project_repo::create_project;
    use crate::models::CreateProjectInput;

    fn setup_test_db() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();
        conn
    }

    #[test]
    fn test_character_crud_and_sorting() {
        let conn = setup_test_db();
        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Cast Test Novel".into(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: None,
            },
        )
        .unwrap();

        let protagonist = create_character(
            &conn,
            CreateCharacterInput {
                project_id: proj.id.clone(),
                name: "Vance Marlowe".into(),
                nickname: Some("Vance".into()),
                role: Some("protagonist".into()),
                age: Some("38".into()),
                description: Some("Private Investigator".into()),
                personality: Some("Cynical, observant".into()),
                appearance: Some("Trench coat, graying hair".into()),
                background: Some("Ex-police officer".into()),
                motivations: Some("Seeking justice for his lost partner".into()),
                fears: Some("Failing again".into()),
                goals: Some("Solve the disappearance".into()),
                notes: Some("Carries a worn brass lighter".into()),
                avatar_path: None,
                tags: Some("detective,noir".into()),
                custom_fields_json: Some("{\"Weapon\":\".38 Special\"}".into()),
            },
        )
        .unwrap();

        assert_eq!(protagonist.name, "Vance Marlowe");
        assert_eq!(protagonist.role, "protagonist");

        let antagonist = create_character(
            &conn,
            CreateCharacterInput {
                project_id: proj.id.clone(),
                name: "Lord Julian Blackwood".into(),
                nickname: None,
                role: Some("antagonist".into()),
                age: Some("52".into()),
                description: Some("Ruthless industrialist".into()),
                personality: None,
                appearance: None,
                background: None,
                motivations: None,
                fears: None,
                goals: None,
                notes: None,
                avatar_path: None,
                tags: None,
                custom_fields_json: None,
            },
        )
        .unwrap();

        let list = list_characters(&conn, &proj.id).unwrap();
        assert_eq!(list.len(), 2);
        assert_eq!(list[0].id, protagonist.id); // protagonist ordered before antagonist
        assert_eq!(list[1].id, antagonist.id);

        let updated = update_character(
            &conn,
            &protagonist.id,
            UpdateCharacterInput {
                name: Some("Vance C. Marlowe".into()),
                nickname: None,
                role: None,
                age: Some("39".into()),
                description: None,
                personality: None,
                appearance: None,
                background: None,
                motivations: None,
                fears: None,
                goals: None,
                notes: None,
                avatar_path: None,
                tags: None,
                custom_fields_json: None,
            },
        )
        .unwrap();
        assert_eq!(updated.name, "Vance C. Marlowe");
        assert_eq!(updated.age.as_deref(), Some("39"));
    }

    #[test]
    fn test_relationships_and_foreign_key_cascade() {
        let conn = setup_test_db();
        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Rel Test Novel".into(),
                subtitle: None,
                author: None,
                description: None,
                genre: None,
                target_word_count: None,
            },
        )
        .unwrap();

        let a = create_character(
            &conn,
            CreateCharacterInput {
                project_id: proj.id.clone(),
                name: "Alice".into(),
                nickname: None,
                role: Some("protagonist".into()),
                age: None,
                description: None,
                personality: None,
                appearance: None,
                background: None,
                motivations: None,
                fears: None,
                goals: None,
                notes: None,
                avatar_path: None,
                tags: None,
                custom_fields_json: None,
            },
        )
        .unwrap();

        let b = create_character(
            &conn,
            CreateCharacterInput {
                project_id: proj.id.clone(),
                name: "Bob".into(),
                nickname: None,
                role: Some("supporting".into()),
                age: None,
                description: None,
                personality: None,
                appearance: None,
                background: None,
                motivations: None,
                fears: None,
                goals: None,
                notes: None,
                avatar_path: None,
                tags: None,
                custom_fields_json: None,
            },
        )
        .unwrap();

        let rel = create_relationship(
            &conn,
            CreateRelationshipInput {
                project_id: proj.id.clone(),
                character_a_id: a.id.clone(),
                character_b_id: b.id.clone(),
                relation_type: "Partner".into(),
                description: Some("Former academy partners".into()),
            },
        )
        .unwrap();

        assert_eq!(rel.character_a_name, "Alice");
        assert_eq!(rel.character_b_name, "Bob");
        assert_eq!(rel.relation_type, "Partner");

        let all_rels = list_relationships(&conn, &proj.id).unwrap();
        assert_eq!(all_rels.len(), 1);

        // Delete Bob -> should cascade delete relationship via foreign key
        delete_character(&conn, &b.id).unwrap();
        let after_delete = list_relationships(&conn, &proj.id).unwrap();
        assert_eq!(after_delete.len(), 0);
    }
}
