use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelatedContentItem {
    pub id: String,
    pub entity_type: String,
    pub title: String,
    pub subtitle: Option<String>,
    pub badge: Option<String>,
    pub target_tab: String,
    pub target_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelatedContentResponse {
    pub entity_type: String,
    pub entity_id: String,
    pub chapters: Vec<RelatedContentItem>,
    pub characters: Vec<RelatedContentItem>,
    pub locations: Vec<RelatedContentItem>,
    pub timeline_events: Vec<RelatedContentItem>,
    pub notes: Vec<RelatedContentItem>,
    pub attachments: Vec<RelatedContentItem>,
}
