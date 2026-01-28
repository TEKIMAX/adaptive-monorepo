export const CONTENT_FEATURES = {
    "adaptive_content": {
        title: "Adaptive AI Content",
        desc: "Modality-aware content generation that automatically adjusts complexity and format (Visual/Auditory/Textual) based on real-time user needs.",
        endpoint: "/v1/stream-learning-content",
        method: "POST",
        params: [
            { name: "prompt", type: "string", description: "The learning query or topic", required: true },
            { name: "modality_context", type: "object", description: "Cognitive modality preferences", required: true },
            { name: "session_depth", type: "integer", description: "Engagement depth (0-10)", default: 0 },
            { name: "provenance_enabled", type: "boolean", description: "Enable cryptographic signing", default: true }
        ],
        metadata_schema: ["interaction_id", "source", "digital_signature", "supervisory_check", "compliance_flags"],
        stats: [
            { label: "Latency", value: "Live", color: "text-emerald-400" },
            { label: "Adaptation", value: "Dynamic", color: "text-tekimax-blue" },
            { label: "Signatures", value: "Verified", color: "text-white" }
        ],
        action: "Generate Content"
    },
    "modality_profile": {
        title: "Self-Adaptive Profiling",
        desc: "Auto-detects optimal learning preferences by analyzing interaction history, engagement duration, and completion rates.",
        endpoint: "/v1/user/modality-profile",
        method: "POST",
        params: [
            { name: "user_id", type: "string", description: "Target user ID", required: true },
            { name: "interaction_history", type: "array", description: "List of past interactions", required: false },
            { name: "preferred_modality_override", type: "string", description: "Explicit user override", required: false }
        ],
        stats: [
            { label: "Confidence", value: "Live", color: "text-emerald-400" },
            { label: "Profiles", value: "Active", color: "text-purple-400" },
            { label: "Accuracy", value: "High", color: "text-white" }
        ],
        action: "View Profile Logic"
    },
    "contestability": {
        title: "Contestability & Redress",
        desc: "Full federal compliance flow allowing users to flag, contest, and correct AI outputs with transparent resolution tracking.",
        endpoint: "/v1/contest-outcome",
        method: "POST",
        params: [
            { name: "interaction_id", type: "string", description: "ID of the contested output", required: true },
            { name: "correction_text", type: "string", description: "User's correction", required: true },
            { name: "contestation_reason", type: "enum", description: "Reason for contestation", required: true, options: ["factual_error", "bias_detected", "modality_mismatch", "hallucination"] }
        ],
        stats: [
            { label: "Disputes", value: "Live", color: "text-amber-400" },
            { label: "Resolution", value: "Active", color: "text-white" },
            { label: "Compliance", value: "Tier 1", color: "text-emerald-400" }
        ],
        action: "File Contest"
    },
    "provenance": {
        title: "Provenance & Agency",
        desc: "Cryptographic content authenticity tracking and quantifiable Human Agency Scores for every system output.",
        endpoint: "/v1/provenance/{id}",
        method: "GET",
        params: [
            { name: "id", type: "string", description: "Interaction ID to verify", required: true }
        ],
        stats: [
            { label: "Agency", value: "Live", color: "text-tekimax-blue" },
            { label: "Status", value: "SIGNED", color: "text-emerald-400" },
            { label: "Chain", value: "Verified", color: "text-white" }
        ],
        action: "Verify Chain"
    },
    "orchestrator": {
        title: "Intelligent Orchestrator",
        desc: "Single entry point that analyzes natural language queries to automatically select and invoke the correct platform tools.",
        endpoint: "/v1/engine/orchestrate",
        method: "POST",
        params: [
            { name: "query", type: "string", description: "Natural language query", required: true },
            { name: "organization_id", type: "string", description: "Org identifier", required: false },
            { name: "preferred_modality", type: "enum", description: "Force a modality", required: false, options: ["visual", "textual", "auditory"] }
        ],
        stats: [
            { label: "Usage", value: "Active", color: "text-purple-400" },
            { label: "Routing", value: "Live", color: "text-emerald-400" },
            { label: "Success", value: "99.9%", color: "text-white" }
        ],
        action: "View System Logs"
    },
    "models": {
        title: "Model Management",
        desc: "List and manage available AI models including NIM-optimized deployments and Google Gemini models.",
        endpoint: "/v1/models",
        method: "GET",
        params: [],
        stats: [
            { label: "Providers", value: "Active", color: "text-emerald-400" },
            { label: "Available", value: "Active", color: "text-tekimax-blue" },
            { label: "Latency", value: "Low", color: "text-white" }
        ],
        action: "List Models"
    },
    "user_profile": {
        title: "Persistent User Profile",
        desc: "Save and retrieve persistent modality profiles to ensure cognitive preferences follow users across sessions and devices.",
        endpoint: "/v1/user/profile",
        method: "POST",
        params: [
            { name: "user_id", type: "string", description: "Target user ID", required: true },
            { name: "modality_preferences", type: "object", description: "Persistent preferences object", required: true }
        ],
        stats: [
            { label: "Storage", value: "DB", color: "text-emerald-400" },
            { label: "Sync", value: "Active", color: "text-tekimax-blue" },
            { label: "Latency", value: "Live", color: "text-white" }
        ],
        action: "Save Profile"
    },
    "organization": {
        title: "Organization Governance",
        desc: "Manage organization-level compliance settings, NIST AI RMF alignment, and global accessibility defaults.",
        endpoint: "/v1/organization",
        method: "POST",
        params: [
            { name: "org_id", type: "string", description: "Organization ID", required: true },
            { name: "compliance_config", type: "object", description: "Global compliance settings", required: true }
        ],
        stats: [
            { label: "Active", value: "Yes", color: "text-emerald-400" },
            { label: "Compliance", value: "Tier 1", color: "text-tekimax-blue" },
            { label: "Audit", value: "Enabled", color: "text-white" }
        ],
        action: "Save Settings"
    },
    "mcp_registry": {
        title: "MCP Server Registry",
        desc: "Manage Model Context Protocol (MCP) servers. Connected servers provide additional tools and context to the AI Orchestrator.",
        endpoint: "/v1/mcp/servers",
        method: "GET",
        params: [
            { name: "server_id", type: "string", description: "Target server ID", required: false },
            { name: "action", type: "enum", description: "Server action", options: ["restart", "stop", "logs"] }
        ],
        stats: [
            { label: "Connected", value: "4 Active", color: "text-emerald-400" },
            { label: "Tools", value: "42 Total", color: "text-tekimax-blue" },
            { label: "Latency", value: "Local", color: "text-white" }
        ],
        action: "Manage Servers"
    }
};

export const TABS = [
    { id: 'adaptive_content', label: 'Adaptive Engine' },
    { id: 'modality_profile', label: 'Modality Profile' },
    { id: 'contestability', label: 'Contestability' },
    { id: 'provenance', label: 'Provenance Chain' },
    { id: 'orchestrator', label: 'Orchestrator' },
    { id: 'models', label: 'Model Studio' },
    { id: 'user_profile', label: 'User Profile' },
    { id: 'organization', label: 'Organization' },
    { id: 'mcp_registry', label: 'MCP Registry' },
];
