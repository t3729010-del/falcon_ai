import io
import time
import base64
import logging

from .base import AvatarProvider

logger = logging.getLogger(__name__)

LOCAL_SD_AVAILABLE = False
LOCAL_SD_REASON = ""
LOCAL_PIPE = None

try:
    import torch
    import diffusers
    import transformers
    import accelerate

    LOCAL_SD_AVAILABLE = True
    LOCAL_SD_REASON = "Libraries available"
except ImportError as e:
    LOCAL_SD_AVAILABLE = False
    LOCAL_SD_REASON = f"Missing dependency: {e.name}"

if LOCAL_SD_AVAILABLE:
    try:
        import psutil
        mem = psutil.virtual_memory()
        if mem.available < 3 * 1024**3:
            LOCAL_SD_AVAILABLE = False
            LOCAL_SD_REASON = f"Insufficient RAM ({mem.available / 1024**3:.1f}GB available, need ~3GB)"
    except ImportError:
        pass


def _load_local_pipe():
    global LOCAL_PIPE
    if LOCAL_PIPE is not None:
        return LOCAL_PIPE, None
    try:
        from diffusers import StableDiffusionImg2ImgPipeline
        pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
            "stabilityai/stable-diffusion-2-1",
            torch_dtype=torch.float32,
            safety_checker=None,
        )
        if torch.cuda.is_available():
            pipe = pipe.to("cuda")
        else:
            logger.info("No GPU found — running SD2.1 on CPU (will be slow)")
        pipe.enable_attention_slicing()
        LOCAL_PIPE = pipe
        return pipe, None
    except Exception as e:
        return None, str(e)


class LocalProvider(AvatarProvider):
    name = "local"
    model_name = "stabilityai/stable-diffusion-2-1"

    def __init__(self):
        super().__init__()
        self._pipe_loaded = False
        self._pipe_error = ""

    def check_available(self) -> tuple[bool, str]:
        if not LOCAL_SD_AVAILABLE:
            return False, LOCAL_SD_REASON

        pipe, err = _load_local_pipe()
        if pipe is None:
            return False, f"Failed to load model: {err}"
        self._pipe_loaded = True
        return True, "Local SD2.1 ready"

    def generate(self, image_bytes: bytes, prompt: str = "") -> tuple[bool, bytes | str]:
        if not self._pipe_loaded:
            pipe, err = _load_local_pipe()
            if pipe is None:
                return False, f"Local model not loaded: {err}"

        if not prompt:
            prompt = (
                "professional humanoid AI assistant avatar, futuristic virtual human portrait, "
                "clean symmetrical face, highly detailed digital illustration, 2D vector art style"
            )

        from PIL import Image as PILImage
        import torch

        try:
            input_image = PILImage.open(io.BytesIO(image_bytes)).convert("RGB")
            input_image = input_image.resize((768, 768))

            start = time.time()
            result = pipe(
                prompt=prompt,
                image=input_image,
                strength=0.65,
                guidance_scale=7.0,
                num_inference_steps=25,
                negative_prompt=(
                    "blurry, ugly, deformed, distorted face, extra limbs, "
                    "low quality, watermark, text, photograph, realistic photo, "
                    "worst quality, low resolution"
                ),
            ).images[0]
            elapsed = time.time() - start
            logger.info(f"Local SD inference: {elapsed:.1f}s")

            buf = io.BytesIO()
            result.save(buf, format="PNG")
            self.status.last_generation_time_ms = round(elapsed * 1000)
            return True, buf.getvalue()

        except Exception as e:
            return False, f"Local inference failed: {str(e)[:200]}"
