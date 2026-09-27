use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::models::{
    Attachment, Character, CharacterRelationship, DocumentContent, Location, ManuscriptNode, Note,
    Project, Tag, TimelineEvent, WorldbuildingEntry, WritingGoal,
};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TransferStats {
    pub projects_count: i64,
    pub documents_count: i64,
    pub chapters_count: i64,
    pub characters_count: i64,
    pub locations_count: i64,
    pub timeline_count: i64,
    pub notes_count: i64,
    pub worldbuilding_count: i64,
    pub attachments_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferManifest {
    pub format_version: String,
    pub writein_version: String,
    pub source_device_id: String,
    pub created_at: String,
    pub stats: TransferStats,
    pub checksum_sha256: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AttachmentTransferItem {
    pub attachment: Attachment,
    pub base64_data: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryTransferData {
    pub projects: Vec<Project>,
    pub nodes: Vec<ManuscriptNode>,
    pub documents: HashMap<String, DocumentContent>,
    pub characters: Vec<Character>,
    pub relationships: Vec<CharacterRelationship>,
    pub locations: Vec<Location>,
    pub worldbuilding: Vec<WorldbuildingEntry>,
    pub timeline: Vec<TimelineEvent>,
    pub notes: Vec<Note>,
    pub tags: Vec<Tag>,
    pub writing_goals: Vec<WritingGoal>,
    pub attachments: Vec<AttachmentTransferItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryTransferPackage {
    pub manifest: TransferManifest,
    pub data: LibraryTransferData,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferLogItem {
    pub id: String,
    pub session_id: String,
    pub direction: String, // "outgoing" | "incoming"
    pub peer_device_id: Option<String>,
    pub stats_json: String,
    pub created_at: String,
}
