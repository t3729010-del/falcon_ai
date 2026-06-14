# Technical Analysis of browser_fallback.py

## 1. Overview
Minimal fallback provider that signals the frontend to handle avatar generation entirely in-browser using the Canvas API. No server-side inference occurs. Always available as the last resort when all other providers fail.

## 2. Architecture & Setup
```python
from .base import AvatarProvider
```

**No external dependencies.** Pure Python with only the base class import.

## 3. Key Components

### BROWSER_FALLBACK_SIGNAL (constant)
```python
BROWSER_FALLBACK_SIGNAL = "__USE_BROWSER_FALLBACK__"
```
Special string sentinel returned by `generate()`. Detected by `ProviderRegistry.generate_with_fallback()` to immediately return control to the frontend without trying more providers.

### BrowserFallbackProvider (class)

**Properties:**
- `name = "browser_fallback"`
- `model_name = "canvas_image_processor"`

**`check_available() -> tuple[bool, str]`**
Always returns `(True, "Always available — runs entirely in the browser via Canvas API")`. No checks needed — Canvas API is a browser-native feature.

**`generate(image_bytes: bytes, prompt: str = "") -> tuple[bool, bytes | str]`**
Always returns `(False, BROWSER_FALLBACK_SIGNAL)`. The `False` indicates no server-side generation occurred. The signal string tells the registry to delegate to frontend Canvas processing.

## 4. Integration with ProviderRegistry
In `ProviderRegistry.generate_with_fallback()` (base.py:136-138):
```python
from .browser_fallback import BROWSER_FALLBACK_SIGNAL
if isinstance(result, str) and result == BROWSER_FALLBACK_SIGNAL:
    return False, result, name
```
When this signal is detected, the registry short-circuits — no further providers are attempted, and the frontend is expected to handle generation via Canvas API.

## 5. Error Handling
None required. This provider cannot fail — it performs no computation and always returns the same signal.