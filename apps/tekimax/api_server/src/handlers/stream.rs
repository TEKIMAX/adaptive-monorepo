use axum::{
    response::{sse::{Event, Sse}, IntoResponse},
    Json,
};
use futures::stream::{Stream, StreamExt};
use serde_json::json;
use std::convert::Infallible;
use crate::utils::{get_inference_url, get_inference_key};
use ollama_proxy::ollama::{self, ChatRequest};

pub async fn chat_stream_handler(headers: axum::http::HeaderMap, Json(mut req): Json<ChatRequest>) -> impl IntoResponse {
    // Ensure parameters are passed correctly
    req.stream = Some(true);

    if req.model.is_empty() {
        req.model = crate::config::DEFAULT_CHAT_MODEL.to_string();
    }

    match crate::inference_router::route_chat(&headers, req).await {
        Ok(res) => match res {
            crate::inference_router::ResponseType::Standard(_) => (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Expected streaming response" }))).into_response(),
            crate::inference_router::ResponseType::Stream(byte_stream) => {
                let start_event = Event::default().data(json!({
                    "type": "text-start",
                    "id": "chat-id"
                }).to_string());

                let transformed_stream = byte_stream.flat_map(|item| {
                    match item {
                        Ok(bytes) => {
                            let chunk_str = String::from_utf8_lossy(&bytes);
                            if let Ok(value) = serde_json::from_str::<serde_json::Value>(&chunk_str) {
                                let mut events = Vec::new();

                                if value.get("done").and_then(|v| v.as_bool()).unwrap_or(false) {
                                    events.push(Event::default().data(json!({
                                        "type": "text-end",
                                        "id": "chat-id"
                                    }).to_string()));
                                } else {
                                    let content = value.pointer("/message/content")
                                        .and_then(|v| v.as_str())
                                        .or_else(|| value.get("response").and_then(|v| v.as_str()));
                                    if let Some(c) = content {
                                        events.push(Event::default().data(json!({
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
                        Err(e) => futures::stream::iter(vec![Event::default().event("error").data(e.to_string())])
                    }
                });

                let sse_stream = futures::stream::once(async { start_event })
                    .chain(transformed_stream)
                    .map(Ok::<_, std::convert::Infallible>);

                Sse::new(sse_stream)
                    .keep_alive(axum::response::sse::KeepAlive::default())
                    .into_response()
            }
        },
        Err(e) => (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e }))
        ).into_response()
    }
}
