use serde::{Deserialize, Serialize};

// ─── Document Version ───────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentVersion {
    pub id: String,
    pub document_id: String,
    pub node_id: String,
    pub version_num: i64,
    pub snapshot_text: String,
    pub word_count: i64,
    pub created_at: String,
}

// ─── Writing Goal ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WritingGoal {
    pub id: String,
    pub project_id: String,
    pub goal_type: String, // "novel" | "daily" | "session"
    pub target_words: i64,
    pub current_words: i64,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub is_active: bool,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateWritingGoalInput {
    pub project_id: String,
    pub goal_type: String,
    pub target_words: i64,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateWritingGoalInput {
    pub target_words: Option<i64>,
    pub current_words: Option<i64>,
    pub is_active: Option<bool>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

// ─── Writing Session ─────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WritingSession {
    pub id: String,
    pub project_id: String,
    pub node_id: Option<String>,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub duration_seconds: i64,
    pub words_written: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionStats {
    pub today_words: i64,
    pub week_words: i64,
    pub all_time_words: i64,
    pub today_sessions: i64,
    pub avg_session_words: i64,
}

// ─── Settings ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Setting {
    pub key: String,
    pub value: String,
    pub updated_at: String,
}
