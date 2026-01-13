use axum::{Json, response::IntoResponse};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use crate::utils::{get_inference_url, get_inference_key};
use ollama_proxy::ollama::{self};
use crate::{storage, pii_scrubber, c2pa_signer, audit};
use crate::handlers::{quantum, adaptive}; // Import handlers

#[derive(Deserialize, Debug)]
pub struct RootNodeRequest {
    pub project_id: String,
    pub intent: String, // The user's prompt
    pub modality: Option<String>,
    pub strict_mode: Option<bool>, // If true, abort on PII detection
    pub thinking_preference: Option<String>, // "off", "on", "low", "medium", "high"
    pub model: Option<String>, // The specific agent/model to use
    pub user_id: Option<String>, // Who (DID or username)
    pub initiator: Option<String>, // "human" or "agent"
}

#[derive(Serialize, Debug)]
pub struct RootNodeResponse {
    pub status: String,
    pub pipeline_trace: PipelineTrace,
    pub final_output: String,
    pub reasoning_trace: Option<String>,
}

#[derive(Serialize, Debug)]
pub struct PipelineTrace {
    pub l1_conditioning: Value,
    pub l2_authority: Value,
    pub l3_workflow_id: String,
    pub l4_audit_hash: String,
    pub l3_sources: Option<Vec<Value>>,
    pub l3_references: Option<Vec<Value>>,
    pub l3_tool_execution: Option<Value>, // New field for tool results
}

pub async fn process_root_node(headers: axum::http::HeaderMap, Json(req): Json<RootNodeRequest>) -> impl IntoResponse {
    // 0. Verify Identity
    let project = match storage::get_project(&req.project_id) {
        Some(p) => p,
        None => return Json(json!({ "error": "Invalid project_id", "code": 401 })).into_response(),
    };

    // Extract Sovereign Key for PII Vault
    let sovereign_key = headers.get("X-Sovereign-Key").map(|v| v.to_str().unwrap_or("").to_string());

    // --- LEVEL 1: CONDITIONING (Privacy & Context) ---
    let scrub_result = pii_scrubber::scrub_text(&req.intent, sovereign_key.as_ref()).await;
    if req.strict_mode.unwrap_or(false) && !scrub_result.detected_fields.is_empty() {
         return Json(json!({ 
             "error": "PII Detected in Strict Mode", 
             "redacted_fields": scrub_result.detected_fields 
         })).into_response();
    }

    // Construct Prompt using centralized template
    let modality = req.modality.unwrap_or_else(|| "text".to_string());
    let policy_context = project.system_policy.map(|p| format!("SYSTEM POLICY (Global Architecture DNA): {}\n", p)).unwrap_or_default();
    let model_name = req.model.clone().unwrap_or_else(|| crate::config::DEFAULT_CHAT_MODEL.to_string());

    let prompt = crate::config::DEFAULT_ORCHESTRATOR_PROMPT
        .replace("{policy}", &policy_context)
        .replace("{modality}", &modality)
        .replace("{context}", &scrub_result.clean_text);


    // --- GENERATION (The Engine) ---
    let target_url = get_inference_url();
    let api_key = get_inference_key();

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

    // Determine 'think' parameter based on preference
    let think_param = match req.thinking_preference.as_deref() {
        Some("on") | Some("true") => Some(json!(true)),
        Some("low") => Some(json!("low")),
        Some("medium") => Some(json!("medium")),
        Some("high") => Some(json!("high")),
        _ => None, // "off" or missing
    };

    // structured output schema
    let schema = json!({
        "type": "object",
        "properties": {
            "content": { "type": "string" },
            "sources": { "type": "array" },
            "references": { "type": "array" },
            "tool_calls": { 
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "function": { "type": "string" },
                        "parameters": { "type": "object" }
                    },
                    "required": ["function", "parameters"]
                }
            }
        },
        "required": ["content", "sources", "references"]
    });

    let llm_req = ollama::ChatRequest {
        model: model_name.clone(),
        messages,
        stream: Some(false),
        think: think_param,
        format: Some(schema),
        ..Default::default()
    };

    let (llm_output_str, reasoning_trace) = match ollama::call_chat(&target_url, &llm_req, api_key).await {
        Ok(res) => (res.message.content, res.message.thinking),
        Err(e) => return Json(json!({ "error": format!("Sovereign Inference Failure: {}", e) })).into_response(),
    };

    // Parse structured output
    #[derive(Deserialize)]
    struct ToolCall {
        function: String,
        parameters: Value,
    }

    #[derive(Deserialize)]
    struct StructuredOutput {
        content: String,
        sources: Vec<Value>,
        references: Vec<Value>,
        tool_calls: Option<Vec<ToolCall>>,
    }

    // Clean potential markdown fences
    let clean_json = llm_output_str.trim();
    let clean_json = if let Some(stripped) = clean_json.strip_prefix("```json") {
        stripped.strip_suffix("```").unwrap_or(stripped).trim()
    } else if let Some(stripped) = clean_json.strip_prefix("```") {
        stripped.strip_suffix("```").unwrap_or(stripped).trim()
    } else {
        clean_json
    };

    let structured: StructuredOutput = serde_json::from_str(clean_json).unwrap_or(StructuredOutput {
        content: llm_output_str.clone(),
        sources: vec![],
        references: vec![],
        tool_calls: None,
    });

    // --- EXECUTION (The Hands) ---
    let mut tool_results = Vec::new();
    if let Some(calls) = &structured.tool_calls {
        for call in calls {
            match call.function.as_str() {
                "quantum_optimize" => {
                    // Re-construct QuantumRequest from params
                    if let Ok(q_req) = serde_json::from_value::<quantum::QuantumRequest>(call.parameters.clone()) {
                        let res = quantum::optimize_handler(Json(q_req)).await;
                        tool_results.push(json!({ "function": "quantum_optimize", "result": res.0 }));
                    } else {
                        tool_results.push(json!({ "function": "quantum_optimize", "error": "Invalid parameters" }));
                    }
                },
                "adapt_content" => {
                    if let Ok(mut a_req) = serde_json::from_value::<adaptive::AdaptiveRequest>(call.parameters.clone()) {
                         // Inject the parent request's model to ensure consistent sovereign agent usage
                         a_req.model = Some(model_name.clone());
                         
                         match adaptive::run_adaptive_engine(&headers, a_req).await {
                             Ok(res) => {
                                 tool_results.push(json!({ "function": "adapt_content", "status": "success", "result": res }));
                             },
                             Err(e) => {
                                 tool_results.push(json!({ "function": "adapt_content", "status": "error", "message": e }));
                             }
                         }
                    }
                },
                "isolate_context" => {
                    // Pass the intent to check for malicious patterns in the sandbox
                    let res = adaptive::security_isolate_handler(Json(adaptive::IsolateRequest {
                        input_context: req.intent.clone()
                    })).await;
                    tool_results.push(json!({ "function": "isolate_context", "result": res.0 }));
                },
                _ => {
                    tool_results.push(json!({ "function": call.function.clone(), "error": "Unknown function" }));
                }
            }
        }
    }

    let generated_text = structured.content;

    // --- LEVEL 2: AUTHORITY (Signing) ---
    let signer = c2pa_signer::C2paSigner::new();
    let signature = match signer.sign_text(&generated_text).await {
        Ok(s) => s,
        Err(_) => "SIGNING_FAILED".to_string(), // Don't block pipeline, just note failure
    };

    // --- LEVEL 4: COMPOUNDING (Audit) ---
    let tool_count = tool_results.len();
    let audit_payload = format!("Generated {} chars. Modality: {}. Signer: C2PA. Tools Used: {}", generated_text.len(), modality, tool_count);
    
    // TODO: PRODUCTION HARDENING
    // User ID: In production, this will be extracted from the JWT or mTLS Certificate (verified identity), not just passed in the body.
    // Initiator: This will be determined by the API Key Scope.
    // - Keys issued to Humans -> initiator: "human"
    // - Keys issued to Agents -> initiator: "ai_agent"
    let user_id = req.user_id.clone().unwrap_or("anonymous".to_string());
    let initiator = req.initiator.clone().unwrap_or("system".to_string());

    let audit_hash = audit::log_event(Some(req.project_id.clone()), "root_node_generation", &audit_payload, Some(user_id.clone()), Some(initiator.clone()))
        .unwrap_or_else(|_| "LOG_FAILED".to_string());

    // --- LEVEL 3: WORKFLOW RESULT ---
    // (This entire function represents the L3 Workflow)
    
    // --- NIST RMF HEADERS ---
    // Categorize: (Step 2) - Categorize based on intent or strict mode
    let risk_category = if req.intent.to_lowercase().contains("search") {
        "HIGH_RISK_WEB_SEARCH"
    } else if req.strict_mode.unwrap_or(false) {
        "MODERATE_RISK_PII"
    } else {
        "LOW_RISK_GENERAL"
    };

    let nist_control = match risk_category {
        "HIGH_RISK_WEB_SEARCH" => "AC-4 Information Flow Enforcement",
        "MODERATE_RISK_PII" => "MP-6 Media Sanitization",
        _ => "CA-7 Continuous Monitoring",
    };

    let response = RootNodeResponse {
        status: "success".to_string(),
        final_output: generated_text,
        pipeline_trace: PipelineTrace {
            l1_conditioning: json!({
                "sanitized": true,
                "detected_fields": scrub_result.detected_fields,
                "encrypted_pii": scrub_result.encrypted_pii
            }),
            l2_authority: json!({
                "signed": signature != "SIGNING_FAILED",
                "manifest_preview": signature.chars().take(20).collect::<String>()
            }),
            l3_workflow_id: format!("wf_{}", audit_hash.chars().take(8).collect::<String>()),
            l4_audit_hash: audit_hash,
            l3_sources: Some(structured.sources),
            l3_references: Some(structured.references),
            l3_tool_execution: if tool_results.is_empty() { None } else { Some(json!(tool_results)) },
        },
        reasoning_trace,
    };

    let mut final_headers = axum::http::HeaderMap::new();
    final_headers.insert("X-Risk-Category", risk_category.parse().unwrap());
    final_headers.insert("X-NIST-Control", nist_control.parse().unwrap());
    final_headers.insert("X-Initiator-Type", initiator.parse().unwrap_or("unknown".parse().unwrap()));
    final_headers.insert("X-User-ID", user_id.parse().unwrap_or("anonymous".parse().unwrap()));
    
    (final_headers, Json(response)).into_response()
}
