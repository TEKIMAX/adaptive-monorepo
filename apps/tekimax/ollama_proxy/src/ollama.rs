// Ollama API client
use serde::{Deserialize, Serialize};
use serde_json::Value;

// --- Shared Structs ---

#[derive(Serialize, Clone, Deserialize, Debug)]
pub struct ChatMessage {
    pub role: String,
    #[serde(default)]
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub images: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<ToolCall>>,
    // "Thinking" field for reasoning models
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thinking: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parts: Option<Vec<Value>>,
}

#[derive(Serialize, Clone, Deserialize, Debug)]
pub struct ToolCall {
    pub function: ToolCallFunction,
}

#[derive(Serialize, Clone, Deserialize, Debug)]
pub struct ToolCallFunction {
    pub name: String,
    pub arguments: Value,
}

#[derive(Serialize, Clone, Deserialize, Debug)]
pub struct Tool {
    #[serde(rename = "type")]
    pub type_: String,
    pub function: ToolFunctionDefinition,
}

#[derive(Serialize, Clone, Deserialize, Debug)]
pub struct ToolFunctionDefinition {
    pub name: String,
    pub description: String,
    pub parameters: Value, // JSON schema
}

// --- Generate Endpoint ---

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct GenerateRequest {
    pub model: String,
    pub prompt: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub suffix: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub images: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<Value>, // "json" or schema
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub template: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keep_alive: Option<String>,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct GenerateResponse {
    pub model: String,
    pub created_at: String,
    pub response: String,
    pub done: bool,
    pub context: Option<Vec<i64>>,
    pub total_duration: Option<u64>,
    pub load_duration: Option<u64>,
    pub prompt_eval_count: Option<u64>,
    pub prompt_eval_duration: Option<u64>,
    pub eval_count: Option<u64>,
    pub eval_duration: Option<u64>,
}

// --- Chat Endpoint ---

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct ChatRequest {
    #[serde(default)]
    pub model: String,
    pub messages: Vec<ChatMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<Vec<Tool>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keep_alive: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub think: Option<Value>, // bool or "low"|"medium"|"high"
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(skip_serializing)] 
    pub system: Option<String>, // Top-level system message
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ChatResponse {
    pub model: String,
    pub created_at: String,
    pub message: ChatMessage,
    pub done: bool,
    pub total_duration: Option<u64>,
    pub load_duration: Option<u64>,
    pub prompt_eval_count: Option<u64>,
    pub prompt_eval_duration: Option<u64>,
    pub eval_count: Option<u64>,
    pub eval_duration: Option<u64>,
}

// --- Embeddings Endpoint ---

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct EmbeddingsRequest {
    pub model: String,
    pub input: Value, // String or Vec<String>
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keep_alive: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<Value>,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct EmbeddingsResponse {
    pub model: String,
    pub embeddings: Vec<Vec<f64>>,
    pub total_duration: Option<u64>,
    pub load_duration: Option<u64>,
    pub prompt_eval_count: Option<u64>,
}

// --- List Models Endpoint ---

#[derive(Deserialize, Serialize, Debug, Default)]
pub struct ListResponse {
    pub models: Vec<ModelSummary>,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct ModelSummary {
    pub name: String,
    pub modified_at: String,
    pub size: u64,
    pub digest: String,
    pub details: ModelDetails,
}

#[derive(Deserialize, Serialize, Debug, Default, Clone)]
pub struct ModelDetails {
    pub format: String,
    pub family: String,
    pub families: Option<Vec<String>>,
    pub parameter_size: String,
    pub quantization_level: String,
}

// --- Client Functions ---

fn build_url(base_url: &str, endpoint: &str) -> String {
    let base = base_url.trim_end_matches('/');
    
    // Fix for OpenAI compatible endpoints which are at root /v1, not /api/v1
    if endpoint.starts_with("/v1") && base.ends_with("/api") {
        let root_base = &base[..base.len() - 4]; // Remove trailing "/api"
        return format!("{}{}", root_base, endpoint);
    }

    if base.ends_with("/api") && endpoint.starts_with("/api") {
        format!("{}{}", base, &endpoint[4..])
    } else {
        format!("{}{}", base, endpoint)
    }
}


pub async fn call_generate(api_url: &str, request: &GenerateRequest, api_key: Option<String>) -> Result<GenerateResponse, Box<dyn std::error::Error + Send + Sync>> {
    println!("Calling Inference Engine Generate API at {} with model {}", api_url, request.model);
    let client = reqwest::Client::new();
    // Default stream to false if not set, for now, to return single response
    // If stream is true, this function signature needs to change to return a Stream.
    // For this step, we assume partial compatibility or stream=false.
    
    let url = build_url(api_url, "/api/generate");
    let mut builder = client.post(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let res = builder
        .json(request)
        .send()
        .await?;

    if !res.status().is_success() {
        let status = res.status();
        let error_text = res.text().await.unwrap_or_default();
        return Err(format!("Inference Engine Error {}: {}", status, error_text).into());
    }

    let val = res.json::<GenerateResponse>().await?;
    Ok(val)
}


pub async fn call_chat(api_url: &str, request: &ChatRequest, api_key: Option<String>) -> Result<ChatResponse, Box<dyn std::error::Error + Send + Sync>> {
    println!("Calling Inference Engine Chat API at {} with model {}", api_url, request.model);
    let client = reqwest::Client::new();
    
    let url = build_url(api_url, "/api/chat");
    let mut builder = client.post(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    
    // Debug Logging
    let body_json = serde_json::to_string(&request).unwrap_or_default();
    println!("DEBUG: Sending Chat Request to {}: {}", url, body_json);

    let res = builder
        .header("Content-Type", "application/json")
        .body(body_json)
        .send()
        .await?;

    if !res.status().is_success() {
        let status = res.status();
        let error_text = res.text().await.unwrap_or_default();
        return Err(format!("Inference Engine Error {}: {}", status, error_text).into());
    }
        
    let val = res.json::<ChatResponse>().await?;
    Ok(val)
}

pub async fn call_chat_stream(api_url: &str, request: &ChatRequest, api_key: Option<String>) -> Result<impl futures::Stream<Item = Result<bytes::Bytes, reqwest::Error>>, Box<dyn std::error::Error + Send + Sync>> {
    println!("Calling Inference Engine Chat API (Stream) at {} with model {}", api_url, request.model);
    let client = reqwest::Client::new();
    
    let url = build_url(api_url, "/api/chat");
    let mut builder = client.post(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }

    // Force stream=true for this call
    let mut req_val = serde_json::to_value(request)?;
    if let Some(obj) = req_val.as_object_mut() {
        obj.insert("stream".to_string(), serde_json::Value::Bool(true));
        
        // Handle System Parameter injection
        if let Some(sys_msg) = &request.system {
             if let Some(messages) = obj.get_mut("messages").and_then(|v| v.as_array_mut()) {
                 let system_json = serde_json::json!({
                     "role": "system",
                     "content": sys_msg,
                     "parts": null
                 });
                 messages.insert(0, system_json);
             }
        }
    }

    let res = builder
        .json(&req_val)
        .send()
        .await?;

    if !res.status().is_success() {
        let status = res.status();
        let error_text = res.text().await.unwrap_or_default();
        return Err(format!("Inference Engine Error {}: {}", status, error_text).into());
    }

    Ok(res.bytes_stream())
}

pub async fn call_embeddings(api_url: &str, request: &EmbeddingsRequest, api_key: Option<String>) -> Result<EmbeddingsResponse, Box<dyn std::error::Error + Send + Sync>> {
    println!("Calling Inference Engine Embeddings API at {} with model {}", api_url, request.model);
    let client = reqwest::Client::new();
    
    let url = build_url(api_url, "/api/embed");
    let mut builder = client.post(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let res = builder
        .json(request)
        .send()
        .await?;

    if !res.status().is_success() {
        let status = res.status();
        let error_text = res.text().await.unwrap_or_default();
        return Err(format!("Inference Engine Error {}: {}", status, error_text).into());
    }

    let val = res.json::<EmbeddingsResponse>().await?;
    Ok(val)
}

pub async fn list_models(api_url: &str, api_key: Option<String>) -> Result<ListResponse, reqwest::Error> {
    println!("Calling Inference Engine List Models API at {}", api_url);
    let client = reqwest::Client::new();
    let url = build_url(api_url, "/api/tags");
    let mut builder = client.get(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let res = builder
        .send()
        .await?
        .json::<ListResponse>()
        .await?;

    Ok(res)
}

// --- Ps Endpoint ---

#[derive(Deserialize, Serialize, Debug, Default)]
pub struct PsResponse {
    pub models: Vec<PsModel>,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct PsModel {
    pub model: String,
    pub size: u64,
    pub digest: String,
    pub details: ModelDetails,
    pub expires_at: String,
    pub size_vram: Option<u64>,
    pub context_length: Option<u64>,
}

// --- Show Endpoint ---

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct ShowRequest {
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub verbose: Option<bool>,
}

#[derive(Deserialize, Serialize, Debug, Default)]
pub struct ShowResponse {
    pub parameters: Option<String>,
    pub license: Option<String>,
    pub modified_at: String,
    pub details: ModelDetails,
    pub template: Option<String>,
    pub capabilities: Option<Vec<String>>,
    pub model_info: Option<std::collections::HashMap<String, serde_json::Value>>,
}

pub async fn list_running_models(api_url: &str, api_key: Option<String>) -> Result<PsResponse, reqwest::Error> {
    println!("Calling Inference Engine Ps API at {}", api_url);
    let client = reqwest::Client::new();
    let url = build_url(api_url, "/api/ps");
    let mut builder = client.get(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let res = builder
        .send()
        .await?
        .json::<PsResponse>()
        .await?;

    Ok(res)
}

pub async fn show_model_info(api_url: &str, request: &ShowRequest, api_key: Option<String>) -> Result<ShowResponse, reqwest::Error> {
    println!("Calling Inference Engine Show API at {} with model {}", api_url, request.model);
    let client = reqwest::Client::new();
    let url = build_url(api_url, "/api/show");
    let mut builder = client.post(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let res = builder
        .json(request)
        .send()
        .await?
        .json::<ShowResponse>()
        .await?;

    Ok(res)
}

// --- Version Endpoint ---

#[derive(Deserialize, Serialize, Debug)]
pub struct VersionResponse {
    pub version: String,
}

pub async fn get_version(api_url: &str, api_key: Option<String>) -> Result<VersionResponse, reqwest::Error> {
    println!("Calling Inference Engine Version API at {}", api_url);
    let client = reqwest::Client::new();
    let url = build_url(api_url, "/api/version");
    let mut builder = client.get(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let res = builder
        .send()
        .await?
        .json::<VersionResponse>()
        .await?;

    Ok(res)
}

// --- OpenAI Compatibility ---

pub async fn list_openai_models(api_url: &str, api_key: Option<String>) -> Result<serde_json::Value, reqwest::Error> {
    println!("Calling Inference Engine OpenAI Models API at {}", api_url);
    let client = reqwest::Client::new();
    let url = build_url(api_url, "/v1/models");
    let mut builder = client.get(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let res = builder
        .send()
        .await?
        .json::<serde_json::Value>()
        .await?;

    Ok(res)
}

pub async fn call_openai_chat(api_url: &str, request: &serde_json::Value, api_key: Option<String>) -> Result<serde_json::Value, reqwest::Error> {
    println!("Calling Inference Engine OpenAI Chat API at {}", api_url);
    let client = reqwest::Client::new();
    let url = build_url(api_url, "/v1/chat/completions");
    let mut builder = client.post(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let res = builder
        .json(request)
        .send()
        .await?
        .json::<serde_json::Value>()
        .await?;

    Ok(res)
}

// --- Extended Model Management ---

// --- Create Model ---

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct CreateRequest {
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub from: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub system: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub template: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub quantize: Option<String>,
}

pub async fn create_model(api_url: &str, request: &CreateRequest, api_key: Option<String>) -> Result<serde_json::Value, reqwest::Error> {
    println!("Calling Ollama Create API at {} for model {}", api_url, request.model);
    let client = reqwest::Client::new();
    let url = build_url(api_url, "/api/create");
    let mut builder = client.post(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let res = builder
        .json(request)
        .send()
        .await?
        .json::<serde_json::Value>()
        .await?;
    Ok(res)
}

// --- Copy Model ---

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct CopyRequest {
    pub source: String,
    pub destination: String,
}

pub async fn copy_model(api_url: &str, request: &CopyRequest, api_key: Option<String>) -> Result<serde_json::Value, reqwest::Error> {
    println!("Calling Ollama Copy API at {} from {} to {}", api_url, request.source, request.destination);
    let client = reqwest::Client::new();
    let url = build_url(api_url, "/api/copy");
    let mut builder = client.post(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let resp = builder
        .json(request)
        .send()
        .await?;
    
    resp.error_for_status_ref()?;
    Ok(serde_json::json!({ "status": "success", "message": "Model copied" }))
}

// --- Delete Model ---

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct DeleteRequest {
    pub model: String,
}

pub async fn delete_model(api_url: &str, request: &DeleteRequest, api_key: Option<String>) -> Result<serde_json::Value, reqwest::Error> {
    println!("Calling Ollama Delete API at {} for model {}", api_url, request.model);
    let client = reqwest::Client::new();
    let url = build_url(api_url, "/api/delete");
    let mut builder = client.delete(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let resp = builder
        .json(request)
        .send()
        .await?;

    resp.error_for_status_ref()?;
    Ok(serde_json::json!({ "status": "success", "message": "Model deleted" }))
}

// --- Pull Model ---

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct PullRequest {
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub insecure: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream: Option<bool>,
}

pub async fn pull_model(api_url: &str, request: &PullRequest, api_key: Option<String>) -> Result<serde_json::Value, reqwest::Error> {
    println!("Calling Inference Engine Pull API at {} for model {}", api_url, request.model);
    let client = reqwest::Client::new();
    let url = build_url(api_url, "/api/pull");
    let mut builder = client.post(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let res = builder
        .json(request)
        .send()
        .await?
        .json::<serde_json::Value>()
        .await?;
    Ok(res)
}

// --- Push Model ---

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct PushRequest {
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub insecure: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream: Option<bool>,
}

pub async fn push_model(api_url: &str, request: &PushRequest, api_key: Option<String>) -> Result<serde_json::Value, reqwest::Error> {
    println!("Calling Ollama Push API at {} for model {}", api_url, request.model);
    let client = reqwest::Client::new();
    let url = build_url(api_url, "/api/push");
    let mut builder = client.post(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let res = builder
        .json(request)
        .send()
        .await?
        .json::<serde_json::Value>()
        .await?;
    Ok(res)
}

// --- Tokenize ---

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct TokenizeRequest {
    pub model: String,
    pub prompt: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TokenizeResponse {
    pub tokens: Vec<i64>,
}

pub async fn tokenize(api_url: &str, request: &TokenizeRequest, api_key: Option<String>) -> Result<TokenizeResponse, Box<dyn std::error::Error + Send + Sync>> {
    println!("Calling Inference Engine Tokenize API at {} for model {}", api_url, request.model);
    let client = reqwest::Client::new();
    let url = build_url(api_url, "/api/tokenize");
    let mut builder = client.post(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let res = builder
        .json(request)
        .send()
        .await?;

    if !res.status().is_success() {
        let status = res.status();
        let text = res.text().await.unwrap_or_default();
        return Err(format!("Upstream error {}: {}", status, text).into());
    }

    let text = res.text().await?;
    match serde_json::from_str::<TokenizeResponse>(&text) {
        Ok(data) => Ok(data),
        Err(e) => {
            eprintln!("Failed to decode tokenize response: {}. Raw: {}", e, text);
            Err(format!("Error decoding response body: {}. Raw was: {}", e, text).into())
        }
    }
}

// --- Detokenize ---

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct DetokenizeRequest {
    pub model: String,
    pub tokens: Vec<i64>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DetokenizeResponse {
    pub prompt: String,
}

pub async fn detokenize(api_url: &str, request: &DetokenizeRequest, api_key: Option<String>) -> Result<DetokenizeResponse, reqwest::Error> {
    println!("Calling Ollama Detokenize API at {} for model {}", api_url, request.model);
    let client = reqwest::Client::new();
    let url = build_url(api_url, "/api/detokenize");
    let mut builder = client.post(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let res = builder
        .json(request)
        .send()
        .await?
        .json::<DetokenizeResponse>()
        .await?;
    Ok(res)
}

// --- Blob Management ---

pub async fn check_blob(api_url: &str, digest: &str, api_key: Option<String>) -> Result<bool, reqwest::Error> {
    println!("Checking blob {} at {}", digest, api_url);
    let client = reqwest::Client::new();
    let url = build_url(api_url, &format!("/api/blobs/{}", digest));
    let mut builder = client.head(&url);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let res = builder.send().await?;
    Ok(res.status().is_success())
}

pub async fn create_blob(api_url: &str, digest: &str, data: bytes::Bytes, api_key: Option<String>) -> Result<(), reqwest::Error> {
    println!("Creating blob {} at {}", digest, api_url);
    let client = reqwest::Client::new();
    let url = build_url(api_url, &format!("/api/blobs/{}", digest));
    let mut builder = client.post(&url).body(data);

    if let Some(key) = api_key {
        builder = builder.header("Authorization", format!("Bearer {}", key));
    }
    let res = builder.send().await?;
    res.error_for_status()?;
    Ok(())
}

