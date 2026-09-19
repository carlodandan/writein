use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ProjectStatus {
    Idea,
    Planning,
    Writing,
    Editing,
    Completed,
    Archived,
}

impl ProjectStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Idea => "idea",
            Self::Planning => "planning",
            Self::Writing => "writing",
            Self::Editing => "editing",
            Self::Completed => "completed",
            Self::Archived => "archived",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s {
            "planning" => Self::Planning,
            "writing" => Self::Writing,
            "editing" => Self::Editing,
            "completed" => Self::Completed,
            "archived" => Self::Archived,
            _ => Self::Idea,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub title: String,
    pub subtitle: Option<String>,
    pub author: Option<String>,
    pub description: Option<String>,
    pub genre: Option<String>,
    pub status: ProjectStatus,
    pub target_word_count: i64,
    pub current_word_count: i64,
    pub cover_image: Option<String>,
    pub project_notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub archived_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectInput {
    pub title: String,
    pub subtitle: Option<String>,
    pub author: Option<String>,
    pub description: Option<String>,
    pub genre: Option<String>,
    pub target_word_count: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProjectInput {
    pub title: Option<String>,
    pub subtitle: Option<String>,
    pub author: Option<String>,
    pub description: Option<String>,
    pub genre: Option<String>,
    pub status: Option<ProjectStatus>,
    pub target_word_count: Option<i64>,
    pub project_notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSummary {
    pub project: Project,
    pub chapter_count: i64,
    pub scene_count: i64,
    pub character_count: i64,
    pub location_count: i64,
    pub note_count: i64,
    pub last_edited_chapter_title: Option<String>,
}
