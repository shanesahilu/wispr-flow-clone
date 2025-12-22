use tauri::Manager;

/**
 * Command: start_drag
 * Responsibility: Initiates window drag operation.
 */
#[tauri::command]
fn start_drag(window: tauri::Window) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![start_drag])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            if let Ok(Some(monitor)) = window.current_monitor() {
                let screen_size = monitor.size();
                let window_size = window
                    .outer_size()
                    .unwrap_or(tauri::PhysicalSize::new(400, 280));

                let x = (screen_size.width as i32 - window_size.width as i32) / 2;
                let y = screen_size.height as i32 - window_size.height as i32 - 60;

                let _ = window.set_position(tauri::PhysicalPosition::new(x, y));
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
