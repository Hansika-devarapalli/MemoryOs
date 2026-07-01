"""Ollama HTTP client for LLM inference and embeddings.

Falls back gracefully when Ollama is not running — the app stays functional
in demo mode and becomes fully AI-powered once Ollama is installed locally.
"""
import httpx
import os
from typing import Optional, List

OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "gemma3:4b")
EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")


def ollama_available() -> bool:
    try:
        r = httpx.get(f"{OLLAMA_BASE}/api/tags", timeout=2.0)
        return r.status_code == 200
    except Exception:
        return False


def generate_text(prompt: str, system: str = "") -> str:
    """Call Ollama generate. Returns empty string on failure."""
    try:
        payload = {"model": LLM_MODEL, "prompt": prompt, "stream": False}
        if system:
            payload["system"] = system
        r = httpx.post(f"{OLLAMA_BASE}/api/generate", json=payload, timeout=60.0)
        r.raise_for_status()
        return r.json().get("response", "").strip()
    except Exception:
        return ""


def generate_embeddings(text: str) -> Optional[List[float]]:
    """Call Ollama embeddings. Returns None on failure."""
    try:
        payload = {"model": EMBED_MODEL, "prompt": text[:8000]}
        r = httpx.post(f"{OLLAMA_BASE}/api/embeddings", json=payload, timeout=30.0)
        r.raise_for_status()
        return r.json().get("embedding")
    except Exception:
        return None


def generate_answer(query: str, snippets: List[str]) -> Optional[str]:
    """Generate a natural language answer from search result snippets."""
    if not ollama_available():
        return _fallback_answer(query, snippets)

    context = "\n\n".join(snippets)
    prompt = (
        f"Question: {query}\n\n"
        f"Relevant excerpts from the user's documents:\n{context}\n\n"
        "Answer in 2–3 concise sentences based only on the excerpts above:"
    )
    answer = generate_text(
        prompt,
        system=(
            "You are a personal knowledge assistant. Answer based strictly on the "
            "provided context. Be concise and factual."
        ),
    )
    return answer or _fallback_answer(query, snippets)


def _fallback_answer(query: str, snippets: List[str]) -> str:
    if not snippets:
        return "No matching memories found. Try different keywords or index more folders."
    n = len(snippets)
    return (
        f"Found {n} relevant memor{'y' if n == 1 else 'ies'} matching your query. "
        "Connect Ollama locally to get AI-generated answers."
    )
