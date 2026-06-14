from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional

# Priority order: best quality / most capable first
PROVIDER_PRIORITY = [
    "identity",
    "comfyui",
    "local",
    "huggingface_free",
    "browser_fallback",
]


@dataclass
class ProviderStatus:
    available: bool
    name: str
    model_name: str
    status: str  # "ready", "unavailable", "error"
    detail: str = ""
    last_error: str = ""
    last_generation_time_ms: float = 0.0
    total_generations: int = 0
    failed_generations: int = 0


class AvatarProvider(ABC):
    name: str = ""
    model_name: str = ""

    def __init__(self):
        self.status = ProviderStatus(
            available=False,
            name=self.name,
            model_name=self.model_name,
            status="unavailable",
        )

    @abstractmethod
    def check_available(self) -> tuple[bool, str]:
        pass

    @abstractmethod
    def generate(self, image_bytes: bytes, prompt: str = "") -> tuple[bool, bytes | str]:
        pass

    def get_status_dict(self) -> dict:
        return {
            "name": self.status.name,
            "model": self.status.model_name,
            "available": self.status.available,
            "status": self.status.status,
            "detail": self.status.detail,
            "last_error": self.status.last_error,
            "last_generation_time_ms": self.status.last_generation_time_ms,
            "total_generations": self.status.total_generations,
            "failed_generations": self.status.failed_generations,
        }


class ProviderRegistry:
    def __init__(self):
        self._providers: dict[str, AvatarProvider] = {}
        self._active_provider: Optional[str] = None
        self._fallback_chain: list[str] = []

    def register(self, provider: AvatarProvider):
        self._providers[provider.name] = provider

    def get(self, name: str) -> Optional[AvatarProvider]:
        return self._providers.get(name)

    def detect_all(self) -> list[str]:
        available = []
        for name in PROVIDER_PRIORITY:
            provider = self._providers.get(name)
            if provider:
                ok, reason = provider.check_available()
                if ok:
                    available.append(name)
                    provider.status.available = True
                    provider.status.status = "ready"
                    provider.status.detail = reason
                else:
                    provider.status.available = False
                    provider.status.status = "unavailable"
                    provider.status.detail = reason
        return available

    def select_best(self) -> Optional[str]:
        available = self.detect_all()
        if available:
            self._active_provider = available[0]
        else:
            self._active_provider = "browser_fallback"
        return self._active_provider

    @property
    def active(self) -> Optional[AvatarProvider]:
        if self._active_provider:
            return self._providers.get(self._active_provider)
        return None

    @active.setter
    def active(self, name: str):
        if name in self._providers:
            self._active_provider = name

    def generate_with_fallback(self, image_bytes: bytes, prompt: str = "") -> tuple[bool, bytes | str, str]:
        providers_to_try = []
        if self._active_provider:
            providers_to_try.append(self._active_provider)
        for name in PROVIDER_PRIORITY:
            if name != self._active_provider:
                providers_to_try.append(name)

        seen = set()
        for name in providers_to_try:
            if name in seen:
                continue
            seen.add(name)
            provider = self._providers.get(name)
            if not provider:
                continue
            ok, _ = provider.check_available()
            if not ok:
                continue
            try:
                success, result = provider.generate(image_bytes, prompt)
                provider.status.total_generations += 1
                if success:
                    self._active_provider = name
                    return True, result, name
                else:
                    from .browser_fallback import BROWSER_FALLBACK_SIGNAL
                    if isinstance(result, str) and result == BROWSER_FALLBACK_SIGNAL:
                        return False, result, name
                    provider.status.failed_generations += 1
                    provider.status.last_error = str(result)[:200]
            except Exception as e:
                provider.status.failed_generations += 1
                provider.status.last_error = str(e)[:200]

        return False, "All providers failed to generate avatar", "none"

    def get_all_status(self) -> list[dict]:
        return [
            p.get_status_dict()
            for p in self._providers.values()
        ]

    def get_active_name(self) -> str:
        return self._active_provider or "none"
