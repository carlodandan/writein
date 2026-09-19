use std::path::PathBuf;
use tauri::State;
use uuid::Uuid;

use crate::db::{attachment_repo, cross_link_repo, DbManager};
use crate::models::{
    AppError, Attachment, CreateAttachmentInput, RelatedContentResponse,
    SaveAttachmentPayload, UpdateAttachmentInput,
};

fn decode_base64(input: &str) -> Result<Vec<u8>, AppError> {
    let clean = if let Some(idx) = input.find(";base64,") {
        &input[idx + 8..]
    } else {
        input.trim()
    };

    let mut out = Vec::new();
    let mut buf = 0u32;
    let mut bits = 0;

    for b in clean.bytes() {
        let val = match b {
            b'A'..=b'Z' => b - b'A',
            b'a'..=b'z' => b - b'a' + 26,
            b'0'..=b'9' => b - b'0' + 52,
            b'+' => 62,
            b'/' => 63,
            b'=' | b'\r' | b'\n' | b' ' => continue,
            _ => return Err(AppError::Validation("Invalid base64 character".to_string())),
        };
        buf = (buf << 6) | (val as u32);
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            out.push((buf >> bits) as u8);
        }
    }
    Ok(out)
}

#[tauri::command]
pub fn get_attachments(
    db: State<DbManager>,
    project_id: String,
    entity_type: Option<String>,
    entity_id: Option<String>,
) -> Result<Vec<Attachment>, AppError> {
    db.with_conn(|conn| {
        attachment_repo::list_attachments(
            conn,
            &project_id,
            entity_type.as_deref(),
            entity_id.as_deref(),
        )
    })
}

#[tauri::command]
pub fn create_attachment(
    db: State<DbManager>,
    input: CreateAttachmentInput,
) -> Result<Attachment, AppError> {
    db.with_conn(|conn| attachment_repo::create_attachment(conn, input))
}

#[tauri::command]
pub fn save_attachment_file(
    db: State<DbManager>,
    payload: SaveAttachmentPayload,
) -> Result<Attachment, AppError> {
    let safe_name = attachment_repo::sanitize_filename(&payload.file_name)?;
    let attachment_id = Uuid::new_v4().to_string();

    let bytes = if let Some(b64) = payload.base64_data {
        decode_base64(&b64)?
    } else if let Some(src_path) = payload.source_path {
        std::fs::read(&src_path)?
    } else {
        return Err(AppError::Validation("Neither base64 data nor source path provided".to_string()));
    };

    let (file_path, relative_path) = attachment_repo::save_attachment_file(
        db.base_dir(),
        &payload.project_id,
        &attachment_id,
        &safe_name,
        &bytes,
    )?;

    let ext = std::path::Path::new(&safe_name)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    let file_type = attachment_repo::detect_file_type(ext).to_string();
    let mime_type = Some(attachment_repo::detect_mime_type(ext).to_string());

    let input = CreateAttachmentInput {
        project_id: payload.project_id,
        file_name: safe_name,
        file_path: file_path.to_string_lossy().to_string(),
        relative_path: Some(relative_path),
        file_type,
        mime_type,
        file_size: bytes.len() as i64,
        entity_type: payload.entity_type,
        entity_id: payload.entity_id,
        description: payload.description,
    };

    db.with_conn(|conn| attachment_repo::create_attachment(conn, input))
}

#[tauri::command]
pub fn update_attachment(
    db: State<DbManager>,
    id: String,
    input: UpdateAttachmentInput,
) -> Result<Attachment, AppError> {
    db.with_conn(|conn| attachment_repo::update_attachment(conn, &id, input))
}

#[tauri::command]
pub fn delete_attachment(db: State<DbManager>, id: String) -> Result<bool, AppError> {
    db.with_conn(|conn| attachment_repo::delete_attachment(conn, &id, Some(db.base_dir())))
}

#[tauri::command]
pub fn open_attachment(db: State<DbManager>, id: String) -> Result<bool, AppError> {
    let att = db.with_conn(|conn| attachment_repo::get_attachment(conn, &id))?;
    let path = PathBuf::from(&att.file_path);

    if !path.exists() {
        return Err(AppError::NotFound(format!("File '{}' does not exist on disk", att.file_path)));
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "", &path.to_string_lossy()])
            .spawn()
            .map_err(|e| AppError::Internal(format!("Failed to launch file: {}", e)))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| AppError::Internal(format!("Failed to launch file: {}", e)))?;
    }

    Ok(true)
}

#[tauri::command]
pub fn reveal_attachment_folder(db: State<DbManager>, id: String) -> Result<bool, AppError> {
    let att = db.with_conn(|conn| attachment_repo::get_attachment(conn, &id))?;
    let path = PathBuf::from(&att.file_path);

    if !path.exists() {
        return Err(AppError::NotFound(format!("File '{}' does not exist on disk", att.file_path)));
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(format!("/select,{}", path.display()))
            .spawn()
            .map_err(|e| AppError::Internal(format!("Failed to reveal file: {}", e)))?;
    }

    #[cfg(not(target_os = "windows"))]
    {
        if let Some(parent) = path.parent() {
            std::process::Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|e| AppError::Internal(format!("Failed to reveal folder: {}", e)))?;
        }
    }

    Ok(true)
}

#[tauri::command]
pub fn add_attachment(
    db: State<DbManager>,
    payload: SaveAttachmentPayload,
) -> Result<Attachment, AppError> {
    save_attachment_file(db, payload)
}

#[tauri::command]
pub fn remove_attachment(db: State<DbManager>, id: String) -> Result<bool, AppError> {
    delete_attachment(db, id)
}

#[tauri::command]
pub fn get_related_content(
    db: State<DbManager>,
    project_id: String,
    entity_type: String,
    entity_id: String,
) -> Result<RelatedContentResponse, AppError> {
    db.with_conn(|conn| {
        cross_link_repo::get_related_content(conn, &project_id, &entity_type, &entity_id)
    })
}
