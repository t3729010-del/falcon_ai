# Technical Analysis of avatar_manager.py

## 1. Overview

Avatar generation orchestrator that manages a registry of AI image providers with automatic fallback. Implements a priority-based provider selection system and exposes a single `generate_avatar()` function that attempts providers in order until one succeeds.

## 2. Architecture & Setup

**Imports**

| Library | Purpose |
|---|---|
| `logging` | Structured logging for provider detection and generation |
| `time` | Inference timing measurement |
| `providers.ProviderRegistry` | Central provider management |
| `providers.IdentityProvider` | Highest priority — identity-preserving generation |
| `providers.ComfyUIProvider` | ComfyUI backend integration |
| `providers.LocalProvider` | Local model inference |
| `providers.HuggingFaceProvider` | HuggingFace API inference |
| `providers.BrowserFallbackProvider` | Browser-based fallback (lowest priority) |

**Singleton Pattern**: Global `_registry` variable (line 16) initialized lazily via `get_registry()`. Ensures single registry instance across the process.

## 3. Key Features

### Provider Priority System

Providers are registered in strict priority order (lines 23-27):

```
1. IdentityProvider        (highest priority)
2. ComfyUIProvider
3. LocalProvider
4. HuggingFaceProvider
5. BrowserFallbackProvider (lowest priority)
```

On first call to `get_registry()`:
1. All five providers are registered in order.
2. `_registry.detect_all()` is called to probe availability.
3. `_registry.select_best()` picks the highest-priority available provider.
4. If none available, falls back to `"browser_fallback"`.

### `generate_avatar(image_bytes, prompt)` — line 42

Main generation endpoint. Flow:

1. Gets or initializes the registry singleton.
2. Calls `registry.generate_with_fallback(image_bytes, prompt)` which tries providers in priority order.
3. **Success path** (result is `bytes`):
   - Decodes image to get dimensions via PIL.
   - Base64-encodes to a data URL (`data:image/png;base64,...`).
   - Returns `{"success": True, "avatar": data_url, "model_used": ..., "inference_time_s": ...}`.
4. **Browser fallback path** (`result == "__USE_BROWSER_FALLBACK__"`):
   - Returns `{"success": False, "use_browser_fallback": True, "model_used": "browser_fallback"}`.
5. **Failure path**:
   - Returns `{"success": False, "error": <truncated to 300 chars>, "model_used": ...}`.

### `get_diagnostics()` — line 92

Returns provider status summary:
- Active provider name
- All provider statuses via `registry.get_all_status()`
- Total and available provider counts

## 4. Data Structure & Persistence

**Registry State** (in-memory only, no persistence):
- `_registry: ProviderRegistry | None` — global singleton.
- Registry holds provider instances and tracks which is active.

**`generate_avatar()` Return Schema**

| Key | Type | Description |
|---|---|---|
| `success` | bool | Whether avatar was generated |
| `avatar` | str | Base64 data URL (success only) |
| `model_used` | str | Provider name that generated the avatar |
| `inference_time_s` | float | Elapsed time in seconds (success only) |
| `error` | str | Error message (failure only, max 300 chars) |
| `use_browser_fallback` | bool | Signals client-side processing needed |

## 5. Logic & Event Handlers

### Initialization Flow (lines 19-39)

```
get_registry()
  ├─ If _registry is None:
  │   ├─ Create ProviderRegistry
  │   ├─ Register providers in priority order
  │   ├─ detect_all() → probe each provider's availability
  │   ├─ select_best() → pick highest-priority available
  │   └─ If none available → set active to "browser_fallback"
  └─ Return _registry
```

### Generation Fallback Flow (line 47)

```
generate_with_fallback(image_bytes, prompt)
  ├─ Try IdentityProvider → check_available() → generate()
  ├─ Try ComfyUIProvider → check_available() → generate()
  ├─ Try LocalProvider → check_available() → generate()
  ├─ Try HuggingFaceProvider → check_available() → generate()
  └─ Try BrowserFallbackProvider → return "__USE_BROWSER_FALLBACK__"
```

Each provider is queried via `check_available()` before `generate()` is attempted.

### Error Handling

- Provider detection failures are logged but do not crash.
- Generation errors are caught by `generate_with_fallback()` and returned as error strings.
- Image dimension parsing failures default to `(0, 0)` (line 60).
- Error messages are truncated to 300 characters to prevent oversized responses.
