# Tekimax API Hook System: Developer Opt-In Design

> **Objective**: Allow developers ("Vibe Coders" or Startups) to "Opt-In" to Tekimax's "Secure by Design" features (C2PA, Audit, Quantum) via a single hook endpoint, without rewriting their entire application.

---

## 1. The Concept: "The Sidecar Service"
Instead of forcing developers to host their entire app on Tekimax, they can simply call our **Unified Service Endpoint** (`/v1/sovereign/run`) whenever they need a specific "Sovereign Service."

*   **Developer Action**: Sends a JSON payload to one endpoint.
*   **Tekimax Action**: Parses the `services` list, runs the requested modules (in Rust/Quantum), and returns the specific cryptographic or compute results.
*   **Benefit**: "Opt-In" security. Day 1 protection with 1 API call.

---

## 2. The Service Map (Table)

The developer calls **`POST /v1/sovereign/run`**. The behavior changes based on the **`services`** parameter.

| Feature Name (Service) | Opt-In Use Case | Input Parameters (Payload) | Tekimax Action | Result / Output |
| :--- | :--- | :--- | :--- | :--- |
| **`secure_onboarding`** | **Startups**: "Day 1" Project Setup | `project_name`, `developer_did` (Digital ID) | Generates a persistent **C2PA Signing Key** & initializes an immutable **Audit Log** for this project. | `project_id`, `api_key`, `audit_ledger_address` |
| **`sign_content`** | **Trust**: Signing AI outputs (Images/Text) | `content_blob` (base64), `author_id` | **C2PA Engine**: Hashes content, appends developer ID, cryptographically signs it. | `c2pa_manifest_cbor`, `signature_verification_url` |
| **`quantum_optimize`** | **Compute**: Complex Logistics / Routing | `problem_type` (e.g., "route"), `dataset_json` | **Quantum Bridge**: Maps problem to Qiskit circuit, runs on Hybrid Simulator/IBM. | `optimized_parameters_json`, `energy_score` |
| **`nist_audit_log`** | **Compliance**: NIST RMF Tracking | `event_type`, `risk_level`, `decision_metadata` | **Governance Engine**: Logs event to non-repudiable local ledger adhering to NIST AI-600-1. | `log_entry_hash`, `compliance_status: "OK"` |
| **`pii_scrub`** | **Privacy**: "Sovereignty Wall" | `raw_prompt_text` | **Local NLP**: Detects and redacts PII/PHI *before* it leaves the secure enclave. | `sanitized_text`, `redaction_report_json` |

---

## 3. Example Usage Code (Vibe Coding Friendly)

A developer wants to **Sanitize** a prompt and then **Sign** the result. They send one request:

```json
// POST /v1/sovereign/run
{
  "project_id": "proj_123",
  "services": ["pii_scrub", "sign_content"],
  "payload": {
    "raw_prompt_text": "Patient John Doe has diabetes...",
    "author_id": "Dr. Smith"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "results": {
    "pii_scrub": {
      "sanitized_text": "Patient [REDACTED] has diabetes..."
    },
    "sign_content": {
      "signature": "sha256:9f86d081884c7d..."
    }
  }
}
```
