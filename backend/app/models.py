from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, Index
from sqlalchemy.sql import func
from .database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    path = Column(String, unique=True, nullable=False, index=True)
    type = Column(String, nullable=False)  # pdf | docx | txt | md | image
    size = Column(Integer, default=0)
    summary = Column(Text)
    keywords = Column(JSON)  # List[str]
    preview = Column(Text)
    ocr_text = Column(Text)
    indexed = Column(Boolean, default=False)
    embedding_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    modified_at = Column(DateTime, server_default=func.now())
    indexed_at = Column(DateTime)

    # Composite indexes for common query patterns
    __table_args__ = (
        Index("ix_documents_type", "type"),
        Index("ix_documents_modified_at", "modified_at"),
        Index("ix_documents_indexed_at", "indexed_at"),
        Index("ix_documents_indexed", "indexed"),
    )


class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, nullable=False)
    result_count = Column(Integer, default=0)
    timestamp = Column(DateTime, server_default=func.now())

    __table_args__ = (
        Index("ix_search_history_timestamp", "timestamp"),
    )


class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    path = Column(String, unique=True, nullable=False)
    is_watched = Column(Boolean, default=True)
    document_count = Column(Integer, default=0)
    last_indexed = Column(DateTime)
