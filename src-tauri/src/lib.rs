pub mod commands;
pub mod db;
pub mod models;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();

            #[cfg(desktop)]
            {
                handle.plugin(tauri_plugin_updater::Builder::new().build())?;
                handle.plugin(tauri_plugin_process::init())?;
                handle.plugin(
                    tauri_plugin_window_state::Builder::default()
                        .with_denylist(&["splashscreen"])
                        .build(),
                )?;
            }

            let app_data = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("./data"));
            let db_manager = db::DbManager::new(&app_data)
                .expect("failed to initialize WriteIn database and migrations");
            app.manage(db_manager);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_projects,
            commands::get_project,
            commands::create_project,
            commands::update_project,
            commands::delete_project,
            commands::get_project_summary,
            commands::get_manuscript_tree,
            commands::get_manuscript_node,
            commands::create_manuscript_node,
            commands::update_manuscript_node,
            commands::delete_manuscript_node,
            commands::duplicate_manuscript_node,
            commands::move_manuscript_node,
            commands::reorder_manuscript_nodes,
            commands::get_document,
            commands::save_document,
            commands::get_characters,
            commands::get_character,
            commands::create_character,
            commands::update_character,
            commands::delete_character,
            commands::get_character_relationships,
            commands::create_character_relationship,
            commands::update_character_relationship,
            commands::delete_character_relationship,
            commands::get_locations,
            commands::get_location,
            commands::create_location,
            commands::update_location,
            commands::delete_location,
            commands::get_worldbuilding_entries,
            commands::get_worldbuilding_entry,
            commands::create_worldbuilding_entry,
            commands::update_worldbuilding_entry,
            commands::delete_worldbuilding_entry,
            commands::get_timeline_events,
            commands::get_timeline_event,
            commands::create_timeline_event,
            commands::update_timeline_event,
            commands::delete_timeline_event,
            commands::get_notes,
            commands::get_note,
            commands::create_note,
            commands::update_note,
            commands::toggle_archive_note,
            commands::delete_note,
            commands::get_tags,
            commands::create_tag,
            commands::rename_tag,
            commands::update_tag,
            commands::delete_tag,
            commands::get_entity_tags,
            commands::set_entity_tags,
            commands::assign_tag,
            commands::remove_tag,
            commands::global_search,
            commands::search_project,
            commands::get_attachments,
            commands::create_attachment,
            commands::save_attachment_file,
            commands::add_attachment,
            commands::update_attachment,
            commands::delete_attachment,
            commands::remove_attachment,
            commands::open_attachment,
            commands::reveal_attachment_folder,
            commands::get_related_content,
            commands::close_splashscreen,
            commands::get_writing_goals,
            commands::create_writing_goal,
            commands::update_writing_goal,
            commands::delete_writing_goal,
            commands::start_writing_session,
            commands::end_writing_session,
            commands::list_writing_sessions,
            commands::get_session_stats,
            commands::get_setting,
            commands::save_setting,
            commands::get_all_settings,
            commands::delete_setting,
            commands::list_document_versions,
            commands::get_document_version,
            commands::create_document_snapshot,
            commands::restore_document_version,
            commands::delete_document_version,
            commands::compile_manuscript,
            commands::export_story_bible,
            commands::commit_imported_manuscript,
            commands::list_trash,
            commands::move_to_trash,
            commands::restore_from_trash,
            commands::delete_permanently,
            commands::empty_trash,
            commands::create_project_backup,
            commands::restore_project_backup,
            commands::list_backups,
            commands::delete_backup_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
