use crate::storage::{self, Project};
use crate::c2pa_signer::C2paSigner;
use crate::pii_scrubber;
use rand::{distr::Alphanumeric, Rng};
use sha2::{Digest, Sha256};
use axum::{Json, response::IntoResponse};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::HashMap;

#[derive(Deserialize, Debug)]
pub struct SovereignRequest {
    pub project_id: Option<String>,
    pub services: Vec<String>,
    pub payload: Value,
}

#[derive(Serialize, Debug)]
pub struct SovereignResponse {
    pub status: String,
    pub results: HashMap<String, Value>,
}

// Update signature to accept headers
pub async fn run_sovereign_service(headers: axum::http::HeaderMap, Json(req): Json<SovereignRequest>) -> impl IntoResponse {
    let mut results = HashMap::new();
    let sovereign_key = headers.get("X-Sovereign-Key").map(|v| v.to_str().unwrap_or("").to_string());
    
    if let Some(k) = &sovereign_key {
        println!("DEBUG: Sovereign Service received Key (len: {})", k.len());
    } else {
        println!("DEBUG: Sovereign Service - No Key provided");
    }

    for service in req.services {
        println!("DEBUG: Dispatching Sovereign Service: '{}'", service);
        match service.as_str() {
            "secure_onboarding" => {
                // Provision a new Project & API Key
                let developer_did = req.payload.get("developer_did").and_then(|v| v.as_str()).unwrap_or("anonymous");
                let project_id_suffix = match req.payload.get("project_name").and_then(|v| v.as_str()) {
                    Some(name) => name.to_string(),
                    None => {
                        let s: String = rand::thread_rng()
                            .sample_iter(&Alphanumeric)
                            .take(8)
                            .map(char::from)
                            .collect();
                        s.to_lowercase()
                    }
                };
                let project_id = format!("proj_{}", project_id_suffix);

                let api_key: String = rand::thread_rng()
                    .sample_iter(&Alphanumeric)
                    .take(32)
                    .map(char::from)
                    .collect();

                // Hash for storage
                let mut hasher = Sha256::new();
                hasher.update(api_key.as_bytes());
                let raw_hash = hex::encode(hasher.finalize());

                let project = Project {
                    project_id: project_id.clone(),
                    api_key_hash: raw_hash.to_string(), // Ensure it's a String
                    developer_did: developer_did.to_string(),
                    created_at: chrono::Utc::now().to_rfc3339(),
                    system_policy: None,
                };

                if let Err(e) = storage::save_project(project) {
                    eprintln!("Failed to save onboarding project: {}", e);
                    results.insert("secure_onboarding".to_string(), json!({ "error": "Storage failure", "details": e.to_string() }));
                } else {
                    results.insert("secure_onboarding".to_string(), json!({
                        "status": "provisioned",
                        "project_id": project_id,
                        "api_key": api_key // Return raw key only once during onboarding
                    }));
                }
            },
            "pii_scrub" => {
                // Real PII Scrubbing
                let raw_text = req.payload.get("raw_prompt_text").and_then(|v| v.as_str()).unwrap_or("");
                let result = pii_scrubber::scrub_text(raw_text, sovereign_key.as_ref()).await;
                
                results.insert("pii_scrub".to_string(), json!({
                    "clean_text": result.clean_text,
                    "detected_fields": result.detected_fields,
                    "encrypted_pii": result.encrypted_pii
                }));
            },
            "sign_content" => {
                // Digital Signature (C2PA)
                let content = req.payload.get("content_blob").and_then(|v| v.as_str()).unwrap_or("");
                let signer = C2paSigner::new();
                let manifest_b64 = match signer.sign_text(content).await {
                    Ok(s) => s,
                    Err(e) => format!("Signing failed: {}", e),
                };

                results.insert("sign_content".to_string(), json!({
                    "manifest_base64": manifest_b64,
                    "algorithm": crate::config::C2PA_SIGNING_ALGORITHM,
                    "status": "signed"
                }));
            },
            "nist_audit_log" => {
                // 1. Calculate Hash of the Event (Compliance Proof)
                let event_data = req.payload.to_string();
                let log_hash = format!("{:x}", md5::compute(&event_data)); // Using MD5 for shortness in MVP, SHA256 better for prod

                // 2. Persist to "Local Flight Recorder" (Sovereign Storage)
                // We store the Log Trace locally so the User has evidence, but WE don't own it centrally.
                let log_entry = json!({
                    "timestamp": chrono::Utc::now().to_rfc3339(),
                    "project_id": req.project_id.clone(),
                    "risk_profile": crate::config::NIST_COMPLIANCE_PROFILE,
                    "event_hash": log_hash,
                    "status": "logged_locally"
                });

                // Append to local file (blocking IO for MVP is acceptable here)
                use std::io::Write;
                if let Ok(mut file) = std::fs::OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open(crate::config::AUDIT_LOG_FILENAME) 
                {
                    if let Err(e) = writeln!(file, "{}", log_entry.to_string()) {
                        eprintln!("Failed to write audit log: {}", e);
                    }
                }

                results.insert("nist_audit_log".to_string(), json!({
                    "log_entry_hash": log_hash,
                    "storage_mode": "local_sovereign_node",
                    "compliance_status": "OK",
                    "profile": crate::config::NIST_COMPLIANCE_PROFILE
                }));
            },
            _ => {
                results.insert(service.clone(), json!({
                    "error": "Service not found",
                    "code": 404
                }));
            }
        }
    }

    Json(SovereignResponse {
        status: "success".to_string(),
        results,
    })
}
