// Centralized Configuration Constants
// This file acts as the "Control Panel" for the Sovereign Engine. 
// Adjusting these values changes the core behavior, security thresholds, and compliance signals of the API.

/// Default models used for general inference and routing.
pub const DEFAULT_CHAT_MODEL: &str = "granite3-guardian:latest";
pub const DEFAULT_ROUTER_MODEL: &str = "granite3-guardian:latest";

/// --- Global Development & Feature Flags ---
/// MOCK_MODE: If true, simulated backends are used for C2PA and Quantum modules.
pub const MOCK_MODE: bool = true;
/// EXPERIMENTAL_FEATURES: Enables early-stage or simulated features in the API.
pub const EXPERIMENTAL_FEATURES: bool = true;

/// --- Sovereign CA Integration ---
/// USE_SOVEREIGN_CA: If true, delegating signing requests to the dedicated sovereign-ca service.
pub const USE_SOVEREIGN_CA: bool = true;
/// SOVEREIGN_CA_URL: The internal URL for the Sovereign Certificate Authority.
pub const SOVEREIGN_CA_URL: &str = "http://localhost:11440";


/// Configuration for the Quantum Optimization module.
/// QUANTUM_PYTHON_CMD: The command used to invoke the Python interpreter.
/// QUANTUM_SCRIPT_PATH: The relative path to the Python optimization script.
pub const QUANTUM_PYTHON_CMD: &str = "python3";
pub const QUANTUM_SCRIPT_PATH: &str = "quantum_optimizer.py";

/// Default settings for the Sovereign Guard Node (Dockerized PII Redactor).
/// PII_CHECK_URL: The endpoint where the local Granite-Guardian container listens.
pub const DEFAULT_PII_CHECK_MODEL: &str = "granite3-guardian"; 
pub const PII_CHECK_URL: &str = "http://localhost:11435"; 

// --- Adaptive & Reliability ---
/// ADAPTIVE_VALIDATION_DECAY_RATE: The rate at which agent confidence decays per reasoning step (0.05 = 5%).
/// ADAPTIVE_VALIDATION_THRESHOLD: The minimum confidence required for a "Validated" status (0.8 = 80%).
pub const ADAPTIVE_VALIDATION_DECAY_RATE: f64 = 0.05;
pub const ADAPTIVE_VALIDATION_THRESHOLD: f64 = 0.8;

// --- Security Sandbox ---
/// Patterns actively blocked by the Security Isolation Sandbox to prevent SQL injection, 
/// shell command execution, path traversal, and Cross-Site Scripting (XSS).
pub const MALICIOUS_PATTERNS: &[&str] = &[
    // Database / SQL Injection
    "DROP TABLE", "UNION SELECT", "SELECT * FROM", "OR 1=1", "--;",
    // Filesystem / OS Commands
    "rm -rf", "chmod ", "chown ", "sudo ", "/etc/passwd", "../../",
    // Process / Environment
    "process.exit", "os.system", "__import__", "eval(", "exec(",
    // Web / JS / XSS
    "<script>", "alert(", "onerror=", "onclick=", "javascript:"
];


// --- Compliance & Trust ---
/// NIST_COMPLIANCE_PROFILE: The specific NIST AI Risk Management Framework profile label.
/// C2PA_SIGNING_ALGORITHM: The cryptographic algorithm label included in signed manifests.
pub const NIST_COMPLIANCE_PROFILE: &str = "NIST AI-600-1";
pub const C2PA_SIGNING_ALGORITHM: &str = "C2PA-SHA256-ES256";

// --- Infrastructure ---
/// The physical filename used for the local Sovereign audit trail (JSONL format).
pub const AUDIT_LOG_FILENAME: &str = "sovereign_audit.jsonl";

// --- Orchestration Prompts ---
/// Centralized System Messages and Prompt Templates used across the Sovereign Engine.

/// The base prompt for the L2 Cognition engine, enforcing JSON output and source verification.
pub const DEFAULT_ORCHESTRATOR_PROMPT: &str = r#"{policy}
Generate content for modality '{modality}'. Context: {context}. 
IMPORTANT: Your output MUST be valid JSON. 
You must verify your claims. 
In the 'sources' field, list at least 2 relevant academic or technical domain sources. 
In the 'references' field, list specific sections or URLs. 
If you need to use a tool, specify it in the 'tool_calls' array with 'function' and 'parameters'. 
Available tools (if enabled): quantum_optimize, adapt_content, isolate_context.
"#;

/// The specialized prompt for the PII Redaction Engine (Sovereign Guard Node).
pub const PROMPT_PII_REDACTION: &str = r#"You are a PII Redaction Engine. Analyze the following text. 
Replace any Persons, Locations, or Sensitive Data with [REDACTED]. 
Return the sanitized text exactly. 
If no PII is found, return the text unchanged. 
Do not output conversational text like 'No PII found' or 'Here is the text'. 
Text: {text}"#;

/// The template for modality-based learning content adaptation.
pub const PROMPT_ADAPTIVE_ENGINE: &str = "Adapt the following learning content for a '{modality}' learner. content: '{content}'";

/// The "Brain Stem" classification prompt for the Sovereign Intent Router.
pub const PROMPT_SOVEREIGN_ROUTER: &str = r#"You are the Sovereign Router. Your ONLY job is to classify user intent into one of the following tools:
- "quantum_optimize": For complex optimization, math, physics, or scheduling problems.
- "adapt_content": For educational, content rewriting, or modality adaptation.
- "isolate_context": For security checks, code analysis, or sanitization.
- "general_chat": For everything else.

Return ONLY a valid JSON object:
{
  "tool": "tool_name",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}"#;

/// The system prompt for the Deep Research Agent.
pub const PROMPT_DEEP_RESEARCH: &str = r#"You are a Deep Research Agent. 
You are given a query and a set of search results.
Your goal is to synthesize a comprehensive answer based ONLY on the provided search results.
Cite your sources using [1], [2], etc., corresponding to the search results.
If the search results are insufficient, state what is missing.
Format your response in Markdown."#;

/// Ollama Web Search API Endpoint.
pub const OLLAMA_SEARCH_URL: &str = "https://ollama.com/api/web_search";




