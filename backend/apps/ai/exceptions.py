"""Exceptions metier du module IA.

Ces exceptions donnent des codes propres au frontend et aux logs. Elles ne
transportent jamais de secret fournisseur, seulement une raison exploitable.
"""


class AIError(Exception):
    code = "ai_error"

    def __init__(self, message="", **extra):
        self.message = message or self.code
        self.extra = extra
        super().__init__(self.message)

    def to_dict(self):
        return {"error_code": self.code, "message": self.message, **self.extra}


class AIConfigurationError(AIError):
    code = "ai_not_configured"


class AINotConfigured(AIConfigurationError):
    pass


class AIProviderError(AIError):
    code = "provider_unavailable"


class AIProviderUnavailable(AIProviderError):
    pass


class AITimeoutError(AIError):
    code = "provider_timeout"


class AIQuotaError(AIError):
    code = "quota_exceeded"


class AIQuotaExceeded(AIQuotaError):
    pass


class AIModelError(AIProviderError):
    code = "model_unavailable"


class AIInvalidResponseError(AIError):
    code = "invalid_ai_response"


class AIPermissionError(AIError):
    code = "permission_denied"


class AIValidationError(AIError):
    code = "validation_error"
