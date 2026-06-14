/**
 * BrowserFallbackProvider
 *
 * Pure Canvas-based avatar generation that runs entirely in the browser.
 * No server, no GPU, no API keys, no internet required.
 *
 * Pipeline:
 *   1. Load image onto canvas
 *   2. Center crop to square (avatar framing)
 *   3. Multi-pass cartoonization
 *   4. AI-assistant color grading (cyan/blue palette)
 *   5. Glow border + vignette
 *   6. Return stylized avatar data URL
 */

const BrowserAvatar = {

    async generate(imageFile) {
        const img = await this._loadImage(imageFile);
        const avatarDataUrl = this._processCanvas(img);
        return avatarDataUrl;
    },

    _loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    _processCanvas(img) {
        const SIZE = 512;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');

        // 1. Center-crop to square
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, SIZE, SIZE);

        // 2. Get pixel data
        const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
        let pixels = imageData.data;

        // 3. Multi-pass cartoonization
        pixels = this._bilateralFilter(pixels, SIZE, SIZE, 6);
        pixels = this._quantizeColors(pixels, 8);
        pixels = this._edgeOverlay(pixels, SIZE, SIZE);
        pixels = this._aiColorGrade(pixels);
        imageData.data = pixels;

        // 4. Put processed data back
        ctx.putImageData(imageData, 0, 0);

        // 5. Draw circular clip + glow border on top
        return this._applyAvatarFrame(canvas, ctx, SIZE);
    },

    _bilateralFilter(pixels, w, h, radius) {
        const output = new Uint8ClampedArray(pixels);
        const sigmaS = radius / 2;
        const sigmaR = 30;

        for (let y = radius; y < h - radius; y += 2) {
            for (let x = radius; x < w - radius; x += 2) {
                let i = (y * w + x) * 4;
                let r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
                let sumW = 0, sumR = 0, sumG = 0, sumB = 0;

                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        let ni = ((y + dy) * w + (x + dx)) * 4;
                        let pr = pixels[ni], pg = pixels[ni + 1], pb = pixels[ni + 2];
                        let dS = Math.sqrt(dx * dx + dy * dy);
                        let dR = Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb);
                        let wS = Math.exp(-(dS * dS) / (2 * sigmaS * sigmaS));
                        let wR = Math.exp(-(dR * dR) / (2 * sigmaR * sigmaR));
                        let wT = wS * wR;
                        sumW += wT;
                        sumR += pr * wT;
                        sumG += pg * wT;
                        sumB += pb * wT;
                    }
                }

                if (sumW > 0) {
                    output[i] = sumR / sumW;
                    output[i + 1] = sumG / sumW;
                    output[i + 2] = sumB / sumW;
                }
            }
        }

        // Fill gaps from stride-2 sampling
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let i = (y * w + x) * 4;
                if (y % 2 === 0 && x % 2 === 0) continue;
                let nearestY = Math.floor(y / 2) * 2;
                let nearestX = Math.floor(x / 2) * 2;
                let ni = (nearestY * w + nearestX) * 4;
                if (ni >= 0 && ni + 2 < output.length) {
                    output[i] = output[ni];
                    output[i + 1] = output[ni + 1];
                    output[i + 2] = output[ni + 2];
                }
            }
        }

        return output;
    },

    _quantizeColors(pixels, levels) {
        const step = 256 / levels;
        for (let i = 0; i < pixels.length; i += 4) {
            pixels[i] = Math.round(pixels[i] / step) * step;
            pixels[i + 1] = Math.round(pixels[i + 1] / step) * step;
            pixels[i + 2] = Math.round(pixels[i + 2] / step) * step;
        }
        return pixels;
    },

    _edgeOverlay(pixels, w, h) {
        const gray = new Float32Array(w * h);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let i = (y * w + x) * 4;
                gray[y * w + x] = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
            }
        }

        const edgePixels = new Uint8ClampedArray(pixels);
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                let gx = -gray[(y - 1) * w + (x - 1)] + gray[(y - 1) * w + (x + 1)]
                        - 2 * gray[y * w + (x - 1)] + 2 * gray[y * w + (x + 1)]
                        - gray[(y + 1) * w + (x - 1)] + gray[(y + 1) * w + (x + 1)];
                let gy = -gray[(y - 1) * w + (x - 1)] - 2 * gray[(y - 1) * w + x] - gray[(y - 1) * w + (x + 1)]
                        + gray[(y + 1) * w + (x - 1)] + 2 * gray[(y + 1) * w + x] + gray[(y + 1) * w + (x + 1)];
                let mag = Math.sqrt(gx * gx + gy * gy);
                let i = (y * w + x) * 4;
                if (mag > 40) {
                    edgePixels[i] = Math.max(0, edgePixels[i] - mag * 0.3);
                    edgePixels[i + 1] = Math.max(0, edgePixels[i + 1] - mag * 0.3);
                    edgePixels[i + 2] = Math.max(0, edgePixels[i + 2] - mag * 0.3);
                }
            }
        }
        return edgePixels;
    },

    _aiColorGrade(pixels) {
        for (let i = 0; i < pixels.length; i += 4) {
            let r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];

            // Boost cyan/blue channel
            let avg = (r + g + b) / 3;
            let boost = avg * 0.15;
            pixels[i] = r * 0.85 + boost;
            pixels[i + 1] = g * 0.92 + boost * 1.2;
            pixels[i + 2] = Math.min(255, b * 0.95 + boost * 1.8 + 10);

            // Increase contrast
            pixels[i] = this._contrast(pixels[i], 1.15);
            pixels[i + 1] = this._contrast(pixels[i + 1], 1.15);
            pixels[i + 2] = this._contrast(pixels[i + 2], 1.15);
        }
        return pixels;
    },

    _contrast(val, factor) {
        val = val / 255;
        val = (val - 0.5) * factor + 0.5;
        return Math.max(0, Math.min(255, Math.round(val * 255)));
    },

    _applyAvatarFrame(canvas, ctx, size) {
        const half = size / 2;

        // Apply circular clip
        ctx.save();
        ctx.beginPath();
        ctx.arc(half, half, half - 8, 0, Math.PI * 2);
        ctx.clip();

        // Inner glow shadow
        const gradient = ctx.createRadialGradient(half, half, half * 0.7, half, half, half);
        gradient.addColorStop(0, 'rgba(0, 217, 255, 0)');
        gradient.addColorStop(1, 'rgba(0, 217, 255, 0.15)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        ctx.restore();

        // Draw ring border
        ctx.beginPath();
        ctx.arc(half, half, half - 8, 0, Math.PI * 2);
        ctx.strokeStyle = '#00d9ff';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(0, 217, 255, 0.5)';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(half, half, half - 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 217, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Vignette
        const vigGradient = ctx.createRadialGradient(half, half, half * 0.4, half, half, half);
        vigGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vigGradient.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
        ctx.fillStyle = vigGradient;
        ctx.fillRect(0, 0, size, size);

        return canvas.toDataURL('image/png');
    },
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserAvatar;
}
