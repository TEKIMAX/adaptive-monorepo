use axum::Json;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::process::Command;

#[derive(Deserialize, Serialize, Debug)]
pub struct QuantumRequest {
    pub problem_type: String,
    pub parameters: Value,
    pub backend: Option<String>,
    pub shots: Option<u32>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct QuantumResponse {
    pub status: String,
    // Fields from Python might vary, so we make them optional or generic
    pub optimal_parameters: Option<Vec<f64>>,
    pub energy: Option<f64>,
    pub confidence: Option<f64>, 
    pub backend_used: Option<String>,
    pub message: Option<String>,
    pub execution_time_ms: Option<u64>,
}

pub async fn optimize_handler(Json(payload): Json<QuantumRequest>) -> Json<QuantumResponse> {
    // 1. Serialize request to JSON to pass to Python
    let input_json = serde_json::to_string(&payload).unwrap_or_default();

    let start_time = std::time::Instant::now();

    // 2. Call the Python script using the local venv
    // Assumes .venv is created in the repo root
    let output = Command::new(crate::config::QUANTUM_PYTHON_CMD)
        .arg(crate::config::QUANTUM_SCRIPT_PATH)
        .arg(&input_json)
        .output();

    let elapsed = start_time.elapsed().as_millis() as u64;

    match output {
        Ok(o) => {
            if o.status.success() {
                let stdout = String::from_utf8_lossy(&o.stdout);
                // Parse Python JSON output
                match serde_json::from_str::<QuantumResponse>(&stdout) {
                    Ok(mut response) => {
                        response.execution_time_ms = Some(elapsed);
                        Json(response)
                    },
                    Err(_) => {
                        // Fallback if parsing fails (e.g. print statements in script)
                        Json(QuantumResponse {
                            status: "error".to_string(),
                            message: Some(format!("Invalid JSON from Python: {}", stdout)),
                            optimal_parameters: None,
                            energy: None,
                            confidence: None,
                            backend_used: None,
                            execution_time_ms: Some(elapsed),
                        })
                    }
                }
            } else {
                let stderr = String::from_utf8_lossy(&o.stderr);
                Json(QuantumResponse {
                    status: "error".to_string(),
                    message: Some(format!("Python script failed: {}", stderr)),
                    optimal_parameters: None,
                    energy: None,
                    confidence: None,
                    backend_used: None,
                    execution_time_ms: Some(elapsed),
                })
            }
        },
        Err(e) => {
            Json(QuantumResponse {
                status: "error".to_string(),
                message: Some(format!("Failed to execute process: {}", e)),
                optimal_parameters: None,
                energy: None,
                confidence: None,
                backend_used: None,
                execution_time_ms: Some(elapsed),
            })
        }
    }
}
