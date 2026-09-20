use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::models::{
    Character, CharacterRelationship, DocumentContent, Location, ManuscriptNode,
    Note, Project, TimelineEvent, WorldbuildingEntry, WritingGoal, WritingSession,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrashItem {
    pub id: String,
    pub project_id: String,
    pub entity_type: String, // "manuscript" | "character" | "location" | "note"
    pub entity_id: String,
    pub title: String,
    pub deleted_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupFileInfo {
    pub file_name: String,
    pub file_path: String,
    pub file_size_bytes: u64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupResult {
    pub file_name: String,
    pub file_path: Option<String>,
    pub content_json: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectBackupBundle {
    pub version: String,
    pub exported_at: String,
    pub project: Project,
    pub nodes: Vec<ManuscriptNode>,
    pub documents: HashMap<String, DocumentContent>,
    pub characters: Vec<Character>,
    pub relationships: Vec<CharacterRelationship>,
    pub locations: Vec<Location>,
    pub worldbuilding: Vec<WorldbuildingEntry>,
    pub timeline: Vec<TimelineEvent>,
    pub notes: Vec<Note>,
    pub writing_goals: Vec<WritingGoal>,
    pub writing_sessions: Vec<WritingSession>,
    pub settings: HashMap<String, String>,
}
