use std::env;

pub fn get_inference_url() -> String {
    env::var("OLLAMA_API_URL").unwrap_or_else(|_| "http://localhost:11434".to_string())
}

pub fn get_inference_key() -> Option<String> {
    env::var("OLLAMA_API_KEY").ok()
}
