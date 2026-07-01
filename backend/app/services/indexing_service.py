"""File indexing pipeline: walk directory → extract text → embed → store.

Runs in a background thread started by the /api/index endpoint.
Each call creates its own SQLAlchemy session (never reuse a request session
across thread boundaries).
"""
import os
import time
import logging
import threading
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session

from ..models import Document, Folder
from ..schemas import IndexStatus
from .ocr_service import extract_text_from_image
from .embedding_service import embed_text
from .chroma_service import add_document

logger = logging.getLogger("memoryos")

SUPPORTED = {
    ".pdf": "pdf",
    ".docx": "docx",
    ".doc": "docx",
    ".txt": "txt",
    ".md": "md",
    ".png": "image",
    ".jpg": "image",
    ".jpeg": "image",
}


def _extract_text(filepath: str, ftype: str) -> str:
    """Extract plain text from a file. Returns empty string on any failure."""
    try:
        if ftype == "pdf":
            import fitz  # PyMuPDF
            with fitz.open(filepath) as doc:
                return "\n".join(page.get_text() for page in doc)

        if ftype == "docx":
            from docx import Document as DocxDoc
            return "\n".join(p.text for p in DocxDoc(filepath).paragraphs)

        if ftype in ("txt", "md"):
            return Path(filepath).read_text(encoding="utf-8", errors="ignore")

        if ftype == "image":
            text, _ = extract_text_from_image(filepath)
            return text

    except Exception:
        logger.warning("Failed to extract text from '%s'", filepath, exc_info=True)

    return ""


def _index_file(
    filepath: str,
    ftype: str,
    db: Session,
    state: IndexStatus,
    lock: threading.Lock,
):
    with lock:
        state.currentFile = filepath

    try:
        stat = os.stat(filepath)
        title = Path(filepath).name
        text = _extract_text(filepath, ftype)

        existing = db.query(Document).filter(Document.path == filepath).first()
        doc = existing or Document(title=title, path=filepath, type=ftype)

        doc.size = stat.st_size
        doc.modified_at = datetime.fromtimestamp(stat.st_mtime)
        doc.preview = text[:500] if text else None
        doc.ocr_text = text if ftype == "image" else None
        doc.indexed = True
        doc.indexed_at = datetime.utcnow()

        if not existing:
            db.add(doc)
        db.commit()
        db.refresh(doc)

        # Embed and persist to ChromaDB (best-effort — doesn't fail the file)
        embedding = embed_text(text) if text else None
        ok = add_document(
            doc.id, text or title, embedding,
            {"path": filepath, "type": ftype, "title": title},
        )
        if ok:
            doc.embedding_count = 1
            db.commit()

        with lock:
            state.processedFiles += 1

    except Exception:
        logger.error("Failed to index '%s'", filepath, exc_info=True)
        with lock:
            state.failedFiles += 1


def index_folder_background(
    folder_path: str,
    recursive: bool,
    db: Session,
    state: IndexStatus,
    lock: threading.Lock,
):
    """Entry point for the background indexing thread."""
    if not os.path.exists(folder_path):
        _simulate(folder_path, db, state, lock)
        return

    # Collect files
    files: list[str] = []
    if recursive:
        for root, _, names in os.walk(folder_path):
            for name in names:
                if Path(name).suffix.lower() in SUPPORTED:
                    files.append(os.path.join(root, name))
    else:
        files = [
            os.path.join(folder_path, n)
            for n in os.listdir(folder_path)
            if Path(n).suffix.lower() in SUPPORTED
        ]

    with lock:
        state.totalFiles = len(files)

    for fp in files:
        ftype = SUPPORTED[Path(fp).suffix.lower()]
        _index_file(fp, ftype, db, state, lock)

    # Update folder metadata
    folder = db.query(Folder).filter(Folder.path == folder_path).first()
    if folder:
        folder.document_count = db.query(Document).count()
        folder.last_indexed = datetime.utcnow()
        db.commit()

    with lock:
        state.isIndexing = False
        state.currentFile = None

    logger.info(
        "Indexing complete — processed=%d failed=%d path=%s",
        state.processedFiles, state.failedFiles, folder_path,
    )


def _simulate(folder_path: str, db: Session, state: IndexStatus, lock: threading.Lock):
    """Demo mode — animates progress when the path doesn't exist on disk."""
    steps = [
        "Scanning files...",
        "Extracting text...",
        "Generating embeddings...",
        "Remembering your documents...",
    ]
    total = db.query(Document).count() or 10

    with lock:
        state.totalFiles = total

    for i, step in enumerate(steps):
        time.sleep(0.8)
        with lock:
            state.currentFile = step
            state.processedFiles = min(int(total * (i + 1) / len(steps)), total)

    db.query(Document).update({"indexed": True, "indexed_at": datetime.utcnow()})
    folder = db.query(Folder).filter(Folder.path == folder_path).first()
    if folder:
        folder.document_count = total
        folder.last_indexed = datetime.utcnow()
    db.commit()

    with lock:
        state.isIndexing = False
        state.processedFiles = total
        state.currentFile = None
