import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..dependencies import get_db
from ..models import SearchHistory
from ..schemas import (
    SearchInput, SearchResult, SearchResultItem,
    SearchHistoryList, SearchHistoryItem,
)
from ..services.search_service import semantic_search
from ..services.ollama_service import generate_answer
from ..utils import doc_to_schema

router = APIRouter(tags=["search"])


@router.post("/search", response_model=SearchResult)
def search(body: SearchInput, db: Session = Depends(get_db)):
    start = time.time()

    search_result = semantic_search(body.query, body.limit, db)
    results = search_result["results"]
    ai_used = search_result["ai_used"]

    elapsed = int((time.time() - start) * 1000)

    snippets = [r["snippet"] for r in results[:3]]
    ai_response = generate_answer(body.query, snippets) if results else None

    db.add(SearchHistory(query=body.query, result_count=len(results)))
    db.commit()

    items = [
        SearchResultItem(
            document=doc_to_schema(r["document"]),
            score=r["score"],
            snippet=r["snippet"],
        )
        for r in results
    ]

    return SearchResult(
        query=body.query,
        results=items,
        aiResponse=ai_response,
        totalResults=len(results),
        timeTakenMs=elapsed,
        aiUsed=ai_used,
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
        SearchHistoryItem(
            id=r.id,
            query=r.query,
            resultCount=r.result_count,
            timestamp=r.timestamp,
        )
        for r in rows
    ])
