use ollama_proxy::ollama::{self, ChatRequest, GenerateRequest, EmbeddingsRequest};
use futures::StreamExt;
use axum::http::HeaderMap;
use serde_json::{Value, json};
use crate::utils::{get_inference_url, get_inference_key};

pub enum ResponseType {
    Standard(Value),
    Stream(std::pin::Pin<Box<dyn futures::Stream<Item = Result<bytes::Bytes, reqwest::Error>> + Send>>),
}

pub async fn route_chat(headers: &HeaderMap, mut req: ChatRequest) -> Result<ResponseType, String> {
    if req.model.is_empty() {
        req.model = crate::config::DEFAULT_CHAT_MODEL.to_string();
    }

    // Default to Ollama Logic (which handles Cloud via keys/URL)
    route_ollama_logic(headers, req).await
}

async fn route_ollama_logic(headers: &HeaderMap, req: ChatRequest) -> Result<ResponseType, String> {
    let mut target_url = get_inference_url();
    let mut api_key = get_inference_key();

    // Specific Cloud override via header or model suffix
    if req.model.ends_with("-cloud") || headers.get("x-ollama-key").is_some() {
        target_url = "https://ollama.com".to_string();
        api_key = headers.get("x-ollama-key")
            .and_then(|h| h.to_str().ok())
            .map(|s| s.to_string())
            .or(api_key);
    }

    let is_stream = req.stream.unwrap_or(false);

    if is_stream {
        let s = ollama::call_chat_stream(&target_url, &req, api_key).await
            .map_err(|e| e.to_string())?;
        Ok(ResponseType::Stream(Box::pin(s)))
    } else {
        let v = ollama::call_chat(&target_url, &req, api_key).await
            .map_err(|e| e.to_string())?;
        Ok(ResponseType::Standard(serde_json::to_value(v).unwrap()))
    }
}

pub async fn route_generate(req: GenerateRequest) -> Result<Value, String> {
    let target_url = get_inference_url();
    let api_key = get_inference_key();

    let target_url = if req.model == crate::config::DEFAULT_PII_CHECK_MODEL {
        crate::config::PII_CHECK_URL.to_string()
    } else {
        target_url
    };

    ollama::call_generate(&target_url, &req, api_key).await
        .map(|res| serde_json::to_value(res).unwrap())
        .map_err(|e| e.to_string())
}

pub async fn route_embeddings(req: EmbeddingsRequest) -> Result<Value, String> {
    let target_url = get_inference_url();
    let api_key = get_inference_key();

    ollama::call_embeddings(&target_url, &req, api_key).await
        .map(|res| serde_json::to_value(res).unwrap())
        .map_err(|e| e.to_string())
}
