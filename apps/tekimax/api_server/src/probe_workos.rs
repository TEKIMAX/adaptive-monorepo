use reqwest::Client;
use serde_json::json;

#[tokio::main]
async fn main() {
    let api_key = "sk_FQzOkATbBhFCm3OskZxrw3rk0slJ5GIFXitvTLCooONgBq"; // Admin Key
    let user_token = "sk_test_123456"; // Dummy user token to test
    
    let client = Client::new();
    let base = "https://api.workos.com";
    
    let endpoints = vec![
        "/api_keys/verify",
        "/keys/verify", 
        "/organization_api_keys/verify",
        "/organization_api_keys/validate"
    ];

    for ep in endpoints {
        let url = format!("{}{}", base, ep);
        println!("Trying POST {}", url);
        let res = client.post(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&json!({ "token": user_token }))
            .send()
            .await;
            
        match res {
            Ok(r) => println!("  -> Status: {}", r.status()),
            Err(e) => println!("  -> Error: {}", e),
        }
    }
}
