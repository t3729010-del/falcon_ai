# Technical Analysis of emotional.js

## 1. Overview

`emotional.js` (2005 lines) is the main emotion support chat system. It manages an AI-powered emotional support chat with an animated SVG/image avatar, Web Audio API-based visualizer, voice input (recording WebM/Opus -> transcribing via Vosk backend), text chat, session management (create/delete/archive/unarchive), emotion tracking, and conversation search. It coordinates avatar rendering states (idle, listening, thinking, preparing, loading, speaking, error), text-to-speech lip sync with backend-generated TTS audio chunks, and persists conversations and emotion statistics in LocalStorage.

## 2. Architecture & Setup

### Imports / Dependencies
- No external JS imports; relies on browser-native APIs: `fetch`, HTML5 `Audio`, Web Audio API (`AudioContext`, `AnalyserNode`, `MediaElementAudioSourceNode`), `MediaRecorder`, `requestAnimationFrame`, `CanvasRenderingContext2D`
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
Canvas-based animated bar visualizer (48 bars) utilizing the Web Audio API for real audio source analysis.

```javascript
const Visualizer = {
    canvas: null, ctx: null, animId: null, active: false, bars: 48,
    audioCtx: null, analyser: null, source: null, dataArray: null,
    init()               // Binds canvas, sets 2x resolution
    _resize()            // Adapts to parent width (max 560px), height 100px
    _ensureAudioCtx()    // Safely creates or resumes Web Audio AudioContext
    _disconnectSource()  // Disconnects existing audio node source
    start(audioEl)       // Connects Audio element to AnalyserNode, resumes context, starts loop
    startPreparing()     // Displays preparing/loading status UI
    stop()               // Disconnects source, cancels animation, hides visualizer
    _loop()              // requestAnimationFrame loop
    _drawFrame()         // Reads analyser frequency data (falls back to idle pulse if no data) and draws glowing cyan HSL bars
    _drawFlat()          // Draws flat baseline, hides visualizer section
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
- **Instant user bubble:** Appends `.user-message` to `#chat-history` immediately before any fetch
- **Streaming response:** Uses `/chat-stream` endpoint with `ReadableStream` + SSE parsing
- Each token appended to `.falcon-message` as it arrives (typewriter effect)
- Auto-scrolls on each token
- Sets avatar to listening → thinking → speaking states
- Stores in `conversations` object, persists to LocalStorage `falconConversations`
- If avatar enabled: `handleAIResponse(fullReply)`; otherwise plain TTS
- Error fallback: shows "Sorry, something went wrong" message

### Voice Chat (Vosk-powered)
```javascript
async function startVoiceFlow()
```
- Uses `MediaRecorder` API to record audio as WebM/Opus
- Click mic button → starts recording, adds `.recording` class (red pulse)
- Click again → stops recording, POSTs audio blob to `/transcribe`
- Backend converts WebM → WAV via ffmpeg, transcribes with Vosk
- Returns `{transcript}` → calls `sendTextMessage(transcript)`
- Visual feedback: mic button classes (recording), voice hint text
- Error handling: shows error in voice hint, auto-clears after 5s

### Voice Mode Toggle
```javascript
let voiceMode = JSON.parse(localStorage.getItem("voiceMode")) || false;
const voiceToggleBtn = document.getElementById("voice-toggle-btn");
```
- Toggles TTS on/off via `voiceMode` flag, persisted to localStorage
- UI: `.active` class on toggle button (cyan glow vs gray)
- When `voiceMode = true`: AI replies are processed and sent to the backend `/tts` endpoint to generate spoken audio chunks.
- When `voiceMode = false`: AI replies only displayed as text

### Avatar Speech & Lip Sync
```javascript
function speakResponse(text)          // Splits text into sentences, queues them, starts playback
function playNextTTSChunk()           // Handles fetching /tts WAV audio for the next chunk, starting/stopping visualizer, state transitions, playing HTML5 Audio, error recovery
function processTTSToken(token)       // Processes streaming tokens, buffering them into chunks for TTS
function handleAIResponse(text)       // Entry point for AI response: handles TTS, updates states
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
        sendTextMessage(text);
        // Hide: emotion-section, h1, subtitle, #static-humanoid, .platform
    });
});
```
- Increments emotion counter on click, persists to LocalStorage
- Sends button text to AI via `sendTextMessage()`
- Hides emotion section, hero header, humanoid image, and platform

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
| POST | `/chat` | Send message (non-streaming), returns `{reply, title}` |
| POST | `/chat-stream` | Send message (SSE streaming), returns `data: {token}\n\n` chunks |
| GET | `/messages/{id}` | Fetch messages for a session |
| POST | `/generate_avatar` | Generate avatar from uploaded image |
| POST | `/tts` | Convert text chunk to WAV audio |

## 5. Logic & Event Handlers

| Function | Trigger | Behavior |
|----------|---------|----------|
| `loadSessions()` | Page load, after create/delete/archive | Fetches and renders session sidebar |
| `sendTextMessage(msg)` | Send button click, Enter key | Sends chat message via streaming, renders bubbles, TTS if voiceMode |
| `startVoiceFlow()` | Mic button click | Records audio → POSTs to `/transcribe` → sends transcript via `sendTextMessage()` |
| `toggleVoiceMode()` | Voice toggle button click | Toggles `voiceMode` flag, persists to localStorage, updates UI |
| `speakResponse(text)` | Avatar speech | Splits response into sentences and queues them for playback |
| `playNextTTSChunk()` | Queue processor | Plays next TTS sentence from queue, fetching from backend `/tts` and connecting to Web Audio Visualizer |
| `handleAIResponse(text)` | Chat response with avatar | TTS entry point + state management |
| `startLipSync()` | Speech start | 100ms interval animating mouth SVG |
| `stopLipSync()` | Speech end/error | Clears interval |
| `showAvatar()` / `hideAvatar()` | Avatar toggle | Enables/disables avatar rendering |
| `setAvatarState(state)` | Various | Transitions avatar state (idle/listening/thinking/preparing/loading/speaking/error), resetting eyebrows for prep/load |
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
- **Preparing**: Container class `preparing`, eyebrows reset, outer ring animation active, visualizer pill shown
- **Loading**: Container class `loading`, eyebrows reset, outer and inner rings spinning
- **Speaking**: Brows lowered (y1=138, y2=140), lip sync active, canvas visualizer active
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
