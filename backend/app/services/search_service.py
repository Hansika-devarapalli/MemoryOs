"""Search pipeline: vector search (Ollama + ChromaDB) → keyword LIKE fallback.

Returns a dict:
  {
    "results": List[dict],  # each: {"document": Document, "score": float, "snippet": str}
    "ai_used": bool,        # True = semantic (Ollama + ChromaDB), False = keyword fallback
  }
"""
import logging
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from ..models import Document
from ..services.ollama_service import generate_embeddings, ollama_available
from ..services.chroma_service import vector_search

logger = logging.getLogger("memoryos")


def semantic_search(query: str, limit: int, db: Session) -> Dict[str, Any]:
    """Main entry point. Tries Ollama + ChromaDB first, falls back to SQL LIKE."""
    # 1. Try embedding + ChromaDB (real semantic search)
    if ollama_available():
        embedding = generate_embeddings(query)
        if embedding:
            chroma_hits = vector_search(query, embedding, n=limit)
            if chroma_hits:
                results = _hydrate(chroma_hits, query, db)
                if results:
                    return {"results": results, "ai_used": True}

    # 2. Keyword fallback
    logger.info("Ollama unavailable or no Chroma results — using keyword search for: %r", query)
    return {"results": _keyword_search(query, limit, db), "ai_used": False}


def _keyword_search(query: str, limit: int, db: Session) -> List[Dict]:
    """SQL LIKE search — no memory-side scoring loop."""
    raw_terms = [t.strip() for t in query.lower().split() if len(t.strip()) > 1]
    terms = raw_terms[:6]  # cap to avoid absurdly large OR clauses

    if not terms:
        return []

    conditions = []
    for term in terms:
        pattern = f"%{term}%"
        conditions.append(Document.title.ilike(pattern))
        conditions.append(Document.preview.ilike(pattern))
        conditions.append(Document.ocr_text.ilike(pattern))

    docs = (
        db.query(Document)
        .filter(or_(*conditions))
        .order_by(Document.modified_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "document": doc,
            "score": _keyword_score(query, doc),
            "snippet": _snippet(query, doc.preview or doc.ocr_text or doc.title),
        }
        for doc in docs
    ]


def _keyword_score(query: str, doc: Document) -> float:
    """Simple term-frequency score for keyword results (0–0.85)."""
    terms = query.lower().split()
    blob = f"{doc.title} {doc.preview or ''} {doc.ocr_text or ''}".lower()
    hits = sum(1 for t in terms if t in blob)
    return round(min(hits / max(len(terms), 1), 1.0) * 0.85, 3)


def _hydrate(chroma_hits: List[Dict], query: str, db: Session) -> List[Dict]:
    """Batch-fetch documents by ID (avoids N+1 queries)."""
    ids = [h["id"] for h in chroma_hits]
    docs_map = {d.id: d for d in db.query(Document).filter(Document.id.in_(ids)).all()}

    out = []
    for h in chroma_hits:
        doc = docs_map.get(h["id"])
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
    """Extract the most query-relevant passage from ``text``."""
    if not text:
        return ""
    tl = text.lower()
    terms = query.lower().split()
    best_pos, best_hits = 0, 0

    for i in range(0, max(1, len(text) - window), 60):
        chunk = tl[i: i + window]
        hits = sum(1 for t in terms if t in chunk)
        if hits > best_hits:
            best_hits, best_pos = hits, i

    prefix = "..." if best_pos > 0 else ""
    suffix = "..." if best_pos + window < len(text) else ""
    return (prefix + text[best_pos: best_pos + window] + suffix).strip()
