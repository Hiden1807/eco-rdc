"""Runtime IA centralise pour ECO RDC Intelligence.

Le reste du projet conserve ces helpers historiques, mais l'appel fournisseur
reel passe maintenant par `apps.ai.providers.provider_factory`.
"""

import json
import re
from django.conf import settings

from apps.ai.exceptions import AIError, AIInvalidResponseError
from apps.ai.providers.base import AIMessage
from apps.ai.providers.provider_factory import get_provider


JSON_OBJECT_RE = re.compile(r"\{.*\}", re.S)


def provider_status(live=False):
    """Expose a redacted provider status payload for health endpoints."""
    try:
        provider = get_provider()
        health = provider.health_check(live=live)
        return {
            "active": health.get("provider", getattr(settings, "AI_PROVIDER", "gemini")),
            "enabled": health.get("enabled", False),
            "configured": health.get("configured", False),
            "provider": health.get("provider", ""),
            "model": health.get("model", ""),
            "status": health.get("status", "unavailable"),
            "error_code": health.get("error_code", ""),
            "live_check": health.get("live_check", False),
            "providers": [
                {
                    "name": health.get("provider", ""),
                    "configured": health.get("configured", False),
                    "model": health.get("model", ""),
                    "status": health.get("status", ""),
                }
            ],
        }
    except AIError as exc:
        provider_name = getattr(settings, "AI_PROVIDER", "gemini")
        return {
            "active": provider_name,
            "enabled": bool(getattr(settings, "AI_ENABLED", True)),
            "configured": False,
            "provider": provider_name,
            "model": getattr(settings, "GEMINI_MODEL", ""),
            "status": "not_configured",
            "error_code": exc.code,
            "providers": [],
        }


def parse_json_response(text):
    if not text:
        return {}
    if not isinstance(text, str):
        text = json.dumps(text, ensure_ascii=False)
    cleaned = text.strip()
    fence = re.search(r"```(?:json|JSON)?\s*(\{.*\})\s*```", cleaned, re.S)
    if fence:
        cleaned = fence.group(1)
    for candidate in (cleaned, _first_json_object(cleaned)):
        if not candidate:
            continue
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue
    return {}


def _first_json_object(text):
    text = text or ""
    start = text.find("{")
    if start < 0:
        return ""
    depth = 0
    in_string = False
    escape = False
    for index in range(start, len(text)):
        char = text[index]
        if escape:
            escape = False
            continue
        if char == "\\":
            escape = True
            continue
        if char == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start : index + 1]
    match = JSON_OBJECT_RE.search(text)
    return match.group(0) if match else ""


def _empty_result(provider="", model="", error_code="", errors=None):
    errors = errors or []
    return {"text": "", "provider": provider, "model": model, "error_code": error_code}


def generate_text_result(system_prompt, user_prompt, temperature=0.2, json_mode=False):
    """Genere du texte avec metadonnees fournisseur, sans exposer de secret."""
    provider = None
    try:
        provider = get_provider()
        messages = [AIMessage(role="system", content=system_prompt), AIMessage(role="user", content=user_prompt)]
        max_tokens = int(getattr(settings, "AI_MAX_OUTPUT_TOKENS", 4096))
        if json_mode:
            result = provider.generate_structured(
                messages,
                json_schema_hint="Objet JSON libre correspondant a la demande utilisateur.",
                temperature=temperature,
                max_output_tokens=max_tokens,
            )
            return {
                "text": json.dumps(result.data, ensure_ascii=False),
                "provider": result.provider,
                "model": result.model,
                "error_code": "",
                "structured": result.data,
            }
        result = provider.generate_text(messages, temperature=temperature, max_output_tokens=max_tokens)
        return {"text": result.text.strip(), "provider": result.provider, "model": result.model, "error_code": ""}
    except AIError as exc:
        return {
            "text": "",
            "provider": getattr(provider, "name", getattr(settings, "AI_PROVIDER", "")) if provider else getattr(settings, "AI_PROVIDER", ""),
            "model": getattr(provider, "model", getattr(settings, "GEMINI_MODEL", "")) if provider else getattr(settings, "GEMINI_MODEL", ""),
            "error_code": exc.code,
            "errors": [
                {
                    "provider": getattr(provider, "name", getattr(settings, "AI_PROVIDER", "")) if provider else getattr(settings, "AI_PROVIDER", ""),
                    "model": getattr(provider, "model", getattr(settings, "GEMINI_MODEL", "")) if provider else getattr(settings, "GEMINI_MODEL", ""),
                    "error_code": exc.code,
                }
            ],
        }


def generate_text(system_prompt, user_prompt, temperature=0.2):
    """Generate text with the best available provider and deterministic fallback order."""
    return generate_text_result(system_prompt, user_prompt, temperature=temperature).get("text", "").strip()


def generate_json(system_prompt, user_prompt, fallback=None, temperature=0.15):
    """Generate a JSON object through the configured provider.

    `fallback` is preserved only for legacy non-conversation flows. Provider
    failures are marked with `_error_code` so callers cannot mistake the payload
    for a real IA response.
    """
    result = generate_text_result(system_prompt, user_prompt, temperature=temperature, json_mode=True)
    payload = result.get("structured") or parse_json_response(result.get("text", ""))
    if payload:
        payload.setdefault("_provider", result.get("provider", ""))
        payload.setdefault("_model", result.get("model", ""))
        payload.setdefault("_source", "provider")
        return payload
    if fallback is None:
        raise AIInvalidResponseError(result.get("error_code") or "invalid_ai_response")
    safe = dict(fallback)
    safe.setdefault("_provider", "")
    safe.setdefault("_model", "")
    safe.setdefault("_source", "legacy_fallback")
    safe.setdefault("_error_code", result.get("error_code", "provider_unavailable"))
    return safe
