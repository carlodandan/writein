use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum NodeType {
    Part,
    Chapter,
    Scene,
}

impl NodeType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Part => "part",
            Self::Chapter => "chapter",
            Self::Scene => "scene",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "part" => Self::Part,
            "chapter" => Self::Chapter,
            _ => Self::Scene,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManuscriptNode {
    pub id: String,
    pub project_id: String,
    pub parent_id: Option<String>,
    pub node_type: NodeType,
    pub title: String,
    pub synopsis: Option<String>,
    pub sort_order: i64,
    pub status: String,
    pub word_count: i64,
    pub created_at: String,
    pub updated_at: String,
    pub archived_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentContent {
    pub id: String,
    pub node_id: String,
    pub content_json: String,
    pub content_text: String,
    pub word_count: i64,
    pub character_count: i64,
    pub last_edited_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateNodeInput {
    pub project_id: String,
    pub parent_id: Option<String>,
    pub node_type: NodeType,
    pub title: String,
    pub synopsis: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateNodeInput {
    pub title: Option<String>,
    pub synopsis: Option<String>,
    pub status: Option<String>,
    pub sort_order: Option<i64>,
    pub parent_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoveNodeInput {
    pub node_id: String,
    pub target_parent_id: Option<String>,
    pub target_sort_order: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReorderItem {
    pub id: String,
    pub parent_id: Option<String>,
    pub sort_order: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveDocumentInput {
    pub node_id: String,
    pub content_json: String,
    pub content_text: String,
    pub word_count: i64,
    pub character_count: i64,
}
