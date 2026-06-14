# Technical Analysis of base.py

## 1. Overview
Abstract base class and registry for the avatar generation provider system. Defines the `AvatarProvider` interface, `ProviderStatus` data model, `ProviderRegistry` for provider management/fallback, and the `PROVIDER_PRIORITY` constant that controls provider selection order.

## 2. Architecture & Setup
```python
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional
```
- **abc**: Abstract base class support for `AvatarProvider`
- **dataclasses**: `ProviderStatus` data structure
- **typing.Optional**: Nullable provider references

No external dependencies. Pure Python standard library.

## 3. Key Components

### PROVIDER_PRIORITY (constant)
```python
PROVIDER_PRIORITY = [
    "identity",      # Highest quality — IP-Adapter-FaceID
    "comfyui",       # ComfyUI WebSocket integration
    "local",         # Local SD2.1 diffusers
    "huggingface_free",  # HuggingFace free Inference API
    "browser_fallback",  # Canvas API — always last resort
]
```
Ordered from best quality to most accessible. Used by `ProviderRegistry.detect_all()` and `generate_with_fallback()`.

### ProviderStatus (dataclass)
Tracks per-provider runtime metrics:
- `available: bool` — Whether provider passed `check_available()`
- `name: str`, `model_name: str` — Provider identity
- `status: str` — `"ready"`, `"unavailable"`, or `"error"`
- `detail: str` — Human-readable status reason
- `last_error: str` — Truncated error message (max 200 chars)
- `last_generation_time_ms: float` — Last inference duration
- `total_generations: int`, `failed_generations: int` — Lifetime counters

### AvatarProvider (ABC)
Abstract base class for all providers. Subclasses must implement:
- **`check_available() -> tuple[bool, str]`**: Check if provider can run. Returns `(is_available, reason)`.
- **`generate(image_bytes: bytes, prompt: str = "") -> tuple[bool, bytes | str]`**: Generate avatar. Returns `(success, result_bytes_or_error)`.

Constructor initializes `self.status` with `available=False`, `status="unavailable"`.

**`get_status_dict() -> dict`**: Serializes `ProviderStatus` to a dict for API responses. Includes all metrics.

### ProviderRegistry
Central registry managing all provider instances.

| Method | Description |
|--------|-------------|
| `register(provider)` | Adds provider to `_providers` dict keyed by `provider.name` |
| `get(name) -> Optional[AvatarProvider]` | Lookup provider by name |
| `detect_all() -> list[str]` | Calls `check_available()` on all providers in `PROVIDER_PRIORITY` order. Returns list of available provider names. Updates each provider's `status` accordingly. |
| `select_best() -> Optional[str]` | Runs `detect_all()`, sets `_active_provider` to first available (or `"browser_fallback"` if none). Returns active provider name. |
| `generate_with_fallback(image_bytes, prompt)` | Tries active provider first, then iterates `PROVIDER_PRIORITY`. Returns `(success, result, provider_name)`. Skips unavailable providers. Increments `failed_generations` on failure. |
| `get_all_status() -> list[dict]` | Returns status dicts for all registered providers. |
| `get_active_name() -> str` | Returns active provider name or `"none"`. |

**`active` property**: Getter/setter for `_active_provider`. Setter validates name exists in `_providers`.

## 4. Error Handling Patterns
- `generate_with_fallback()` catches generic `Exception` for each provider attempt, logs error to `provider.status.last_error` (truncated to 200 chars), increments `failed_generations`.
- Special case: if `generate()` returns `BROWSER_FALLBACK_SIGNAL`, immediately returns without trying more providers.
- Final fallback: returns `False, "All providers failed to generate avatar", "none"`.

## 5. Data Flow
```
select_best() → detect_all() → [check_available() per provider]
                                        ↓
generate_with_fallback() → try active → fallback to PROVIDER_PRIORITY order
                                        ↓
                              return (success, result, provider_name)
```