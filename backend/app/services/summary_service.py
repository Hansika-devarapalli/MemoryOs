"""AI document summarisation.

Uses Ollama (gemma3:4b) when available; falls back to extractive summarisation.
Returns {"summary": str, "keywords": List[str], "keyPoints": List[str]} to
satisfy the OpenAPI DocumentSummary contract.
"""
import re
from typing import List, Dict
from .ollama_service import generate_text, ollama_available

_STOPWORDS = {
    "this", "that", "with", "from", "have", "been", "were", "they", "their",
    "when", "what", "which", "will", "would", "could", "should", "there",
    "then", "than", "also", "into", "more", "your", "some", "such", "about",
    "just", "like", "very", "over", "after", "before", "where", "while",
}


def generate_summary(content: str, title: str) -> Dict:
    """Return {"summary": str, "keywords": List[str], "keyPoints": List[str]}."""
    if ollama_available() and content and len(content.strip()) > 50:
        prompt = (
            f"Document title: {title}\n\n"
            f"Content (first 4000 chars):\n{content[:4000]}\n\n"
            "Provide:\n"
            "SUMMARY: <2-3 sentence summary>\n"
            "KEYWORDS: <5-8 comma-separated keywords>\n"
            "KEYPOINTS: <3-5 bullet points, one per line, starting with '-'>"
        )
        response = generate_text(
            prompt,
            system="You are a document analysis assistant. Be concise and factual.",
        )
        if response:
            return _parse_response(response, title, content)

    return _extractive(content, title)


def _parse_response(response: str, title: str, content: str) -> Dict:
    summary = ""
    keywords: List[str] = []
    key_points: List[str] = []
    in_keypoints = False

    for line in response.splitlines():
        stripped = line.strip()
        if stripped.startswith("SUMMARY:"):
            summary = stripped.removeprefix("SUMMARY:").strip()
            in_keypoints = False
        elif stripped.startswith("KEYWORDS:"):
            kw_str = stripped.removeprefix("KEYWORDS:").strip()
            keywords = [k.strip() for k in kw_str.split(",") if k.strip()]
            in_keypoints = False
        elif stripped.startswith("KEYPOINTS:"):
            in_keypoints = True
        elif in_keypoints and stripped.startswith("-"):
            key_points.append(stripped.lstrip("- ").strip())

    if not summary:
        summary = response[:300].strip()
    if not keywords:
        keywords = _extract_keywords(title + " " + content[:500])
    if not key_points:
        key_points = _extract_key_points(content)

    return {"summary": summary[:600], "keywords": keywords[:8], "keyPoints": key_points[:5]}


def _extractive(content: str, title: str) -> Dict:
    sentences = re.split(r"(?<=[.!?])\s+", content.replace("\n", " "))
    summary = " ".join(sentences[:2]).strip()
    if not summary:
        summary = f"Document: {title}"
    keywords = _extract_keywords(title + " " + content[:600])
    key_points = _extract_key_points(content)
    return {"summary": summary[:600], "keywords": keywords[:8], "keyPoints": key_points[:5]}


def _extract_keywords(text: str) -> List[str]:
    words = re.findall(r"\b[A-Za-z][a-z]{3,}\b", text)
    freq: Dict[str, int] = {}
    for w in words:
        lw = w.lower()
        if lw not in _STOPWORDS:
            freq[lw] = freq.get(lw, 0) + 1
    return sorted(freq, key=lambda k: freq[k], reverse=True)


def _extract_key_points(content: str) -> List[str]:
    """Extract up to 5 key sentences as bullet points."""
    sentences = re.split(r"(?<=[.!?])\s+", content.replace("\n", " "))
    candidates = [s.strip() for s in sentences if 30 < len(s.strip()) < 200]
    return candidates[:5]
