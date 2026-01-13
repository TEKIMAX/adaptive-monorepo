use axum::routing::{delete, get, head, post};
use axum::Router;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

mod c2pa_signer;
mod utils;
pub mod version;
pub mod config;
mod handlers;
mod storage;
mod pii_scrubber;
mod audit;
mod inference_router;

use handlers::{adaptive, crypto, docs, library, llm, orchestrator, policy, quantum, research, router, sovereign, stream, system, auth};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    // --- Protected Routes (Require API Key) ---
    let api_routes = Router::new()
        // --- Inference ---
        .route("/api/llm", post(llm::call_llm))
        
        // --- Model Registry ---
        .route("/api/tags", get(library::list_models_handler))
        .route("/api/tokenize", post(library::tokenize_handler))
        .route("/api/detokenize", post(library::detokenize_handler))
        
        // --- System ---
        .route("/api/version", get(system::get_version_handler))
        
        // --- Adaptive Architecture ---
        .route("/v1/stream-learning-content", post(adaptive::stream_learning_handler))
        .route("/v1/agent/validate", post(adaptive::agent_validate_handler))
        .route("/v1/activity-log", get(adaptive::activity_log_handler))
        .route("/v1/signoff", post(adaptive::signoff_handler))
        .route("/v1/security/isolate", post(adaptive::security_isolate_handler))
        
        // --- Quantum Optimization ---
        .route("/v1/quantum/optimize", post(quantum::optimize_handler))
        .route("/v1/sovereign/run", post(sovereign::run_sovereign_service))
        .route("/v1/root_node/process", post(orchestrator::process_root_node))
        .route("/v1/router/classify", post(router::classify_intent_handler))
        
        // --- Cryptography Service (Stateless) ---
        .route("/v1/crypto/key", post(crypto::generate_key_handler))
        .route("/v1/crypto/encrypt", post(crypto::encrypt_handler))
        .route("/v1/crypto/decrypt", post(crypto::decrypt_handler))
        
        // --- Research ---
        .route("/v1/research/deep", post(research::deep_research_handler))
        .route("/v1/research/stream", post(research::stream_research_handler))
        .route("/v1/chat/stream", post(stream::chat_stream_handler))
        .route("/v1/portal/session", post(auth::create_portal_session_handler))
        
        // --- School Policy ---
        .route("/v1/project/policy", post(policy::update_policy))

        
        // Apply Auth Middleware to all above
        .layer(axum::middleware::from_fn(auth::auth_middleware));

    let app = Router::new()
        .merge(api_routes)
        // --- Public Routes (Docs) ---
        .route("/docs", get(docs::scalar_docs))
        .route("/openapi.yaml", get(docs::openapi_spec))
        .route("/logo.png", get(docs::serve_logo))
        .route("/v1/organizations", post(auth::create_organization_handler))
        .route("/v1/portal/widget-token", post(auth::create_widget_token_handler))
        
        .layer(CorsLayer::permissive()
            .expose_headers([axum::http::HeaderName::from_static("x-c2pa-manifest")]))
        .layer(tower_http::set_header::SetResponseHeaderLayer::overriding(
            axum::http::HeaderName::from_static("x-ai-assisted"),
            axum::http::HeaderValue::from_static("true"),
        ));

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    println!("Server running at http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
