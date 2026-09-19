use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum CharacterRole {
    Protagonist,
    Antagonist,
    Supporting,
    Minor,
}

impl Default for CharacterRole {
    fn default() -> Self {
        CharacterRole::Supporting
    }
}

impl CharacterRole {
    pub fn as_str(&self) -> &'static str {
        match self {
            CharacterRole::Protagonist => "protagonist",
            CharacterRole::Antagonist => "antagonist",
            CharacterRole::Supporting => "supporting",
            CharacterRole::Minor => "minor",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "protagonist" => CharacterRole::Protagonist,
            "antagonist" => CharacterRole::Antagonist,
            "minor" => CharacterRole::Minor,
            _ => CharacterRole::Supporting,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Character {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub nickname: Option<String>,
    pub role: String,
    pub age: Option<String>,
    pub description: Option<String>,
    pub personality: Option<String>,
    pub appearance: Option<String>,
    pub background: Option<String>,
    pub motivations: Option<String>,
    pub fears: Option<String>,
    pub goals: Option<String>,
    pub notes: Option<String>,
    pub avatar_path: Option<String>,
    pub tags: Option<String>,
    pub custom_fields_json: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCharacterInput {
    pub project_id: String,
    pub name: String,
    pub nickname: Option<String>,
    pub role: Option<String>,
    pub age: Option<String>,
    pub description: Option<String>,
    pub personality: Option<String>,
    pub appearance: Option<String>,
    pub background: Option<String>,
    pub motivations: Option<String>,
    pub fears: Option<String>,
    pub goals: Option<String>,
    pub notes: Option<String>,
    pub avatar_path: Option<String>,
    pub tags: Option<String>,
    pub custom_fields_json: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCharacterInput {
    pub name: Option<String>,
    pub nickname: Option<String>,
    pub role: Option<String>,
    pub age: Option<String>,
    pub description: Option<String>,
    pub personality: Option<String>,
    pub appearance: Option<String>,
    pub background: Option<String>,
    pub motivations: Option<String>,
    pub fears: Option<String>,
    pub goals: Option<String>,
    pub notes: Option<String>,
    pub avatar_path: Option<String>,
    pub tags: Option<String>,
    pub custom_fields_json: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterRelationship {
    pub id: String,
    pub project_id: String,
    pub character_a_id: String,
    pub character_b_id: String,
    pub relation_type: String,
    pub description: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CharacterRelationshipWithNames {
    pub id: String,
    pub project_id: String,
    pub character_a_id: String,
    pub character_a_name: String,
    pub character_b_id: String,
    pub character_b_name: String,
    pub relation_type: String,
    pub description: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRelationshipInput {
    pub project_id: String,
    pub character_a_id: String,
    pub character_b_id: String,
    pub relation_type: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateRelationshipInput {
    pub relation_type: Option<String>,
    pub description: Option<String>,
}
