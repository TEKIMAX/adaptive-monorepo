use reqwest::Client;
use serde::Deserialize;
use serde_json::{json, Value};
use futures::Stream;
use crate::ollama::ChatRequest;

pub async fn call_chat_stream(
    base_url: &str, // e.g. https://generativelanguage.googleapis.com/v1beta
    api_key: &str,
    req: &ChatRequest,
) -> Result<impl Stream<Item = Result<bytes::Bytes, reqwest::Error>>, reqwest::Error> {
    let client = Client::new();
    let model = &req.model;
    let url = format!("{}/models/{}:streamGenerateContent?key={}", base_url.trim_end_matches('/'), model, api_key);

    // TRANSFORM: ChatRequest (OpenAI) -> Google GenerateContentRequest
    let mut contents = Vec::new();
    
    // Google System Instructions are separate, but for simple chat we often prepend or use strict system maps if supported.
    // v1beta supports "system_instruction" field now.
    let system_instruction = if let Some(sys) = &req.system {
        Some(json!({
            "parts": [{ "text": sys }]
        }))
    } else {
        None
    };

    for msg in &req.messages {
        let role = match msg.role.as_str() {
            "user" => "user",
            "assistant" => "model",
            "system" => "user", // Fallback if regular msg, though system should be extracted
            _ => "user",
        };

        // Handle text
        let mut parts = Vec::new();
        parts.push(json!({ "text": msg.content }));

        // Handle images (inline data)
        if let Some(images) = &msg.images {
            for img in images {
                parts.push(json!({
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": img
                    }
                }));
            }
        }

        contents.push(json!({
            "role": role,
            "parts": parts
        }));
    }

    let mut payload = json!({
        "contents": contents,
        "generationConfig": {
            "temperature": req.options.as_ref().and_then(|o| o.get("temperature")).unwrap_or(&json!(0.7))
        }
    });

    if let Some(sys) = system_instruction {
        payload.as_object_mut().unwrap().insert("system_instruction".to_string(), sys);
    }

    let res = client.post(&url)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await?;

    res.error_for_status_ref()?;
    Ok(res.bytes_stream())
}

pub async fn call_chat<T: for<'de> Deserialize<'de>>(
    base_url: &str,
    api_key: &str,
    req: &ChatRequest,
) -> Result<T, reqwest::Error> {
    let client = Client::new();
    let model = &req.model;
    // Google API: use generateContent for blocking
    let url = format!("{}/models/{}:generateContent?key={}", base_url.trim_end_matches('/'), model, api_key);

    let mut contents = Vec::new();
    
    let system_instruction = if let Some(sys) = &req.system {
        Some(json!({
            "parts": [{ "text": sys }]
        }))
    } else {
        None
    };

    for msg in &req.messages {
        let role = match msg.role.as_str() {
            "user" => "user",
            "assistant" => "model",
            "system" => "user", 
            _ => "user",
        };

        let mut parts = Vec::new();
        parts.push(json!({ "text": msg.content }));

        if let Some(images) = &msg.images {
            for img in images {
                parts.push(json!({
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": img
                    }
                }));
            }
        }

        contents.push(json!({
            "role": role,
            "parts": parts
        }));
    }

    let mut payload = json!({
        "contents": contents,
        "generationConfig": {
            "temperature": req.options.as_ref().and_then(|o| o.get("temperature")).unwrap_or(&json!(0.7))
        }
    });

    if let Some(sys) = system_instruction {
        payload.as_object_mut().unwrap().insert("system_instruction".to_string(), sys);
    }

    let res = client.post(&url)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await?;

    res.error_for_status_ref()?;
    res.json::<T>().await
}
