# Technical Analysis of identity_provider.py

## 1. Overview
Highest-priority avatar provider. Uses IP-Adapter-FaceID with Stable Diffusion 1.5 to generate identity-preserving avatars. Extracts face embeddings via InsightFace, then runs img2img inference with face conditioning. Requires ~4GB RAM and multiple ML libraries.

## 2. Architecture & Setup
```python
import io, time, logging, numpy as np
from .base import AvatarProvider
```
**Dependencies:**
- `insightface` — Face detection and embedding extraction (`buffalo_l` model)
- `torch` — PyTorch tensor operations, GPU/CPU inference
- `diffusers` — `StableDiffusionPipeline`, `DDIMScheduler`
- `transformers`, `accelerate` — Required by diffusers
- `psutil` (optional) — RAM availability check
- `cv2` (imported at runtime) — Image decoding

**Module-level availability check:**
```python
IDENTITY_AVAILABLE = False  # Set True if all imports succeed
IDENTITY_REASON = ""        # Error message if unavailable
```
Also checks `psutil.virtual_memory().available >= 4GB`. If insufficient RAM, sets `IDENTITY_AVAILABLE = False`.

**Singleton globals:**
- `FACE_APP` — Lazily loaded `FaceAnalysis` instance
- `PIPE` — Lazily loaded diffusers pipeline
- `PIPE_LOADED` — Pipeline load flag

## 3. Key Functions

### `_load_face_app()`
Lazily initializes `FaceAnalysis` with `buffalo_l` model on CPU. Sets `det_size=(320, 320)`. Returns cached `FACE_APP` singleton.

### `_load_pipeline()`
Lazily loads `StableDiffusionPipeline` from `runwayml/stable-diffusion-v1-5`:
- `torch_dtype=torch.float32`
- `safety_checker=None`
- `DDIMScheduler` (replaces default PNDM)
- `enable_attention_slicing()` for memory efficiency
- Loads `h94/IP-Adapter-FaceID` with `ip-adapter-faceid_sd15.bin`

Returns `(pipe, None)` on success or `(None, error_string)` on failure.

### `check_available()`
1. Returns `False` immediately if `IDENTITY_AVAILABLE` is `False` (import/RAM check failed)
2. Calls `_load_face_app()` to verify InsightFace works
3. Returns `(True, "IP-Adapter-FaceID + SD1.5 ready (identity-preserving)")` on success
4. Returns `(False, "Face model load failed: ...")` on exception

### `generate(image_bytes: bytes, prompt: str = "") -> tuple[bool, bytes | str]`
1. **Image decode**: `np.frombuffer` → `cv2.imdecode`. Returns error if decode fails.
2. **Face detection**: `FACE_APP.get(img)` → takes first face. Returns error if no faces found.
3. **Embedding**: Extracts `face.normed_embedding`, converts to `torch.float32` tensor.
4. **Pipeline load**: Calls `_load_pipeline()`. Returns error if pipeline unavailable.
5. **Prompt default**: If empty, uses a detailed cyberpunk robot avatar prompt.
6. **Inference**: `pipe()` with 25 steps, `guidance_scale=7.0`, seed 42. Includes negative prompt for quality.
7. **Output**: Saves result PIL image to PNG bytes via `io.BytesIO`.

**Input**: Raw image bytes (any format decodable by OpenCV)
**Output**: `(True, png_bytes)` or `(False, error_string)`

## 4. Default Prompt
```
professional AI assistant avatar, futuristic humanoid robot portrait,
front facing, symmetrical face, clean studio lighting, high quality,
4k detailed, cyberpunk aesthetic, cinematic portrait, sharp focus
```

## 5. Error Handling
- Import errors → sets `IDENTITY_AVAILABLE = False` with `e.name`
- RAM check failure → silently ignored if `psutil` not installed
- No face detected → returns `False, "No face detected in the uploaded image"`
- Pipeline load failure → returns `False, "Pipeline unavailable: {err}"`
- Inference exception → returns `False, "Inference error: {str(e)[:300]}"`
- Updates `status.last_generation_time_ms` on success