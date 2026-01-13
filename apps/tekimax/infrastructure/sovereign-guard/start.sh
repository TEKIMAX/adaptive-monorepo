#!/bin/bash
echo "🚀 Initializing Sovereign Guard Node..."

# 1. Start Docker Container
docker-compose up -d

echo "⏳ Waiting for PII Guard Service to boot..."
sleep 5

# 2. Pull the Granite Guardian Model (IBM)
# We execute this INSIDE the container to ensure it's sequestered in the "VM"
echo "🛡️ Installing 'granite3-guardian' on the Guard Node..."
docker exec sovereign-guard-node ollama pull granite3-guardian

echo "✅ Sovereign Guard online at http://localhost:11435"
