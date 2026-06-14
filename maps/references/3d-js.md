# Technical Analysis of 3d.js

## 1. Overview

`3d.js` (398 lines) implements a 3D holographic teaching interface. It provides session management (create/delete/switch), text and voice chat with TTS response, an audio visualizer, and a sidebar with lesson navigation. It shares API patterns with the text chat system but operates in a visually distinct 3D-themed UI.

## 2. Architecture & Setup

### DOM References
```javascript
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatHistory = document.getElementById('chat-history');
const micBtn = document.getElementById('mic-btn');
const voiceHint = document.getElementById('voice-hint');
const VisualizerLabel = document.getElementById('visualizer-label');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');
```

### Global State
```javascript
let currentSession = null;
let conversations = {};
```

### Initialization
```javascript
Visualizer.init();
loadSessions();
```

### Visualizer Object
Same structure as `emotional.js` but with 80px height instead of 100px:
```javascript
const Visualizer = {
    canvas: null, ctx: null, animId: null, active: false, bars: 48,
    init()    // Binds canvas, 2x resolution
    _resize() // Width max 560px, height 80px (vs 100px in emotional.js)
    start()   // Activates animation loop
    stop()    // Cancels RAF, draws flat
    _loop()   // requestAnimationFrame loop
    _drawFrame() // 48 animated bars with cyan HSL colors
    _drawFlat()  // Flat baseline bars
};
```

## 3. Key Features / UI Panels

### Session Sidebar
```javascript
async function loadSessions()
```
- Fetches `GET /teaching_sessions`
- Creates "+ New Lesson" button at top
- Each session item: title span + delete button (SVG trash icon)
- Active session highlighted via `.active` class
- Click loads messages; delete button calls `deleteSession()`

### createNewSession()
```javascript
async function createNewSession()
```
- `GET /create_teaching_session`
- Sets `currentSession` to new ID
- Clears `chatHistory`, reloads sidebar

### loadSessionMessages(sessionId)
```javascript
async function loadSessionMessages(sessionId)
```
- Fetches `GET /teaching_messages/{sessionId}`
- Renders user/falcon message bubbles
- Auto-scrolls to bottom

### deleteSession(sessionId)
```javascript
async function deleteSession(sessionId)
```
- `DELETE /delete_teaching_session/{sessionId}`
- Clears chat if deleted session was active

### sendTextMessage(message)
```javascript
async function sendTextMessage(message)
```
- Auto-creates session if none exists
- POST to `/text-chat` with `{session_id, message, history: []}`
- Renders user/falcon bubbles
- Stores in `conversations` object
- Speaks response via `SpeechSynthesisUtterance` (en-US, rate 1, pitch 1)
- Reloads sessions after response

### startVoiceFlow()
```javascript
async function startVoiceFlow()
```
- Uses `webkitSpeechRecognition` (en-US, single result)
- Visual states: mic button classes (listening/processing/speaking), voice hint text
- On result: POST transcript to `/text-chat`, render bubbles, start Visualizer
- TTS response with Visualizer stop on end/error

### Menu Toggle
```javascript
menuToggle.addEventListener('click', () => sidebar.classList.toggle('hide-sidebar'));
```

## 4. Data Structure & Persistence

### LocalStorage Keys
None.

### SessionStorage Keys
None.

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/teaching_sessions` | List all teaching sessions |
| GET | `/create_teaching_session` | Create new session |
| GET | `/teaching_messages/{id}` | Fetch messages for a session |
| DELETE | `/delete_teaching_session/{id}` | Delete a session |
| POST | `/text-chat` | Send message, get AI reply |

## 5. Logic & Event Handlers

| Function | Trigger | Behavior |
|----------|---------|----------|
| `loadSessions()` | Page load, after create/delete | Fetches and renders session sidebar |
| `createNewSession()` | "+ New Lesson" button | Creates session, clears chat |
| `loadSessionMessages(id)` | Session click | Loads and renders session messages |
| `deleteSession(id)` | Delete button click | Deletes session, updates UI |
| `sendTextMessage(msg)` | Send button / Enter key | Sends message, renders response, TTS |
| `startVoiceFlow()` | Mic button click | Speech recognition → chat → TTS |
| `Visualizer.init()` | Page load | Initializes canvas |
| Menu toggle handler | Menu button click | Toggles sidebar visibility |

## 6. UX & Styling Details

### Visualizer
- 48 bars, 2px border radius
- Colors: `hsla(185±5, 100%, 60%, 0.35-0.80)` — cyan
- Glow: `rgba(0, 217, 255, 0.15-0.40)`
- Height: 80px (vs 100px in emotional.js)
- Canvas: 2x resolution for retina

### Layout
- Sidebar with `hide-sidebar` class toggle
- Chat history with `.user-message` / `.falcon-message` bubbles
- Voice hint with `.voice-hint` class and states: `.listening`, `.processing`, `.speaking`

### Session Items
- `.lesson-item` class with `.active` for current session
- Delete button: inline SVG trash icon (14×14)
- New lesson button: `.new-lesson-btn` class
