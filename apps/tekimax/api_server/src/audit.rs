use serde::{Deserialize, Serialize};
use serde_json::json;
use std::io::Write;
use chrono::Utc;

#[derive(Serialize, Deserialize, Debug)]
#[allow(dead_code)]
pub struct AuditEntry {
    pub project_id: Option<String>,
    pub action: String,
    pub risk_profile: String,
    pub event_hash: String,
    pub status: String,
    pub payload_summary: String,
    pub timestamp: String,
}

pub fn log_event(project_id: Option<String>, action: &str, payload: &str, user_id: Option<String>, initiator: Option<String>) -> std::io::Result<String> {
    let event_hash = format!("{:x}", md5::compute(payload));
    
    let entry = json!({
        "timestamp": Utc::now().to_rfc3339(),
        "project_id": project_id,
        "action": action,
        "risk_profile": crate::config::NIST_COMPLIANCE_PROFILE,
        "event_hash": event_hash,
        "status": "sovereign_persisted",
        "attribution": {
            "user_id": user_id.unwrap_or("anonymous".to_string()),
            "initiator": initiator.unwrap_or("unknown".to_string())
        }
    });

    if let Ok(mut file) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(crate::config::AUDIT_LOG_FILENAME) 
    {
        writeln!(file, "{}", entry.to_string())?;
    }

    Ok(event_hash)
}

