use axum::{Json, response::IntoResponse};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use crate::utils::{get_inference_url, get_inference_key};
use ollama_proxy::ollama::{self, ChatMessage, ChatRequest};

#[derive(Deserialize, Debug)]
pub struct RouterRequest {
    pub intent: String,
    pub project_id: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RouterResponse {
    pub tool: String,
    pub confidence: f64,
    pub reasoning: String,
}

// Structs for Triton V2 Protocol (JSON)
#[derive(Serialize)]
struct TritonRequest {
    inputs: Vec<TritonInput>,
}

#[derive(Serialize)]
struct TritonInput {
    name: String,
    shape: Vec<i64>,
    datatype: String,
    data: Vec<String>,
}

#[derive(Deserialize, Debug)]
struct TritonResponse {
    outputs: Vec<TritonOutput>,
}

#[derive(Deserialize, Debug)]
struct TritonOutput {
    name: String,
    data: Vec<Value>, // Can be mixed types depending on config, but usually strings/floats
}

pub async fn classify_intent_handler(Json(req): Json<RouterRequest>) -> impl IntoResponse {
    let triton_url = "http://localhost:8000/v2/models/router/infer";

    // 1. Prepare Input Tensor (Intent)
    let triton_payload = TritonRequest {
        inputs: vec![
            TritonInput {
                name: "intent".to_string(),
                shape: vec![1, 1], // [Batch, Dims]
                datatype: "BYTES".to_string(),
                data: vec![req.intent.clone()],
            }
        ],
    };

    let client = reqwest::Client::new();
    let res = match client.post(triton_url)
        .json(&triton_payload)
        .send()
        .await {
            Ok(r) => r,
            Err(e) => return (axum::http::HeaderMap::new(), Json(json!({"error": format!("Triton Connect Error: {}", e)}))).into_response(),
        };

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return (axum::http::HeaderMap::new(), Json(json!({"error": format!("Triton Error: {}", err_text)}))).into_response();
    }

    let triton_resp: TritonResponse = match res.json().await {
        Ok(j) => j,
        Err(e) => return (axum::http::HeaderMap::new(), Json(json!({"error": format!("Triton Parse Error: {}", e)}))).into_response(),
    };
    
    // 2. Parse Outputs
    let mut tool = "unknown".to_string();
    let mut confidence = 0.0;
    let mut reasoning = "No reasoning".to_string();

    for output in triton_resp.outputs {
        if let Some(val) = output.data.first() {
            match output.name.as_str() {
                "tool" => tool = val.as_str().unwrap_or("unknown").to_string(),
                "confidence" => confidence = val.as_f64().unwrap_or(0.0),
                "reasoning" => reasoning = val.as_str().unwrap_or("none").to_string(),
                _ => {}
            }
        }
    }

    let response_value = json!({
        "tool": tool,
        "confidence": confidence,
        "reasoning": reasoning,
        "backend": "nvidia-triton"
    });

    // C2PA Signing
    let signer = crate::c2pa_signer::C2paSigner::new();
    let signature = match signer.sign_text(&response_value.to_string()).await {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Failed to sign router response: {}", e);
            String::new()
        }
    };

    let mut headers = axum::http::HeaderMap::new();
    if !signature.is_empty() {
        headers.insert("X-C2PA-Manifest", signature.parse().unwrap());
    }

    (headers, Json(response_value)).into_response()
}

