use axum::{Json, response::IntoResponse};
use crate::utils::{get_inference_url, get_inference_key};
// Note: We need to import the C2PA signer if we want to keep signature in version.
// For simplicity in refactor, we keep logic here.
use crate::c2pa_signer;
use ollama_proxy::ollama;

// We need LlmResponse for the signature wrapper if we reuse it, or just manual logic.
// In main.rs, get_version_handler called ollama::get_version and then wrapped it.

pub async fn get_version_handler() -> impl IntoResponse {
    let target_url = get_inference_url();
    let api_key = get_inference_key();
    
    // Call upstream
    let version_val = match ollama::get_version(&target_url, api_key).await {
        Ok(v) => serde_json::to_value(v).unwrap(),
        Err(_) => serde_json::json!({ "version": "unknown" }),
    };

    // Sign it
    let signer = c2pa_signer::C2paSigner::new();
    let signature = match signer.sign_text(&version_val.to_string()).await {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Failed to sign version: {}", e);
            String::new()
        }
    };

    let mut headers = axum::http::HeaderMap::new();
    if !signature.is_empty() {
        headers.insert("X-C2PA-Manifest", signature.parse().unwrap());
    }

    // Return JSON with headers
    // Note: To include c2pa_manifest in body like main.rs did, we need to modify version_val
    let mut response_obj = version_val;
    if !signature.is_empty() {
         if let Some(obj) = response_obj.as_object_mut() {
             obj.insert("gateway_version".to_string(), serde_json::json!(crate::version::GATEWAY_VERSION));
             obj.insert("component_versions".to_string(), serde_json::json!({
                 "adaptive_engine": crate::version::ADAPTIVE_ENGINE_VERSION,
                 "sovereign_router": crate::version::SOVEREIGN_ROUTER_VERSION
             }));
         }
    }

    (headers, Json(response_obj))
}
