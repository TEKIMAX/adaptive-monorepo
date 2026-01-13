use axum::{Json, response::IntoResponse};
use serde::Deserialize;
use serde_json::json;
use crate::storage;

#[derive(Deserialize)]
pub struct UpdatePolicyRequest {
    pub project_id: String,
    pub policy_text: String,
}

pub async fn update_policy(Json(req): Json<UpdatePolicyRequest>) -> impl IntoResponse {
    let mut project = match storage::get_project(&req.project_id) {
        Some(p) => p,
        None => return Json(json!({ "error": "Project not found", "code": 404 })).into_response(),
    };

    project.system_policy = Some(req.policy_text);

    match storage::save_project(project) {
        Ok(_) => Json(json!({ "status": "success", "message": "Policy updated" })).into_response(),
        Err(e) => Json(json!({ "error": format!("Storage failure: {}", e), "code": 500 })).into_response(),
    }
}
