"""Search pipeline: vector search → keyword fallback."""
from sqlalchemy.orm import Session
from typing import List, Dict
from ..models import Document
from .ollama_service import generate_embeddings, ollama_available
from .chroma_service import vector_search


def semantic_search(query: str, limit: int, db: Session) -> List[Dict]:
    # 1. Try embedding + ChromaDB
    if ollama_available():
        embedding = generate_embeddings(query)
        if embedding:
            chroma_hits = vector_search(query, embedding, n=limit)
            if chroma_hits:
                return _hydrate(chroma_hits, query, db)

    # 2. Keyword fallback against SQLite
    return _keyword_search(query, limit, db)


def _keyword_search(query: str, limit: int, db: Session) -> List[Dict]:
    terms = query.lower().split()
    candidates = db.query(Document).limit(500).all()
    scored = []

    for doc in candidates:
        blob = f"{doc.title} {doc.preview or ''} {doc.ocr_text or ''}".lower()
        hits = sum(1 for t in terms if t in blob)
        if hits > 0:
            score = round(min(hits / len(terms), 1.0) * 0.85, 3)
            scored.append({
                "document": doc,
                "score": score,
                "snippet": _snippet(query, doc.preview or doc.ocr_text or doc.title),
            })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]


def _hydrate(chroma_hits: List[Dict], query: str, db: Session) -> List[Dict]:
    out = []
    for h in chroma_hits:
        doc = db.query(Document).filter(Document.id == h["id"]).first()
        if doc:
            score = round(max(0.0, 1.0 - h.get("distance", 0.5)), 3)
            raw_snippet = h.get("snippet", "") or doc.preview or ""
            out.append({
                "document": doc,
                "score": score,
                "snippet": _snippet(query, raw_snippet),
            })
    return out


def _snippet(query: str, text: str, window: int = 250) -> str:
    if not text:
        return ""
    tl = text.lower()
    best_pos, best_hits = 0, 0
    terms = query.lower().split()

    for i in range(0, max(1, len(text) - window), 60):
        chunk = tl[i: i + window]
        hits = sum(1 for t in terms if t in chunk)
        if hits > best_hits:
            best_hits, best_pos = hits, i

    prefix = "..." if best_pos > 0 else ""
    suffix = "..." if best_pos + window < len(text) else ""
    return (prefix + text[best_pos: best_pos + window] + suffix).strip()
