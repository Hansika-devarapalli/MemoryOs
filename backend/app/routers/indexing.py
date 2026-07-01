import threading
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..dependencies import get_db
from ..models import Document, Folder
from ..schemas import IndexInput, IndexStatus, FolderList, FolderOut, OcrInput, OcrResult
from ..services.indexing_service import index_folder_background
from ..services.ocr_service import extract_text_from_image
from ..utils import validate_user_path

logger = logging.getLogger("memoryos")

router = APIRouter(tags=["indexing"])

# Per-process indexing state — protected by _lock
_state = IndexStatus(
    isIndexing=False, totalFiles=0, processedFiles=0,
    failedFiles=0, currentFile=None, folders=[],
)
_lock = threading.Lock()

# Allowed image extensions for OCR
_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".webp"}


@router.post("/index", response_model=IndexStatus)
def start_index(body: IndexInput, db: Session = Depends(get_db)):
    global _state

    # Validate path — prevent directory traversal attacks
    try:
        safe_path = validate_user_path(body.path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    with _lock:
        if _state.isIndexing:
            return _state
        _state = IndexStatus(
            isIndexing=True, totalFiles=0, processedFiles=0, failedFiles=0,
            currentFile="Scanning files...", folders=[safe_path],
        )

    # Ensure folder record exists (request-scoped session — safe here)
    if not db.query(Folder).filter(Folder.path == safe_path).first():
        db.add(Folder(path=safe_path, is_watched=True))
        db.commit()

    recursive = body.recursive

    def run():
        """Background worker — owns its own SQLAlchemy session (thread-safe)."""
        global _state
        worker_db = SessionLocal()
        try:
            index_folder_background(safe_path, recursive, worker_db, _state, _lock)
        except Exception:
            logger.exception("Indexing worker failed for path: %s", safe_path)
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
    import os
    from pathlib import Path

    # Validate path
    try:
        safe_path = validate_user_path(body.filePath)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Only allow image files
    ext = Path(safe_path).suffix.lower()
    if ext not in _IMAGE_EXTS:
        raise HTTPException(
            status_code=400,
            detail=f"OCR only supports image files ({', '.join(_IMAGE_EXTS)}). Got: '{ext}'",
        )

    if not os.path.isfile(safe_path):
        raise HTTPException(status_code=404, detail="File not found")

    text, confidence = extract_text_from_image(safe_path)
    return OcrResult(filePath=safe_path, text=text, confidence=confidence)
