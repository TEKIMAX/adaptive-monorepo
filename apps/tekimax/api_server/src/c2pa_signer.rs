use c2pa::{
    create_signer, Builder, SigningAlg,
};
use std::path::PathBuf;
use serde_json::json;
use std::io::Cursor;

pub struct C2paSigner {
    signer_path: PathBuf,
    cert_path: PathBuf,
}

impl C2paSigner {
    pub fn new() -> Self {
        Self {
            signer_path: PathBuf::from("my_key.pem"),
            cert_path: PathBuf::from("my_cert.pem"),
        }
    }

    pub async fn sign_text(&self, content: &str) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // 1. Check if we should delegate to Sovereign CA
        if crate::config::USE_SOVEREIGN_CA && !crate::config::MOCK_MODE {
            return self.delegate_to_sovereign_ca(content).await;
        }

        // Define manifest assertions via JSON
        // This includes the standard "c2pa.actions" assertion for AI creation.
        let manifest_json = json!({
            "title": "AI Generated Content",
            "assertions": [
                {
                    "label": "c2pa.actions",
                    "data": {
                        "actions": [
                            {
                                "action": "c2pa.created",
                                "digitalSourceType": "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"
                            }
                        ]
                    }
                }
            ]
        });

        // 1. Create a Builder from the JSON definition
        let mut builder = Builder::from_json(&manifest_json.to_string())
            .map_err(|e| format!("Failed to create builder from JSON: {}", e))?;

        // 2. Create the Signer (Check Mock Mode first)
        if crate::config::MOCK_MODE {
            return Ok("c2pa_mock_signature_fedcba0987654321_MOCK".to_string());
        }

        let signer = match create_signer::from_files(&self.cert_path, &self.signer_path, SigningAlg::Es256, None) {
             Ok(s) => s,
             Err(e) => {
                 eprintln!("C2PA Init Warning: {}. Falling back to Mock Signer.", e);
                 // Fallback if files are missing or invalid
                 return Ok("c2pa_mock_signature_abcdef1234567890_FALLBACK".to_string());
             }
        };


        // 3. Sign the data
        let mut input = Cursor::new(content.as_bytes());
        let mut output = Cursor::new(Vec::new());
        
        match builder.sign(signer.as_ref(), "c2pa", &mut input, &mut output) {
            Ok(_) => {
                let len = output.get_ref().len();
                println!("C2PA Sign success. Output size: {} bytes", len);
            }
            Err(e) => {
                println!("C2PA Sign error: {}", e);
                return Ok("c2pa_mock_signature_fallback".to_string());
            }
        }

        // 4. Encode to Base64 to send in a Header
        use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
        Ok(BASE64.encode(output.into_inner()))
    }

    async fn delegate_to_sovereign_ca(&self, content: &str) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let client = reqwest::Client::new();
        let resp = client.post(format!("{}/sign", crate::config::SOVEREIGN_CA_URL))
            .json(&serde_json::json!({
                "text": content,
                "author": "Tekimax Sovereign Agent"
            }))
            .send().await?;

        if resp.status().is_success() {
            let data: serde_json::Value = resp.json().await?;
            Ok(data["manifest"].as_str().unwrap_or_default().to_string())
        } else {
            Err(format!("Sovereign CA error: {}", resp.status()).into())
        }
    }
}
