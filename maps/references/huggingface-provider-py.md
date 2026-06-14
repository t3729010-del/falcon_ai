# Technical Analysis of huggingface_provider.py

## 1. Overview
Cloud-based avatar provider using HuggingFace's free Inference API. Tries multiple SD models with automatic fallback. Handles rate limiting (HTTP 429), model loading (HTTP 503), and payment required (HTTP 402) gracefully. Requires `HF_API_KEY` environment variable.

## 2. Architecture & Setup
```python
import io, os, time, base64, hashlib, logging, requests
from .base import AvatarProvider
```
**Dependencies:**
- `requests` — HTTP communication with HuggingFace API
- `hashlib` — MD5 checksums for input/output deduplication

**Constants:**
```python
HF_INFERENCE_API = "https://api-inference.huggingface.co/models"

FREE_MODELS = [
    {"id": "stabilityai/stable-diffusion-2-1", "note": "SD2.1 — primary"},
    {"id": "runwayml/stable-diffusion-v1-5", "note": "SD1.5 — fallback"},
]
```
Uses the **old** free Inference API (not the paid Inference Providers).

**Instance state:**
- `self._api_key` — Read from `HF_API_KEY` env var
- `self._last_model_used` — Tracks which model succeeded

## 3. Key Functions

### `check_available() -> tuple[bool, str]`
1. Returns `False` if no `HF_API_KEY` set
2. Sends `GET` to first model endpoint with 5s timeout
3. Returns `(True, "Free Inference API accessible")` for HTTP 200 or 503 (model loading)
4. Returns `(False, "HF_API_KEY is invalid")` for HTTP 401
5. Returns `(True, "API reachable (may have rate limits)")` for other status codes
6. Returns `(False, ...)` for connection errors or exceptions

### `generate(image_bytes: bytes, prompt: str = "") -> tuple[bool, bytes | str]`
1. **Guard**: Returns error if no API key
2. **Prompt default**: Detailed futuristic avatar with blue neon accents
3. **Input prep**: Base64-encodes image, computes MD5 hash
4. **Model iteration**: Loops through `FREE_MODELS` list:

**For each model:**
- **Payload**: `{inputs: base64_image, parameters: {prompt, negative_prompt, guidance_scale: 7.5, num_inference_steps: 25, strength: 0.75}}`
- **Request**: `POST /{model_id}` with Bearer auth, 120s timeout

**Response handling:**
| Status | Action |
|--------|--------|
| 503 | Parse `x-wait-time` header, sleep (max 60s), retry next model |
| 429 | Rate limited — skip to next model |
| 402 | Payment required — skip to next model |
| 200 + image content | Validate MD5 ≠ input hash, return bytes |
| 200 + non-image | Skip (not valid image response) |

**Input**: Raw image bytes (any format — base64 encoded for API)
**Output**: `(True, image_bytes)` or `(False, error_string)`

## 4. Error Handling Patterns
- **Rate limiting (429)**: Silently skips to next model
- **Model loading (503)**: Reads `x-wait-time` header, sleeps up to 60s, retries
- **Payment required (402)**: Skips to next model
- **Timeout**: Logs warning, continues to next model
- **Output == input**: MD5 comparison prevents returning unmodified images
- **All models fail**: Returns `"All free HuggingFace models failed (rate limited or unavailable)"`

## 5. Security Notes
- API key stored in `HF_API_KEY` environment variable (never hardcoded)
- Bearer token sent in Authorization header
- No secrets logged (only model IDs and status codes)