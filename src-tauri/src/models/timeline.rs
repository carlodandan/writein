use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineEvent {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub event_date: Option<String>,
    pub date_value: Option<String>,
    pub date_label: Option<String>,
    pub time_value: Option<String>,
    pub order_index: i64,
    pub description: Option<String>,
    pub location_id: Option<String>,
    pub location_name: Option<String>,
    pub importance: String,
    pub related_chapter_id: Option<String>,
    pub chapter_title: Option<String>,
    pub character_ids: Vec<String>,
    pub character_names: Vec<String>,
    pub tags: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTimelineEventInput {
    pub project_id: String,
    pub title: String,
    pub event_date: Option<String>,
    pub date_value: Option<String>,
    pub date_label: Option<String>,
    pub time_value: Option<String>,
    pub order_index: Option<i64>,
    pub description: Option<String>,
    pub location_id: Option<String>,
    pub importance: Option<String>,
    pub related_chapter_id: Option<String>,
    pub character_ids: Option<Vec<String>>,
    pub tags: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTimelineEventInput {
    pub title: Option<String>,
    pub event_date: Option<String>,
    pub date_value: Option<String>,
    pub date_label: Option<String>,
    pub time_value: Option<String>,
    pub order_index: Option<i64>,
    pub description: Option<String>,
    pub location_id: Option<String>,
    pub importance: Option<String>,
    pub related_chapter_id: Option<String>,
    pub character_ids: Option<Vec<String>>,
    pub tags: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineFilter {
    pub character_id: Option<String>,
    pub location_id: Option<String>,
    pub related_chapter_id: Option<String>,
    pub importance: Option<String>,
    pub tag: Option<String>,
    pub search_query: Option<String>,
    pub sort_direction: Option<String>, // "asc" or "desc"
}
