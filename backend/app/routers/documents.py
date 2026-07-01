from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from ..dependencies import get_db
from ..models import Document
from ..schemas import DocumentOut, DocumentList, DocumentSummary
from ..services.summary_service import generate_summary
from ..services.chroma_service import get_related_documents
from ..utils import doc_to_schema

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("", response_model=DocumentList)
def list_documents(
    limit: int = 50,
    offset: int = 0,
    type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Document)
    if type:
        q = q.filter(Document.type == type)
    total = q.count()
    docs = q.order_by(Document.modified_at.desc()).offset(offset).limit(limit).all()
    return DocumentList(documents=[doc_to_schema(d) for d in docs], total=total)


@router.get("/{id}", response_model=DocumentOut)
def get_document(id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc_to_schema(doc)


@router.post("/{id}/summary", response_model=DocumentSummary)
def generate_doc_summary(id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    content = doc.ocr_text or doc.preview or doc.title
    result = generate_summary(content, doc.title)

    doc.summary = result["summary"]
    doc.keywords = result["keywords"]
    db.commit()

    return DocumentSummary(
        id=str(doc.id),
        summary=result["summary"],
        keywords=result["keywords"],
        keyPoints=result.get("keyPoints", []),
    )


@router.get("/{id}/related", response_model=DocumentList)
def get_related(id: int, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    related_ids = get_related_documents(doc.id, doc.title)
    if related_ids:
        related = db.query(Document).filter(Document.id.in_(related_ids)).limit(5).all()
    else:
        related = (
            db.query(Document)
            .filter(Document.id != id, Document.type == doc.type)
            .limit(5)
            .all()
        )

    return DocumentList(documents=[doc_to_schema(d) for d in related], total=len(related))
