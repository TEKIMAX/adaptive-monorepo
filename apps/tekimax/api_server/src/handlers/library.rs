use axum::{Json, response::IntoResponse};
use serde_json::Value;
use crate::utils::{get_inference_url, get_inference_key};
use ollama_proxy::ollama;

pub async fn list_models_handler(headers: axum::http::HeaderMap) -> Json<Value> {
    let mut target_url = get_inference_url();
    let mut api_key = get_inference_key();

    if headers.get("x-ollama-key").is_some() {
        target_url = "https://ollama.com".to_string();
        api_key = headers.get("x-ollama-key").and_then(|h| h.to_str().ok()).map(|s| s.to_string()).or(api_key);
    }

    let models = ollama::list_models(&target_url, api_key).await.unwrap_or_default();
    Json(serde_json::to_value(models).unwrap())
}

pub async fn list_running_handler() -> Json<Value> {
    let target_url = get_inference_url();
    let api_key = get_inference_key();
    let models = ollama::list_running_models(&target_url, api_key).await.unwrap_or_default();
    Json(serde_json::to_value(models).unwrap())
}

pub async fn show_model_handler(Json(payload): Json<ollama::ShowRequest>) -> Json<Value> {
    let target_url = get_inference_url();
    let api_key = get_inference_key();
    let info = ollama::show_model_info(&target_url, &payload, api_key).await.unwrap_or_default();
    Json(serde_json::to_value(info).unwrap())
}

pub async fn create_model_handler(Json(payload): Json<ollama::CreateRequest>) -> impl IntoResponse {
    let target_url = get_inference_url();
    let api_key = get_inference_key();
    match ollama::create_model(&target_url, &payload, api_key).await {
         Ok(_) => Json(serde_json::json!({"status": "created"})), 
         Err(e) => Json(serde_json::json!({"error": e.to_string()}))
    }
}

pub async fn copy_model_handler(Json(payload): Json<ollama::CopyRequest>) -> Json<Value> {
    let target_url = get_inference_url();
    let api_key = get_inference_key();
    match ollama::copy_model(&target_url, &payload, api_key).await {
        Ok(_) => Json(serde_json::json!({"status": "copied"})),
        Err(e) => Json(serde_json::json!({"error": e.to_string()})),
    }
}

pub async fn delete_model_handler(Json(payload): Json<ollama::DeleteRequest>) -> Json<Value> {
    let target_url = get_inference_url();
    let api_key = get_inference_key();
    match ollama::delete_model(&target_url, &payload, api_key).await {
        Ok(_) => Json(serde_json::json!({"status": "deleted"})),
        Err(e) => Json(serde_json::json!({"error": e.to_string()})),
    }
}

pub async fn pull_model_handler(Json(payload): Json<ollama::PullRequest>) -> Json<Value> {
    let target_url = get_inference_url();
    let api_key = get_inference_key();
    match ollama::pull_model(&target_url, &payload, api_key).await {
        Ok(_) => Json(serde_json::json!({"status": "pulling"})),
        Err(e) => Json(serde_json::json!({"error": e.to_string()})),
    }
}

pub async fn push_model_handler(Json(payload): Json<ollama::PushRequest>) -> Json<Value> {
    let target_url = get_inference_url();
    let api_key = get_inference_key();
    match ollama::push_model(&target_url, &payload, api_key).await {
        Ok(_) => Json(serde_json::json!({"status": "pushing"})),
        Err(e) => Json(serde_json::json!({"error": e.to_string()})),
    }
}

pub async fn tokenize_handler(headers: axum::http::HeaderMap, Json(payload): Json<ollama::TokenizeRequest>) -> Json<Value> {
    let mut target_url = get_inference_url();
    let mut api_key = get_inference_key();

    if payload.model.ends_with("-cloud") || headers.get("x-ollama-key").is_some() || payload.model.starts_with("gemini") {
        target_url = "https://ollama.com".to_string();
        api_key = headers.get("x-ollama-key").and_then(|h| h.to_str().ok()).map(|s| s.to_string()).or(api_key);
    }

    match ollama::tokenize(&target_url, &payload, api_key).await {
        Ok(data) => Json(serde_json::to_value(data).unwrap()),
        Err(e) => Json(serde_json::json!({ "error": format!("Upstream error: {}", e) })),
    }
}

pub async fn detokenize_handler(headers: axum::http::HeaderMap, Json(payload): Json<ollama::DetokenizeRequest>) -> Json<Value> {
    let mut target_url = get_inference_url();
    let mut api_key = get_inference_key();

    if payload.model.ends_with("-cloud") || headers.get("x-ollama-key").is_some() || payload.model.starts_with("gemini") {
        target_url = "https://ollama.com".to_string();
        api_key = headers.get("x-ollama-key").and_then(|h| h.to_str().ok()).map(|s| s.to_string()).or(api_key);
    }

    match ollama::detokenize(&target_url, &payload, api_key).await {
        Ok(data) => Json(serde_json::to_value(data).unwrap()),
        Err(e) => Json(serde_json::json!({ "error": format!("Upstream error: {}", e) })),
    }
}

pub async fn check_blob_handler(axum::extract::Path(digest): axum::extract::Path<String>) -> impl IntoResponse {
    let target_url = get_inference_url();
    let api_key = get_inference_key();
    match ollama::check_blob(&target_url, &digest, api_key).await {
        Ok(true) => axum::http::StatusCode::OK,
        Ok(false) => axum::http::StatusCode::NOT_FOUND,
        Err(_) => axum::http::StatusCode::INTERNAL_SERVER_ERROR,
    }
}

pub async fn create_blob_handler(axum::extract::Path(digest): axum::extract::Path<String>, body: axum::body::Bytes) -> impl IntoResponse {
    let target_url = get_inference_url();
    let api_key = get_inference_key();
    match ollama::create_blob(&target_url, &digest, body, api_key).await {
        Ok(_) => axum::http::StatusCode::CREATED,
        Err(_) => axum::http::StatusCode::INTERNAL_SERVER_ERROR,
    }
}

pub async fn openai_models_handler() -> Json<Value> {
     let target_url = get_inference_url();
     let api_key = get_inference_key();
     let models = ollama::list_openai_models(&target_url, api_key).await.unwrap_or_default();
     Json(serde_json::to_value(models).unwrap())
}
