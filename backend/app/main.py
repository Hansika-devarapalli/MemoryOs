from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from .database import init_db
from .routers import health, documents, search, indexing, stats, timeline
import logging

logger = logging.getLogger("memoryos")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="MemoryOS API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(indexing.router, prefix="/api")
app.include_router(stats.router, prefix="/api")
app.include_router(timeline.router, prefix="/api")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log full details server-side; never expose internals to the client
    logger.error("Unhandled error on %s %s", request.method, request.url, exc_info=exc)
    return JSONResponse(status_code=500, content={"error": "An internal server error occurred."})
