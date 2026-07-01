"""Seed script — populates memoryos.db with realistic demo data."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta
import random

from app.database import init_db, SessionLocal
from app.models import Document, SearchHistory, Folder

FOLDERS = [
    "~/Documents/Research",
    "~/Documents/Projects",
    "~/Documents/Notes",
    "~/Downloads",
]

DOCUMENTS = [
    ("Machine Learning Exam Notes.pdf",          "pdf",   "~/Documents/Research/ml_exam_notes.pdf",          180_000),
    ("Transformer Architecture Study.pdf",        "pdf",   "~/Documents/Research/transformer_arch.pdf",       240_000),
    ("Python Error Solutions.md",                 "md",    "~/Documents/Notes/python_errors.md",               15_000),
    ("Internship Resume 2024.docx",               "docx",  "~/Documents/Projects/resume_2024.docx",            42_000),
    ("sourdough_recipe_final.md",                 "md",    "~/Documents/Notes/sourdough_recipe.md",             8_000),
    ("Project Architecture Overview.txt",         "txt",   "~/Documents/Projects/architecture_notes.txt",      22_000),
    ("Deep Learning Lecture Notes.pdf",           "pdf",   "~/Documents/Research/dl_lectures.pdf",            310_000),
    ("Database Schema Design.md",                 "md",    "~/Documents/Projects/db_schema.md",                18_000),
    ("Screenshot Python Error 2024.png",          "image", "~/Downloads/python_error_screenshot.png",         890_000),
    ("API Integration Guide.txt",                 "txt",   "~/Documents/Projects/api_guide.txt",               35_000),
    ("Statistics Formulas Cheatsheet.pdf",        "pdf",   "~/Documents/Research/stats_cheatsheet.pdf",       95_000),
    ("Meeting Notes Q2 2024.docx",                "docx",  "~/Documents/Notes/q2_meeting_notes.docx",          28_000),
    ("Docker Setup Instructions.md",              "md",    "~/Documents/Projects/docker_setup.md",             12_000),
    ("Budget Spreadsheet Notes.txt",              "txt",   "~/Documents/Notes/budget_notes.txt",               9_500),
    ("Attention Is All You Need Screenshot.png",  "image", "~/Downloads/attention_paper_screenshot.png",      740_000),
]

PREVIEWS = {
    "pdf":   "Abstract: This document provides a comprehensive overview of the topic with analysis of key concepts, methodology, and findings based on current research and literature review.",
    "md":    "# Overview\n\nThis document covers the main topic with structured notes, code examples, and key takeaways for quick reference.",
    "docx":  "Professional document containing formatted content, tables, and structured information for the target audience.",
    "txt":   "Plain text content with notes, ideas, and references. Contains raw information and quick observations.",
    "image": "Visual content — OCR extracted text will appear here after OCR indexing is complete.",
}

SEARCHES = [
    ("machine learning notes",    3),
    ("sourdough recipe",          1),
    ("python error",              2),
    ("transformer architecture",  4),
    ("internship resume",         1),
    ("docker setup",              1),
    ("statistics formulas",       2),
    ("database schema",           3),
    ("meeting notes q2",          1),
    ("API integration",           2),
]

KEYWORDS = {
    "pdf":   ["research", "analysis", "methodology", "findings", "literature"],
    "md":    ["notes", "overview", "code", "examples", "reference"],
    "docx":  ["document", "professional", "formatted", "structured"],
    "txt":   ["notes", "ideas", "references", "raw", "quick"],
    "image": ["screenshot", "visual", "ocr", "image"],
}


def seed():
    init_db()
    db = SessionLocal()

    try:
        if db.query(Document).count() > 0:
            print("Database already seeded — skipping.")
            return

        # Seed folders
        for path in FOLDERS:
            db.add(Folder(path=path, is_watched=True, document_count=0))
        db.commit()

        now = datetime.utcnow()

        # Seed documents
        for i, (title, ftype, path, size) in enumerate(DOCUMENTS):
            days_ago = random.randint(0, 30)
            modified = now - timedelta(days=days_ago, hours=random.randint(0, 23))
            indexed  = modified + timedelta(minutes=random.randint(2, 60))

            doc = Document(
                title=title,
                path=path,
                type=ftype,
                size=size,
                summary=None,
                keywords=KEYWORDS.get(ftype, []),
                preview=PREVIEWS.get(ftype, ""),
                ocr_text=PREVIEWS.get(ftype, "") if ftype == "image" else None,
                indexed=True,
                embedding_count=random.randint(1, 8),
                created_at=modified - timedelta(days=random.randint(0, 90)),
                modified_at=modified,
                indexed_at=indexed,
            )
            db.add(doc)

        db.commit()

        # Seed search history
        for query, result_count in SEARCHES:
            days_ago = random.randint(0, 14)
            ts = now - timedelta(days=days_ago, hours=random.randint(0, 20))
            db.add(SearchHistory(query=query, result_count=result_count, timestamp=ts))

        db.commit()

        # Update folder document counts
        for folder in db.query(Folder).all():
            folder.document_count = db.query(Document).count() // len(FOLDERS)
            folder.last_indexed = now - timedelta(days=1)
        db.commit()

        print(f"Seeded {db.query(Document).count()} documents, {db.query(SearchHistory).count()} searches.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
