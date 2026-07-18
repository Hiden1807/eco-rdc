import base64
from io import BytesIO
import mimetypes
import os

from PIL import Image
import requests

from .exceptions import AIError
from .engine import generate_json, generate_text, parse_json_response, provider_status
from .providers.provider_factory import get_provider


IMAGE_JSON_SCHEMA_HINT = """
{
  "categorie_detectee": "string",
  "gravite": "faible|moyen|eleve|critique",
  "urgence": "string",
  "resume": "string",
  "resume_court": "string",
  "description_amelioree": "string",
  "risques_detectes": ["string"],
  "recommandation": "string",
  "recommandation_autorite": "string",
  "recommandation_citoyen": "string",
  "delai_intervention_recommande": "string",
  "coherence_image_description": "string",
  "priorite_traitement": "string",
  "score_confiance": 0
}
"""


def _provider_timeout_seconds():
    """Timeout d'appel visuel aligne avec le runtime IA principal."""
    return max(3, int(os.getenv("AI_TIMEOUT_SECONDS", "12")))


def gemini_available():
    return any(item["name"] == "gemini" and item["configured"] for item in provider_status()["providers"])


def _gemini_key():
    key = os.getenv("GEMINI_API_KEY", "").strip()
    return "" if key.startswith("sk-or-v1-") else key


def _gemini_model():
    return os.getenv("GEMINI_MODEL") or (
        os.getenv("AI_MODEL") if "gemini" in os.getenv("AI_MODEL", "").lower() else ""
    ) or "gemini-2.5-flash"


def _gemini_vision_model():
    return os.getenv("GEMINI_VISION_MODEL") or os.getenv("GEMINI_MODEL") or "gemini-2.5-flash"


def _openrouter_key():
    return os.getenv("OPENROUTER_API_KEY", "").strip()


def _openrouter_vision_model():
    return os.getenv("OPENROUTER_VISION_MODEL", "google/gemini-3.1-flash-lite-image")


def _compressed_image_bytes(image_path, max_size=768, quality=72):
    """Compresse l'image avant envoi IA pour reduire latence et erreurs reseau."""

    with Image.open(image_path) as image:
        image = image.convert("RGB")
        image.thumbnail((max_size, max_size))
        buffer = BytesIO()
        image.save(buffer, format="JPEG", quality=quality, optimize=True)
        return buffer.getvalue(), "image/jpeg"


def _attach_provider(payload, provider, model):
    if payload:
        payload.setdefault("_provider", provider)
        payload.setdefault("_model", model)
    return payload


def generate_with_gemini(prompt, image_path=None, text_context=""):
    try:
        if image_path:
            image_bytes, mime_type = _compressed_image_bytes(image_path)
            result = get_provider(force="gemini").analyze_multimodal(
                image_bytes,
                mime_type,
                f"{prompt}\n\n{text_context}",
                json_schema_hint=IMAGE_JSON_SCHEMA_HINT,
            )
            return _attach_provider(result.data, "gemini_vision", result.model)

        api_key = _gemini_key()
        if not api_key:
            return {}
        parts = [{"text": f"{prompt}\n\n{text_context}"}]
        model = _gemini_model()
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            params={"key": api_key},
            json={
                "contents": [{"role": "user", "parts": parts}],
                "generationConfig": {
                    "temperature": 0.12,
                    "maxOutputTokens": int(os.getenv("AI_IMAGE_MAX_TOKENS", "900")),
                    "responseMimeType": "application/json",
                },
            },
            timeout=_provider_timeout_seconds(),
        )
        response.raise_for_status()
        text = "\n".join(part.get("text", "") for part in response.json()["candidates"][0]["content"].get("parts", []))
        return _attach_provider(parse_json_response(text), "gemini_text", model)
    except AIError:
        return {}
    except Exception:
        return {}


def generate_text_with_gemini(prompt, text_context=""):
    return generate_text(prompt, text_context)


def generate_with_openrouter(prompt, text_context="", response_format="json"):
    text = generate_text(prompt, text_context)
    return parse_json_response(text) if response_format == "json" else {"text": text}


def generate_with_openrouter_vision(prompt, image_path, text_context=""):
    api_key = _openrouter_key()
    if not api_key:
        return {}
    try:
        image_bytes, mime_type = _compressed_image_bytes(image_path)
        data_url = f"data:{mime_type};base64,{base64.b64encode(image_bytes).decode('ascii')}"
        model = _openrouter_vision_model()
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": os.getenv("PUBLIC_FRONTEND_URL", "http://localhost:5173"),
                "X-OpenRouter-Title": "ECO RDC Intelligence",
            },
            json={
                "model": model,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": f"{prompt}\n\n{text_context}"},
                            {"type": "image_url", "image_url": {"url": data_url}},
                        ],
                    }
                ],
                "temperature": 0.12,
                "max_tokens": int(os.getenv("AI_IMAGE_MAX_TOKENS", "900")),
            },
            timeout=_provider_timeout_seconds(),
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"].get("content") or ""
        if isinstance(content, list):
            text = "\n".join(part.get("text", "") if isinstance(part, dict) else str(part) for part in content)
        else:
            text = str(content)
        return _attach_provider(parse_json_response(text), "openrouter_vision", model)
    except Exception:
        return {}


def generate_with_best_provider(prompt, image_path=None, text_context="", response_format="json"):
    if image_path:
        image_provider = os.getenv("AI_IMAGE_PROVIDER", "auto").lower()
        if image_provider in {"auto", "gemini"}:
            payload = generate_with_gemini(prompt, image_path=image_path, text_context=text_context)
            if payload:
                return payload
        payload = generate_with_openrouter_vision(prompt, image_path=image_path, text_context=text_context)
        if payload:
            return payload
        return {} if response_format == "json" else {"text": ""}
    if response_format == "text":
        return {"text": generate_text(prompt, text_context)}
    return generate_json(prompt, text_context)


def generate_text_with_best_provider(prompt, text_context=""):
    gemini_text = generate_text_with_gemini(prompt, text_context=text_context)
    if gemini_text:
        return gemini_text
    openrouter_payload = generate_with_openrouter(prompt, text_context=text_context, response_format="text")
    return openrouter_payload.get("text", "")
