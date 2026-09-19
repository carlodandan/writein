use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Location {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub location_type: Option<String>,
    pub description: Option<String>,
    pub appearance: Option<String>,
    pub atmosphere: Option<String>,
    pub inhabitants: Option<String>,
    pub notes: Option<String>,
    pub map_path: Option<String>,
    pub tags: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateLocationInput {
    pub project_id: String,
    pub name: String,
    pub location_type: Option<String>,
    pub description: Option<String>,
    pub appearance: Option<String>,
    pub atmosphere: Option<String>,
    pub inhabitants: Option<String>,
    pub notes: Option<String>,
    pub map_path: Option<String>,
    pub tags: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateLocationInput {
    pub name: Option<String>,
    pub location_type: Option<String>,
    pub description: Option<String>,
    pub appearance: Option<String>,
    pub atmosphere: Option<String>,
    pub inhabitants: Option<String>,
    pub notes: Option<String>,
    pub map_path: Option<String>,
    pub tags: Option<String>,
}
