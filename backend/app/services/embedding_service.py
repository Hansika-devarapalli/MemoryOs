from typing import Optional, List
from .ollama_service import generate_embeddings


def embed_text(text: str) -> Optional[List[float]]:
    """Embed a text string via Ollama nomic-embed-text.

    Returns None when Ollama is unavailable — callers fall back to keyword search.
    """
    if not text or not text.strip():
        return None
    return generate_embeddings(text[:8000])
