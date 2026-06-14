import io
import os
import time
import base64
import hashlib
import logging
import requests

from .base import AvatarProvider

logger = logging.getLogger(__name__)

# Use the OLD HuggingFace Inference API endpoint (free, rate-limited)
# NOT the new Inference Providers (which cost credits)
HF_INFERENCE_API = "https://api-inference.huggingface.co/models"

FREE_MODELS = [
    {
        "id": "stabilityai/stable-diffusion-2-1",
        "note": "SD2.1 — available on free Inference API with rate limits",
    },
    {
        "id": "runwayml/stable-diffusion-v1-5",
        "note": "SD1.5 — lightweight fallback on free tier",
    },
]


class HuggingFaceProvider(AvatarProvider):
    name = "huggingface_free"
    model_name = "stabilityai/stable-diffusion-2-1"

    def __init__(self):
        super().__init__()
        self._api_key = os.getenv("HF_API_KEY", "")
        self._last_model_used = ""

    def check_available(self) -> tuple[bool, str]:
        if not self._api_key:
            return False, "No HF_API_KEY set"
        try:
            resp = requests.get(
                f"{HF_INFERENCE_API}/{FREE_MODELS[0]['id']}",
                headers={"Authorization": f"Bearer {self._api_key}"},
                timeout=5,
            )
            if resp.status_code == 200 or resp.status_code == 503:
                return True, "Free Inference API accessible"
            elif resp.status_code == 401:
                return False, "HF_API_KEY is invalid"
            else:
                return True, "API reachable (may have rate limits)"
        except requests.ConnectionError:
            return False, "Cannot reach api-inference.huggingface.co"
        except Exception as e:
            return False, f"API check failed: {str(e)[:100]}"

    def generate(self, image_bytes: bytes, prompt: str = "") -> tuple[bool, bytes | str]:
        if not self._api_key:
            return False, "No HF_API_KEY set"

        if not prompt:
            prompt = (
                "professional humanoid AI assistant avatar, futuristic virtual human portrait, "
                "clean symmetrical face with glowing blue neon accents, "
                "highly detailed digital illustration, 2D vector art style, "
                "suitable for lip sync animation, centered face composition"
            )

        input_b64 = base64.b64encode(image_bytes).decode()
        input_hash = hashlib.md5(image_bytes).hexdigest()

        for model_info in FREE_MODELS:
            model_id = model_info["id"]
            try:
                logger.info(f"HF free API — trying model: {model_id}")
                start = time.time()

                payload = {
                    "inputs": input_b64,
                    "parameters": {
                        "prompt": prompt,
                        "negative_prompt": (
                            "blurry, distorted face, extra limbs, duplicate face, "
                            "low quality, watermark, text, photograph, realistic photo, "
                            "worst quality, low resolution, grainy"
                        ),
                        "guidance_scale": 7.5,
                        "num_inference_steps": 25,
                        "strength": 0.75,
                    },
                }

                resp = requests.post(
                    f"{HF_INFERENCE_API}/{model_id}",
                    json=payload,
                    headers={"Authorization": f"Bearer {self._api_key}"},
                    timeout=120,
                )

                elapsed = time.time() - start
                logger.info(f"HF {model_id}: HTTP {resp.status_code} ({elapsed:.1f}s)")

                if resp.status_code == 503:
                    wait_header = resp.headers.get("x-wait-time", "20")
                    try:
                        wait = int(wait_header) + 2
                    except ValueError:
                        wait = 20
                    logger.info(f"Model loading — waiting ~{wait}s")
                    time.sleep(min(wait, 60))
                    continue

                if resp.status_code != 200:
                    err_detail = resp.text[:200] if resp.text else f"HTTP {resp.status_code}"
                    if "rate limit" in err_detail.lower() or "429" in str(resp.status_code):
                        continue
                    if "payment" in err_detail.lower() or "402" in str(resp.status_code):
                        continue
                    continue

                content_type = resp.headers.get("Content-Type", "")
                if "image" not in content_type:
                    continue

                generated_bytes = resp.content
                output_hash = hashlib.md5(generated_bytes).hexdigest()

                if output_hash == input_hash:
                    logger.warning(f"HF {model_id}: output identical to input — skipping")
                    continue

                self._last_model_used = model_id
                self.status.last_generation_time_ms = round(elapsed * 1000)
                logger.info(f"HF free API success: {model_id} ({elapsed:.1f}s)")
                return True, generated_bytes

            except requests.Timeout:
                logger.warning(f"HF {model_id} timed out")
                continue
            except Exception as e:
                logger.warning(f"HF {model_id} error: {str(e)[:100]}")
                continue

        return False, "All free HuggingFace models failed (rate limited or unavailable)"
