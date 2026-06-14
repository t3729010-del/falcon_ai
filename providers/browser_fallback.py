from .base import AvatarProvider

BROWSER_FALLBACK_SIGNAL = "__USE_BROWSER_FALLBACK__"


class BrowserFallbackProvider(AvatarProvider):
    name = "browser_fallback"
    model_name = "canvas_image_processor"

    def check_available(self) -> tuple[bool, str]:
        return True, "Always available — runs entirely in the browser via Canvas API"

    def generate(self, image_bytes: bytes, prompt: str = "") -> tuple[bool, bytes | str]:
        return False, BROWSER_FALLBACK_SIGNAL
