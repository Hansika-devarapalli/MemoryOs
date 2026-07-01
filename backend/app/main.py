import time
import threading
import logging
from collections import defaultdict
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager
from .database import init_db
from .routers import health, documents, search, indexing, stats, timeline

logger = logging.getLogger("memoryos")

# ── Rate limiting ─────────────────────────────────────────────────────────────
# Simple in-memory token bucket; limits expensive AI/indexing endpoints.
_rl_lock = threading.Lock()
_rl_calls: dict[str, list[float]] = defaultdict(list)

_RATE_LIMITS: dict[str, int] = {
    "/api/search": 30,   # 30 searches / minute per IP
    "/api/index":   5,   # 5 index starts / minute per IP
    "/api/ocr":    10,   # 10 OCR calls / minute per IP
}

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        limit = _RATE_LIMITS.get(request.url.path)
        if limit and request.method == "POST":
            ip = (request.client.host if request.client else "unknown")
            now = time.time()
            with _rl_lock:
                window = [t for t in _rl_calls[ip] if now - t < 60.0]
                if len(window) >= limit:
                    return Response(
                        content='{"error":"Too many requests — please slow down."}',
                        status_code=429,
                        media_type="application/json",
                    )
                window.append(now)
                _rl_calls[ip] = window
        return await call_next(request)


# ── App lifespan ──────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(title="MemoryOS API", version="1.0.0", lifespan=lifespan)

app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router,     prefix="/api")
app.include_router(documents.router,  prefix="/api")
app.include_router(search.router,     prefix="/api")
app.include_router(indexing.router,   prefix="/api")
app.include_router(stats.router,      prefix="/api")
app.include_router(timeline.router,   prefix="/api")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error on %s %s", request.method, request.url, exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"error": "An internal server error occurred."},
    )
