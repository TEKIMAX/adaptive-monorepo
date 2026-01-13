use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use futures::Stream;
use crate::ollama::{ChatRequest, ChatMessage}; // Re-using existing structs where compatible

pub async fn call_chat_stream(
    base_url: &str,
    api_key: &str,
    req: &ChatRequest,
) -> Result<impl Stream<Item = Result<bytes::Bytes, reqwest::Error>>, reqwest::Error> {
    let client = Client::new();
    let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));

    // TRANSFORM: Adapt internal ChatRequest to OpenAI format
    // Main difference: OpenAI expects "image_url" content parts, not top-level "images" list
    let mut messages: Vec<Value> = Vec::new();
    
    for msg in &req.messages {
        if let Some(images) = &msg.images {
            if !images.is_empty() {
                // Multimodal Message
                let mut content_parts = Vec::new();
                content_parts.push(json!({
                    "type": "text",
                    "text": msg.content
                }));
                
                for img in images {
                    content_parts.push(json!({
                        "type": "image_url",
                        "image_url": {
                            "url": format!("data:image/jpeg;base64,{}", img)
                        }
                    }));
                }
                
                messages.push(json!({
                    "role": msg.role,
                    "content": content_parts
                }));
                continue;
            }
        }
        
        // Standard Text Message
        messages.push(json!({
            "role": msg.role,
            "content": msg.content
        }));
    }
    
    // Inject system message if present
    if let Some(sys) = &req.system {
         messages.insert(0, json!({
             "role": "system",
             "content": sys
         }));
    }

    let payload = json!({
        "model": req.model,
        "messages": messages,
        "stream": true,
        // Map other fields if necessary
        "temperature": req.options.as_ref().and_then(|o| o.get("temperature")).unwrap_or(&json!(0.7)),
    });

    let res = client.post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
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
    let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));

    let mut messages: Vec<Value> = Vec::new();
    
    for msg in &req.messages {
        if let Some(images) = &msg.images {
            if !images.is_empty() {
                let mut content_parts = Vec::new();
                content_parts.push(json!({
                    "type": "text",
                    "text": msg.content
                }));
                
                for img in images {
                    content_parts.push(json!({
                        "type": "image_url",
                        "image_url": {
                            "url": format!("data:image/jpeg;base64,{}", img)
                        }
                    }));
                }
                
                messages.push(json!({
                    "role": msg.role,
                    "content": content_parts
                }));
                continue;
            }
        }
        
        // Standard Text Message
        messages.push(json!({
            "role": msg.role,
            "content": msg.content
        }));
    }
    
    // Inject system message if present
    if let Some(sys) = &req.system {
         messages.insert(0, json!({
             "role": "system",
             "content": sys
         }));
    }

    let payload = json!({
        "model": req.model,
        "messages": messages,
        "stream": false,
        "temperature": req.options.as_ref().and_then(|o| o.get("temperature")).unwrap_or(&json!(0.7)),
    });

    let res = client.post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await?;

    res.error_for_status_ref()?;
    res.json::<T>().await
}
