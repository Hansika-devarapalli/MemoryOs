---
name: MemoryOS Python backend
description: FastAPI + SQLite backend at backend/; key constraints around env vars, threading, and OpenAPI contract alignment
---

## Key rules

**DATABASE_URL env var conflict:**  
The workspace has a `DATABASE_URL` secret pointing at the old PostgreSQL instance.  
The Python backend uses `MEMORYOS_DB_URL` (defaults to `sqlite:///./memoryos.db`) to avoid SQLAlchemy loading psycopg2. Never use `DATABASE_URL` in the Python backend.

**Why:** psycopg2 is not installed; reading `DATABASE_URL` on startup crashes uvicorn before it can bind the port.

**SQLAlchemy sessions and background threads:**  
Never pass a request-scoped `Session` (from `get_db()`) into a `threading.Thread`. Sessions are not thread-safe.  
**How to apply:** Create a fresh `SessionLocal()` inside the background worker function, and `close()` it in a `finally` block. See `backend/app/routers/indexing.py`.

**OpenAPI contract fields that are easy to miss:**  
- `SearchResult` must include `query: str` (the input query echoed back)  
- `DocumentSummary` must include `id: str` and `keyPoints: List[str]`  
- `OcrResult` must include `filePath: str` (the input path echoed back)  
- `DashboardStats` must include `recentSearches: int` and `indexedToday: int`  
Source of truth: `lib/api-spec/openapi.yaml` — check it whenever adding/changing response schemas.

**Global exception handler:**  
Return generic `{"error": "An internal server error occurred."}` to clients. Log full traceback server-side with `logger.error(..., exc_info=exc)`.

**Seed script:**  
`backend/seed.py` populates `memoryos.db` with 15 demo documents and 10 search history entries. Run with `cd backend && python3 seed.py`. Idempotent (skips if documents already exist).

**Graceful AI fallback:**  
Ollama and ChromaDB are detected at call time (not startup). When unavailable, search falls back to SQLite keyword search; answers fall back to template strings. The app is demo-functional without Ollama installed.
