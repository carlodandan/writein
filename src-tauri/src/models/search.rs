use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResultItem {
    pub id: String,
    pub entity_type: String, // "manuscript", "character", "location", "worldbuilding", "timeline", "note", "tag"
    pub title: String,
    pub subtitle: Option<String>,
    pub snippet: Option<String>,
    pub target_tab: String,
    pub target_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResponse {
    pub query: String,
    pub items: Vec<SearchResultItem>,
    pub total_count: usize,
}
