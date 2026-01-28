use keyring::Entry;

#[tauri::command]
fn save_secret(key: String, value: String) -> Result<(), String> {
    let entry = Entry::new("adaptive-startup", &key).map_err(|e| e.to_string())?;
    entry.set_password(&value).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_secret(key: String) -> Result<String, String> {
    let entry = Entry::new("adaptive-startup", &key).map_err(|e| e.to_string())?;
    entry.get_password().map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_secret(key: String) -> Result<(), String> {
    let entry = Entry::new("adaptive-startup", &key).map_err(|e| e.to_string())?;
    entry.delete_credential().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      app.handle().plugin(tauri_plugin_shell::init())?;
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![save_secret, get_secret, delete_secret])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
