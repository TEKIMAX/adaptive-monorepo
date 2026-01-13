use axum::{Json, response::IntoResponse};
use serde::{Deserialize, Serialize};
use serde_json::json;
use reqwest::Client;
use crate::config::{OLLAMA_SEARCH_URL, PROMPT_DEEP_RESEARCH, DEFAULT_CHAT_MODEL};
use crate::utils::{get_inference_url, get_inference_key};
use ollama_proxy::ollama;
use std::env;

#[derive(Deserialize, Debug)]
pub struct DeepResearchRequest {
    pub query: String,
    pub max_results: Option<u32>,
    pub model: Option<String>,
    pub response_schema: Option<serde_json::Value>, // User-defined JSON schema
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SearchResult {
    pub title: String,
    pub url: String,
    pub content: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SearchResponse {
    pub results: Vec<SearchResult>,
}

pub async fn deep_research_handler(headers: axum::http::HeaderMap, Json(req): Json<DeepResearchRequest>) -> impl IntoResponse {
    // 1. Prepare Authorization
    let api_key_env = env::var("OLLAMA_API_KEY").ok();
    
    // 2. Perform Web Search via Ollama API
    let client = Client::new();
    let mut request_builder = client.post(OLLAMA_SEARCH_URL)
        .json(&json!({
            "query": req.query,
            "max_results": req.max_results.unwrap_or(5)
        }));

    // Attach Auth Header if key exists
    if let Some(key) = api_key_env {
        request_builder = request_builder.header("Authorization", format!("Bearer {}", key));
    }

    let search_res = request_builder.send().await;

    // Handle search error
    let search_data: SearchResponse = match search_res {
        Ok(res) => {
             if !res.status().is_success() {
                 let status = res.status();
                 let text = res.text().await.unwrap_or_else(|_| "Unknown".to_string());
                 return Json(json!({ "error": format!("Search API error ({}): {}", status, text) })).into_response();
             }
             match res.json().await {
                 Ok(data) => data,
                 Err(e) => return Json(json!({ "error": format!("Failed to parse search results: {}", e) })).into_response()
             }
        },
        Err(e) => return Json(json!({ "error": format!("Search Request Failed: {}", e) })).into_response(),
    };
    
    // 3. Synthesize with LLM
    // Format Search Results into Context
    let context = search_data.results.iter().enumerate()
        .map(|(i, r)| format!("[{}] Title: {}\nURL: {}\nContent: {}\n", i+1, r.title, r.url, r.content))
        .collect::<Vec<String>>()
        .join("\n---\n");

    let mut base_prompt = PROMPT_DEEP_RESEARCH.to_string();
    
    // If structured output is requested, override the "Markdown" instruction
    if req.response_schema.is_some() {
        base_prompt = base_prompt.replace("Format your response in Markdown.", "Format your response as valid JSON matching the provided schema.");
    }

    let prompt = format!("{}\n\nQUERY: {}\n\nSEARCH RESULTS:\n{}", base_prompt, req.query, context);

    // Call Local LLM
    let target_url = get_inference_url();
    let llm_api_key = get_inference_key();

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

     let model_name = req.model.unwrap_or(DEFAULT_CHAT_MODEL.to_string());
    // Clone schema for LLM request so we can check it later
    let response_schema_clone = req.response_schema.clone();

    let llm_req = ollama::ChatRequest {
        model: model_name,
        messages,
        stream: Some(false),
        format: req.response_schema, // Pass user schema here (moved)
        ..Default::default()
    };
    
     match crate::inference_router::route_chat(&headers, llm_req).await {
        Ok(res) => match res {
            crate::inference_router::ResponseType::Standard(v) => {
                 // If a schema was provided, try to parse the content as JSON to ensure validity
                let synthesis_output = if response_schema_clone.is_some() {
                     let content = v.pointer("/message/content").and_then(|v| v.as_str()).unwrap_or("");
                     match serde_json::from_str::<serde_json::Value>(content) {
                         Ok(json_val) => json_val,
                         Err(_) => json!(content) 
                     }
                } else {
                    v.pointer("/message/content").cloned().unwrap_or(json!(""))
                };

                Json(json!({
                    "status": "success",
                    "query": req.query,
                    "sources": search_data.results,
                    "synthesis": synthesis_output
                })).into_response()
            },
            crate::inference_router::ResponseType::Stream(_) => {
                Json(json!({ "error": "Streaming not supported in deep_research_handler" })).into_response()
            }
        },
        Err(e) => Json(json!({ "error": format!("LLM Synthesis Failed: {}", e) })).into_response(),
    }
}

pub async fn stream_research_handler(headers: axum::http::HeaderMap, Json(req): Json<DeepResearchRequest>) -> impl IntoResponse {
    // 1. Prepare Authorization
    let api_key_env = env::var("OLLAMA_API_KEY").ok();
    
    // 2. Perform Web Search (Blocking/Sync part)
    let client = Client::new();
    let mut request_builder = client.post(OLLAMA_SEARCH_URL)
        .json(&json!({
            "query": req.query,
            "max_results": req.max_results.unwrap_or(5)
        }));

    if let Some(key) = api_key_env {
        request_builder = request_builder.header("Authorization", format!("Bearer {}", key));
    }

    let search_res = request_builder.send().await;

    let search_data: SearchResponse = match search_res {
        Ok(res) => {
             if !res.status().is_success() {
                 let status = res.status();
                 let text = res.text().await.unwrap_or_else(|_| "Unknown".to_string());
                 // Return error as a JSON error response (non-streaming since we failed early)
                 return Json(json!({ "error": format!("Search API error ({}): {}", status, text) })).into_response();
             }
             match res.json().await {
                 Ok(data) => data,
                 Err(e) => return Json(json!({ "error": format!("Failed to parse search results: {}", e) })).into_response()
             }
        },
        Err(e) => return Json(json!({ "error": format!("Search Request Failed: {}", e) })).into_response(),
    };
    
    // 3. Synthesize with LLM (Streaming part)
    let context = search_data.results.iter().enumerate()
        .map(|(i, r)| format!("[{}] Title: {}\nURL: {}\nContent: {}\n", i+1, r.title, r.url, r.content))
        .collect::<Vec<String>>()
        .join("\n---\n");

    let prompt = format!("{}\n\nQUERY: {}\n\nSEARCH RESULTS:\n{}", PROMPT_DEEP_RESEARCH, req.query, context);

    let target_url = get_inference_url();
    let llm_api_key = get_inference_key();

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

     let model_name = req.model.unwrap_or(DEFAULT_CHAT_MODEL.to_string());

    let llm_req = ollama::ChatRequest {
        model: model_name,
        messages,
        stream: Some(true),
        format: req.response_schema,
        ..Default::default()
    };
    
    match crate::inference_router::route_chat(&headers, llm_req).await {
        Ok(res) => match res {
            crate::inference_router::ResponseType::Standard(_) => {
                (axum::http::StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Expected streaming response" }))).into_response()
            },
            crate::inference_router::ResponseType::Stream(byte_stream) => {
                 use axum::response::sse::{Event, Sse};
                 use futures::stream::StreamExt;
    
                 let start_event = Event::default().data(json!({
                    "type": "text-start",
                    "id": "research-id",
                    "sources": search_data.results
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
                                        "id": "research-id"
                                    }).to_string()));
                                } else {
                                    let content = value.pointer("/message/content")
                                        .and_then(|v| v.as_str())
                                        .or_else(|| value.get("response").and_then(|v| v.as_str()));
                                    if let Some(c) = content {
                                        events.push(Event::default().data(json!({
                                            "type": "text-delta",
                                            "id": "research-id",
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
            Json(json!({ "error": format!("LLM Synthesis Failed: {}", e) }))
        ).into_response(),
    }
}
