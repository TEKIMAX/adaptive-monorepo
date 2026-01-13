use serde::{Deserialize, Serialize};
use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use std::path::Path;
use std::sync::Mutex;
use lazy_static::lazy_static;

const DB_PATH: &str = "sovereign_db.json";

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Project {
    pub project_id: String,
    pub api_key_hash: String, // Storing hash for security
    pub developer_did: String,
    pub created_at: String,
    pub system_policy: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Default)]
struct Database {
    projects: Vec<Project>,
}

lazy_static! {
    static ref DB_MUTEX: Mutex<()> = Mutex::new(());
}

pub fn save_project(project: Project) -> Result<(), Box<dyn std::error::Error>> {
    let _lock = DB_MUTEX.lock().unwrap();
    
    let mut db = load_db()?;
    // Check if project exists and update it, or push new
    if let Some(pos) = db.projects.iter().position(|p| p.project_id == project.project_id) {
        db.projects[pos] = project;
    } else {
        db.projects.push(project);
    }
    
    let json = serde_json::to_string_pretty(&db)?;
    let mut file = OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .open(DB_PATH)?;
    file.write_all(json.as_bytes())?;
    
    Ok(())
}

pub fn get_project(project_id: &str) -> Option<Project> {
    let _lock = DB_MUTEX.lock().unwrap();
    let db = load_db().ok()?;
    db.projects.into_iter().find(|p| p.project_id == project_id)
}

fn load_db() -> Result<Database, Box<dyn std::error::Error>> {
    if !Path::new(DB_PATH).exists() {
        return Ok(Database::default());
    }
    
    let mut file = File::open(DB_PATH)?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;
    
    if content.trim().is_empty() {
        return Ok(Database::default());
    }
    
    let db: Database = serde_json::from_str(&content)?;
    Ok(db)
}
