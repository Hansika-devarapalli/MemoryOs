"""Tesseract OCR service.

Gracefully returns empty text when pytesseract or Tesseract itself is not
installed — the app stays functional without OCR capability.
"""
from typing import Tuple


def extract_text_from_image(filepath: str) -> Tuple[str, float]:
    """Extract text from PNG/JPG/JPEG using Tesseract. Returns (text, confidence)."""
    try:
        import pytesseract
        from PIL import Image

        img = Image.open(filepath)
        data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
        text = pytesseract.image_to_string(img).strip()

        confidences = [c for c in data.get("conf", []) if isinstance(c, (int, float)) and c >= 0]
        avg_conf = (sum(confidences) / len(confidences) / 100) if confidences else 0.5
        return text, round(avg_conf, 2)

    except ImportError:
        return "", 0.0
    except Exception:
        return "", 0.0
