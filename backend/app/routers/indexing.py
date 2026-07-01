import threading
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..dependencies import get_db
from ..models import Document, Folder
from ..schemas import IndexInput, IndexStatus, FolderList, FolderOut, OcrInput, OcrResult
from ..services.indexing_service import index_folder_background
from ..services.ocr_service import extract_text_from_image

router = APIRouter(tags=["indexing"])

# Per-process indexing state — protected by _lock
_state = IndexStatus(isIndexing=False, totalFiles=0, processedFiles=0, failedFiles=0, currentFile=None, folders=[])
_lock = threading.Lock()


@router.post("/index", response_model=IndexStatus)
def start_index(body: IndexInput, db: Session = Depends(get_db)):
    global _state
    with _lock:
        if _state.isIndexing:
            return _state
        _state = IndexStatus(
            isIndexing=True, totalFiles=0, processedFiles=0, failedFiles=0,
            currentFile="Scanning files...", folders=[body.path],
        )

    # Ensure folder record exists (use request-scoped session — safe here)
    if not db.query(Folder).filter(Folder.path == body.path).first():
        db.add(Folder(path=body.path, is_watched=True))
        db.commit()

    path = body.path
    recursive = body.recursive

    def run():
        """Background worker — owns its own SQLAlchemy session (thread-safe)."""
        global _state
        worker_db = SessionLocal()
        try:
            index_folder_background(path, recursive, worker_db, _state, _lock)
        except Exception:
            with _lock:
                _state = IndexStatus(
                    isIndexing=False,
                    totalFiles=_state.totalFiles,
                    processedFiles=_state.processedFiles,
                    failedFiles=_state.failedFiles + 1,
                    currentFile=None,
                    folders=_state.folders,
                )
        finally:
            worker_db.close()

    threading.Thread(target=run, daemon=True).start()
    return _state


@router.get("/index/status", response_model=IndexStatus)
def get_index_status():
    with _lock:
        return _state


@router.get("/folders", response_model=FolderList)
def list_folders(db: Session = Depends(get_db)):
    folders = db.query(Folder).all()
    return FolderList(folders=[
        FolderOut(
            id=f.id, path=f.path, isWatched=f.is_watched,
            documentCount=f.document_count, lastIndexed=f.last_indexed,
        )
        for f in folders
    ])


@router.post("/ocr", response_model=OcrResult)
def run_ocr(body: OcrInput):
    text, confidence = extract_text_from_image(body.filePath)
    return OcrResult(filePath=body.filePath, text=text, confidence=confidence)   # ← filePath per spec
