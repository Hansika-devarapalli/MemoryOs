import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ..models import Document, SearchHistory
from ..schemas import (
    SearchInput, SearchResult, SearchResultItem,
    SearchHistoryList, SearchHistoryItem, DocumentOut,
)
from ..services.search_service import semantic_search
from ..services.ollama_service import generate_answer

router = APIRouter(tags=["search"])


def _to_schema(doc: Document) -> DocumentOut:
    return DocumentOut(
        id=doc.id,
        title=doc.title,
        path=doc.path,
        type=doc.type,
        size=doc.size or 0,
        summary=doc.summary,
        keywords=doc.keywords or [],
        preview=doc.preview,
        ocrText=doc.ocr_text,
        indexed=doc.indexed or False,
        embeddingCount=doc.embedding_count or 0,
        createdAt=doc.created_at,
        modifiedAt=doc.modified_at,
        indexedAt=doc.indexed_at,
    )


@router.post("/search", response_model=SearchResult)
def search(body: SearchInput, db: Session = Depends(get_db)):
    start = time.time()

    results = semantic_search(body.query, body.limit, db)
    elapsed = int((time.time() - start) * 1000)

    snippets = [r["snippet"] for r in results[:3]]
    ai_response = generate_answer(body.query, snippets) if results else None

    # Persist search history
    db.add(SearchHistory(query=body.query, result_count=len(results)))
    db.commit()

    items = [
        SearchResultItem(document=_to_schema(r["document"]), score=r["score"], snippet=r["snippet"])
        for r in results
    ]

    return SearchResult(
        query=body.query,               # ← now included per spec
        results=items,
        aiResponse=ai_response,
        totalResults=len(results),
        timeTakenMs=elapsed,
    )


@router.get("/search/history", response_model=SearchHistoryList)
def get_history(limit: int = 20, db: Session = Depends(get_db)):
    rows = (
        db.query(SearchHistory)
        .order_by(SearchHistory.timestamp.desc())
        .limit(limit)
        .all()
    )
    return SearchHistoryList(history=[
        SearchHistoryItem(id=r.id, query=r.query, resultCount=r.result_count, timestamp=r.timestamp)
        for r in rows
    ])
