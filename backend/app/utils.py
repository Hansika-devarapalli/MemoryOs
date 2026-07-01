"""Shared utilities — helpers used by multiple routers."""
import logging
import os
from .models import Document
from .schemas import DocumentOut

logger = logging.getLogger("memoryos")

# System paths that must never be walked/read
_BLOCKED_PREFIXES = (
    "/etc", "/sys", "/proc", "/dev", "/root", "/boot",
    "/usr/bin", "/usr/sbin", "/bin", "/sbin",
)


def doc_to_schema(doc: Document) -> DocumentOut:
    """Convert a Document ORM object to the DocumentOut Pydantic schema."""
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


def validate_user_path(path: str) -> str:
    """Resolve and validate a user-supplied filesystem path.

    Expands ``~``, resolves symlinks, and raises ``ValueError`` if the
    resolved path starts with a blocked system prefix.  Returns the
    resolved absolute path (which may not exist — caller decides).
    """
    resolved = os.path.realpath(os.path.expanduser(path))

    for blocked in _BLOCKED_PREFIXES:
        if resolved == blocked or resolved.startswith(blocked + os.sep):
            raise ValueError(
                f"Access to '{blocked}' is not permitted for security reasons."
            )

    return resolved
