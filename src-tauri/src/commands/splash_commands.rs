use tauri::{AppHandle, Manager};

/// Closes the splashscreen window and shows/focuses the main application window.
#[tauri::command]
pub async fn close_splashscreen(app: AppHandle) -> Result<(), String> {
    // Close splashscreen window if present
    if let Some(splash_window) = app.get_webview_window("splashscreen") {
        let _ = splash_window.close();
    }

    // Unhide and focus the primary application window
    if let Some(main_window) = app.get_webview_window("main") {
        let _ = main_window.show();
        let _ = main_window.set_focus();
    }

    Ok(())
}
