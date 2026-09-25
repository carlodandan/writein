use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileOptions {
    pub format: String, // "markdown" | "text" | "html" | "docx"
    pub include_title_page: bool,
    #[serde(rename = "includeTableOfContents")]
    pub include_toc: bool,
    pub chapter_header_format: String, // "numbered_with_title" | "numbered_only" | "title_only"
    pub scene_separator: String,       // "* * *" | "###" | "---" | "blank_line"
    pub selected_node_ids: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileResult {
    pub file_name: String,
    pub file_path: Option<String>,
    pub content: String,
    pub word_count: i64,
    pub character_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoryBibleExportResult {
    pub file_name: String,
    pub file_path: Option<String>,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
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
#[serde(rename_all = "camelCase")]
pub struct ImportPreview {
    pub total_nodes: i64,
    pub total_words: i64,
    pub detected_nodes: Vec<ImportDetectedNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitImportInput {
    pub project_id: String,
    pub items: Vec<ImportDetectedNode>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compile_result_camel_case_serialization() {
        let result = CompileResult {
            file_name: "test.md".to_string(),
            file_path: Some("/path/to/test.md".to_string()),
            content: "Hello world".to_string(),
            word_count: 42,
            character_count: 200,
        };

        let json = serde_json::to_string(&result).expect("serialization should succeed");
        assert!(json.contains("\"fileName\":\"test.md\""));
        assert!(json.contains("\"filePath\":\"/path/to/test.md\""));
        assert!(json.contains("\"wordCount\":42"));
        assert!(json.contains("\"characterCount\":200"));
        assert!(!json.contains("\"file_name\""));
        assert!(!json.contains("\"word_count\""));
        assert!(!json.contains("\"character_count\""));
    }

    #[test]
    fn test_story_bible_export_result_camel_case_serialization() {
        let result = StoryBibleExportResult {
            file_name: "bible.md".to_string(),
            file_path: None,
            content: "# Bible".to_string(),
        };

        let json = serde_json::to_string(&result).expect("serialization should succeed");
        assert!(json.contains("\"fileName\":\"bible.md\""));
        assert!(!json.contains("\"file_name\""));
    }

    #[test]
    fn test_import_preview_camel_case_serialization() {
        let preview = ImportPreview {
            total_nodes: 5,
            total_words: 1500,
            detected_nodes: vec![ImportDetectedNode {
                node_type: "chapter".to_string(),
                title: "Chapter 1".to_string(),
                content_text: "Text".to_string(),
                word_count: 300,
                character_count: 1200,
                order_index: 1,
                children: None,
            }],
        };

        let json = serde_json::to_string(&preview).expect("serialization should succeed");
        assert!(json.contains("\"totalNodes\":5"));
        assert!(json.contains("\"totalWords\":1500"));
        assert!(json.contains("\"detectedNodes\":["));
        assert!(json.contains("\"nodeType\":\"chapter\""));
        assert!(json.contains("\"wordCount\":300"));
        assert!(json.contains("\"characterCount\":1200"));
        assert!(json.contains("\"orderIndex\":1"));
        assert!(!json.contains("\"total_nodes\""));
        assert!(!json.contains("\"total_words\""));
        assert!(!json.contains("\"detected_nodes\""));
        assert!(!json.contains("\"node_type\""));
        assert!(!json.contains("\"word_count\""));
        assert!(!json.contains("\"character_count\""));
    }
}
