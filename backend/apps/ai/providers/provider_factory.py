from django.conf import settings

from apps.ai.exceptions import AIConfigurationError

from .gemini_provider import GeminiProvider


_PROVIDERS = {
    "gemini": GeminiProvider,
}

_instance = None
_instance_name = None


def get_provider(force: str | None = None):
    global _instance, _instance_name
    provider_name = (force or getattr(settings, "AI_PROVIDER", "gemini") or "gemini").lower()
    if _instance is not None and _instance_name == provider_name:
        return _instance
    provider_cls = _PROVIDERS.get(provider_name)
    if not provider_cls:
        raise AIConfigurationError(
            f"AI_PROVIDER='{provider_name}' non supporte. Providers disponibles: {', '.join(sorted(_PROVIDERS))}."
        )
    _instance = provider_cls()
    _instance_name = provider_name
    return _instance


def reset_provider_cache():
    global _instance, _instance_name
    _instance = None
    _instance_name = None
