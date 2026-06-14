import io
import time
import logging
import numpy as np

from .base import AvatarProvider

logger = logging.getLogger(__name__)

IDENTITY_AVAILABLE = False
IDENTITY_REASON = ""

try:
    from insightface.app import FaceAnalysis
    import torch
    import diffusers
    import transformers
    import accelerate

    IDENTITY_AVAILABLE = True
    IDENTITY_REASON = "All dependencies available"
except ImportError as e:
    IDENTITY_AVAILABLE = False
    IDENTITY_REASON = f"Missing: {e.name}"

if IDENTITY_AVAILABLE:
    try:
        import psutil
        mem = psutil.virtual_memory()
        if mem.available < 4 * 1024 ** 3:
            IDENTITY_AVAILABLE = False
            IDENTITY_REASON = (
                f"Insufficient RAM ({mem.available / 1024**3:.1f}GB available, "
                f"need ~4GB for SD1.5 + IP-Adapter-FaceID + InsightFace)"
            )
    except ImportError:
        pass

FACE_APP = None
PIPE = None
PIPE_LOADED = False


def _load_face_app():
    global FACE_APP
    if FACE_APP is not None:
        return FACE_APP
    from insightface.app import FaceAnalysis
    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    app.prepare(ctx_id=0, det_size=(320, 320))
    FACE_APP = app
    return app


def _load_pipeline():
    global PIPE, PIPE_LOADED
    if PIPE_LOADED:
        return PIPE, None
    try:
        from diffusers import StableDiffusionPipeline, DDIMScheduler
        pipe = StableDiffusionPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            torch_dtype=torch.float32,
            safety_checker=None,
        )
        pipe.scheduler = DDIMScheduler.from_config(pipe.scheduler.config)
        pipe.enable_attention_slicing()
        pipe.load_ip_adapter(
            "h94/IP-Adapter-FaceID",
            subfolder="",
            weight_name="ip-adapter-faceid_sd15.bin",
        )
        PIPE = pipe
        PIPE_LOADED = True
        return pipe, None
    except Exception as e:
        return None, str(e)


class IdentityProvider(AvatarProvider):
    name = "identity"
    model_name = "IP-Adapter-FaceID + SD1.5"

    def __init__(self):
        super().__init__()
        self._face_loaded = False
        self._pipe_loaded = False

    def check_available(self) -> tuple[bool, str]:
        if not IDENTITY_AVAILABLE:
            return False, IDENTITY_REASON
        try:
            _load_face_app()
            self._face_loaded = True
            return True, "IP-Adapter-FaceID + SD1.5 ready (identity-preserving)"
        except Exception as e:
            return False, f"Face model load failed: {str(e)[:200]}"

    def generate(self, image_bytes: bytes, prompt: str = "") -> tuple[bool, bytes | str]:
        nparr = np.frombuffer(image_bytes, np.uint8)
        import cv2
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return False, "Failed to decode image"

        app = _load_face_app()
        faces = app.get(img)
        if len(faces) == 0:
            return False, "No face detected in the uploaded image"
        face = faces[0]
        face_emb = face.normed_embedding
        logger.info(f"[FACE_DETECTED] confidence={face.det_score:.3f}")
        logger.info(f"[EMBEDDING_CREATED] shape={face_emb.shape} norm={np.linalg.norm(face_emb):.3f}")

        import torch
        face_emb_t = torch.from_numpy(face_emb).unsqueeze(0).to(torch.float32)

        pipe, err = _load_pipeline()
        if pipe is None:
            return False, f"Pipeline unavailable: {err}"
        logger.info("[IDENTITY_MODEL_LOADED]")

        if not prompt:
            prompt = (
                "professional AI assistant avatar, futuristic humanoid robot portrait, "
                "front facing, symmetrical face, clean studio lighting, high quality, "
                "4k detailed, cyberpunk aesthetic, cinematic portrait, sharp focus"
            )

        start = time.time()
        try:
            result_image = pipe(
                prompt=prompt,
                ip_adapter_image=face_emb_t,
                num_inference_steps=25,
                guidance_scale=7.0,
                negative_prompt=(
                    "blurry, low quality, distorted face, deformed, ugly, bad anatomy, "
                    "disfigured, extra limbs, cartoon, 2d, 3d render, anime, illustration, "
                    "low resolution, watermark, text, signature, photograph"
                ),
                generator=torch.manual_seed(42),
            ).images[0]
        except Exception as e:
            return False, f"Inference error: {str(e)[:300]}"

        elapsed = time.time() - start
        logger.info(f"[AVATAR_GENERATED] inference={elapsed:.1f}s")

        buf = io.BytesIO()
        result_image.save(buf, format="PNG")
        result_bytes = buf.getvalue()
        logger.info(f"[AVATAR_RENDERED] {len(result_bytes) / 1024:.0f}KB")

        self.status.last_generation_time_ms = round(elapsed * 1000)
        return True, result_bytes
