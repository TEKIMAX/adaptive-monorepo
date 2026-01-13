Local combined stack for development

Services:
- api_server: builds from `api_server` Rust crate and exposes host port 3000.
- ollama: pulls `ollama/ollama:latest` and maps host 11436 -> container 11434.

Usage:

```bash
cd infrastructure/local-stack
docker compose up -d --build
docker compose ps
docker compose logs --tail 200
```
