# Technical Analysis of browser_avatar.js

## 1. Overview

`browser_avatar.js` (235 lines) provides a pure Canvas-based avatar generation pipeline that runs entirely in the browser. No server, GPU, API keys, or internet required. It processes uploaded photos through center cropping, cartoonization (bilateral filter + color quantization + edge overlay), AI-assisted color grading (cyan/blue palette), and applies a circular avatar frame with glow effects. Returns a stylized avatar as a data URL.

## 2. Architecture & Setup

### Module Structure
```javascript
const BrowserAvatar = {
    // Pipeline methods
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrowserAvatar;
}
```
- Exported as CommonJS module for Node.js testing
- Available as global `BrowserAvatar` in browser

### Processing Pipeline
1. Load image onto canvas
2. Center crop to square (avatar framing)
3. Multi-pass cartoonization
4. AI-assistant color grading (cyan/blue palette)
5. Glow border + vignette
6. Return stylized avatar data URL

## 3. Key Features / UI Panels

### generate(imageFile)
```javascript
async generate(imageFile)
```
- Entry point; accepts a File object
- Calls `_loadImage()` then `_processCanvas()`
- Returns `string` (data URL of generated avatar)

### _loadImage(file)
```javascript
_loadImage(file)
```
- Returns `Promise<HTMLImageElement>`
- Uses `FileReader.readAsDataURL()` to convert file
- Creates `Image` element and resolves on load

### _processCanvas(img)
```javascript
_processCanvas(img)
```
- Creates 512×512 canvas
- Center-crops input image to square
- Applies processing pipeline:
  1. `_bilateralFilter(pixels, SIZE, SIZE, 6)`
  2. `_quantizeColors(pixels, 8)`
  3. `_edgeOverlay(pixels, SIZE, SIZE)`
  4. `_aiColorGrade(pixels)`
- Calls `_applyAvatarFrame()` for final output

### _bilateralFilter(pixels, w, h, radius)
```javascript
_bilateralFilter(pixels, w, h, radius)
```
- Edge-preserving smoothing filter
- Parameters: `sigmaS = radius/2`, `sigmaR = 30`
- Stride-2 sampling for performance
- Fills gaps from stride-2 sampling in second pass
- Returns filtered pixel data

### _quantizeColors(pixels, levels)
```javascript
_quantizeColors(pixels, levels)
```
- Reduces color palette to `levels` (8) steps per channel
- Formula: `Math.round(value / step) * step` where `step = 256 / levels`

### _edgeOverlay(pixels, w, h)
```javascript
_edgeOverlay(pixels, w, h)
```
- Sobel edge detection on grayscale conversion
- Grayscale formula: `0.299R + 0.587G + 0.114B`
- Edge threshold: magnitude > 40
- Darkens edges by `magnitude * 0.3`

### _aiColorGrade(pixels)
```javascript
_aiColorGrade(pixels)
```
- Boosts cyan/blue channel:
  - R: `R * 0.85 + boost`
  - G: `G * 0.92 + boost * 1.2`
  - B: `min(255, B * 0.95 + boost * 1.8 + 10)`
- Applies contrast enhancement (factor 1.15) to all channels

### _contrast(val, factor)
```javascript
_contrast(val, factor)
```
- Formula: `(val/255 - 0.5) * factor + 0.5`
- Clamps to [0, 255]

### _applyAvatarFrame(canvas, ctx, size)
```javascript
_applyAvatarFrame(canvas, ctx, size)
```
- Circular clip path (radius: `size/2 - 8`)
- Inner glow: radial gradient from transparent to `rgba(0, 217, 255, 0.15)`
- Ring border: `#00d9ff`, 3px, shadow blur 20px
- Outer glow ring: `rgba(0, 217, 255, 0.15)`, 1px
- Vignette: radial gradient from transparent to `rgba(0, 0, 0, 0.35)`
- Returns `canvas.toDataURL('image/png')`

## 4. Data Structure & Persistence

### LocalStorage Keys
None.

### SessionStorage Keys
None.

### API Endpoints
None (purely client-side).

## 5. Logic & Event Handlers

| Function | Trigger | Behavior |
|----------|---------|----------|
| `generate(file)` | Called from AvatarProvider | Full pipeline: load → process → return data URL |
| `_loadImage(file)` | Called by generate | Reads file, creates Image element |
| `_processCanvas(img)` | Called by generate | Applies all processing steps |
| `_bilateralFilter()` | Called by processCanvas | Edge-preserving smoothing |
| `_quantizeColors()` | Called by processCanvas | Reduces color palette |
| `_edgeOverlay()` | Called by processCanvas | Adds edge darkening |
| `_aiColorGrade()` | Called by processCanvas | Cyan/blue color grading |
| `_contrast()` | Called by colorGrade | Per-channel contrast |
| `_applyAvatarFrame()` | Called by processCanvas | Circular frame + glow + vignette |

## 6. UX & Styling Details

### Output
- Format: PNG data URL
- Size: 512×512 pixels
- Circular avatar with cyan glow border

### Color Palette
- Primary: `#00d9ff` (cyan) for borders and glow
- Color grading: Blue/cyan boost for AI-assistant aesthetic
- Vignette: `rgba(0, 0, 0, 0.35)` for depth

### Frame Effects
- Inner glow: `rgba(0, 217, 255, 0.15)` radial gradient
- Border: 3px solid `#00d9ff` with 20px shadow blur
- Outer ring: 1px `rgba(0, 217, 255, 0.15)`
- Vignette: 35% opacity darkening at edges
