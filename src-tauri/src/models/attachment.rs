use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    pub id: String,
    pub project_id: String,
    pub file_name: String,
    pub file_path: String,
    pub relative_path: Option<String>,
    pub file_type: String,
    pub mime_type: Option<String>,
    pub file_size: i64,
    pub entity_type: Option<String>,
    pub entity_id: Option<String>,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateAttachmentInput {
    pub project_id: String,
    pub file_name: String,
    pub file_path: String,
    pub relative_path: Option<String>,
    pub file_type: String,
    pub mime_type: Option<String>,
    pub file_size: i64,
    pub entity_type: Option<String>,
    pub entity_id: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateAttachmentInput {
    pub file_name: Option<String>,
    pub description: Option<String>,
    pub entity_type: Option<String>,
    pub entity_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveAttachmentPayload {
    pub project_id: String,
    pub file_name: String,
    pub base64_data: Option<String>,
    pub source_path: Option<String>,
    pub entity_type: Option<String>,
    pub entity_id: Option<String>,
    pub description: Option<String>,
}
