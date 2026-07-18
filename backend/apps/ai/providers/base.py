from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AIMessage:
    role: str
    content: str


@dataclass
class AITextResult:
    text: str
    provider: str
    model: str
    raw: Any = None
    usage: dict = field(default_factory=dict)


@dataclass
class AIStructuredResult:
    data: dict
    provider: str
    model: str
    raw_text: str = ""
    raw: Any = None


class BaseAIProvider(ABC):
    name = "base"

    @abstractmethod
    def generate_text(self, messages: list[AIMessage], *, temperature: float, max_output_tokens: int) -> AITextResult:
        raise NotImplementedError

    @abstractmethod
    def generate_structured(
        self,
        messages: list[AIMessage],
        *,
        json_schema_hint: str,
        temperature: float,
        max_output_tokens: int,
    ) -> AIStructuredResult:
        raise NotImplementedError

    @abstractmethod
    def analyze_image(self, image_bytes: bytes, mime_type: str, prompt: str, *, json_schema_hint: str = "") -> AIStructuredResult:
        raise NotImplementedError

    @abstractmethod
    def analyze_multimodal(
        self,
        image_bytes: bytes | None,
        mime_type: str | None,
        text: str,
        *,
        json_schema_hint: str,
    ) -> AIStructuredResult:
        raise NotImplementedError

    @abstractmethod
    def health_check(self, *, live: bool = False) -> dict:
        raise NotImplementedError
