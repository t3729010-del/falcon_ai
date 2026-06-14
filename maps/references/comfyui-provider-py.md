# Technical Analysis of comfyui_provider.py

## 1. Overview
ComfyUI-based avatar provider. Communicates with a local ComfyUI server via HTTP REST API and WebSocket for real-time output streaming. Builds a node-based workflow for img2img generation using SDXL base model. Requires ComfyUI running on `localhost:8188`.

## 2. Architecture & Setup
```python
import io, json, time, base64, logging, requests, uuid
from .base import AvatarProvider
```
**Dependencies:**
- `requests` — HTTP communication with ComfyUI REST API
- `websocket-client` — Real-time output streaming (lazy import)
- `PIL` (Pillow) — Image resizing and base64 encoding (lazy import)
- `uuid` — Client ID generation for WebSocket identification

**Constants:**
- `COMFYUI_BASE = "http://127.0.0.1:8188"` — Local ComfyUI endpoint

**Instance state:**
- `self._client_id` — Random 8-char UUID for WebSocket multiplexing

## 3. Key Functions

### `check_available() -> tuple[bool, str]`
1. Sends `GET /system_stats` to ComfyUI with 3-second timeout
2. Returns `(True, "ComfyUI running on localhost:8188")` if HTTP 200
3. Returns `(False, ...)` with specific error for non-200 status, connection error, or exception

### `generate(image_bytes: bytes, prompt: str = "") -> tuple[bool, bytes | str]`
1. **Prompt default**: If empty, uses a futuristic virtual human portrait prompt
2. **Image prep**: Opens with PIL, converts to RGB, resizes to 768x768, base64-encodes
3. **Workflow build**: Calls `_build_workflow(img_b64, prompt)`
4. **Submit**: `POST /prompt` with `{prompt: workflow, client_id: self._client_id}`, 30s timeout
5. **Wait for output**: Calls `_wait_for_output(prompt_id)` with WebSocket
6. **Return**: `(True, output_bytes)` on success

**Input**: Raw image bytes (any PIL-decodable format)
**Output**: `(True, png_bytes)` or `(False, error_string)`

### `_build_workflow(img_b64: str, prompt: str) -> dict`
Constructs ComfyUI workflow JSON with 10 nodes:

| Node | Class Type | Purpose |
|------|-----------|---------|
| `2` | `LoadImageBase64` | Decode base64 input image |
| `3` | `KSampler` | Main sampler: 25 steps, cfg 7.0, euler, denoise 0.65 |
| `4` | `CheckpointLoaderSimple` | Loads `sd_xl_base_1.0.safetensors` |
| `5` | `VAEEncode` | Encode input image to latent space |
| `6` | `CLIPTextEncode` | Positive prompt encoding |
| `7` | `CLIPTextEncode` | Negative prompt (distortion, quality issues) |
| `8` | `VAEDecode` | Decode latent to pixel space |
| `9` | `SaveImageWebsocket` | Stream output via WebSocket |

**Key parameters:**
- `denoise: 0.65` — Moderate style transfer (preserves face structure)
- `seed: int(time.time())` — Time-based randomness

### `_wait_for_output(prompt_id: str, timeout: int = 120) -> bytes | None`
1. Connects to `ws://127.0.0.1:8188/ws?clientId={client_id}`
2. Polls messages with 5-second socket timeout
3. Returns raw bytes on binary message (image output)
4. Handles `execution_error` messages → logs and returns `None`
5. Returns `None` on timeout, `ImportError` (missing `websocket-client`), or other exceptions

## 4. Error Handling
- Connection refused → `False, "ComfyUI not found on localhost:8188"`
- HTTP error → `False, "ComfyUI prompt error: {text[:200]}"`
- No prompt_id → `False, "No prompt_id in ComfyUI response"`
- WebSocket timeout → continues polling until overall deadline
- WebSocket import missing → logs warning, returns `None`
- Generic exception → `False, "ComfyUI error: {str(e)[:200]}"`