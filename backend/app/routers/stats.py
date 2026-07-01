from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, date

from ..dependencies import get_db
from ..models import Document, SearchHistory
from ..schemas import DashboardStats, TypeBreakdown, DayActivity

router = APIRouter(tags=["stats"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Document).count()

    def count_type(t: str) -> int:
        return db.query(Document).filter(Document.type == t).count()

    type_breakdown = TypeBreakdown(
        pdf=count_type("pdf"),
        docx=count_type("docx"),
        txt=count_type("txt"),
        md=count_type("md"),
        image=count_type("image"),
    )

    storage = int(db.query(func.sum(Document.size)).scalar() or 0)
    embeddings = int(db.query(func.sum(Document.embedding_count)).scalar() or 0)

    today = date.today()
    recent_searches = db.query(SearchHistory).filter(
        func.date(SearchHistory.timestamp) >= (today - timedelta(days=7))
    ).count()

    indexed_today = db.query(Document).filter(
        func.date(Document.indexed_at) == today
    ).count()

    # Activity for last 14 days
    activity = []
    for i in range(13, -1, -1):
        day = (datetime.utcnow() - timedelta(days=i)).date()
        indexed = db.query(Document).filter(func.date(Document.indexed_at) == day).count()
        searched = db.query(SearchHistory).filter(func.date(SearchHistory.timestamp) == day).count()
        activity.append(DayActivity(date=day.strftime("%b %d"), indexed=indexed, searched=searched))

    return DashboardStats(
        totalDocuments=total,
        totalImages=count_type("image"),
        totalEmbeddings=embeddings,
        storageUsedBytes=storage,
        recentSearches=recent_searches,     # ← now included per spec
        indexedToday=indexed_today,          # ← now included per spec
        typeBreakdown=type_breakdown,
        activityByDay=activity,
    )
