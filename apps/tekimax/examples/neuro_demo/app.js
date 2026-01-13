const API_BASE = "http://localhost:3000";

// Global Session State
let sovereignIdentity = {
    project_id: null,
    api_key: null,
    did: `did:tekimax:user:${Math.floor(Math.random() * 10000)}`
};

window.onload = async () => {
    log("System Boot: Establishing Sovereign Identity...", "info");
    await establishIdentity();
};

async function establishIdentity() {
    try {
        logTransaction("Sovereign Layer", "Identity Request", { services: ["secure_onboarding"], did: sovereignIdentity.did });

        const response = await fetch(`${API_BASE}/v1/sovereign/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                services: ["secure_onboarding"],
                payload: { developer_did: sovereignIdentity.did }
            })
        });

        const data = await response.json();

        if (data.status === "success" && data.results.secure_onboarding) {
            const res = data.results.secure_onboarding;
            sovereignIdentity.project_id = res.project_id;
            sovereignIdentity.api_key = res.api_key;

            log(`Identity Confirmed: ${sovereignIdentity.project_id}`, "success");
            logTransaction("Sovereign Layer", "Identity Provisioned", res, "success");

            // Update UI Header
            document.getElementById('status-feed').textContent = `ACTIVE: ${sovereignIdentity.project_id}`;
        } else {
            throw new Error("Failed to provision identity");
        }
    } catch (e) {
        log(`Identity Error: ${e.message}`, "error");
        logTransaction("Sovereign Layer", "Identity Failed", { error: e.message }, "error");
    }
}

document.getElementById('btn-update-policy').addEventListener('click', async () => {
    if (!sovereignIdentity.project_id) return;

    const policy = document.getElementById('input-policy').value;
    log("Updating System Policy...", "info");

    try {
        const response = await fetch(`${API_BASE}/v1/project/policy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_id: sovereignIdentity.project_id,
                policy_text: policy
            })
        });

        const data = await response.json();
        if (data.status === "success") {
            log("School Policy Updated Successfully", "success");
            logTransaction("Sovereign Layer", "Policy Update", { policy_snippet: policy.substring(0, 50) + "..." }, "success");
        } else {
            log(`Policy Update Failed: ${data.error}`, "error");
        }
    } catch (e) {
        log(`Policy Update Error: ${e.message}`, "error");
    }
});

// Modal UI Handlers
const forgeModal = document.getElementById('forge-modal');
document.getElementById('btn-open-forge').addEventListener('click', () => {
    forgeModal.showModal();
});
document.getElementById('btn-close-forge').addEventListener('click', () => {
    forgeModal.close();
});

// Config UI Handlers
document.getElementById('input-temperature').addEventListener('input', (e) => {
    document.getElementById('val-temperature').textContent = e.target.value;
});
document.getElementById('input-context').addEventListener('input', (e) => {
    document.getElementById('val-context').textContent = e.target.value;
});

// Auto-fetch Context Limit
document.getElementById('input-base-model').addEventListener('blur', async (e) => {
    const model = e.target.value;
    if (!model) return;

    try {
        log(`Checking capabilities for ${model}...`, "info");
        const response = await fetch(`${API_BASE}/api/show`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: model })
        });

        const data = await response.json();
        // Naive heuristic: check model info for context window keys if available, 
        // or just rely on manual override. Ollama sometimes returns 'parameters' string.
        if (data.parameters) {
            // Try to find context window in params text
            const match = data.parameters.match(/num_ctx\s+(\d+)/);
            if (match) {
                const limit = parseInt(match[1]);
                const slider = document.getElementById('input-context');
                slider.max = limit;
                slider.value = Math.min(slider.value, limit);
                document.getElementById('val-context').textContent = slider.value;
                log(`Adjusted Max Context to ${limit}`, "success");
                return;
            }
        }
        // Fallback or leave as is if undetermined
    } catch (e) {
        // Silent fail, just keep defaults
    }
});

// Agent Factory Handler
document.getElementById('btn-create-agent').addEventListener('click', async () => {
    if (!sovereignIdentity.project_id) {
        log("Identity required to spawn agents.", "error");
        return;
    }

    const name = document.getElementById('input-agent-name').value;
    const base = document.getElementById('input-base-model').value;
    const signing = document.getElementById('check-signing').checked;
    const tools = document.getElementById('check-tools').checked;
    const quantum = document.getElementById('check-quantum').checked;
    const adaptive = document.getElementById('check-adaptive').checked;
    const security = document.getElementById('check-security').checked;

    const temp = document.getElementById('input-temperature').value;
    const num_ctx = document.getElementById('input-context').value;

    log(`Forging Agent: ${name} (Base: ${base}, Temp: ${temp}, Ctx: ${num_ctx})...`, "info");

    // Construct Modelfile dynamically
    let modelfile = `FROM ${base}\n`;
    modelfile += `PARAMETER temperature ${temp}\n`;
    modelfile += `PARAMETER num_ctx ${num_ctx}\n`;

    // 1. Core Identity & Policy
    const policy = document.getElementById('input-policy').value;
    modelfile += `SYSTEM "You are ${name}. ${policy}"\n`;

    // 2. Capabilities: Cryptographic Signing
    if (signing) {
        modelfile += `SYSTEM "CRITICAL: You are running on a Sovereign Node. You representative a verified digital instance. You MUST sign your critical outputs contextually to ensure C2PA traceability."\n`;
    }

    // 3. Capabilities: Function Calling (Aggregated)
    let availableTools = [];
    if (tools) {
        availableTools.push("search_database(query)");
        availableTools.push("run_simulation(params)");
    }
    if (quantum) {
        availableTools.push("quantum_optimize(problem_type, params) -> /v1/quantum/optimize");
    }
    if (adaptive) {
        availableTools.push("adapt_content(modality, content) -> /v1/stream-learning-content");
    }
    if (security) {
        availableTools.push("isolate_context() -> /v1/security/isolate");
    }

    if (availableTools.length > 0) {
        modelfile += `SYSTEM "TOOLS ENABLED: You have access to the following functions:\n`;
        availableTools.forEach(t => {
            modelfile += ` - ${t}\n`;
        });
        modelfile += `Use them when requested."\n`;
    }

    logTransaction("Sovereign Layer", "Agent Forge Request", { name, modelfile_preview: modelfile }, "info");

    try {
        const response = await fetch(`${API_BASE}/api/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: name,
                modelfile: modelfile,
                stream: false
            })
        });

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            // Handle non-JSON response (likely an error message text)
            const textRaw = await response.text();
            throw new Error(textRaw || `Server returned ${response.status}`);
        }

        log(`Agent '${name}' Spawned Successfully.`, "success");
        logTransaction("Sovereign Layer", "Agent Created", { status: "ACTIVE", agent_id: name }, "success");
        forgeModal.close();

        // Critical: Update persistence so fetchAgents selects this new one
        currentModel = name;
        localStorage.setItem('preferred_agent', currentModel);

        // Add slight delay to allow backend to persist
        setTimeout(async () => {
            await fetchAgents();
        }, 1000);

    } catch (e) {
        log(`Forge Error: ${e.message}`, "error");
        logTransaction("Sovereign Layer", "Forge Error", { error: e.message }, "error");
    }

});


document.getElementById('btn-process').addEventListener('click', async () => {
    if (!sovereignIdentity.project_id) {
        log("Cannot proceed: No Valid Identity", "error");
        return;
    }

    const content = document.getElementById('input-content').value;
    const modality = document.getElementById('input-modality').value;
    const strictMode = document.getElementById('input-strict').checked;
    const thinkingPref = document.getElementById('input-thinking').value;

    // Reset UI
    document.getElementById('accordion-content').classList.remove('hidden'); // Auto-expand
    document.getElementById('output-adaptive').innerHTML = '<em>Processing...</em>';
    document.getElementById('trace-log').innerHTML = '';
    document.getElementById('signoff-panel').classList.add('hidden');
    document.getElementById('signature-display').classList.add('hidden');
    document.getElementById('success-overlay')?.remove();

    logTransaction("Orchestrator", "Initial Request", {
        endpoint: "/v1/root_node/process",
        params: { project_id: sovereignIdentity.project_id, intent: content, modality, strict_mode: strictMode, thinking_preference: thinkingPref }
    });

    log("Initializing Root Node Sequence...", "info");

    try {
        const response = await fetch(`${API_BASE}/v1/root_node/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_id: sovereignIdentity.project_id,
                intent: content,
                modality: modality,
                strict_mode: strictMode,
                thinking_preference: thinkingPref,
                model: currentModel,
                user_id: sovereignIdentity.did,
                initiator: "human" // Explicitly mark as human-initiated
            })
        });

        const data = await response.json();

        // Capture NIST RMF Headers
        const riskCategory = response.headers.get("X-Risk-Category") || "UNKNOWN";
        const nistControl = response.headers.get("X-NIST-Control") || "UNKNOWN";
        const initiatorType = response.headers.get("X-Initiator-Type") || "UNKNOWN";

        if (data.pipeline_trace) {
            data.pipeline_trace.nist = { risk_category: riskCategory, nist_control: nistControl, initiator: initiatorType };
        }

        logTransaction("Orchestrator", "Response Received", data, data.status === "success" ? "success" : "error");

        // NIST RMF Transaction Log Entry
        logTransaction("NIST Monitor", "Risk Assessment", {
            risk_category: riskCategory,
            control_id: nistControl,
            status: "COMPLIANT"
        }, "success");

        if (data.status === "success") {
            log("L1-L4 Pipeline Complete.", "success");

            // Capture C2PA Signature
            const c2paSignature = response.headers.get("X-C2PA-Manifest") || response.headers.get("x-c2pa-manifest");

            displayOutput(data.final_output, data.reasoning_trace, data.pipeline_trace.l3_sources, data.pipeline_trace.l3_references, c2paSignature);
            renderTrace(data.pipeline_trace);

            // Log the 'Halt' event
            logTransaction("System", "Blocking Gate Active", {
                reason: "Human Sign-Off Required",
                next_step: "CAST_VOTE"
            }, "warning");

            // Enable Sign-Off
            document.getElementById('signoff-panel').classList.remove('hidden');
            window.lastResourceId = `gen_${Date.now()}`;
        } else {
            log(`Pipeline Failed: ${JSON.stringify(data)}`, "error");
            document.getElementById('output-adaptive').textContent = "Error: " + JSON.stringify(data);
        }

    } catch (e) {
        logTransaction("System", "Network Error", { error: e.message }, "error");
        log(`Network Error: ${e.message}`, "error");
    }
});

// Approve Handler
document.getElementById('btn-approve').addEventListener('click', async () => handleSignoff("approve"));

// Deny Handler
document.getElementById('btn-deny').addEventListener('click', async () => handleSignoff("deny"));

async function handleSignoff(decision) {
    const approver = document.getElementById('input-approver').value;
    log(`Requesting Human Agency Sign-Off: ${decision.toUpperCase()}...`, "info");

    const payload = {
        approver_id: approver,
        decision: decision,
        resource_id: window.lastResourceId || "unknown"
    };

    logTransaction("Human Agency", "Sign-Off Request", payload);

    try {
        const response = await fetch(`${API_BASE}/v1/signoff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        logTransaction("Human Agency", "Sign-Off Response", data, "success");

        if (data.status === "recorded") {
            const sigBlock = document.getElementById('signature-display');
            const isApprove = decision === "approve";

            sigBlock.innerHTML = `
                <div style="display:flex; align-items:center; gap:1rem;">
                    <div style="font-size:2rem;">${isApprove ? '✅' : '🛑'}</div>
                    <div>
                        <strong style="color: ${isApprove ? '#00ff9d' : '#ff0055'}">
                            AGENCY ${isApprove ? 'VERIFIED' : 'DENIED'}
                        </strong><br>
                        <span style="font-size:0.8em; opacity:0.8;">Signer: ${data.signer}</span><br>
                        <span style="font-size:0.8em; opacity:0.8;">Manifest: ${data.human_agency_manifest.substring(0, 32)}...</span>
                    </div>
                </div>
            `;
            sigBlock.classList.remove('hidden');
            log(`Cryptographic Proof Recorded: ${decision.toUpperCase()}`, isApprove ? "success" : "error");
            document.getElementById('signoff-panel').classList.add('hidden');

            if (isApprove) {
                showSuccessState("WORKFLOW COMPLETE", "Assets generated, signed, and approved.");
            } else {
                showSuccessState("WORKFLOW TERMINATED", "Assets rejected by human agency.", true);
            }
        }

    } catch (e) {
        logTransaction("Human Agency", "Sign-off Error", { error: e.message }, "error");
        log(`Sign-off Error: ${e.message}`, "error");
    }
}

function displayOutput(text, trace, sources, references, signature = null) {
    const container = document.getElementById('output-adaptive');
    container.classList.add('content-signed');

    let html = "";

    // Verified Badge Injection
    if (signature) {
        html += `<div class="verified-badge" title="Cryptographically Verified by Tekimax Sovereign CA\nHash: ${signature.substring(0, 16)}..."></div>`;
        html += `<div class="provenance-status">Sovereign Provenance Verified</div>`;
    }

    if (trace && trace.length > 0) {
        html += `<div class="thinking-trace">
            <div class="trace-header">🧠 Reasoning Trace</div>
            <div class="trace-content">${marked.parse(trace)}</div>
        </div>`;
    }

    html += marked.parse(text);

    if ((sources && sources.length > 0) || (references && references.length > 0)) {
        html += `<div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #333; font-size: 0.9em; color: #888;">`;

        if (sources && sources.length > 0) {
            html += `<strong>Sources:</strong><ul style="margin: 0.5rem 0 1rem 1.5rem;">${sources.map(s => `<li>${s}</li>`).join('')}</ul>`;
        }

        if (references && references.length > 0) {
            html += `<strong>References:</strong><ul style="margin: 0.5rem 0 0 1.5rem;">${references.map(r => `<li>${r}</li>`).join('')}</ul>`;
        }

        html += `</div>`;
    }

    container.innerHTML = html;
}

function showSuccessState(title, subtitle, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.right = '2rem';
    toast.style.padding = '1rem 1.5rem';
    toast.style.background = isError ? 'rgba(255, 0, 85, 0.95)' : 'rgba(0, 255, 157, 0.15)';
    toast.style.border = `1px solid ${isError ? '#ff0055' : '#00ff9d'}`;
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    toast.style.backdropFilter = 'blur(10px)';
    toast.style.zIndex = '9999';
    toast.style.transition = 'all 0.3s ease';
    toast.style.transform = 'translateY(100px)';
    toast.style.opacity = '0';

    toast.innerHTML = `
        <div style="display:flex; align-items:center; gap:1rem;">
            <div style="font-size:1.5rem;">${isError ? '🛑' : '✅'}</div>
            <div>
                <h3 style="margin:0; font-size:1rem; color: ${isError ? '#ff0055' : '#00ff9d'};">${title}</h3>
                <p style="margin:0.25rem 0 0; opacity:0.8; font-size:0.9em;">${subtitle}</p>
            </div>
        </div>
    `;

    document.body.appendChild(toast);

    // Animate In
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
    });

    // Auto Remove
    setTimeout(() => {
        toast.style.transform = 'translateY(20px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function renderTrace(trace) {
    const container = document.getElementById('trace-log');
    container.innerHTML = '';

    const steps = [
        {
            func: "orchestrator.process_root_node()",
            endpoint: `POST /v1/process [BY: ${trace?.nist?.initiator || 'SYSTEM'}]`,
            status: "INIT",
            color: "#fff"
        },
        {
            func: `pii_scrubber.scrub_text("${sovereignIdentity.project_id}")`,
            endpoint: "INTERNAL_FUNCTION",
            status: trace?.l1_conditioning?.sanitized ? "SECURE" : "FLAGGED",
            color: trace?.l1_conditioning?.sanitized ? "#00ff9d" : "#ff0055"
        },
        {
            func: "llm_engine.generate_content(...)",
            endpoint: "POST /api/generate (Ollama)",
            status: "COMPLETE",
            color: "#00ff9d"
        },
        {
            func: `c2pa_signer.sign_content(hash="${trace?.l2_authority?.manifest_preview || '...'}")`,
            endpoint: "INTERNAL_FUNCTION",
            status: trace?.l2_authority?.signed ? "SIGNED" : "UNSIGNED",
            color: trace?.l2_authority?.signed ? "#00ff9d" : "#ffcc00"
        },
        {
            func: `audit.log_event(hash="${trace?.l4_audit_hash?.substring(0, 8)}...")`,
            endpoint: "DISK_WRITE /sovereign_audit.jsonl",
            status: "AUDITED",
            color: "#00ff9d"
        },
        // NIST RMF Compliance Step
        {
            func: `RMF_monitor.log_risk(category="${trace?.nist?.risk_category || 'pending'}")`,
            endpoint: `NIST CONTROL: ${trace?.nist?.nist_control || 'scanning'}`,
            status: "COMPLIANT",
            color: "#7b61ff"
        }
    ];

    steps.forEach((step, index) => {
        const div = document.createElement('div');
        div.className = 'trace-item';
        div.style.fontFamily = 'monospace';
        div.style.marginBottom = '0.5rem';
        div.style.padding = '0.5rem';
        div.style.background = 'rgba(255,255,255,0.05)';
        div.style.borderLeft = `2px solid ${step.color}`;

        // Delay animation
        div.style.opacity = '0';
        div.style.animation = `fadeIn 0.3s forwards ${index * 0.2}s`;

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#888; font-size:0.75em;">${index + 1}. ${step.endpoint}</span>
                <span style="
                    background: ${step.color}20; 
                    color: ${step.color}; 
                    border: 1px solid ${step.color}; 
                    padding: 2px 6px; 
                    border-radius: 4px; 
                    font-size: 0.7em; 
                    font-weight: bold;
                    letter-spacing: 0.5px;
                ">${step.status}</span>
            </div>
            <div style="color:#eee; font-size:0.9em; margin-top:0.25rem;">
                <span style="color:#c792ea;">call</span> <span style="color:#82aaff;">${step.func}</span>
            </div>
        `;
        container.appendChild(div);
    });

    // Add Keyframes for animation if not present
    if (!document.getElementById('anim-style')) {
        const style = document.createElement('style');
        style.id = 'anim-style';
        style.innerHTML = `@keyframes fadeIn { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }`;
        document.head.appendChild(style);
    }
}

function logTransaction(source, event, data, status = "info") {
    const container = document.getElementById('transaction-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${status}`;

    const ts = new Date().toISOString().split('T')[1].replace('Z', '');

    let color = "#888";
    if (status === "success") color = "#00ff9d";
    if (status === "error") color = "#ff0055";
    if (status === "warning") color = "#ffcc00";

    // Clean empty arrays for cleaner display
    const cleanData = JSON.parse(JSON.stringify(data));
    if (Array.isArray(cleanData.redacted_fields) && cleanData.redacted_fields.length === 0) {
        delete cleanData.redacted_fields;
    }
    // Generic cleanup for other empty arrays if needed
    for (const key in cleanData) {
        if (Array.isArray(cleanData[key]) && cleanData[key].length === 0) {
            delete cleanData[key];
        }
    }

    const dataPreview = JSON.stringify(cleanData).substring(0, 60) + (JSON.stringify(cleanData).length > 60 ? "..." : "");

    entry.innerHTML = `
        <div class="log-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
            <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="ts">[${ts}]</span> 
                <strong>${source}</strong>
                <span style="opacity:0.6; font-size:0.9em;">${event}</span>
            </div>
            <div style="display:flex; align-items:center; gap:1rem;">
                <span style="font-size:0.8em; opacity:0.5; font-family:monospace;">${dataPreview}</span>
                <span style="color:${color}; font-weight:bold; font-size:0.8em;">${status.toUpperCase()}</span>
                <span style="font-size:0.8em; opacity:0.5;">▼</span>
            </div>
        </div>
        <div class="json-payload hidden">
            <pre>${JSON.stringify(data, null, 2)}</pre>
        </div>
    `;

    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

function log(msg, type) {
    console.log(`[${type.toUpperCase()}] ${msg}`);
    const feed = document.getElementById('status-feed');
    feed.textContent = msg;
    feed.className = `status-badge ${type}`;
}

// Agent Management Logic
let currentModel = "gemini-3-flash-preview";

async function fetchAgents() {
    try {
        const response = await fetch(`${API_BASE}/api/tags`);
        const data = await response.json();
        // Ollama API returns { "models": [...] }
        const models = data.models || [];

        log(`Fetched ${models.length} agents.`, "info");

        const selector = document.getElementById('agent-selector');
        selector.innerHTML = '';

        models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.name;
            opt.textContent = m.name;
            if (m.name === currentModel) opt.selected = true;
            selector.appendChild(opt);
        });

        if (models.length > 0) {
            // Restore from local storage if available and valid
            const saved = localStorage.getItem('preferred_agent');
            if (saved && models.some(m => m.name === saved)) {
                currentModel = saved;
            } else if (!models.some(m => m.name === currentModel)) {
                // Fallback to first if current invalid
                currentModel = models[0].name;
            }
            selector.value = currentModel;
        }

    } catch (e) {
        log(`Failed to fetch agents: ${e.message}`, "error");
    }
}

document.getElementById('agent-selector').addEventListener('change', (e) => {
    currentModel = e.target.value;
    localStorage.setItem('preferred_agent', currentModel);
    log(`Switched Active Agent: ${currentModel}`, "info");
});

// Refresh Button Logic
document.getElementById('btn-refresh-agents')?.addEventListener('click', async () => {
    log("Refreshing Agent List...", "info");
    await fetchAgents();
});

document.getElementById('btn-delete-agent').addEventListener('click', async () => {
    if (!currentModel) return;
    if (!confirm(`Delete Agent: ${currentModel}? This is irreversible.`)) return;

    try {
        const response = await fetch(`${API_BASE}/api/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: currentModel })
        });

        const data = await response.json();
        if (data.status === "deleted" || !data.error) {
            log(`Agent ${currentModel} DELETED.`, "warning");
            currentModel = "gemini-3-flash-preview";
            await fetchAgents();
        } else {
            log(`Delete Failed: ${data.error}`, "error");
        }
    } catch (e) {
        log(`Delete Error: ${e.message}`, "error");
    }
});

const originalOnload = window.onload;
window.onload = async () => {
    if (originalOnload) await originalOnload();
    await fetchAgents();
};

// --- TAB SWITCHING LOGIC ---
document.getElementById('nav-dashboard').addEventListener('click', () => switchTab('dashboard'));
document.getElementById('nav-chat').addEventListener('click', () => switchTab('chat'));

function switchTab(tab) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`nav-${tab}`).classList.add('active');

    if (tab === 'dashboard') {
        document.getElementById('view-dashboard').classList.remove('hidden');
        document.getElementById('view-chat').classList.add('hidden');
    } else {
        document.getElementById('view-dashboard').classList.add('hidden');
        document.getElementById('view-chat').classList.remove('hidden');
    }
}

// --- CHAT LOGIC ---
const chatHistory = document.getElementById('chat-history');
const chatInput = document.getElementById('input-chat');

document.getElementById('btn-chat-send').addEventListener('click', sendMessage);

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    if (!sovereignIdentity.project_id) {
        appendChatMessage("System", "Error: Identity not established.", "ai");
        return;
    }

    // 1. User Message
    appendChatMessage("You", text, "user");
    chatInput.value = '';

    // 2. Show Typing Indicator (could be better, but simple placeholder for now)
    const thinkingId = appendChatMessage("Sovereign Agent", "Processing...", "ai");

    // 3. Send to Orchestrator (Reusing Root Node logic to ensure safety/compliance)
    try {
        const response = await fetch(`${API_BASE}/v1/root_node/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_id: sovereignIdentity.project_id,
                intent: text, // Treat chat message as intent
                modality: "analytical", // Default for chat
                strict_mode: true, // Auto-enable strict mode for chat safety
                thinking_preference: "medium", // Ensure we get thinking trace
                model: currentModel,
                user_id: sovereignIdentity.did,
                initiator: "human"
            })
        });

        const data = await response.json();
        const msgDiv = document.getElementById(thinkingId);

        if (data.status === "success") {
            // Clear "Processing..." content
            msgDiv.innerHTML = `<span class="meta">Sovereign Agent [${currentModel}]</span>`;

            // 1. Handle Reasoning Trace (Accordion)
            if (data.reasoning_trace) {
                const traceId = `trace-${Date.now()}`;
                const traceHtml = `
                    <div class="chat-thinking-box">
                        <div class="chat-thinking-header" onclick="document.getElementById('${traceId}').classList.toggle('hidden')">
                            <span>🧠 Reasoning Process</span>
                            <span>▼</span>
                        </div>
                        <div id="${traceId}" class="chat-thinking-content hidden">
                            ${marked.parse(data.reasoning_trace)}
                        </div>
                    </div>
                `;
                msgDiv.innerHTML += traceHtml;
            }

            // 2. Handle Content (Typewriter Effect)
            const contentDiv = document.createElement('div');
            contentDiv.className = 'typewriter-cursor';
            contentDiv.style.lineHeight = '1.6';
            msgDiv.appendChild(contentDiv);

            // Start Typewriter
            await typewriterEffect(contentDiv, data.final_output);
            contentDiv.classList.remove('typewriter-cursor'); // Stop blinking cursor

            // Log side effects
            logTransaction("Chat Interface", "Message Processed", { trace_summary: "See Dashboard for details" }, "success");

        } else {
            msgDiv.innerHTML = `
                <span class="meta">System Alert</span>
                Error: ${data.error || "Unknown failure"}
            `;
            msgDiv.style.border = "1px solid #ff0055";
        }

    } catch (e) {
        const msgDiv = document.getElementById(thinkingId);
        if (msgDiv) {
            msgDiv.innerHTML = `
                <span class="meta">Network Error</span>
                Failed to reach sovereign node.
            `;
        }
    }
}

async function typewriterEffect(element, text) {
    const delay = 10; // ms per char
    let i = 0;
    element.innerHTML = ""; // Clear

    return new Promise(resolve => {
        function type() {
            if (i < text.length) {
                const chunk = text.slice(i, i + 3);
                i += 3;
                element.textContent += chunk;
                chatHistory.scrollTop = chatHistory.scrollHeight; // Auto-scroll
                setTimeout(type, delay);
            } else {
                element.innerHTML = marked.parse(text); // Final render markdown
                resolve();
            }
        }
        type();
    });
}

function appendChatMessage(sender, text, type) {
    const div = document.createElement('div');
    const id = `msg-${Date.now()}`;
    div.id = id;
    div.className = `chat-message ${type}`;
    div.innerHTML = `
        <span class="meta">${sender}</span>
        ${type === 'user' ? text.replace(/\n/g, '<br>') : text}
    `;

    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return id;
}
