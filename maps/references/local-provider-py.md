# Technical Analysis of local_provider.py

## 1. Overview
Local inference avatar provider using Stable Diffusion 2.1 via HuggingFace `diffusers`. Runs img2img pipeline entirely on local hardware (GPU preferred, CPU fallback). Requires ~3GB RAM and `torch`, `diffusers`, `transformers`, `accelerate`.

## 2. Architecture & Setup
```python
import io, time, base64, logging
from .base import AvatarProvider
```
**Dependencies:**
- `torch` — PyTorch tensor operations, CUDA detection
- `diffusers` — `StableDiffusionImg2ImgPipeline`
- `transformers`, `accelerate` — Required by diffusers
- `psutil` (optional) — RAM availability check
- `PIL` (Pillow) — Image resizing (lazy import)

**Module-level globals:**
- `LOCAL_SD_AVAILABLE: bool` — Set `True` if imports + RAM check pass
- `LOCAL_SD_REASON: str` — Error reason if unavailable
- `LOCAL_PIPE` — Lazy-loaded pipeline singleton

**RAM check:** Requires ≥3GB available (checked via `psutil.virtual_memory()`).

## 3. Key Functions

### `_load_local_pipe()`
Lazily loads `StableDiffusionImg2ImgPipeline` from `stabilityai/stable-diffusion-2-1`:
- `torch_dtype=torch.float32`
- `safety_checker=None`
- Auto-detects CUDA: moves to GPU if available, logs CPU fallback warning
- `enable_attention_slicing()` for memory efficiency
- Returns `(pipe, None)` or `(None, error_string)`

### `check_available() -> tuple[bool, str]`
1. Returns `False` immediately if `LOCAL_SD_AVAILABLE` is `False`
2. Calls `_load_local_pipe()` to verify model loads
3. Returns `(True, "Local SD2.1 ready")` on success
4. Returns `(False, "Failed to load model: {err}")` on failure

### `generate(image_bytes: bytes, prompt: str = "") -> tuple[bool, bytes | str]`
1. **Lazy load**: If pipeline not loaded, calls `_load_local_pipe()`. Returns error if fails.
2. **Prompt default**: If empty, uses futuristic virtual human portrait prompt
3. **Image prep**: Opens with PIL, converts to RGB, resizes to 768x768
4. **Inference**: `pipe()` with:
   - `strength=0.65` — Moderate transformation
   - `guidance_scale=7.0`
   - `num_inference_steps=25`
   - Negative prompt for quality/deformation prevention
5. **Output**: Saves result PIL image to PNG bytes via `io.BytesIO`

**Input**: Raw image bytes (any PIL-decodable format)
**Output**: `(True, png_bytes)` or `(False, error_string)`

## 4. Default Prompt
```
professional humanoid AI assistant avatar, futuristic virtual human portrait,
clean symmetrical face, highly detailed digital illustration, 2D vector art style
```

## 5. Error Handling
- Import errors → `LOCAL_SD_AVAILABLE = False` with `e.name`
- RAM check → silently skipped if `psutil` not installed
- Pipeline load failure → `False, "Failed to load model: {err}"`
- Not loaded at generate time → `False, "Local model not loaded: {err}"`
- Inference exception → `False, "Local inference failed: {str(e)[:200]}"`
- Updates `status.last_generation_time_ms` on success