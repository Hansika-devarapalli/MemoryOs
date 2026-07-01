from fastapi import APIRouter
from ..schemas import HealthStatus
from ..services.ollama_service import ollama_available
from ..services.chroma_service import _get_collection
from ..config import settings

router = APIRouter(tags=["health"])


@router.get("/healthz", response_model=HealthStatus)
def health_check():
    chroma_ok = _get_collection() is not None
    ollama_ok = ollama_available()
    return HealthStatus(
        status="ok",
        version="1.0.0",
        ollamaAvailable=ollama_ok,
        chromaAvailable=chroma_ok,
        llmModel=settings.ollama_llm_model,
        embedModel=settings.ollama_embed_model,
    )
