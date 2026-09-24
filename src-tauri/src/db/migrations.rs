use rusqlite::{params, Connection, Result};

pub fn run_migrations(conn: &mut Connection) -> Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version INTEGER NOT NULL UNIQUE,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL
        );",
    )?;

    let applied_versions: Vec<i64> = {
        let mut stmt = conn.prepare("SELECT version FROM _migrations ORDER BY version ASC")?;
        let versions = stmt
            .query_map([], |row| row.get(0))?
            .filter_map(|r| r.ok())
            .collect();
        versions
    };

    if !applied_versions.contains(&1) {
        let tx = conn.transaction()?;
        tx.execute_batch(MIGRATION_001)?;
        tx.execute(
            "INSERT INTO _migrations (version, name, applied_at) VALUES (?1, ?2, datetime('now'))",
            params![1, "001_initial_schema"],
        )?;
        tx.commit()?;
    }

    if !applied_versions.contains(&2) {
        let tx = conn.transaction()?;
        tx.execute_batch(MIGRATION_002)?;
        tx.execute(
            "INSERT INTO _migrations (version, name, applied_at) VALUES (?1, ?2, datetime('now'))",
            params![2, "002_manuscript_enhancements"],
        )?;
        tx.commit()?;
    }

    if !applied_versions.contains(&3) {
        let tx = conn.transaction()?;
        tx.execute_batch(MIGRATION_003)?;
        tx.execute(
            "INSERT INTO _migrations (version, name, applied_at) VALUES (?1, ?2, datetime('now'))",
            params![3, "003_organization_enhancements"],
        )?;
        tx.commit()?;
    }

    if !applied_versions.contains(&4) {
        let tx = conn.transaction()?;
        tx.execute_batch(MIGRATION_004)?;
        tx.execute(
            "INSERT INTO _migrations (version, name, applied_at) VALUES (?1, ?2, datetime('now'))",
            params![4, "004_secure_attachments_and_entity_linking"],
        )?;
        tx.commit()?;
    }

    if !applied_versions.contains(&5) {
        let tx = conn.transaction()?;
        tx.execute_batch(MIGRATION_005)?;
        tx.execute(
            "INSERT INTO _migrations (version, name, applied_at) VALUES (?1, ?2, datetime('now'))",
            params![5, "005_writing_sessions"],
        )?;
        tx.commit()?;
    }

    Ok(())
}

const MIGRATION_005: &str = r#"
-- Writing Sessions: track per-session word counts and durations
CREATE TABLE IF NOT EXISTS writing_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    node_id TEXT,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    words_written INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY(node_id) REFERENCES manuscript_nodes(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_project_date ON writing_sessions(project_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_node ON writing_sessions(node_id);
"#;

const MIGRATION_004: &str = r#"
-- Secure Attachments & Entity Linking
ALTER TABLE attachments ADD COLUMN mime_type TEXT;
ALTER TABLE attachments ADD COLUMN relative_path TEXT;
ALTER TABLE attachments ADD COLUMN entity_type TEXT;
ALTER TABLE attachments ADD COLUMN entity_id TEXT;
ALTER TABLE attachments ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';

UPDATE attachments SET updated_at = created_at WHERE updated_at = '';
UPDATE attachments SET relative_path = file_path WHERE relative_path IS NULL;

CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_project_created ON attachments(project_id, created_at DESC);
"#;

const MIGRATION_003: &str = r#"
-- Timeline enhancements
ALTER TABLE timeline_events ADD COLUMN date_value TEXT;
ALTER TABLE timeline_events ADD COLUMN date_label TEXT;
ALTER TABLE timeline_events ADD COLUMN time_value TEXT;
ALTER TABLE timeline_events ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';

-- Populate default values from existing event_date & created_at
UPDATE timeline_events SET date_value = event_date WHERE date_value IS NULL;
UPDATE timeline_events SET date_label = event_date WHERE date_label IS NULL;
UPDATE timeline_events SET updated_at = created_at WHERE updated_at = '';

-- Timeline Event Characters junction table
CREATE TABLE IF NOT EXISTS timeline_event_characters (
    id TEXT PRIMARY KEY NOT NULL,
    event_id TEXT NOT NULL,
    character_id TEXT NOT NULL,
    FOREIGN KEY(event_id) REFERENCES timeline_events(id) ON DELETE CASCADE,
    FOREIGN KEY(character_id) REFERENCES characters(id) ON DELETE CASCADE,
    UNIQUE(event_id, character_id)
);
CREATE INDEX IF NOT EXISTS idx_timeline_chars_event ON timeline_event_characters(event_id);
CREATE INDEX IF NOT EXISTS idx_timeline_chars_char ON timeline_event_characters(character_id);

-- Notes enhancements (archived_at)
ALTER TABLE notes ADD COLUMN archived_at TEXT;

-- Indexing for tags and search
CREATE INDEX IF NOT EXISTS idx_tags_project_name ON tags(project_id, name);
CREATE INDEX IF NOT EXISTS idx_entity_tags_lookup ON entity_tags(tag_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_timeline_sort_date ON timeline_events(project_id, date_value, order_index);
"#;

const MIGRATION_002: &str = r#"
-- Manuscript enhancements
ALTER TABLE manuscript_nodes ADD COLUMN archived_at TEXT;
ALTER TABLE manuscript_nodes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE manuscript_nodes SET sort_order = order_index;

CREATE INDEX IF NOT EXISTS idx_manuscript_sort_order ON manuscript_nodes(project_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_manuscript_updated_at ON manuscript_nodes(updated_at);
"#;

const MIGRATION_001: &str = r#"
-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    author TEXT,
    description TEXT,
    genre TEXT,
    status TEXT NOT NULL DEFAULT 'idea',
    target_word_count INTEGER NOT NULL DEFAULT 50000,
    current_word_count INTEGER NOT NULL DEFAULT 0,
    cover_image TEXT,
    project_notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    archived_at TEXT
);

-- Manuscript Hierarchy
CREATE TABLE IF NOT EXISTS manuscript_nodes (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    parent_id TEXT,
    node_type TEXT NOT NULL, -- 'folder', 'chapter', 'scene'
    title TEXT NOT NULL,
    synopsis TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    word_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY(parent_id) REFERENCES manuscript_nodes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_manuscript_project ON manuscript_nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_manuscript_parent ON manuscript_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_manuscript_order ON manuscript_nodes(project_id, order_index);

-- Document Contents
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY NOT NULL,
    node_id TEXT NOT NULL UNIQUE,
    content_json TEXT NOT NULL DEFAULT '',
    content_text TEXT NOT NULL DEFAULT '',
    word_count INTEGER NOT NULL DEFAULT 0,
    character_count INTEGER NOT NULL DEFAULT 0,
    last_edited_at TEXT NOT NULL,
    FOREIGN KEY(node_id) REFERENCES manuscript_nodes(id) ON DELETE CASCADE
);

-- Characters
CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    nickname TEXT,
    role TEXT NOT NULL DEFAULT 'supporting',
    age TEXT,
    description TEXT,
    personality TEXT,
    appearance TEXT,
    background TEXT,
    motivations TEXT,
    fears TEXT,
    goals TEXT,
    notes TEXT,
    avatar_path TEXT,
    tags TEXT,
    custom_fields_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);

-- Character Relationships
CREATE TABLE IF NOT EXISTS character_relationships (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    character_a_id TEXT NOT NULL,
    character_b_id TEXT NOT NULL,
    relation_type TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY(character_a_id) REFERENCES characters(id) ON DELETE CASCADE,
    FOREIGN KEY(character_b_id) REFERENCES characters(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_char_rel_project ON character_relationships(project_id);
CREATE INDEX IF NOT EXISTS idx_char_rel_a ON character_relationships(character_a_id);
CREATE INDEX IF NOT EXISTS idx_char_rel_b ON character_relationships(character_b_id);

-- Locations
CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    location_type TEXT,
    description TEXT,
    appearance TEXT,
    atmosphere TEXT,
    inhabitants TEXT,
    notes TEXT,
    map_path TEXT,
    tags TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_locations_project ON locations(project_id);

-- Worldbuilding Entries
CREATE TABLE IF NOT EXISTS worldbuilding_entries (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    tags TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_worldbuilding_project ON worldbuilding_entries(project_id);

-- Timeline Events
CREATE TABLE IF NOT EXISTS timeline_events (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    event_date TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    location_id TEXT,
    importance TEXT DEFAULT 'normal',
    related_chapter_id TEXT,
    tags TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY(location_id) REFERENCES locations(id) ON DELETE SET NULL,
    FOREIGN KEY(related_chapter_id) REFERENCES manuscript_nodes(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_timeline_project ON timeline_events(project_id);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Ideas',
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    tags TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, name)
);

-- Entity Tags
CREATE TABLE IF NOT EXISTS entity_tags (
    id TEXT PRIMARY KEY NOT NULL,
    tag_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_entity_tags_entity ON entity_tags(entity_type, entity_id);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_attachments_project ON attachments(project_id);

-- Document Versions (Snapshots)
CREATE TABLE IF NOT EXISTS document_versions (
    id TEXT PRIMARY KEY NOT NULL,
    document_id TEXT NOT NULL,
    node_id TEXT NOT NULL,
    version_num INTEGER NOT NULL DEFAULT 1,
    snapshot_text TEXT NOT NULL,
    word_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY(node_id) REFERENCES manuscript_nodes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_versions_doc ON document_versions(document_id);

-- Writing Goals
CREATE TABLE IF NOT EXISTS writing_goals (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    goal_type TEXT NOT NULL,
    target_words INTEGER NOT NULL,
    current_words INTEGER NOT NULL DEFAULT 0,
    start_date TEXT,
    end_date TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_writing_goals_project ON writing_goals(project_id);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Trash / Recovery
CREATE TABLE IF NOT EXISTS trash_items (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    original_data_json TEXT NOT NULL,
    deleted_at TEXT NOT NULL,
    FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_trash_project ON trash_items(project_id);
"#;

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_migrations_run_successfully() {
        let mut conn = Connection::open_in_memory().expect("failed to open in-memory db");
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();

        let result = run_migrations(&mut conn);
        assert!(result.is_ok(), "migration should succeed");

        // Verify tables exist in an isolated scope
        {
            let mut stmt = conn
                .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'")
                .unwrap();
            let mut rows = stmt.query([]).unwrap();
            assert!(rows.next().unwrap().is_some());
        }

        // Verify Migration 005: writing_sessions table
        {
            let mut stmt = conn
                .prepare(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='writing_sessions'",
                )
                .unwrap();
            let mut rows = stmt.query([]).unwrap();
            assert!(
                rows.next().unwrap().is_some(),
                "writing_sessions table should exist after migration 005"
            );
        }

        // Idempotency: Running it a second time should succeed without error
        let second_run = run_migrations(&mut conn);
        assert!(
            second_run.is_ok(),
            "second migration run should be idempotent"
        );
    }
}
