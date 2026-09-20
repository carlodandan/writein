use chrono::Utc;
use rusqlite::{params, Connection};
use std::collections::HashMap;

use crate::models::{AppError, Setting};

pub fn get_setting(conn: &Connection, key: &str) -> Result<Option<String>, AppError> {
    let mut stmt =
        conn.prepare("SELECT value FROM settings WHERE key = ?1")?;

    let val: Option<String> = stmt
        .query_row(params![key], |row| row.get(0))
        .ok();

    Ok(val)
}

pub fn save_setting(conn: &Connection, key: &str, value: &str) -> Result<Setting, AppError> {
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        params![key, value, now],
    )?;

    Ok(Setting {
        key: key.to_string(),
        value: value.to_string(),
        updated_at: now,
    })
}

pub fn get_all_settings(conn: &Connection) -> Result<HashMap<String, String>, AppError> {
    let mut stmt = conn.prepare("SELECT key, value FROM settings")?;

    let iter = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;

    let mut map = HashMap::new();
    for item in iter {
        let (k, v) = item?;
        map.insert(k, v);
    }
    Ok(map)
}

pub fn delete_setting(conn: &Connection, key: &str) -> Result<bool, AppError> {
    let rows = conn.execute("DELETE FROM settings WHERE key = ?1", params![key])?;
    Ok(rows > 0)
}
