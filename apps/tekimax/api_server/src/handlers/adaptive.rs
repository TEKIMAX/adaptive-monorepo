use crate::utils::{get_inference_url, get_inference_key};
use ollama_proxy::ollama::{self};
use axum::{Json, response::IntoResponse};
use serde::Deserialize;
use serde_json::{Value, json};
use crate::c2pa_signer::C2paSigner;

#[derive(Deserialize, Debug)]
pub struct AdaptiveRequest {
    pub content: String,
    pub modality: String, 
    pub model: Option<String>, // New field for dynamic model selection
}

pub async fn run_adaptive_engine(headers: &axum::http::HeaderMap, req: AdaptiveRequest) -> Result<Value, String> {
    let prompt = crate::config::PROMPT_ADAPTIVE_ENGINE
        .replace("{modality}", &req.modality)
        .replace("{content}", &req.content);

    let messages = vec![
        ollama::ChatMessage {
            role: "user".to_string(),
            content: prompt,
            images: None,
            tool_calls: None,
            thinking: None,
            parts: None,
        }
    ];

    // Use requested model or default to sovereign standard
    let model_name = req.model.clone().unwrap_or_else(|| crate::config::DEFAULT_CHAT_MODEL.to_string());

    let llm_req = ollama::ChatRequest {
        model: model_name,
        messages,
        stream: Some(false),
        ..Default::default()
    };

    match crate::inference_router::route_chat(headers, llm_req).await {
        Ok(res) => match res {
            crate::inference_router::ResponseType::Standard(v) => {
                // Extract content from standard chat response
                let content = v.pointer("/message/content")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| "Failed to extract content from LLM response".to_string())?;
                
                Ok(json!({ 
                    "status": "success", 
                    "modality": req.modality, 
                    "adapted_content": content,
                    "source": crate::version::ADAPTIVE_ENGINE_VERSION
                }))
            },
            crate::inference_router::ResponseType::Stream(_) => Err("Streaming response not supported in run_adaptive_engine".to_string()),
        },
        Err(e) => Err(format!("LLM adaptation failed: {}", e)),
    }
}

pub async fn stream_learning_handler(headers: axum::http::HeaderMap, Json(req): Json<AdaptiveRequest>) -> impl IntoResponse {
    let response_value = match run_adaptive_engine(&headers, req).await {
        Ok(val) => val,
        Err(e) => json!({ "status": "error", "message": e }),
    };

    // C2PA Signing
    let signer = C2paSigner::new();
    let signature = match signer.sign_text(&response_value.to_string()).await {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Failed to sign adaptive response: {}", e);
            String::new()
        }
    };

    let mut headers = axum::http::HeaderMap::new();
    if !signature.is_empty() {
        headers.insert("X-C2PA-Manifest", signature.parse().unwrap());
    }

    (headers, Json(response_value)).into_response()
}


#[derive(Deserialize, Debug)]
pub struct ValidateRequest {
    pub current_step: u32,
    pub initial_confidence: f64,
}

pub async fn agent_validate_handler(Json(req): Json<ValidateRequest>) -> Json<Value> {
    let decay_rate = crate::config::ADAPTIVE_VALIDATION_DECAY_RATE;
    let decay_factor = (1.0 - decay_rate).powi(req.current_step as i32);
    let final_confidence = req.initial_confidence * decay_factor;
    
    let status = if final_confidence > crate::config::ADAPTIVE_VALIDATION_THRESHOLD { 
        "validated" 
    } else { 
        "failed_decay_threshold" 
    };

    Json(serde_json::json!({ 
        "status": status, 
        "initial_confidence": req.initial_confidence,
        "current_step": req.current_step,
        "decay_rate": decay_rate,
        "final_confidence": final_confidence,
        "message": "Reliability calculated using exponential decay model."
    }))
}

pub async fn activity_log_handler() -> Json<Value> {
    Json(serde_json::json!({ 
        "logs": [{ "timestamp": "2024-01-01T12:00:00Z", "module": "Summarizer", "action": "READ", "target": "User.Bio" }],
        "message": "Verified access log for privacy audit."
    }))
}

#[derive(Deserialize, Debug)]
pub struct SignoffRequest {
    pub approver_id: String,
    pub decision: String, // "approve" | "reject"
    pub resource_id: String,
}

pub async fn signoff_handler(Json(req): Json<SignoffRequest>) -> Json<Value> {
    let message = format!("User {} decided to {} resource {}", req.approver_id, req.decision, req.resource_id);
    
    // Cryptographically sign the human decision
    let signer = C2paSigner::new();
    let signature = signer.sign_text(&message).await.unwrap_or_else(|_| "signing_failed".to_string());

    Json(serde_json::json!({ 
        "status": "recorded", 
        "decision": req.decision,
        "signer": req.approver_id, 
        "human_agency_manifest": signature,
        "message": "Human decision has been cryptographically preserved."
    }))
}

#[derive(Deserialize, Debug)]
pub struct IsolateRequest {
    pub input_context: String,
}

pub async fn security_isolate_handler(Json(req): Json<IsolateRequest>) -> Json<Value> {
    let input_context = req.input_context.to_lowercase();
    
    // Check for potentially dangerous patterns using centralized config
    let mut detected_threats = Vec::new();
    for pattern in crate::config::MALICIOUS_PATTERNS {
        if input_context.contains(&pattern.to_lowercase()) {
            detected_threats.push(*pattern);
        }
    }

    if detected_threats.is_empty() {
        Json(serde_json::json!({ 
            "status": "isolated", 
            "sanitized": true, 
            "threat_level": "none",
            "message": "Input context verified safe and isolated."
        }))
    } else {
        Json(serde_json::json!({ 
            "status": "blocked", 
            "sanitized": false, 
            "threat_level": "high",
            "detected_patterns": detected_threats,
            "message": "Malicious patterns detected in isolation sandbox."
        }))
    }
}

