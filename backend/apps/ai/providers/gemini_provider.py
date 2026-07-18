import base64
import json
import re
import time

import requests
from django.conf import settings

from apps.ai.exceptions import (
    AIConfigurationError,
    AIInvalidResponseError,
    AIModelError,
    AIProviderError,
    AIQuotaError,
    AITimeoutError,
)

from .base import AIMessage, AIStructuredResult, AITextResult, BaseAIProvider


GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"


def _redact_secret(value: str) -> str:
    api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
    if api_key:
        value = value.replace(api_key, "[redacted]")
    return value


class GeminiProvider(BaseAIProvider):
    name = "gemini"

    def __init__(self):
        self.enabled = bool(getattr(settings, "AI_ENABLED", True))
        self.api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
        self.model = getattr(settings, "GEMINI_MODEL", "") or ""
        self.timeout = int(getattr(settings, "AI_TIMEOUT_SECONDS", 60))
        self.max_retries = int(getattr(settings, "AI_MAX_RETRIES", 2))

    def _ensure_configured(self):
        if not self.enabled:
            raise AIConfigurationError("Le module IA est desactive par AI_ENABLED=false.")
        if not self.api_key:
            raise AIConfigurationError("GEMINI_API_KEY absent dans backend/.env.")
        if not self.model:
            raise AIConfigurationError("GEMINI_MODEL absent dans backend/.env.")

    def _split_messages(self, messages: list[AIMessage]) -> tuple[str, list[dict]]:
        system_parts = []
        contents = []
        for message in messages:
            if message.role == "system":
                system_parts.append(message.content)
                continue
            role = "model" if message.role == "assistant" else "user"
            contents.append({"role": role, "parts": [{"text": message.content}]})
        if not contents:
            contents.append({"role": "user", "parts": [{"text": ""}]})
        return "\n\n".join(system_parts), contents

    def _raise_for_response(self, response):
        if response.status_code == 429:
            raise AIQuotaError("Quota Gemini depasse.")
        if response.status_code in {401, 403}:
            raise AIConfigurationError("Cle Gemini absente, invalide ou refusee.")
        if response.status_code == 404:
            raise AIModelError("Modele Gemini indisponible ou inconnu.")
        if response.status_code == 408:
            raise AITimeoutError("Timeout Gemini.")
        if response.status_code >= 500:
            raise AIProviderError(f"Gemini indisponible (HTTP {response.status_code}).")
        if response.status_code >= 400:
            detail = _redact_secret(response.text[:300])
            raise AIInvalidResponseError(f"Requete Gemini rejetee (HTTP {response.status_code}): {detail}")

    def _post(self, payload: dict) -> dict:
        self._ensure_configured()
        last_error = None
        url = f"{GEMINI_BASE_URL}/{self.model}:generateContent"
        for attempt in range(self.max_retries + 1):
            try:
                response = requests.post(
                    url,
                    params={"key": self.api_key},
                    json=payload,
                    timeout=self.timeout,
                )
                self._raise_for_response(response)
                try:
                    return response.json()
                except ValueError as exc:
                    raise AIInvalidResponseError("Reponse Gemini non JSON.") from exc
            except AITimeoutError as exc:
                last_error = exc
            except requests.Timeout as exc:
                last_error = AITimeoutError(f"Timeout Gemini apres {self.timeout}s.")
            except requests.RequestException as exc:
                last_error = AIProviderError(_redact_secret(f"Erreur reseau Gemini: {exc}"))
            except AIProviderError as exc:
                last_error = exc
                if not isinstance(exc, AIProviderError) or isinstance(exc, (AIModelError, AIConfigurationError, AIQuotaError)):
                    raise
            if attempt < self.max_retries:
                time.sleep(0.45 * (attempt + 1))
        raise last_error or AIProviderError("Echec Gemini apres retries.")

    @staticmethod
    def _extract_text(data: dict) -> str:
        try:
            candidates = data.get("candidates") or []
            parts = candidates[0].get("content", {}).get("parts", []) if candidates else []
            text = "\n".join(part.get("text", "") for part in parts if isinstance(part, dict)).strip()
        except (KeyError, IndexError, AttributeError) as exc:
            raise AIInvalidResponseError(f"Format de reponse Gemini inattendu: {exc}") from exc
        if not text:
            raise AIInvalidResponseError("Reponse Gemini vide.")
        return text

    @staticmethod
    def _extract_json(text: str) -> dict:
        cleaned = text.strip()
        fence = re.search(r"```(?:json|JSON)?\s*(\{.*\})\s*```", cleaned, re.S)
        if fence:
            cleaned = fence.group(1)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", cleaned, re.S)
            if match:
                try:
                    return json.loads(match.group(0))
                except json.JSONDecodeError:
                    pass
        raise AIInvalidResponseError("Impossible de parser un JSON valide dans la reponse IA.")

    def generate_text(self, messages: list[AIMessage], *, temperature: float, max_output_tokens: int) -> AITextResult:
        system_text, contents = self._split_messages(messages)
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens,
            },
        }
        if system_text:
            payload["systemInstruction"] = {"parts": [{"text": system_text}]}
        data = self._post(payload)
        return AITextResult(text=self._extract_text(data), provider=self.name, model=self.model, raw=data)

    def generate_structured(
        self,
        messages: list[AIMessage],
        *,
        json_schema_hint: str,
        temperature: float,
        max_output_tokens: int,
    ) -> AIStructuredResult:
        schema_message = (
            "Tu dois repondre uniquement avec un objet JSON valide, sans Markdown, "
            "sans texte avant ou apres. Schema attendu:\n"
            f"{json_schema_hint}"
        )
        structured_messages = [AIMessage("system", schema_message), *messages]
        system_text, contents = self._split_messages(structured_messages)
        data = self._post(
            {
                "systemInstruction": {"parts": [{"text": system_text}]},
                "contents": contents,
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": max_output_tokens,
                    "responseMimeType": "application/json",
                },
            }
        )
        text = self._extract_text(data)
        return AIStructuredResult(data=self._extract_json(text), raw_text=text, provider=self.name, model=self.model, raw=data)

    def analyze_image(self, image_bytes: bytes, mime_type: str, prompt: str, *, json_schema_hint: str = "") -> AIStructuredResult:
        self._ensure_configured()
        parts = [
            {"text": prompt},
            {"inline_data": {"mime_type": mime_type, "data": base64.b64encode(image_bytes).decode("ascii")}},
        ]
        generation_config = {
            "temperature": 0.2,
            "maxOutputTokens": int(getattr(settings, "AI_MAX_OUTPUT_TOKENS", 4096)),
        }
        if json_schema_hint:
            generation_config["responseMimeType"] = "application/json"
            parts[0]["text"] = f"{prompt}\n\nReponds uniquement en JSON valide conforme a ce schema:\n{json_schema_hint}"
        data = self._post({"contents": [{"role": "user", "parts": parts}], "generationConfig": generation_config})
        text = self._extract_text(data)
        payload = self._extract_json(text) if json_schema_hint else {"text": text}
        return AIStructuredResult(data=payload, raw_text=text, provider=self.name, model=self.model, raw=data)

    def analyze_multimodal(
        self,
        image_bytes: bytes | None,
        mime_type: str | None,
        text: str,
        *,
        json_schema_hint: str,
    ) -> AIStructuredResult:
        if image_bytes and mime_type:
            return self.analyze_image(image_bytes, mime_type, text, json_schema_hint=json_schema_hint)
        return self.generate_structured(
            [AIMessage("user", text)],
            json_schema_hint=json_schema_hint,
            temperature=0.2,
            max_output_tokens=int(getattr(settings, "AI_MAX_OUTPUT_TOKENS", 4096)),
        )

    def health_check(self, *, live: bool = False) -> dict:
        configured = bool(self.enabled and self.api_key and self.model)
        payload = {
            "enabled": self.enabled,
            "configured": configured,
            "provider": self.name,
            "model": self.model,
            "status": "available" if configured else "not_configured",
        }
        if not self.enabled:
            payload.update({"status": "disabled", "error_code": "ai_disabled"})
            return payload
        if not self.api_key:
            payload.update({"configured": False, "status": "not_configured", "error_code": "ai_not_configured"})
            return payload
        if not self.model:
            payload.update({"configured": False, "status": "not_configured", "error_code": "model_unavailable"})
            return payload
        if not live:
            payload["live_check"] = False
            return payload
        try:
            result = self.generate_text(
                [AIMessage("user", "Reponds uniquement par : ECO IA CONNECTEE")],
                temperature=0,
                max_output_tokens=128,
            )
            payload.update({"status": "available", "live_check": True, "sample_ok": "ECO IA" in result.text.upper()})
        except (AIConfigurationError, AIModelError, AIQuotaError, AITimeoutError, AIInvalidResponseError, AIProviderError) as exc:
            payload.update({"status": "unavailable", "live_check": True, "error_code": exc.code, "detail": exc.message})
        return payload
