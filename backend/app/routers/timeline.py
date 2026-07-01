from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from collections import defaultdict

from ..dependencies import get_db
from ..models import Document, SearchHistory
from ..schemas import Timeline, TimelineGroup, TimelineDocument, TimelineSearch

router = APIRouter(tags=["timeline"])


@router.get("/timeline", response_model=Timeline)
def get_timeline(days: int = 30, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)

    docs = (
        db.query(Document)
        .filter(Document.modified_at >= since)
        .order_by(Document.modified_at.desc())
        .limit(200)
        .all()
    )
    searches = (
        db.query(SearchHistory)
        .filter(SearchHistory.timestamp >= since)
        .order_by(SearchHistory.timestamp.desc())
        .limit(100)
        .all()
    )

    doc_by_date: dict[date, list] = defaultdict(list)
    for d in docs:
        if d.modified_at:
            doc_by_date[d.modified_at.date()].append(d)

    search_by_date: dict[date, list] = defaultdict(list)
    for s in searches:
        if s.timestamp:
            search_by_date[s.timestamp.date()].append(s)

    all_dates = sorted(
        set(list(doc_by_date.keys()) + list(search_by_date.keys())), reverse=True
    )

    today = date.today()
    yesterday = today - timedelta(days=1)
    last_week_start = today - timedelta(days=7)

    def _label(d: date) -> str:
        if d == today:
            return "Today"
        if d == yesterday:
            return "Yesterday"
        if d >= last_week_start:
            return "Last Week"
        return "Last Month"

    groups = []
    for d in all_dates[:30]:
        groups.append(
            TimelineGroup(
                date=d.strftime("%B %d, %Y"),
                label=_label(d),
                documents=[
                    TimelineDocument(id=doc.id, title=doc.title, path=doc.path, type=doc.type)
                    for doc in doc_by_date[d]
                ],
                searches=[
                    TimelineSearch(
                        id=s.id, query=s.query,
                        resultCount=s.result_count, timestamp=s.timestamp,
                    )
                    for s in search_by_date[d]
                ],
            )
        )

    return Timeline(groups=groups)
