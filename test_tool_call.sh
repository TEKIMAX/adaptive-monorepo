#!/bin/bash
# test_tool_call.sh

# API Endpoint
URL="https://adaptive-api-rust.christiank.workers.dev/v1/responses"
AUTH_Header="Authorization: Bearer c5f758681ad0454d97f9d15c021ba73b.Kvwle4MUNOJf8TOXTXyPXJF0"
CF_ID="16035272a806ec5288f638a1a3674624.access"
CF_ID_HEADER="CF-Access-Client-Id"
CF_SECRET="b2e361bda0d25725f00e99fe901a052ff317586940026e9596ba375822365287"

echo "Testing Tool Call on: $URL"

# Define Tool (Gemini Format)
TOOLS='[
  {
    "function_declarations": [
      {
        "name": "renderActionCard",
        "description": "Renders an action card for user approval.",
        "parameters": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "description": { "type": "string" },
            "buttonLabel": { "type": "string" },
            "type": { "type": "string" },
            "data": { "type": "object" }
          },
          "required": ["title", "description", "buttonLabel"]
        }
      }
    ]
  }
]'

# JSON Payload with Thinking and Tools
JSON_DATA=$(cat <<EOF
{
  "model": "ollama/gemini-3-flash-preview",
  "input": [
    {
      "type": "message",
      "role": "user",
      "content": "Add a hypothesis that AI will revolutionize coding."
    }
  ],
  "stream": true,
  "thinking": true,
  "tools": $TOOLS
}
EOF
)

# Execute Curl
curl -N -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "$AUTH_Header" \
  -H "$CF_ID_HEADER: $CF_ID" \
  -H "CF-Access-Client-Secret: $CF_SECRET" \
  -d "$JSON_DATA"
