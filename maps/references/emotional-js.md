# Technical Analysis of emotional.js

## 1. Overview

`emotional.js` (1726 lines) is the main emotion support chat system. It manages an AI-powered emotional support chat with an animated SVG/image avatar, audio visualizer, voice input via Web Speech API, text chat, session management (create/delete/archive/unarchive), emotion tracking, and conversation search. It coordinates avatar rendering states (idle, listening, thinking, speaking, error), text-to-speech lip sync, and persists conversations and emotion statistics in LocalStorage.

## 2. Architecture & Setup

### Imports / Dependencies
- No external JS imports; relies on browser-native APIs: `fetch`, `SpeechSynthesisUtterance`, `webkitSpeechRecognition`, `requestAnimationFrame`, `CanvasRenderingContext2D`
- DOM elements referenced via `getElementById` / `querySelector` at load time

### Global State
```javascript
let emotionStats = JSON.parse(localStorage.getItem("emotionStats")) || {
    happy: 0, sad: 0, calm: 0, motivated: 0,
    thoughtful: 0, confused: 0, overwhelmed: 0, frustrated: 0
};
let conversations = {};
let currentSession = null;
let sessionCount = document.querySelectorAll(".session-item").length;
```

### Initialization (bottom of file)
```javascript
loadSessions();
Visualizer.init();
```
- `loadSessions()` fetches sessions from the backend and populates the sidebar
- `Visualizer.init()` binds the canvas element for the audio visualizer

## 3. Key Features / UI Panels

### Visualizer Object (Audio Visualizer)
Canvas-based animated bar visualizer (48 bars) for TTS playback visualization.

```javascript
const Visualizer = {
    canvas: null, ctx: null, animId: null, active: false, bars: 48,
    init()     // Binds canvas, sets 2x resolution
    _resize()  // Adapts to parent width (max 560px), height 100px
    start()    // Activates animation loop
    stop()     // Cancels RAF, draws flat baseline
    _loop()    // requestAnimationFrame loop
    _drawFrame() // Draws animated bars with cyan HSL colors + glow
    _drawFlat()  // Draws minimal flat bars, hides section
};
```

### AvatarProvider Object
Abstraction layer for switching between default SVG avatar and uploaded image avatar.

```javascript
const AvatarProvider = {
    type: 'default',        // 'default' | 'image'
    imageSrc: null,         // Data URL of uploaded avatar
    pendingFile: null,      // File awaiting confirmation

    isImage() / isDefault()
    switchToDefault()       // Shows SVG, hides image
    switchToImage(src)      // Hides SVG, shows image
    handleImageUpload()     // Triggers hidden file input
    previewUploadedImage(file) // Shows preview modal
    confirmImage()          // Sends to backend or BrowserAvatar
    generateAvatarFromPhoto(file) // Full upload+generate pipeline with loading overlay
    createImageAvatar(src)  // Applies generated avatar to DOM
    updateAvatarTexture(src) // Updates image src
    removeAvatar()          // Reverts to default
};
```

### AVATAR Object
Core avatar state machine and element references.

```javascript
const AVATAR = {
    enabled: false, initialized: false, state: 'idle',
    blinkTimer: null, idleRAF: null, lipSyncTimer: null,
    tts: window.speechSynthesis, utterance: null,
    els: {}  // DOM refs: container, body, face, mouth, eyes, brows, glow, rings, etc.
};
```

### Session Management
- **`loadSessions()`** — Fetches `/sessions`, populates `.session-list` and `.archive-list` with title, menu button, dropdown (share/archive/unarchive/delete)
- **New session** — Click handler on `#new-chat-btn` calls `/create_session`, stores in `conversations`, persists to LocalStorage
- **Delete** — Event delegation on `.delete-btn` calls `DELETE /delete_session/{id}`
- **Archive/Unarchive** — POST to `/archive_session/{id}` or `/unarchive_session/{id}`, toggles button text
- **Archive toggle** — Expands/collapses `.archive-list` section
- **Session click** — Fetches `/messages/{id}` and renders chat bubbles
- **Search** — Filters `.session-item` elements by text match

### Text Chat
```javascript
async function sendTextMessage(message)
```
- Auto-creates session if none exists
- Sets avatar to listening → thinking → speaking states
- POST to `/chat` with `{session_id, message, history: []}`
- Renders user/falcon message bubbles
- Stores in `conversations` object, persists to LocalStorage `falconConversations`
- If avatar enabled: `handleAIResponse(data.reply)`; otherwise plain TTS

### Voice Chat
```javascript
async function startVoiceFlow()
```
- Uses `webkitSpeechRecognition` (en-US, single result)
- On result: POST transcript to `/chat`, render bubbles, call `handleAIResponse()`
- Visual feedback: mic button classes (listening/processing/speaking), voice hint text
- Visualizer label shows "Falcon is responding..."

### Avatar Speech & Lip Sync
```javascript
function speakResponse(text)          // Basic TTS with lip sync
function handleAIResponse(text)       // TTS + Visualizer + state management
function startLipSync()               // 100ms interval randomizing mouth ry attribute
function stopLipSync()                // Clears interval, resets mouth
```
- Lip sync only active for default SVG avatar (`AvatarProvider.isDefault()`)
- Mouth `ry` values cycle through `[6,9,12,8,14,7,11,10]`

### Dropdown & Activation Handlers
- Toggle button opens/closes avatar dropdown menu
- Actions: `default` (switch to SVG), `upload` (file picker), `deactivate` (hide avatar)
- File input change → `previewUploadedImage()` → confirm → `generateAvatarFromPhoto()`
- Preview modal with confirm/cancel buttons
- Escape key closes dropdown and preview modal

### Emotion Buttons
```javascript
emotionButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        emotionStats[emotion]++;
        localStorage.setItem("emotionStats", JSON.stringify(emotionStats));
    });
});
```
- Increments emotion counter on click, persists to LocalStorage

### Sidebar Toggle
```javascript
menuBtn.addEventListener("click", () => sidebar.classList.toggle("hide-sidebar"));
```

## 4. Data Structure & Persistence

### LocalStorage Keys
| Key | Type | Description |
|-----|------|-------------|
| `emotionStats` | `{happy: number, sad: number, calm: number, motivated: number, thoughtful: number, confused: number, overwhelmed: number, frustrated: number}` | Emotion click counters |
| `falconConversations` | `{[sessionId]: [{user: string, falcon: string}]}` | Cached message history per session |

### SessionStorage Keys
None.

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/sessions` | List all sessions (active + archived) |
| GET | `/create_session` | Create new session, returns `{session_id}` |
| DELETE | `/delete_session/{id}` | Delete a session |
| POST | `/archive_session/{id}` | Archive a session |
| POST | `/unarchive_session/{id}` | Unarchive a session |
| POST | `/chat` | Send message, returns `{reply, title}` |
| GET | `/messages/{id}` | Fetch messages for a session |
| POST | `/generate_avatar` | Generate avatar from uploaded image |

## 5. Logic & Event Handlers

| Function | Trigger | Behavior |
|----------|---------|----------|
| `loadSessions()` | Page load, after create/delete/archive | Fetches and renders session sidebar |
| `sendTextMessage(msg)` | Send button click, Enter key | Sends chat message, renders bubbles, TTS |
| `startVoiceFlow()` | Mic button click | Starts speech recognition → chat → TTS |
| `speakResponse(text)` | Avatar speech | Basic TTS with lip sync |
| `handleAIResponse(text)` | Chat response with avatar | TTS + Visualizer + lip sync |
| `startLipSync()` | Speech start | 100ms interval animating mouth SVG |
| `stopLipSync()` | Speech end/error | Clears interval |
| `showAvatar()` / `hideAvatar()` | Avatar toggle | Enables/disables avatar rendering |
| `setAvatarState(state)` | Various | Transitions avatar state (idle/listening/thinking/speaking/error) |
| `startIdleAnimation()` | Avatar shown | RAF loop with random blinking (3-7s interval) |
| `stopIdleAnimation()` | State change to speaking/thinking | Cancels RAF |
| `generateAvatarFromPhoto(file)` | Upload confirm | Sends to backend, handles browser fallback |
| `toggleDropdown()` | Avatar toggle button | Shows/hides avatar action menu |
| Session click handler | Session sidebar click | Loads messages for selected session |
| Emotion button handler | Emotion grid click | Increments emotion counter |
| Search handler | Search input | Filters session items by text |

## 6. UX & Styling Details

### Visualizer Colors
- Bar fill: `hsla(185±5, 100%, 60%, 0.35-0.80)` — cyan tones
- Bar shadow: `rgba(0, 217, 255, 0.15-0.40)` — cyan glow
- Inactive bars: `rgba(0, 217, 255, 0.08)`

### Avatar States
- **Idle**: Blink animation every 3-7s, mouth ry=5
- **Listening**: Container class `listening`
- **Thinking**: Brows raised (y1=134, y2=136), no idle animation
- **Speaking**: Brows lowered (y1=138, y2=140), lip sync active
- **Error**: Stops all animation, resets after 2s

### Loading Overlay (Avatar Generation)
- 4-stage progress indicator with dots: Upload → Analyze → Generate → Enhance
- Spinner animation with stage text updates
- Error state with retry button

### Layout
- Canvas: 2x resolution (560x200 internal, displayed 560x100)
- Visualizer bars: 48 bars with 1.5px gap, 2px border radius
- Sidebar toggle via `hide-sidebar` class
- Session dropdown overlay with `show` class
