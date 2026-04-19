use std::fs::File;
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use std::path::PathBuf;
use tauri::{Runtime, Window, Manager};
use serde::Serialize;

#[derive(Serialize, Clone, Default)]
struct TelemetryData {
    controller: f32,
    mos: f32,
    motor: f32,
}

fn get_moza_telemetry() -> Option<TelemetryData> {
    let local_app_data = std::env::var("LOCALAPPDATA").ok()?;
    let log_path = PathBuf::from(local_app_data)
        .join("MOZA Pit House")
        .join("Motor_Temprature_Log.log");

    if !log_path.exists() {
        return None;
    }

    let file = File::open(log_path).ok()?;
    let mut reader = BufReader::new(file);
    
    let file_size = reader.get_ref().metadata().ok()?.len();
    let seek_start = if file_size > 4096 { file_size - 4096 } else { 0 };
    reader.seek(SeekFrom::Start(seek_start)).ok()?;

    let mut last_data = TelemetryData::default();
    
    for line in reader.lines().flatten() {
        let mut temps = Vec::new();
        for part in line.split('°') {
            if let Some(start_bracket) = part.rfind('[') {
                if let Ok(val) = part[start_bracket + 1..].parse::<f32>() {
                    temps.push(val);
                }
            }
        }
        
        if temps.len() >= 3 {
            last_data.controller = temps[0];
            last_data.mos = temps[1];
            last_data.motor = temps[2];
        }
    }
    
    Some(last_data)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_always_on_top(true);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_telemetry,
            set_click_through,
            exit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_telemetry() -> TelemetryData {
    get_moza_telemetry().unwrap_or_default()
}

#[tauri::command]
async fn set_click_through<R: Runtime>(window: Window<R>, ignore: bool) -> Result<(), String> {
    window.set_ignore_cursor_events(ignore).map_err(|e| e.to_string())
}

#[tauri::command]
fn exit_app() {
    std::process::exit(0);
}
