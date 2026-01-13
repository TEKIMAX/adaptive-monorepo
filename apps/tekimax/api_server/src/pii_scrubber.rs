use regex::Regex;
use lazy_static::lazy_static;
use crate::utils::{get_inference_key}; 
use ollama_proxy::ollama;
use crate::handlers::crypto; // Ensure we have crypto for vaulting

lazy_static! {
    static ref EMAIL_REGEX: Regex = Regex::new(r"(?i)[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}").unwrap();
    static ref PHONE_REGEX: Regex = Regex::new(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b").unwrap();
    static ref SSN_REGEX: Regex = Regex::new(r"\b\d{3}-\d{2}-\d{4}\b").unwrap();
}

#[derive(serde::Serialize, Clone)]
pub struct EncryptedPii {
    pub label: String,
    pub ciphertext: String,
    pub nonce: String,
}

pub struct PiiScrubResult {
    pub clean_text: String,
    pub detected_fields: Vec<String>,
    pub encrypted_pii: Option<Vec<EncryptedPii>>, // New Vault
}

// Function that handles scrubbing, and optionally encrypts PII if key is provided
pub async fn scrub_text(input: &str, sovereign_key: Option<&String>) -> PiiScrubResult {
    let mut text_out = input.to_string();
    let mut fields_found = Vec::new();
    let mut encrypted_vault = Vec::new();

    let text_ref = text_out.clone(); // Immut copy for find_iter

    // 1. FAST PATH: Regex with Vault logic
    // We handle each regex type manually for simplicity
    
    // EMAIL
    if let Some(key) = sovereign_key {
        // Vault Logic: Find matches, encrypt them, store, and redact
        // We use finding + range replacement. 
        // Note: Doing multiple iterative replacements changes indices. 
        // Simpler implementation: Use `replace_all` callback? Rust Regex doesn't support async/Result closure easily.
        // We will just do a standard find-collect-replace cycle.
        
        let mut vault_matches = Vec::new();
        
        if let Some(_m) = EMAIL_REGEX.find(&text_out) {
             // Just one check? No, findAll.
             for capt in EMAIL_REGEX.find_iter(&text_ref) {
                 vault_matches.push(("Email", capt.start(), capt.end(), capt.as_str().to_string()));
             }
        }
        if let Some(_m) = PHONE_REGEX.find(&text_out) {
             for capt in PHONE_REGEX.find_iter(&text_ref) {
                 vault_matches.push(("Phone", capt.start(), capt.end(), capt.as_str().to_string()));
             }
        }
        if let Some(_m) = SSN_REGEX.find(&text_out) {
             for capt in SSN_REGEX.find_iter(&text_ref) {
                 vault_matches.push(("SSN", capt.start(), capt.end(), capt.as_str().to_string()));
             }
        }
        
        // Sort matches by start index desc to replace safely
        vault_matches.sort_by(|a, b| b.1.cmp(&a.1));
        
        for (label, start, end, val) in vault_matches {
             match crypto::encrypt_internal(key, &val) {
                 Ok(enc) => {
                     encrypted_vault.push(EncryptedPii {
                         label: label.to_string(),
                         ciphertext: enc.ciphertext,
                         nonce: enc.nonce
                     });
                     let replacement = format!("[VAULT_{}]", label.to_uppercase());
                     // Check boundaries didn't shift? Because we sort DESC, it's safe.
                     // But we must check if multiple patterns overlap? Assuming distinct for now.
                     // Only replace if string length hasn't drastically shifted above us...
                     // Actually, replaces change length. Sorting Descending is the correct way.
                     if end <= text_out.len() { // Rough check
                        text_out.replace_range(start..end, &replacement);
                        fields_found.push(label.to_string());
                     }
                 },
                 Err(_) => {
                      // Fallback
                      let replacement = format!("[{}_REDACTED]", label.to_uppercase());
                      if end <= text_out.len() {
                         text_out.replace_range(start..end, &replacement);
                         fields_found.push(label.to_string());
                      }
                 }
             }
        }
    } else {
        // Legacy Destructive Logic
        if EMAIL_REGEX.is_match(&text_out) {
            text_out = EMAIL_REGEX.replace_all(&text_out, "[EMAIL_REDACTED]").to_string();
            fields_found.push("Email".to_string());
        }
        if PHONE_REGEX.is_match(&text_out) {
            text_out = PHONE_REGEX.replace_all(&text_out, "[PHONE_REDACTED]").to_string();
            fields_found.push("Phone".to_string());
        }
        if SSN_REGEX.is_match(&text_out) {
            text_out = SSN_REGEX.replace_all(&text_out, "[SSN_REDACTED]").to_string();
            fields_found.push("SSN".to_string());
        }
    }

    // 2. PRO PATH: Sovereign Guard Node (Docker Container)
    let guard_url = crate::config::PII_CHECK_URL;
    let guard_model = crate::config::DEFAULT_PII_CHECK_MODEL;
    let api_key = get_inference_key();

    let prompt = crate::config::PROMPT_PII_REDACTION
        .replace("{text}", &text_out);


    let llm_req = ollama::ChatRequest {
        model: guard_model.to_string(),
        messages: vec![ollama::ChatMessage {
            role: "user".to_string(),
            content: prompt,
            images: None,
            tool_calls: None,
            thinking: None,
            parts: None,
        }],
        stream: Some(false),
        ..Default::default()
    };

    match ollama::call_chat(guard_url, &llm_req, api_key).await {
        Ok(res) => {
            let llm_redacted = res.message.content.trim().to_string();
            // Heuristics to prevent "No" or "I cannot" responses from nuking the text
            let is_negative = llm_redacted.to_lowercase().starts_with("i ") || 
                             llm_redacted.to_lowercase().starts_with("no ") || 
                             llm_redacted.to_lowercase().starts_with("there are") ||
                             llm_redacted.len() < 5;
            
            let seems_valid = !is_negative && llm_redacted.len() > (text_out.len() / 3);
            
            if llm_redacted != text_out && seems_valid {
                   fields_found.push("AI_Detected_PII".to_string());
                   text_out = llm_redacted;
            } else if !seems_valid && llm_redacted != text_out {
                eprintln!("Guard Node returned invalid/short response (ignored): '{}'", llm_redacted);
            }
        },
        Err(e) => {
            eprintln!("Guard Node Offline/Error (Falling back to Regex): {}", e);
        }
    }

    fields_found.sort();
    fields_found.dedup();
    
    let vault_opt = if sovereign_key.is_some() {
        Some(encrypted_vault)
    } else {
        None
    };

    PiiScrubResult {
        clean_text: text_out,
        detected_fields: fields_found,
        encrypted_pii: vault_opt
    }
}
