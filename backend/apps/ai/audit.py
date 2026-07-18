"""Outils d'observabilite du coeur IA.

Le logging IA doit etre centralise pour rester fiable: un appel Gemini, une
analyse image ou un fallback local doivent tous produire une trace comparable.
"""

import time

from .models import AIAnalysisLog


def monotonic_ms(started):
    return int((time.monotonic() - started) * 1000)


def provider_from_payload(payload):
    if not isinstance(payload, dict):
        return "", ""
    return payload.get("_provider", "") or "", payload.get("_model", "") or ""


def record_ai_operation(
    *,
    user=None,
    operation,
    started,
    success,
    provider="",
    model_name="",
    target_type="",
    target_id="",
    error_code="",
    fallback_used=False,
    metadata=None,
):
    """Ecrit une ligne de log IA sans jamais bloquer le workflow metier."""

    try:
        AIAnalysisLog.objects.create(
            user=user if getattr(user, "is_authenticated", False) and getattr(user, "id", None) else None,
            operation=operation,
            provider=provider or "",
            model_name=model_name or "",
            target_type=target_type or "",
            target_id=str(target_id or ""),
            success=bool(success),
            error_code=error_code or "",
            fallback_used=bool(fallback_used),
            duration_ms=monotonic_ms(started),
            metadata=metadata or {},
        )
    except Exception:
        # Un probleme de log ne doit jamais empecher un signalement, un rapport
        # ou une reponse utilisateur.
        return None
