import io
import json
import time
import base64
import logging
import requests
import uuid

from .base import AvatarProvider

logger = logging.getLogger(__name__)

COMFYUI_BASE = "http://127.0.0.1:8188"


class ComfyUIProvider(AvatarProvider):
    name = "comfyui"
    model_name = "comfyui_user_model"

    def __init__(self):
        super().__init__()
        self._client_id = str(uuid.uuid4())[:8]

    def check_available(self) -> tuple[bool, str]:
        try:
            resp = requests.get(f"{COMFYUI_BASE}/system_stats", timeout=3)
            if resp.status_code == 200:
                return True, "ComfyUI running on localhost:8188"
            return False, f"ComfyUI returned HTTP {resp.status_code}"
        except requests.ConnectionError:
            return False, "ComfyUI not found on localhost:8188"
        except Exception as e:
            return False, f"ComfyUI check failed: {str(e)[:100]}"

    def generate(self, image_bytes: bytes, prompt: str = "") -> tuple[bool, bytes | str]:
        if not prompt:
            prompt = (
                "professional humanoid AI assistant avatar, futuristic virtual human portrait, "
                "clean symmetrical face, highly detailed digital illustration, 2D vector art style"
            )

        try:
            import io as io_module
            from PIL import Image as PILImage

            input_image = PILImage.open(io_module.BytesIO(image_bytes)).convert("RGB")
            input_image = input_image.resize((768, 768))

            buf = io_module.BytesIO()
            input_image.save(buf, format="PNG")
            img_b64 = base64.b64encode(buf.getvalue()).decode()

            workflow = self._build_workflow(img_b64, prompt)
            start = time.time()

            resp = requests.post(
                f"{COMFYUI_BASE}/prompt",
                json={"prompt": workflow, "client_id": self._client_id},
                timeout=30,
            )
            if resp.status_code != 200:
                return False, f"ComfyUI prompt error: {resp.text[:200]}"

            result = resp.json()
            prompt_id = result.get("prompt_id")
            if not prompt_id:
                return False, "No prompt_id in ComfyUI response"

            output = self._wait_for_output(prompt_id)
            elapsed = time.time() - start

            if output:
                self.status.last_generation_time_ms = round(elapsed * 1000)
                return True, output
            return False, "ComfyUI generated no output"

        except Exception as e:
            return False, f"ComfyUI error: {str(e)[:200]}"

    def _build_workflow(self, img_b64: str, prompt: str) -> dict:
        return {
            "3": {
                "class_type": "KSampler",
                "inputs": {
                    "seed": int(time.time()),
                    "steps": 25,
                    "cfg": 7.0,
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "denoise": 0.65,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0],
                },
            },
            "4": {
                "class_type": "CheckpointLoaderSimple",
                "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"},
            },
            "5": {
                "class_type": "VAEEncode",
                "inputs": {"pixels": ["2", 0], "vae": ["4", 2]},
            },
            "6": {
                "class_type": "CLIPTextEncode",
                "inputs": {"text": prompt, "clip": ["4", 1]},
            },
            "7": {
                "class_type": "CLIPTextEncode",
                "inputs": {
                    "text": (
                        "blurry, distorted face, extra limbs, duplicate face, "
                        "low quality, watermark, text, photograph, realistic photo"
                    ),
                    "clip": ["4", 1],
                },
            },
            "2": {
                "class_type": "LoadImageBase64",
                "inputs": {"image": img_b64},
            },
            "8": {
                "class_type": "VAEDecode",
                "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
            },
            "9": {
                "class_type": "SaveImageWebsocket",
                "inputs": {"images": ["8", 0]},
            },
        }

    def _wait_for_output(self, prompt_id: str, timeout: int = 120) -> bytes | None:
        ws_url = f"ws://127.0.0.1:8188/ws?clientId={self._client_id}"
        try:
            import websocket
            ws = websocket.create_connection(ws_url, timeout=timeout)
            deadline = time.time() + timeout
            while time.time() < deadline:
                ws.settimeout(5)
                try:
                    msg = ws.recv()
                    if isinstance(msg, bytes):
                        ws.close()
                        return msg
                    if isinstance(msg, str):
                        data = json.loads(msg)
                        msg_type = data.get("type", "")
                        if msg_type == "execution_error":
                            logger.error(f"ComfyUI error: {data}")
                            ws.close()
                            return None
                except websocket.WebSocketTimeoutException:
                    continue
            ws.close()
        except ImportError:
            logger.warning("websocket-client not installed")
            return None
        except Exception as e:
            logger.warning(f"ComfyUI websocket error: {str(e)[:100]}")
        return None
