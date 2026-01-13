use axum::{Json, response::IntoResponse};
use futures::StreamExt;
use serde::{Serialize, Deserialize};
use serde_json::{Value, json};
use crate::utils::{get_inference_url, get_inference_key};
use crate::c2pa_signer;
use ollama_proxy::ollama;

#[derive(Serialize)]
pub struct LlmResponse {
    response: Value,
}

// Discriminator struct from main.rs
#[derive(Deserialize, Debug)]
#[serde(untagged)]
pub enum LlmRequest {
    Generate(ollama::GenerateRequest),
    Chat(ollama::ChatRequest),
    Embeddings(ollama::EmbeddingsRequest),
}

pub async fn call_llm(headers: axum::http::HeaderMap, Json(payload): Json<LlmRequest>) -> impl IntoResponse {
    match payload {
        LlmRequest::Chat(req) => {
            match crate::inference_router::route_chat(&headers, req).await {
                Ok(res) => match res {
                    crate::inference_router::ResponseType::Standard(v) => Json(LlmResponse { response: v }).into_response(),
                    crate::inference_router::ResponseType::Stream(s) => {
                         // Convert the byte stream into SSE events using the same logic as stream.rs
                         // But for now, let's keep it simple or redirect to the stream handler if possible.
                         // Actually, we can reuse the logic here.
                         let start_event = axum::response::sse::Event::default().data(json!({
                            "type": "text-start",
                            "id": "chat-id"
                        }).to_string());

                        let transformed_stream = s.flat_map(|item: Result<bytes::Bytes, reqwest::Error>| {
                            match item {
                                Ok(bytes) => {
                                    let chunk_str = String::from_utf8_lossy(&bytes);
                                    if let Ok(value) = serde_json::from_str::<serde_json::Value>(&chunk_str) {
                                        let mut events = Vec::new();
                                        if value.get("done").and_then(|v| v.as_bool()).unwrap_or(false) {
                                            events.push(axum::response::sse::Event::default().data(json!({
                                                "type": "text-end",
                                                "id": "chat-id"
                                            }).to_string()));
                                        } else {
                                            let content = value.pointer("/message/content")
                                                .and_then(|v| v.as_str())
                                                .or_else(|| value.get("response").and_then(|v| v.as_str()));
                                            if let Some(c) = content {
                                                events.push(axum::response::sse::Event::default().data(json!({
                                                    "type": "text-delta",
                                                    "id": "chat-id",
                                                    "delta": c
                                                }).to_string()));
                                            }
                                        }
                                        return futures::stream::iter(events);
                                    }
                                    futures::stream::iter(vec![])
                                },
                                Err(e) => futures::stream::iter(vec![axum::response::sse::Event::default().event("error").data(e.to_string())])
                            }
                        });

                        let sse_stream = futures::stream::once(async { start_event })
                            .chain(transformed_stream)
                            .map(Ok::<_, std::convert::Infallible>);

                        axum::response::Sse::new(sse_stream)
                            .keep_alive(axum::response::sse::KeepAlive::default())
                            .into_response()
                    }
                },
                Err(e) => (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e }))).into_response(),
            }
        },
        LlmRequest::Generate(req) => {
            match crate::inference_router::route_generate(req).await {
                Ok(v) => Json(LlmResponse { response: v }).into_response(),
                Err(e) => (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e }))).into_response(),
            }
        },
        LlmRequest::Embeddings(req) => {
            match crate::inference_router::route_embeddings(req).await {
                Ok(v) => Json(LlmResponse { response: v }).into_response(),
                Err(e) => (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e }))).into_response(),
            }
        },
    }
}

