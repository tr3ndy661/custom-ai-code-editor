#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Stdio};
use std::sync::Mutex;
use tauri::State;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct OllamaStatus {
    running: bool,
    models: Vec<String>,
}

struct AppState {
    ollama_process: Mutex<Option<std::process::Child>>,
}

#[tauri::command]
async fn start_ollama(state: State<'_, AppState>) -> Result<String, String> {
    let mut process_guard = state.ollama_process.lock().unwrap();
    
    if process_guard.is_some() {
        return Ok("Ollama is already running".to_string());
    }

    match Command::new("ollama")
        .arg("serve")
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
    {
        Ok(child) => {
            *process_guard = Some(child);
            Ok("Ollama started successfully".to_string())
        }
        Err(e) => Err(format!("Failed to start Ollama: {}", e)),
    }
}

#[tauri::command]
async fn stop_ollama(state: State<'_, AppState>) -> Result<String, String> {
    let mut process_guard = state.ollama_process.lock().unwrap();
    
    if let Some(mut child) = process_guard.take() {
        match child.kill() {
            Ok(_) => Ok("Ollama stopped successfully".to_string()),
            Err(e) => Err(format!("Failed to stop Ollama: {}", e)),
        }
    } else {
        Ok("Ollama was not running".to_string())
    }
}

#[tauri::command]
async fn check_ollama_status() -> Result<OllamaStatus, String> {
    let client = reqwest::Client::new();
    
    match client.get("http://localhost:11434/api/tags").send().await {
        Ok(response) => {
            if response.status().is_success() {
                let models: serde_json::Value = response.json().await.unwrap_or_default();
                let model_names: Vec<String> = models["models"]
                    .as_array()
                    .unwrap_or(&vec![])
                    .iter()
                    .filter_map(|m| m["name"].as_str().map(|s| s.to_string()))
                    .collect();
                
                Ok(OllamaStatus {
                    running: true,
                    models: model_names,
                })
            } else {
                Ok(OllamaStatus {
                    running: false,
                    models: vec![],
                })
            }
        }
        Err(_) => Ok(OllamaStatus {
            running: false,
            models: vec![],
        }),
    }
}

#[tauri::command]
async fn pull_model(model_name: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    let payload = serde_json::json!({
        "name": model_name
    });
    
    match client
        .post("http://localhost:11434/api/pull")
        .json(&payload)
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                Ok(format!("Model {} pulled successfully", model_name))
            } else {
                Err(format!("Failed to pull model {}", model_name))
            }
        }
        Err(e) => Err(format!("Error pulling model: {}", e)),
    }
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            ollama_process: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            start_ollama,
            stop_ollama,
            check_ollama_status,
            pull_model
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}