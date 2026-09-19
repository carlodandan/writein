use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

use crate::models::{
    AppError, Attachment, CreateAttachmentInput, UpdateAttachmentInput,
};

const ALLOWED_EXTENSIONS: &[&str] = &[
    "png", "jpg", "jpeg", "webp", "gif", "svg",
    "pdf", "docx", "doc", "txt", "md", "rtf", "csv", "json",
    "mp3", "wav", "ogg", "m4a",
    "zip", "tar", "gz",
];

const MAX_FILE_SIZE: usize = 50 * 1024 * 1024; // 50 MB

pub fn sanitize_filename(raw: &str) -> Result<String, AppError> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err(AppError::Validation("Filename cannot be empty".to_string()));
    }

    // Check for dangerous patterns in the input to prevent path traversal
    if trimmed.contains("..") || trimmed.contains('/') || trimmed.contains('\\') || trimmed.contains('\0') {
        return Err(AppError::Validation("Filename contains illegal characters or path traversal elements".to_string()));
    }

    // Extract file stem and extension
    let path = Path::new(trimmed);
    let file_name = path
        .file_name()
        .and_then(|f| f.to_str())
        .ok_or_else(|| AppError::Validation("Invalid filename".to_string()))?;

    // Validate extension
    let ext = Path::new(file_name)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();

    if !ALLOWED_EXTENSIONS.contains(&ext.as_str()) {
        return Err(AppError::Validation(format!(
            "File extension '.{}' is not permitted. Allowed: Images, PDF, DOCX, TXT, Audio, ZIP.",
            ext
        )));
    }

    // Clean filename of unsafe characters
    let safe: String = file_name
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' || c == ' ' || c == '(' || c == ')' {
                c
            } else {
                '_'
            }
        })
        .collect();

    Ok(safe)
}

pub fn detect_mime_type(ext: &str) -> &'static str {
    match ext.to_lowercase().as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "pdf" => "application/pdf",
        "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "doc" => "application/msword",
        "txt" => "text/plain",
        "md" => "text/markdown",
        "rtf" => "application/rtf",
        "csv" => "text/csv",
        "json" => "application/json",
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "ogg" => "audio/ogg",
        "m4a" => "audio/mp4",
        "zip" => "application/zip",
        _ => "application/octet-stream",
    }
}

pub fn detect_file_type(ext: &str) -> &'static str {
    match ext.to_lowercase().as_str() {
        "png" | "jpg" | "jpeg" | "webp" | "gif" | "svg" => "image",
        "pdf" => "pdf",
        "docx" | "doc" | "txt" | "md" | "rtf" | "csv" => "document",
        "mp3" | "wav" | "ogg" | "m4a" => "audio",
        "zip" | "tar" | "gz" => "archive",
        _ => "other",
    }
}

pub fn save_attachment_file(
    base_dir: &Path,
    project_id: &str,
    attachment_id: &str,
    safe_filename: &str,
    bytes: &[u8],
) -> Result<(PathBuf, String), AppError> {
    if bytes.len() > MAX_FILE_SIZE {
        return Err(AppError::Validation(format!(
            "File size {} exceeds maximum allowed limit of 50 MB",
            bytes.len()
        )));
    }

    let project_attachments_dir = base_dir
        .join("projects")
        .join(project_id)
        .join("attachments")
        .join(attachment_id);

    fs::create_dir_all(&project_attachments_dir)?;

    let target_file = project_attachments_dir.join(safe_filename);

    // Ensure the target is strictly inside project_attachments_dir
    if !target_file.starts_with(&project_attachments_dir) {
        return Err(AppError::Validation(
            "Security violation: path traversal detected".to_string(),
        ));
    }

    fs::write(&target_file, bytes)?;

    let relative_path = format!(
        "attachments/{}/{}",
        attachment_id, safe_filename
    );

    Ok((target_file, relative_path))
}

pub fn create_attachment(
    conn: &Connection,
    input: CreateAttachmentInput,
) -> Result<Attachment, AppError> {
    let safe_name = sanitize_filename(&input.file_name)?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let ext = Path::new(&safe_name)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    let file_type = if input.file_type.trim().is_empty() {
        detect_file_type(ext).to_string()
    } else {
        input.file_type.trim().to_string()
    };

    let mime_type = input.mime_type.or_else(|| Some(detect_mime_type(ext).to_string()));
    let relative_path = input.relative_path.unwrap_or_else(|| format!("attachments/{}/{}", id, safe_name));

    conn.execute(
        "INSERT INTO attachments (
            id, project_id, file_name, file_path, relative_path, file_type, mime_type,
            file_size, entity_type, entity_id, description, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            id,
            input.project_id,
            safe_name,
            input.file_path.trim(),
            relative_path,
            file_type,
            mime_type,
            input.file_size,
            input.entity_type,
            input.entity_id,
            input.description,
            now,
            now
        ],
    )?;

    get_attachment(conn, &id)
}

pub fn get_attachment(conn: &Connection, id: &str) -> Result<Attachment, AppError> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, file_name, file_path, relative_path, file_type, mime_type,
                file_size, entity_type, entity_id, description, created_at, updated_at
         FROM attachments
         WHERE id = ?1",
    )?;

    let att = stmt
        .query_row(params![id], |row| {
            Ok(Attachment {
                id: row.get(0)?,
                project_id: row.get(1)?,
                file_name: row.get(2)?,
                file_path: row.get(3)?,
                relative_path: row.get(4)?,
                file_type: row.get(5)?,
                mime_type: row.get(6)?,
                file_size: row.get(7)?,
                entity_type: row.get(8)?,
                entity_id: row.get(9)?,
                description: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })
        .optional()?;

    att.ok_or_else(|| AppError::NotFound(format!("Attachment with id '{}' not found", id)))
}

pub fn list_attachments(
    conn: &Connection,
    project_id: &str,
    entity_type: Option<&str>,
    entity_id: Option<&str>,
) -> Result<Vec<Attachment>, AppError> {
    let mut query = "SELECT id, project_id, file_name, file_path, relative_path, file_type, mime_type,
                            file_size, entity_type, entity_id, description, created_at, updated_at
                     FROM attachments
                     WHERE project_id = ?1".to_string();

    let mut param_values: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(project_id.to_string())];

    if let (Some(et), Some(ei)) = (entity_type, entity_id) {
        query.push_str(" AND entity_type = ?2 AND entity_id = ?3");
        param_values.push(Box::new(et.to_string()));
        param_values.push(Box::new(ei.to_string()));
    }

    query.push_str(" ORDER BY created_at DESC");

    let mut stmt = conn.prepare(&query)?;
    let rusqlite_params: Vec<&dyn rusqlite::ToSql> = param_values.iter().map(|b| b.as_ref()).collect();

    let iter = stmt.query_map(rusqlite_params.as_slice(), |row| {
        Ok(Attachment {
            id: row.get(0)?,
            project_id: row.get(1)?,
            file_name: row.get(2)?,
            file_path: row.get(3)?,
            relative_path: row.get(4)?,
            file_type: row.get(5)?,
            mime_type: row.get(6)?,
            file_size: row.get(7)?,
            entity_type: row.get(8)?,
            entity_id: row.get(9)?,
            description: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
        })
    })?;

    let mut result = Vec::new();
    for item in iter {
        result.push(item?);
    }
    Ok(result)
}

pub fn update_attachment(
    conn: &Connection,
    id: &str,
    input: UpdateAttachmentInput,
) -> Result<Attachment, AppError> {
    let existing = get_attachment(conn, id)?;
    let now = Utc::now().to_rfc3339();

    let file_name = match input.file_name {
        Some(name) => sanitize_filename(&name)?,
        None => existing.file_name,
    };

    let description = input.description.or(existing.description);
    let entity_type = input.entity_type.or(existing.entity_type);
    let entity_id = input.entity_id.or(existing.entity_id);

    conn.execute(
        "UPDATE attachments SET
            file_name = ?1,
            description = ?2,
            entity_type = ?3,
            entity_id = ?4,
            updated_at = ?5
         WHERE id = ?6",
        params![file_name, description, entity_type, entity_id, now, id],
    )?;

    get_attachment(conn, id)
}

pub fn delete_attachment(
    conn: &Connection,
    id: &str,
    base_dir: Option<&Path>,
) -> Result<bool, AppError> {
    if let Ok(att) = get_attachment(conn, id) {
        if let Some(base) = base_dir {
            if let Some(rel) = att.relative_path {
                let file_path = base.join("projects").join(&att.project_id).join(&rel);
                if file_path.exists() {
                    let _ = fs::remove_file(&file_path);
                    if let Some(parent) = file_path.parent() {
                        let _ = fs::remove_dir(parent);
                    }
                }
            }
        }
    }

    let rows = conn.execute("DELETE FROM attachments WHERE id = ?1", params![id])?;
    Ok(rows > 0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::migrations::run_migrations;

    fn setup_test_db() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();

        conn.execute(
            "INSERT INTO projects (id, title, status, target_word_count, current_word_count, created_at, updated_at)
             VALUES ('proj-1', 'Test Novel', 'idea', 50000, 0, datetime('now'), datetime('now'))",
            [],
        ).unwrap();

        conn
    }

    #[test]
    fn test_attachment_crud_and_entity_linking() {
        let conn = setup_test_db();

        let att = create_attachment(
            &conn,
            CreateAttachmentInput {
                project_id: "proj-1".to_string(),
                file_name: "world_map.png".to_string(),
                file_path: "C:/fake/world_map.png".to_string(),
                relative_path: Some("attachments/att-1/world_map.png".to_string()),
                file_type: "image".to_string(),
                mime_type: Some("image/png".to_string()),
                file_size: 204800,
                entity_type: Some("location".to_string()),
                entity_id: Some("loc-1".to_string()),
                description: Some("Continental overview map".to_string()),
            },
        ).unwrap();

        assert_eq!(att.file_name, "world_map.png");
        assert_eq!(att.file_type, "image");
        assert_eq!(att.entity_type.as_deref(), Some("location"));

        // List by entity
        let entity_list = list_attachments(&conn, "proj-1", Some("location"), Some("loc-1")).unwrap();
        assert_eq!(entity_list.len(), 1);

        // Update
        let updated = update_attachment(
            &conn,
            &att.id,
            UpdateAttachmentInput {
                file_name: Some("continental_map.png".to_string()),
                description: Some("Updated map with border markers".to_string()),
                entity_type: None,
                entity_id: None,
            },
        ).unwrap();
        assert_eq!(updated.file_name, "continental_map.png");

        // Delete
        let deleted = delete_attachment(&conn, &att.id, None).unwrap();
        assert!(deleted);
    }

    #[test]
    fn test_filename_sanitization_and_security() {
        // Disallow path traversal
        assert!(sanitize_filename("../../etc/passwd.png").is_err());
        assert!(sanitize_filename("..\\boot.ini.jpg").is_err());
        assert!(sanitize_filename("script.exe").is_err());
        assert!(sanitize_filename("virus.bat").is_err());

        // Allow legitimate files
        let safe = sanitize_filename("Character Pose (Final).jpg").unwrap();
        assert_eq!(safe, "Character Pose (Final).jpg");
    }
}
