use axum::{
    extract::Json,
    routing::post,
    Router,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use c2pa::{Builder, SigningAlg, create_signer};
use std::path::Path;
use anyhow::{Context, Result};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use std::io::Cursor;
use serde_json::json;

#[derive(Deserialize)]
struct SignRequest {
    text: String,
    author: Option<String>,
}

#[derive(Serialize)]
struct SignResponse {
    manifest: String, // Base64 encoded manifest
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Ensure PKI is initialized
    initialize_pki().context("Failed to initialize PKI")?;

    let app = Router::new()
        .route("/health", axum::routing::get(health_handler))
        .route("/sign", post(sign_handler));

    let addr = SocketAddr::from(([0, 0, 0, 0], 11440));
    println!("Sovereign CA listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_handler() -> impl IntoResponse {
    axum::response::Json(json!({ "status": "healthy", "service": "sovereign-ca" }))
}

fn initialize_pki() -> Result<()> {
    if !Path::new("pki/ca.pem").exists() {
        println!("Initializing Root CA...");
        let output = std::process::Command::new("cfssl")
            .args(["gencert", "-initca", "ca-csr.json"])
            .output()
            .context("Failed to run cfssl")?;

        let mut child = std::process::Command::new("cfssljson")
            .args(["-bare", "pki/ca"])
            .stdin(std::process::Stdio::piped())
            .spawn()
            .context("Failed to spawn cfssljson")?;

        let mut stdin = child.stdin.take().context("Failed to open stdin")?;
        std::io::Write::write_all(&mut stdin, &output.stdout).context("Failed to write to cfssljson stdin")?;
        drop(stdin);

        child.wait().context("cfssljson failed")?;

        println!("Generating Signer Certificate...");
        let sign_output = std::process::Command::new("cfssl")
            .args(["gencert", "-ca", "pki/ca.pem", "-ca-key", "pki/ca-key.pem", "-config", "ca-config.json", "-profile", "c2pa", "signer-csr.json"])
            .output()
            .context("Failed to run cfssl for signer")?;

        let mut sign_child = std::process::Command::new("cfssljson")
            .args(["-bare", "pki/signer"])
            .stdin(std::process::Stdio::piped())
            .spawn()
            .context("Failed to spawn cfssljson for signer")?;

        let mut sign_stdin = sign_child.stdin.take().context("Failed to open sign_stdin")?;
        std::io::Write::write_all(&mut sign_stdin, &sign_output.stdout).context("Failed to write to sign_child stdin")?;
        drop(sign_stdin);
        sign_child.wait().context("cfssljson for signer failed")?;
    } else if !Path::new("pki/signer.pem").exists() {
        println!("Generating Missing Signer Certificate...");
        let sign_output = std::process::Command::new("cfssl")
            .args(["gencert", "-ca", "pki/ca.pem", "-ca-key", "pki/ca-key.pem", "-config", "ca-config.json", "-profile", "c2pa", "signer-csr.json"])
            .output()
            .context("Failed to run cfssl for signer")?;

        let mut sign_child = std::process::Command::new("cfssljson")
            .args(["-bare", "pki/signer"])
            .stdin(std::process::Stdio::piped())
            .spawn()
            .context("Failed to spawn cfssljson for signer")?;

        let mut sign_stdin = sign_child.stdin.take().context("Failed to open sign_stdin")?;
        std::io::Write::write_all(&mut sign_stdin, &sign_output.stdout).context("Failed to write to sign_child stdin")?;
        drop(sign_stdin);
        sign_child.wait().context("cfssljson for signer failed")?;
    }
    Ok(())
}

async fn sign_handler(Json(req): Json<SignRequest>) -> impl IntoResponse {
    match perform_signing(&req.text, req.author.as_deref()).await {
        Ok(manifest_b64) => axum::response::Json(SignResponse { manifest: manifest_b64 }).into_response(),
        Err(e) => {
            eprintln!("Signing error: {:?}", e);
            (axum::http::StatusCode::INTERNAL_SERVER_ERROR, format!("Signing error: {}", e)).into_response()
        },
    }
}

async fn perform_signing(text: &str, author: Option<&str>) -> Result<String> {
    // 1. Define Manifest assertions via JSON
    let mut assertions = vec![
        json!({
            "label": "c2pa.actions",
            "data": {
                "actions": [
                    {
                        "action": "c2pa.created",
                        "digitalSourceType": "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia",
                        "softwareAgent": "Tekimax Sovereign Engine v1"
                    }
                ]
            }
        })
    ];

    // Add author if provided
    if let Some(author_name) = author {
        assertions.push(json!({
            "label": "st.person",
            "data": {
                "name": author_name
            }
        }));
    }

    let manifest_json = json!({
        "title": "Tekimax Sovereign Verified Content",
        "assertions": assertions
    });

    // 2. Create Builder
    let mut builder = Builder::from_json(&manifest_json.to_string())
        .map_err(|e| anyhow::anyhow!("Failed to create builder: {}", e))?;

    // 3. Add Custom Tekimax Seal Thumbnail (using set_thumbnail in 0.33)
    let seal_path = Path::new("assets/tekimax_seal.png");
    if seal_path.exists() {
        let seal_data = std::fs::read(seal_path).context("Failed to read seal image")?;
        let mut stream = Cursor::new(seal_data);
        builder.set_thumbnail("image/png", &mut stream)
            .map_err(|e| anyhow::anyhow!("Failed to set thumbnail: {}", e))?;
    }

    // 4. Create Signer
    let cert_path = Path::new("pki/signer.pem");
    let key_path = Path::new("pki/signer-key.pem");
    
    if !cert_path.exists() {
        return Err(anyhow::anyhow!("Signer Certificate missing at {:?}", cert_path));
    }

    // Read and clean cert (strip any cfssl comments)
    let cert_raw = std::fs::read_to_string(cert_path)?;
    let cert_clean = cert_raw.lines()
        .skip_while(|l| !l.starts_with("-----BEGIN"))
        .collect::<Vec<_>>()
        .join("\n");

    // Read and clean CA (for chain)
    let ca_path = Path::new("pki/ca.pem");
    let ca_raw = std::fs::read_to_string(ca_path)?;
    let ca_clean = ca_raw.lines()
        .skip_while(|l| !l.starts_with("-----BEGIN"))
        .collect::<Vec<_>>()
        .join("\n");
    
    // Bundle Chain: Leaf + Root
    let full_chain = format!("{}\n{}", cert_clean, ca_clean);
    std::fs::write(cert_path, &full_chain)?;

    let key_raw = std::fs::read_to_string(key_path)?;
    let key_clean = key_raw.lines()
        .skip_while(|l| !l.starts_with("-----BEGIN"))
        .collect::<Vec<_>>()
        .join("\n");
    std::fs::write(key_path, &key_clean)?;

    let signer = create_signer::from_files(cert_path, key_path, SigningAlg::Ps256, None)
        .map_err(|e| anyhow::anyhow!("Failed to create signer: {}", e))?;

    // 5. Sign the data
    let mut input = Cursor::new(text.as_bytes());
    let mut output = Cursor::new(Vec::new());
    
    builder.sign(signer.as_ref(), "c2pa", &mut input, &mut output)
        .map_err(|e| anyhow::anyhow!("C2PA Sign error: {}", e))?;

    Ok(BASE64.encode(output.into_inner()))
}
