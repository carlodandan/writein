use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompileOptions {
    pub format: String, // "markdown" | "text" | "html"
    pub include_title_page: bool,
    pub include_toc: bool,
    pub chapter_header_format: String, // "numbered_with_title" | "numbered_only" | "title_only"
    pub scene_separator: String,       // "* * *" | "###" | "---" | "blank_line"
    pub selected_node_ids: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompileResult {
    pub file_name: String,
    pub file_path: Option<String>,
    pub content: String,
    pub word_count: i64,
    pub character_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoryBibleExportResult {
    pub file_name: String,
    pub file_path: Option<String>,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportDetectedNode {
    pub node_type: String, // "part" | "chapter" | "scene"
    pub title: String,
    pub content_text: String,
    pub word_count: i64,
    pub character_count: i64,
    pub order_index: i64,
    pub children: Option<Vec<ImportDetectedNode>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportPreview {
    pub total_nodes: i64,
    pub total_words: i64,
    pub detected_nodes: Vec<ImportDetectedNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommitImportInput {
    pub project_id: String,
    pub items: Vec<ImportDetectedNode>,
}
