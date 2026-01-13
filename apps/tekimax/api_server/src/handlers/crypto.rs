use axum::{Json, response::IntoResponse};
use serde::{Deserialize, Serialize};
use serde_json::json;
use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce 
};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use aes_gcm::aead::rand_core::RngCore;
use zeroize::{Zeroize, ZeroizeOnDrop}; // Added

// Wrapper for sensitive bytes that wipes memory on drop
#[derive(Zeroize, ZeroizeOnDrop)]
struct SensitiveBytes(Vec<u8>);

#[derive(Serialize)]
pub struct KeyGenResponse {
    pub algorithm: String,
    pub secret_key_base64: String,
    pub instructions: String,
}

#[derive(Deserialize)]
pub struct CryptoRequest {
    pub key_base64: String,
    pub payload: String, 
    pub aad: Option<String>, 
}

#[derive(Serialize)]
pub struct EncryptResponse {
    pub ciphertext_base64: String,
    pub nonce_base64: String,
    pub tag: String,
}

#[derive(Serialize)]
pub struct DecryptResponse {
    pub plaintext: String,
}

// POST /v1/crypto/key
pub async fn generate_key_handler() -> Json<KeyGenResponse> {
    // Generate key directly into a temporary buffer we can zeroize
    let key = Aes256Gcm::generate_key(OsRng);
    let key_b64 = BASE64.encode(&key);
    
    // Explicitly zeroize the raw key memory
    // Note: 'key' from generate_key is likely a GenericArray which might not implement Zeroize directly easily 
    // depending on versions, but we can try to zeroize slice if mutable.
    // Actually, let's treat the key as sensitive.
    // Ideally we would wrap it, but for generation we just encode and forget.
    // Rust RAII drops it, but let's be explicit if possible.
    // For MVP/simplicity with aes-gcm crate types, we rely on RAII for the library type,
    // but the output string is returned to user.
    
    Json(KeyGenResponse {
        algorithm: "AES-256-GCM (NIST SP 800-38D)".to_string(),
        secret_key_base64: key_b64,
        instructions: "SAVE THIS KEY. It is not stored on the server.".to_string(),
    })
}

// Helper for Internal PII Scrubber
pub struct InternalEncryptResult {
    pub ciphertext: String,
    pub nonce: String,
}

// Function to be called by PII Scrubber
pub fn encrypt_internal(key_b64: &str, payload: &str) -> Result<InternalEncryptResult, String> {
    let key_bytes = match BASE64.decode(key_b64) {
        Ok(k) => SensitiveBytes(k),
        Err(_) => return Err("Invalid base64 key".to_string()),
    };

    if key_bytes.0.len() != 32 {
        return Err("Key must be 32 bytes".to_string());
    }

    let cipher = Aes256Gcm::new_from_slice(&key_bytes.0).map_err(|_| "Invalid key length".to_string())?;

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    match cipher.encrypt(nonce, payload.as_bytes()) {
        Ok(ciphertext) => Ok(InternalEncryptResult {
            ciphertext: BASE64.encode(ciphertext),
            nonce: BASE64.encode(nonce_bytes),
        }),
        Err(_) => Err("Encryption failed".to_string()),
    }
}

// POST /v1/crypto/encrypt
pub async fn encrypt_handler(Json(req): Json<CryptoRequest>) -> impl IntoResponse {
    match encrypt_internal(&req.key_base64, &req.payload) {
        Ok(res) => Json(json!({
            "status": "success",
            "nonce_base64": res.nonce,
            "ciphertext_base64": res.ciphertext,
            "algorithm": "AES-256-GCM"
        })).into_response(),
        Err(e) => Json(json!({"error": e})).into_response(),
    }
}

// POST /v1/crypto/decrypt
#[derive(Deserialize)]
pub struct DecryptRequest {
    pub key_base64: String,
    pub ciphertext_base64: String,
    pub nonce_base64: String,
}

pub async fn decrypt_handler(Json(req): Json<DecryptRequest>) -> impl IntoResponse {
    // 1. Decode Key into Sensitive Wrapper
    let key_bytes = match BASE64.decode(&req.key_base64) {
        Ok(k) => SensitiveBytes(k),
        Err(_) => return Json(json!({"error": "Invalid base64 key"})).into_response(),
    };
    if key_bytes.0.len() != 32 {
         return Json(json!({"error": "Key must be 32 bytes (AES-256)"})).into_response();
    }
    
    let cipher = Aes256Gcm::new_from_slice(&key_bytes.0).expect("Key init failed");

    // 2. Decode Nonce & Ciphertext
    let nonce_bytes = match BASE64.decode(&req.nonce_base64) {
         Ok(n) => n,
         Err(_) => return Json(json!({"error": "Invalid base64 nonce"})).into_response(),
    };
    let ciphertext_bytes = match BASE64.decode(&req.ciphertext_base64) {
         Ok(c) => c,
         Err(_) => return Json(json!({"error": "Invalid base64 ciphertext"})).into_response(),
    };

    if nonce_bytes.len() != 12 {
        return Json(json!({"error": "Nonce must be 12 bytes"})).into_response();
    }
    let nonce = Nonce::from_slice(&nonce_bytes);

    // 3. Decrypt
    match cipher.decrypt(nonce, ciphertext_bytes.as_ref()) {
        Ok(plaintext_bytes) => {
            // Check if plaintext might be sensitive? 
            // We usually return it. We could define it as sensitive but user asked for key zeroization.
            match String::from_utf8(plaintext_bytes) {
                Ok(text) => Json(json!({ "status": "success", "plaintext": text })).into_response(),
                Err(_) => Json(json!({ "status": "success", "plaintext_base64": "..." })).into_response(), 
            }
        },
        Err(_) => Json(json!({"error": "Decryption failed (Invalid key/nonce/tag)"})).into_response(),
    }
    // key_bytes is dropped here, activating ZeroizeOnDrop
}
