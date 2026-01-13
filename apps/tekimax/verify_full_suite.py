import urllib.request
import json
import time

BASE_URL = "http://localhost:3000"

def req(method, path, body=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    data = json.dumps(body).encode("utf-8") if body else None
    
    request = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request) as response:
            print(f"✅ {method} {path} - {response.status}")
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        print(f"❌ {method} {path} - {e.code}: {e.read().decode()}")
        return None
    except Exception as e:
        print(f"❌ {method} {path} - Failed: {str(e)}")
        return None

print("--- 🚀 Starting Verification Suite ---")

# 1. Version
print("\n--- Checking Version ---")
req("GET", "/api/version")

# 2. List Models
print("\n--- Listing Models ---")
tags = req("GET", "/api/tags")
if not tags or "models" not in tags or not tags["models"]:
    print("❌ No models found. Cannot proceed with model-dependent tests.")
    exit(1)

model_name = tags["models"][0]["name"]
print(f"ℹ️  Using model: {model_name}")

# 3. PS
print("\n--- Checking Running Models (PS) ---")
req("GET", "/api/ps")

# 4. Show
print("\n--- Showing Model Details ---")
req("POST", "/api/show", {"model": model_name})

# 5. Copy & Delete
print("\n--- Testing Copy & Delete ---")
copy_dest = f"{model_name}-test-copy"
if req("POST", "/api/copy", {"source": model_name, "destination": copy_dest}):
    print("   Copy successful, deleting now...")
    req("DELETE", "/api/delete", {"model": copy_dest})

# 6. Generate (LLM Endpoint)
print("\n--- Testing Generate (Unified) ---")
req("POST", "/api/llm", {
    "type": "generate",
    "api": "ollama",
    "model": model_name,
    "prompt": "Say hello!",
    "stream": False
})

# 7. OpenAI List
print("\n--- Testing OpenAI List Models ---")
req("GET", "/v1/models")

# 8. OpenAI Chat
print("\n--- Testing OpenAI Chat ---")
req("POST", "/v1/chat/completions", {
    "model": model_name,
    "messages": [{"role": "user", "content": "Hi!"}],
    "stream": False
})

# 9. Docs
print("\n--- Checking Docs Availability ---")
try:
    with urllib.request.urlopen(f"{BASE_URL}/docs") as res:
        print(f"✅ GET /docs - {res.status}")
except Exception as e:
    print(f"❌ GET /docs - Failed: {e}")

try:
    with urllib.request.urlopen(f"{BASE_URL}/openapi.yaml") as res:
        print(f"✅ GET /openapi.yaml - {res.status}")
except Exception as e:
    print(f"❌ GET /openapi.yaml - Failed: {e}")

print("\n--- 🎉 Verification Complete ---")
