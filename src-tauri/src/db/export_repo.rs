use std::fs;
use std::path::Path;
use rusqlite::Connection;

use crate::db::manuscript_repo::{create_node, get_manuscript_tree, get_document, recalculate_project_word_count, save_document};
use crate::db::project_repo::get_project;
use crate::db::character_repo::list_characters;
use crate::db::location_repo::list_locations;
use crate::db::worldbuilding_repo::list_worldbuilding_entries;
use crate::db::timeline_repo::list_timeline_events;
use crate::db::note_repo::list_notes;
use crate::models::{
    AppError, CommitImportInput, CompileOptions, CompileResult, CreateNodeInput,
    ImportDetectedNode, ManuscriptNode, NodeType, SaveDocumentInput, StoryBibleExportResult,
};

pub fn compile_manuscript(
    conn: &Connection,
    base_dir: &Path,
    project_id: &str,
    options: CompileOptions,
) -> Result<CompileResult, AppError> {
    let project = get_project(conn, project_id)?;
    let tree = get_manuscript_tree(conn, project_id)?;

    let selected_ids = options.selected_node_ids.as_ref();
    let filtered_nodes: Vec<&ManuscriptNode> = tree
        .iter()
        .filter(|n| {
            if let Some(ids) = selected_ids {
                ids.contains(&n.id)
            } else {
                true
            }
        })
        .collect();

    let mut output = String::new();
    let mut chapter_counter = 0;

    let scene_sep = match options.scene_separator.as_str() {
        "###" => "\n\n###\n\n",
        "---" => "\n\n---\n\n",
        "blank_line" => "\n\n\n",
        _ => "\n\n* * *\n\n",
    };

    // 1. Title Page
    if options.include_title_page {
        if options.format == "markdown" {
            output.push_str(&format!("# {}\n", project.title));
            if let Some(sub) = &project.subtitle {
                output.push_str(&format!("*{sub}*\n\n"));
            }
            if let Some(auth) = &project.author {
                output.push_str(&format!("**By {auth}**\n\n"));
            }
            if let Some(genre) = &project.genre {
                output.push_str(&format!("Genre: {genre}\n\n"));
            }
            output.push_str("---\n\n");
        } else if options.format == "html" {
            output.push_str(&format!(
                "<div class=\"title-page\">\n  <h1 class=\"book-title\">{}</h1>\n",
                escape_html(&project.title)
            ));
            if let Some(sub) = &project.subtitle {
                output.push_str(&format!("  <h2 class=\"book-subtitle\">{}</h2>\n", escape_html(sub)));
            }
            if let Some(auth) = &project.author {
                output.push_str(&format!("  <p class=\"book-author\">By {}</p>\n", escape_html(auth)));
            }
            if let Some(genre) = &project.genre {
                output.push_str(&format!("  <p class=\"book-genre\">{}</p>\n", escape_html(genre)));
            }
            output.push_str("</div>\n<div class=\"page-break\"></div>\n");
        } else {
            output.push_str(&format!("{}\n", project.title.to_uppercase()));
            if let Some(sub) = &project.subtitle {
                output.push_str(&format!("{sub}\n"));
            }
            if let Some(auth) = &project.author {
                output.push_str(&format!("By {auth}\n"));
            }
            output.push_str(&format!("\n{}\n\n", "=".repeat(40)));
        }
    }

    // 2. Table of Contents
    if options.include_toc {
        let chapters: Vec<&&ManuscriptNode> = filtered_nodes
            .iter()
            .filter(|n| n.node_type == NodeType::Chapter)
            .collect();

        if !chapters.is_empty() {
            if options.format == "markdown" {
                output.push_str("### Table of Contents\n\n");
                for (idx, ch) in chapters.iter().enumerate() {
                    output.push_str(&format!("{}. {}\n", idx + 1, ch.title));
                }
                output.push_str("\n---\n\n");
            } else if options.format == "html" {
                output.push_str("<div class=\"toc-page\">\n  <h2>Table of Contents</h2>\n  <ul class=\"toc-list\">\n");
                for (idx, ch) in chapters.iter().enumerate() {
                    output.push_str(&format!(
                        "    <li><span class=\"toc-num\">{}.</span> {}</li>\n",
                        idx + 1,
                        escape_html(&ch.title)
                    ));
                }
                output.push_str("  </ul>\n</div>\n<div class=\"page-break\"></div>\n");
            } else {
                output.push_str("TABLE OF CONTENTS\n\n");
                for (idx, ch) in chapters.iter().enumerate() {
                    output.push_str(&format!("  {}. {}\n", idx + 1, ch.title));
                }
                output.push_str(&format!("\n{}\n\n", "-".repeat(40)));
            }
        }
    }

    // 3. Render Nodes
    for node in &filtered_nodes {
        let doc = get_document(conn, &node.id).ok();
        let body_text = doc.map(|d| d.content_text).unwrap_or_default();

        match node.node_type {
            NodeType::Part => {
                if options.format == "markdown" {
                    output.push_str(&format!("\n\n# {}\n\n", node.title));
                } else if options.format == "html" {
                    output.push_str(&format!(
                        "<div class=\"page-break\"></div>\n<h1 class=\"part-title\">{}</h1>\n",
                        escape_html(&node.title)
                    ));
                } else {
                    output.push_str(&format!(
                        "\n\n{}\n{}\n{}\n\n",
                        "#".repeat(30),
                        node.title.to_uppercase(),
                        "#".repeat(30)
                    ));
                }
            }
            NodeType::Chapter => {
                chapter_counter += 1;
                let header_title = match options.chapter_header_format.as_str() {
                    "numbered_only" => format!("Chapter {}", chapter_counter),
                    "numbered_with_title" => format!("Chapter {}: {}", chapter_counter, node.title),
                    _ => node.title.clone(),
                };

                if options.format == "markdown" {
                    output.push_str(&format!("\n\n## {}\n\n", header_title));
                } else if options.format == "html" {
                    output.push_str(&format!(
                        "<h2 class=\"chapter-title\">{}</h2>\n",
                        escape_html(&header_title)
                    ));
                } else {
                    output.push_str(&format!("\n\n{}\n\n", header_title.to_uppercase()));
                }
            }
            NodeType::Scene => {
                if options.format == "markdown" {
                    output.push_str(scene_sep);
                } else if options.format == "html" {
                    output.push_str("<div class=\"scene-separator\">* * *</div>\n");
                } else {
                    output.push_str("\n\n* * *\n\n");
                }
            }
        }

        if !body_text.trim().is_empty() {
            if options.format == "html" {
                for para in body_text.split("\n\n") {
                    if !para.trim().is_empty() {
                        output.push_str(&format!("<p>{}</p>\n", escape_html(para.trim())));
                    }
                }
            } else {
                output.push_str(&body_text);
                output.push_str("\n\n");
            }
        }
    }

    if options.format == "html" {
        output = format!(
            "<!DOCTYPE html>\n<html><head><meta charset=\"utf-8\"><title>{}</title><style>body{{font-family:Georgia,serif;line-height:1.8;padding:3rem;max-width:42rem;margin:0 auto;}}h1,h2{{text-align:center;}}.title-page{{text-align:center;padding:5rem 0;}}.page-break{{page-break-after:always;}}.scene-separator{{text-align:center;margin:2rem 0;}}</style></head><body>{}</body></html>",
            escape_html(&project.title),
            output
        );
    }

    let word_count = output.split_whitespace().count() as i64;
    let character_count = output.chars().count() as i64;

    let ext = match options.format.as_str() {
        "markdown" => "md",
        "html" => "html",
        _ => "txt",
    };

    let safe_title: String = project
        .title
        .to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '_' })
        .collect();
    let file_name = format!("{safe_title}.{ext}");

    // Save to exports directory
    let exports_dir = base_dir.join("projects").join(project_id).join("exports");
    let _ = fs::create_dir_all(&exports_dir);
    let file_path = exports_dir.join(&file_name);
    let path_str = if fs::write(&file_path, &output).is_ok() {
        Some(file_path.to_string_lossy().to_string())
    } else {
        None
    };

    Ok(CompileResult {
        file_name,
        file_path: path_str,
        content: output,
        word_count,
        character_count,
    })
}

pub fn export_story_bible(
    conn: &Connection,
    base_dir: &Path,
    project_id: &str,
    _format: &str,
) -> Result<StoryBibleExportResult, AppError> {
    let project = get_project(conn, project_id)?;
    let characters = list_characters(conn, project_id)?;
    let locations = list_locations(conn, project_id)?;
    let lore = list_worldbuilding_entries(conn, project_id, None)?;
    let timeline = list_timeline_events(conn, project_id, None)?;
    let notes = list_notes(conn, project_id, None, false)?;

    let mut md = String::new();
    md.push_str(&format!("# Story Bible: {}\n\n", project.title));
    if let Some(desc) = &project.description {
        md.push_str(&format!("{}\n\n", desc));
    }
    md.push_str("---\n\n");

    // Characters
    md.push_str("## Characters & Cast\n\n");
    for c in &characters {
        md.push_str(&format!("### {} ({})\n", c.name, c.role));
        if let Some(desc) = &c.description {
            md.push_str(&format!("**Description**: {}\n\n", desc));
        }
        if let Some(traits) = &c.personality {
            md.push_str(&format!("**Personality**: {}\n\n", traits));
        }
        if let Some(bg) = &c.background {
            md.push_str(&format!("**Background**: {}\n\n", bg));
        }
    }

    // Locations
    md.push_str("## Locations & Setting\n\n");
    for loc in &locations {
        md.push_str(&format!("### {}\n", loc.name));
        if let Some(lt) = &loc.location_type {
            md.push_str(&format!("*Type*: {}\n\n", lt));
        }
        if let Some(desc) = &loc.description {
            md.push_str(&format!("{}\n\n", desc));
        }
        if let Some(atm) = &loc.atmosphere {
            md.push_str(&format!("*Atmosphere*: {}\n\n", atm));
        }
    }

    // Worldbuilding
    md.push_str("## Worldbuilding & Lore\n\n");
    for entry in &lore {
        md.push_str(&format!("### {} [{}]\n\n", entry.title, entry.category));
        md.push_str(&format!("{}\n\n", entry.content));
    }

    // Timeline
    md.push_str("## Timeline & Chronology\n\n");
    for event in &timeline {
        let date_str = event.date_label.as_deref().or(event.event_date.as_deref()).unwrap_or("Undated");
        md.push_str(&format!("- **{}**: {}\n", date_str, event.title));
        if let Some(desc) = &event.description {
            md.push_str(&format!("  {}\n", desc));
        }
    }

    // Notes
    md.push_str("\n## Writer's Notebook\n\n");
    for note in &notes {
        md.push_str(&format!("### {} ({})\n\n", note.title, note.category));
        md.push_str(&format!("{}\n\n", note.content));
    }

    let file_name = format!("{}_story_bible.md", project.title.to_lowercase().replace(' ', "_"));
    let exports_dir = base_dir.join("projects").join(project_id).join("exports");
    let _ = fs::create_dir_all(&exports_dir);
    let file_path = exports_dir.join(&file_name);
    let path_str = if fs::write(&file_path, &md).is_ok() {
        Some(file_path.to_string_lossy().to_string())
    } else {
        None
    };

    Ok(StoryBibleExportResult {
        file_name,
        file_path: path_str,
        content: md,
    })
}

pub fn commit_imported_manuscript(
    conn: &Connection,
    input: CommitImportInput,
) -> Result<Vec<ManuscriptNode>, AppError> {
    let mut created_nodes = Vec::new();

    fn insert_node_recursive(
        conn: &Connection,
        project_id: &str,
        parent_id: Option<&str>,
        item: &ImportDetectedNode,
        created: &mut Vec<ManuscriptNode>,
    ) -> Result<(), AppError> {
        let node_type = match item.node_type.as_str() {
            "part" => NodeType::Part,
            "chapter" => NodeType::Chapter,
            _ => NodeType::Scene,
        };

        let node = create_node(
            conn,
            CreateNodeInput {
                project_id: project_id.to_string(),
                parent_id: parent_id.map(|s| s.to_string()),
                node_type,
                title: item.title.clone(),
                synopsis: None,
            },
        )?;

        // Save content into document
        if !item.content_text.is_empty() {
            let words = item.content_text.split_whitespace().count() as i64;
            let chars = item.content_text.chars().count() as i64;
            save_document(
                conn,
                SaveDocumentInput {
                    node_id: node.id.clone(),
                    content_json: String::new(),
                    content_text: item.content_text.clone(),
                    word_count: words,
                    character_count: chars,
                },
            )?;
        }

        created.push(node.clone());

        if let Some(children) = &item.children {
            for child in children {
                insert_node_recursive(conn, project_id, Some(&node.id), child, created)?;
            }
        }

        Ok(())
    }

    for item in &input.items {
        insert_node_recursive(conn, &input.project_id, None, item, &mut created_nodes)?;
    }

    recalculate_project_word_count(conn, &input.project_id)?;

    Ok(created_nodes)
}

fn escape_html(str: &str) -> String {
    str.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#039;")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::migrations::run_migrations;
    use crate::db::project_repo::create_project;
    use crate::models::CreateProjectInput;

    fn setup_test_db() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        run_migrations(&mut conn).unwrap();
        conn
    }

    #[test]
    fn test_compile_manuscript_and_story_bible() {
        let conn = setup_test_db();
        let proj = create_project(
            &conn,
            CreateProjectInput {
                title: "Compile Test Book".into(),
                subtitle: Some("A Test".into()),
                author: Some("Author Jane".into()),
                description: Some("A book about testing compilers".into()),
                genre: Some("Sci-Fi".into()),
                target_word_count: None,
            },
        )
        .unwrap();

        let ch = create_node(
            &conn,
            CreateNodeInput {
                project_id: proj.id.clone(),
                parent_id: None,
                node_type: NodeType::Chapter,
                title: "Arrival".into(),
                synopsis: None,
            },
        )
        .unwrap();

        save_document(
            &conn,
            SaveDocumentInput {
                node_id: ch.id.clone(),
                content_json: String::new(),
                content_text: "The ship docked silently at the station.".into(),
                word_count: 7,
                character_count: 40,
            },
        )
        .unwrap();

        let temp_dir = std::env::temp_dir().join("writein_export_test");
        let _ = fs::create_dir_all(&temp_dir);

        // Compile to Markdown
        let res_md = compile_manuscript(
            &conn,
            &temp_dir,
            &proj.id,
            CompileOptions {
                format: "markdown".into(),
                include_title_page: true,
                include_toc: true,
                chapter_header_format: "numbered_with_title".into(),
                scene_separator: "* * *".into(),
                selected_node_ids: None,
            },
        )
        .unwrap();

        assert!(res_md.content.contains("# Compile Test Book"));
        assert!(res_md.content.contains("Chapter 1: Arrival"));
        assert!(res_md.content.contains("The ship docked silently at the station."));
        assert_eq!(res_md.file_name, "compile_test_book.md");

        // Export Story Bible
        let res_bible = export_story_bible(&conn, &temp_dir, &proj.id, "markdown").unwrap();
        assert!(res_bible.content.contains("# Story Bible: Compile Test Book"));
    }
}
