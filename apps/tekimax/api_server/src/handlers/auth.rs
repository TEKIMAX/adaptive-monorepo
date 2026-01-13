use axum::{
    extract::{Json, Request},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use serde::{Deserialize, Serialize};
use serde_json::json;

// --- WorkOS API Client ---

const WORKOS_API_BASE: &str = "https://api.workos.com";

#[derive(Serialize, Deserialize)]
pub struct VerifyKeyResponse {
    pub valid: bool,
    pub key: Option<WorkOSKey>,
}

#[derive(Serialize, Deserialize)]
pub struct WorkOSKey {
    pub id: String,
    pub name: String,
    // Add other fields as needed
}

/// Verifies an API Key against WorkOS (Support for both Master Keys and Widget-generated Keys)
/// Verifies an API Key against WorkOS (Support for both Master Keys and Widget-generated Keys)
pub async fn verify_apikey(api_key: &str) -> Result<VerifyKeyResponse, String> {
    let workos_keys_str = std::env::var("WORKOS_API_KEY").unwrap_or_default();
    let valid_keys: Vec<&str> = workos_keys_str.split(',').map(|s| s.trim()).collect();
    
    // 1. Local Check: Is this one of the Master Admin Keys?
    if valid_keys.contains(&api_key) {
        println!("Auth: Valid Master Key used successfully.");
        return Ok(VerifyKeyResponse { valid: true, key: Some(WorkOSKey { id: "admin".into(), name: "Admin Key".into() }) });
    }

    println!("Auth Debug: Key not found in local whitelist. Attempting dynamic validation via WorkOS API...");

    // 2. Simplified Dynamic Check: Use the key itself to query a common WorkOS endpoint.
    // If the key is valid, it should be able to access *something*.
    // We try /organizations first as it's common. If that fails (403), we might try /user_management/users.
    // For now, let's assume valid keys have some read access.
    
    let client = reqwest::Client::new();
    let org_url = format!("{}/organizations?limit=1", WORKOS_API_BASE);
    
    println!("Auth Debug: verifying key via WorkOS API: {}", org_url);

    let org_res = client.get(&org_url)
        .header("Authorization", format!("Bearer {}", api_key)) 
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = org_res.status();
    let body = org_res.text().await.unwrap_or_default();

    if status.is_success() {
         println!("Auth: Key verified via Organizations API.");
         Ok(VerifyKeyResponse { valid: true, key: None })
    } else {
         println!("Auth: Validation failed. Status: {}. Body: {}", status, body);
         // If 403, the key IS valid but just lacks permissions. Technically that's 'Authenticated' but maybe unauthorized for this resource.
         // However, for our API Gateway, we might accept any valid WorkOS key.
         // Let's refine: if 401, it's definitely invalid. If 403, it's valid but limited. 
         // For now, strict: must be able to read orgs.
         Ok(VerifyKeyResponse { valid: false, key: None })
    }
}


// --- Handlers ---

#[derive(Deserialize)]
pub struct PortalSessionRequest {
    pub token: String, // AuthKit User Token
}

pub async fn create_portal_session_handler(
    Json(payload): Json<PortalSessionRequest>,
) -> impl IntoResponse {
    // 1. Verify the AuthKit User Token (JWT)
    // We should verify this against WorkOS User Management API
    
    // 2. If valid, generate a URL/Token for the API Keys Widget
    // Call WorkOS "Generate Widget Session" endpoint
    
    // Placeholder response
    (StatusCode::OK, Json(json!({
        "widget_url": "https://api.workos.com/widgets/api-keys?token=placeholder_widget_token"
    })))
}

#[derive(Deserialize, Serialize)]
pub struct CreateOrganizationRequest {
    pub name: String,
    pub domains: Option<Vec<String>>, 
    pub allow_profiles_outside_organization: Option<bool>,
}

pub async fn create_organization_handler(
    headers: HeaderMap,
    Json(payload): Json<CreateOrganizationRequest>,
) -> impl IntoResponse {
    // 1. Authenticate Request (Must be Master Key)
    // The middleware already ensures A key is present. 
    // Ideally we should double check that it's a MASTER key if we want strict security, 
    // but the dynamic auth allows any valid key. 
    // For creating organizations, maybe we should enforce Master Key?
    // User requested "that way we can create an organization level api key", meaning standard users might need this?
    // Let's rely on the middleware auth for now.

    let workos_key = std::env::var("WORKOS_API_KEY").unwrap_or_default()
        .split(',')
        .next()
        .unwrap_or_default()
        .to_string();

    if workos_key.is_empty() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Server configuration error: No WorkOS API Key" }))).into_response();
    }

    let client = reqwest::Client::new();
    let url = format!("{}/organizations", WORKOS_API_BASE);

    // Payload for WorkOS: { "name": "...", "domainData": [ { "domain": "example.com", "state": "pending" } ] }
    let mut clean_payload = json!({
        "name": payload.name
    });

    if let Some(domains) = payload.domains {
        let domain_data: Vec<serde_json::Value> = domains.into_iter().map(|d| {
            json!({
                "domain": d,
                "state": "pending" // Default to pending verification
            })
        }).collect();
        clean_payload["domainData"] = json!(domain_data);
    }
    
    // User mentions 'allow_profiles_outside_organization' which is valid for Org object but maybe not create?
    // Docs say `createOrganization` takes name, domainData, externalId, metadata.
    // `allow_profiles_outside_organization` is likely an update-only or different param. 
    // I will include it if present, but as per recent docs snippet it's not explicitly in `createOrganization` params list provided.
    // However, I'll keep it just in case, or remove to be safe. Let's remove to be safe based on snippet.
    
    if let Some(allow) = payload.allow_profiles_outside_organization {
         clean_payload["allow_profiles_outside_organization"] = json!(allow);
    }

    let res = client.post(&url)
        .header("Authorization", format!("Bearer {}", workos_key))
        .json(&clean_payload)
        .send()
        .await;

    match res {
        Ok(response) => {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            
            if status.is_success() {
                let json_body: serde_json::Value = serde_json::from_str(&body).unwrap_or(json!({ "raw": body }));
                Json(json_body).into_response()
            } else {
                 (status, Json(json!({ "error": "WorkOS Error", "details": body }))).into_response()
            }
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response()
    }
}

#[derive(Deserialize, Serialize)]
pub struct CreateWidgetTokenRequest {
    pub organization_id: String,
    pub user_id: String,
    pub scopes: Vec<String>,
}

pub async fn create_widget_token_handler(
    headers: HeaderMap,
    Json(payload): Json<CreateWidgetTokenRequest>,
) -> impl IntoResponse {
    let workos_key = std::env::var("WORKOS_API_KEY").unwrap_or_default()
        .split(',')
        .next()
        .unwrap_or_default()
        .to_string();

    if workos_key.is_empty() {
        return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": "Server configuration error: No WorkOS API Key" }))).into_response();
    }

    let client = reqwest::Client::new();
    let url = format!("{}/widgets/token", WORKOS_API_BASE);

    let res = client.post(&url)
        .header("Authorization", format!("Bearer {}", workos_key))
        .json(&json!({
            "organization_id": payload.organization_id,
            "user_id": payload.user_id,
            "scopes": payload.scopes
        }))
        .send()
        .await;

    match res {
        Ok(response) => {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            
            if status.is_success() {
                let json_body: serde_json::Value = serde_json::from_str(&body).unwrap_or(json!({ "raw": body }));
                Json(json_body).into_response()
            } else {
                 (status, Json(json!({ "error": "WorkOS Error", "details": body }))).into_response()
            }
        },
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({ "error": e.to_string() }))).into_response()
    }
}

// Middleware Logic
pub async fn auth_middleware(
    headers: HeaderMap,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = headers.get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let token = if auth_header.starts_with("Bearer ") {
        &auth_header[7..]
    } else if auth_header.starts_with("sk_") {
        auth_header
    } else {
        return Err(StatusCode::UNAUTHORIZED);
    };

    // Check if it's a WorkOS Key
    if token.starts_with("sk_") {
        match verify_apikey(token).await {
            Ok(res) if res.valid => Ok(next.run(request).await),
            _ => Err(StatusCode::UNAUTHORIZED),
        }
    } else {
        // Strict Mode: Block all other requests.
        Err(StatusCode::UNAUTHORIZED)
    }
}
