# Kokoro TTS — Flask Server Integration Guide
> Arch Linux · CPU-only · LLM response → speech pipeline

---

## Overview

Kokoro-82M is an Apache-licensed open-weight TTS model with 82M parameters. It runs fully on
CPU, needs no GPU, and produces 24kHz mono WAV audio. You pipe your LLM's text output into
`KPipeline`, collect audio chunks, and stream or return them over HTTP from Flask.

**Stack used in this guide:**
- `kokoro>=0.9.4` — inference library
- `soundfile` — WAV encoding
- `numpy` — audio array handling
- `torch` (CPU) — model backend
- `flask` + `flask-cors` — HTTP server

---

## 1. System dependencies (Arch Linux)

```bash
# espeak-ng is required for English phonemization — without it, KPipeline will crash
sudo pacman -S espeak-ng python python-pip

# Optional but recommended: CPU torch without CUDA bloat
# (saves ~2GB of download vs the default CUDA wheel)
pip install torch --index-url https://download.pytorch.org/whl/cpu
```

> If you already have `torch` installed (CUDA version), it still works on CPU — just slower
> to load. Using the CPU-only wheel is leaner for a server that will never touch a GPU.

---

## 2. Python dependencies

```bash
pip install "kokoro>=0.9.4" soundfile numpy flask flask-cors
```

Verify the install:

```bash
python -c "from kokoro import KPipeline; p = KPipeline(lang_code='a'); print('OK')"
```

On first run, Kokoro downloads model weights (~330MB) and voice files from Hugging Face into
`~/.cache/huggingface/`. Subsequent runs load from cache — no internet needed.

---

## 3. Project structure

```
tts_server/
├── app.py          ← Flask server
├── tts.py          ← Kokoro pipeline wrapper
└── requirements.txt
```

---

## 4. `tts.py` — Kokoro pipeline wrapper

This module initialises the pipeline once at import time (model stays in memory between
requests) and exposes a single `synthesize()` function.

```python
# tts.py
import io
import numpy as np
import soundfile as sf
import torch
from kokoro import KPipeline

# --------------------------------------------------------------------------
# Pipeline init — runs once when the module is first imported.
# KPipeline auto-detects CPU when no CUDA is available.
# lang_code='a' → American English  (change to 'b' for British English)
# --------------------------------------------------------------------------
print("[kokoro] Loading pipeline on CPU...")
pipeline = KPipeline(lang_code='a')
print("[kokoro] Pipeline ready.")


def synthesize(text: str, voice: str = "af_heart", speed: float = 1.0) -> bytes:
    """
    Convert text to speech and return raw WAV bytes.

    Args:
        text:  The text to synthesise (your LLM's output).
        voice: Kokoro voice ID. See VOICES section below.
        speed: Speech speed multiplier. 1.0 = normal, 0.8 = slower, 1.2 = faster.

    Returns:
        WAV audio as bytes (24000 Hz, mono, float32).
    """
    chunks = []

    with torch.no_grad():
        generator = pipeline(text, voice=voice, speed=speed)
        for _, _, audio in generator:
            chunks.append(audio)

    if not chunks:
        raise ValueError("Kokoro returned no audio — check your text input.")

    # Concatenate all chunks into a single numpy array
    audio_np = np.concatenate(chunks, axis=0)

    # Encode to WAV in memory
    buf = io.BytesIO()
    sf.write(buf, audio_np, samplerate=24000, format="WAV", subtype="PCM_16")
    buf.seek(0)
    return buf.read()


def synthesize_streaming(text: str, voice: str = "af_heart", speed: float = 1.0):
    """
    Generator that yields WAV-encoded audio chunks one at a time.
    Use this for streaming responses — first chunk arrives faster than synthesize().

    Yields:
        bytes — raw PCM int16 samples per chunk (not wrapped in WAV header).
                Suitable for chunked HTTP transfer or WebSocket streaming.
    """
    with torch.no_grad():
        generator = pipeline(text, voice=voice, speed=speed)
        for _, _, audio in generator:
            pcm = (audio * 32767).astype(np.int16)
            yield pcm.tobytes()
```

---

## 5. `app.py` — Flask server

```python
# app.py
import io
import wave
import struct
from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS

from tts import synthesize, synthesize_streaming

app = Flask(__name__)
CORS(app)  # allow cross-origin requests (useful when your LLM frontend is on another port)


# ---------------------------------------------------------------------------
# POST /tts
# Body: { "text": "...", "voice": "af_heart", "speed": 1.0 }
# Returns: audio/wav binary
# ---------------------------------------------------------------------------
@app.route("/tts", methods=["POST"])
def tts():
    data = request.get_json(force=True)

    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "text field is required"}), 400

    voice = data.get("voice", "af_heart")
    speed = float(data.get("speed", 1.0))

    try:
        wav_bytes = synthesize(text, voice=voice, speed=speed)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return Response(
        wav_bytes,
        mimetype="audio/wav",
        headers={
            "Content-Disposition": "inline; filename=speech.wav",
            "Cache-Control": "no-cache",
        },
    )


# ---------------------------------------------------------------------------
# POST /tts/stream
# Body: { "text": "...", "voice": "af_heart", "speed": 1.0 }
# Returns: chunked audio/pcm stream
# Client reconstructs or plays raw PCM (24000 Hz, mono, int16)
# ---------------------------------------------------------------------------
@app.route("/tts/stream", methods=["POST"])
def tts_stream():
    data = request.get_json(force=True)

    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "text field is required"}), 400

    voice = data.get("voice", "af_heart")
    speed = float(data.get("speed", 1.0))

    def generate():
        for pcm_chunk in synthesize_streaming(text, voice=voice, speed=speed):
            yield pcm_chunk

    return Response(
        generate(),
        mimetype="audio/pcm",
        headers={
            "X-Sample-Rate": "24000",
            "X-Channels": "1",
            "X-Bit-Depth": "16",
            "Cache-Control": "no-cache",
            "Transfer-Encoding": "chunked",
        },
    )


# ---------------------------------------------------------------------------
# GET /voices
# Returns the list of recommended voices grouped by type
# ---------------------------------------------------------------------------
VOICES = {
    "american_female": ["af_heart", "af_bella", "af_sarah", "af_nicole", "af_sky"],
    "american_male":   ["am_adam", "am_echo", "am_eric", "am_fenrir", "am_liam"],
    "british_female":  ["bf_emma", "bf_isabella", "bf_alice", "bf_lily"],
    "british_male":    ["bm_george", "bm_daniel", "bm_fable", "bm_lewis"],
}

@app.route("/voices", methods=["GET"])
def list_voices():
    return jsonify(VOICES)


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "kokoro-82M", "device": "cpu"})


if __name__ == "__main__":
    # threaded=False is important — KPipeline is NOT thread-safe.
    # For concurrent requests use a process-based server (gunicorn) instead.
    app.run(host="0.0.0.0", port=5050, debug=False, threaded=False)
```

---

## 6. `requirements.txt`

```
kokoro>=0.9.4
soundfile
numpy
flask
flask-cors
torch
```

---

## 7. Running the server

```bash
cd tts_server
python app.py
```

On first run you'll see Hugging Face downloading weights (~330MB). After that, startup is
instant. The pipeline loads into RAM (~500MB–700MB on CPU).

---

## 8. Testing with curl

**Full WAV response:**
```bash
curl -X POST http://localhost:5050/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is Kokoro speaking.", "voice": "af_heart", "speed": 1.0}' \
  --output speech.wav

# Play it
aplay speech.wav
# or
mpv speech.wav
```

**Streaming (raw PCM):**
```bash
curl -X POST http://localhost:5050/tts/stream \
  -H "Content-Type: application/json" \
  -d '{"text": "Streaming audio from Kokoro.", "voice": "af_bella"}' \
  | aplay -r 24000 -f S16_LE -c 1
```

**List voices:**
```bash
curl http://localhost:5050/voices
```

---

## 9. Wiring your LLM into the pipeline

The typical flow: your LLM generates text → you POST it to `/tts` → return audio to the
client. Here's how to call your own Flask TTS server from within another Python service or
your LLM handler:

```python
# llm_to_speech.py
import requests

TTS_URL = "http://localhost:5050/tts"

def speak(llm_response: str, voice: str = "af_heart", speed: float = 1.0) -> bytes:
    """Call the TTS server and get WAV bytes back."""
    resp = requests.post(TTS_URL, json={
        "text": llm_response,
        "voice": voice,
        "speed": speed,
    }, timeout=60)
    resp.raise_for_status()
    return resp.content  # raw WAV bytes


# Example: save to file
wav = speak("The capital of France is Paris.")
with open("output.wav", "wb") as f:
    f.write(wav)

# Example: stream directly to aplay via subprocess
import subprocess

def speak_and_play(text: str):
    resp = requests.post(TTS_URL, json={"text": text}, timeout=60, stream=True)
    proc = subprocess.Popen(["aplay", "-"], stdin=subprocess.PIPE)
    for chunk in resp.iter_content(chunk_size=4096):
        proc.stdin.write(chunk)
    proc.stdin.close()
    proc.wait()
```

---

## 10. Voices reference

| Voice ID      | Gender | Accent    | Quality |
|---------------|--------|-----------|---------|
| `af_heart`    | F      | American  | A       |
| `af_bella`    | F      | American  | A       |
| `af_sarah`    | F      | American  | B       |
| `af_nicole`   | F      | American  | B       |
| `af_sky`      | F      | American  | B       |
| `am_adam`     | M      | American  | B       |
| `am_echo`     | M      | American  | B       |
| `am_eric`     | M      | American  | B       |
| `am_fenrir`   | M      | American  | A       |
| `am_liam`     | M      | American  | B       |
| `bf_emma`     | F      | British   | A       |
| `bf_isabella` | F      | British   | A       |
| `bm_george`   | M      | British   | A       |
| `bm_daniel`   | M      | British   | B       |

Full list: https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md

**Grade A = highest quality.** `af_heart` and `af_bella` are the best starting points for
English.

---

## 11. CPU performance expectations

On CPU, generation is slower than real-time for long texts. Rough numbers:

| Text length   | Approx. generation time (CPU) |
|---------------|-------------------------------|
| 1 sentence    | ~1–3 seconds                  |
| 1 paragraph   | ~5–15 seconds                 |
| 500 words     | ~30–60 seconds                |

Kokoro chunks long text automatically — so with `/tts/stream` the first chunk arrives in
~1–3 seconds regardless of total text length, and audio keeps coming while the rest generates.

**To speed up CPU inference**, set PyTorch thread counts before importing kokoro:

```python
import torch
torch.set_num_threads(8)           # match your physical core count
torch.set_num_interop_threads(4)
```

Put this at the top of `tts.py`, before the `KPipeline` init.

---

## 12. Production: gunicorn (multi-process)

`threaded=False` in Flask dev server means only one request at a time. For a real deployment
use gunicorn with multiple workers (each gets its own pipeline copy in RAM):

```bash
pip install gunicorn

# 2 workers = 2 concurrent TTS requests, each using ~600MB RAM
gunicorn app:app \
  --workers 2 \
  --bind 0.0.0.0:5050 \
  --timeout 120 \
  --worker-class sync
```

> Do NOT use `--worker-class gevent` or `--worker-class eventlet` — async workers break
> torch CPU inference.

---

## 13. Systemd service (optional, for always-on)

```ini
# /etc/systemd/system/kokoro-tts.service
[Unit]
Description=Kokoro TTS Flask Server
After=network.target

[Service]
Type=simple
User=hello
WorkingDirectory=/home/hello/tts_server
ExecStart=/usr/bin/python /home/hello/tts_server/app.py
Restart=on-failure
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now kokoro-tts
sudo systemctl status kokoro-tts
```

---

## 14. Common errors and fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ModuleNotFoundError: espeak` | espeak-ng not installed | `sudo pacman -S espeak-ng` |
| `RuntimeError: No audio generated` | Empty or whitespace-only text | Validate input before calling pipeline |
| `OSError: [Errno 98] Address already in use` | Port 5050 taken | Change port or `fuser -k 5050/tcp` |
| First request takes 30+ seconds | Model downloading from HF | Wait once; cached after that |
| `kokoro` hangs on import | Bad Python version | Requires Python >=3.10, <3.13 |
| Audio sounds robotic/clipped | Speed too high | Keep speed between 0.7–1.3 |
| `torch` CUDA errors on CPU box | Wrong torch wheel | Reinstall: `pip install torch --index-url https://download.pytorch.org/whl/cpu` |

---

## 15. Full lang_code reference

| Code | Language            |
|------|---------------------|
| `a`  | American English    |
| `b`  | British English     |
| `j`  | Japanese            |
| `z`  | Mandarin Chinese    |
| `f`  | French              |
| `e`  | Spanish             |
| `h`  | Hindi               |
| `p`  | Brazilian Portuguese|
| `i`  | Italian             |
| `k`  | Korean              |

For Japanese: `pip install misaki[ja]`  
For Chinese: `pip install misaki[zh]`

---

## Quick start checklist

```
[ ] sudo pacman -S espeak-ng
[ ] pip install "kokoro>=0.9.4" soundfile numpy flask flask-cors torch
[ ] Create tts.py and app.py as above
[ ] python app.py   (first run downloads ~330MB)
[ ] curl -X POST http://localhost:5050/tts -d '{"text":"hello"}' -H 'Content-Type: application/json' --output out.wav
[ ] aplay out.wav
```
