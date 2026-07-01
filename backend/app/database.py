from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os

# Always use SQLite for the Python backend — the DATABASE_URL secret
# in this workspace points to the old PostgreSQL instance.  Use
# MEMORYOS_DB_URL if you ever want to override the SQLite path.
DATABASE_URL = os.getenv("MEMORYOS_DB_URL", "sqlite:///./memoryos.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def init_db():
    from . import models  # noqa: F401 — registers all ORM models
    Base.metadata.create_all(bind=engine)
