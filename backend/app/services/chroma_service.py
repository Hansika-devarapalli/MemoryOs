"""ChromaDB vector store integration.

Automatically disabled when chromadb is not importable or the server is
unavailable — all callers fall back to keyword search.
"""
from typing import List, Optional
import os

CHROMA_PATH = os.getenv("CHROMA_PATH", "./.chroma")
COLLECTION_NAME = os.getenv("CHROMA_COLLECTION", "memoryos")

_collection = None


def _get_collection():
    global _collection
    if _collection is not None:
        return _collection
    try:
        import chromadb
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        _collection = client.get_or_create_collection(COLLECTION_NAME)
        return _collection
    except Exception:
        return None


def add_document(doc_id: int, text: str, embedding: Optional[List[float]], metadata: dict) -> bool:
    col = _get_collection()
    if col is None:
        return False
    try:
        kwargs: dict = {
            "ids": [str(doc_id)],
            "documents": [text[:10_000]],
            "metadatas": [metadata],
        }
        if embedding:
            kwargs["embeddings"] = [embedding]
        col.upsert(**kwargs)
        return True
    except Exception:
        return False


def vector_search(query: str, embedding: Optional[List[float]], n: int = 10) -> List[dict]:
    col = _get_collection()
    if col is None:
        return []
    try:
        count = col.count()
        if count == 0:
            return []
        kwargs: dict = {"n_results": min(n, count)}
        if embedding:
            kwargs["query_embeddings"] = [embedding]
        else:
            kwargs["query_texts"] = [query]
        res = col.query(**kwargs)
        out = []
        for i, doc_id_str in enumerate(res["ids"][0]):
            out.append({
                "id": int(doc_id_str),
                "distance": (res.get("distances") or [[0]])[0][i],
                "snippet": (res.get("documents") or [[""]])[0][i],
            })
        return out
    except Exception:
        return []


def get_related_documents(doc_id: int, title: str, n: int = 5) -> List[int]:
    col = _get_collection()
    if col is None:
        return []
    try:
        count = col.count()
        if count <= 1:
            return []
        res = col.query(query_texts=[title], n_results=min(n + 1, count))
        return [int(i) for i in res["ids"][0] if int(i) != doc_id][:n]
    except Exception:
        return []


def delete_document(doc_id: int):
    col = _get_collection()
    if col is None:
        return
    try:
        col.delete(ids=[str(doc_id)])
    except Exception:
        pass
