# Technical Analysis of text.js

## 1. Overview

`text.js` (861 lines) implements a text-based teaching chat system. It provides a sidebar with session history, a chat interface with markdown-rendered AI responses, voice input via Web Speech API, and per-message action buttons (copy, examples, quiz, regenerate). Sessions can be created, switched, deleted, archived/unarchived, and exported as PDF.

## 2. Architecture & Setup

### Imports / Dependencies
- **marked.js** — External library for markdown rendering (`marked.parse()`)
- Browser-native: `fetch`, `SpeechRecognition` / `webkitSpeechRecognition`

### DOM References
```javascript
const menuToggle = document.querySelector(".menu-toggle");
const sidebar = document.querySelector(".sidebar");
const chatArea = document.querySelector(".chat-area");
const newChatBtn = document.querySelector(".new-chat");
const chatHistory = document.querySelector(".chat-history");
const chatBox = document.querySelector(".chat-box");
const userInput = document.querySelector(".input-area input");
const sendBtn = document.querySelector(".send-btn");
const voiceBtn = document.querySelector(".voice-btn");
const archivedHistory = document.querySelector(".archived-history");
const sessionSearch = document.querySelector("#sessionSearch");
```

### Initialization
```javascript
sidebar.classList.add("hidden");
chatArea.classList.add("full");
let currentSession = null;
let sessionPromise = null;
ensureSession();  // Pre-creates a session on load
loadTeachingSessions();  // Populates sidebar
```

### Session Guarantee
```javascript
async function ensureSession() {
    if (currentSession) return currentSession;
    if (sessionPromise) return sessionPromise;
    sessionPromise = fetch("http://127.0.0.1:5000/create_teaching_session")
        .then(r => r.json()).then(d => {
            currentSession = d.session_id;
            sessionPromise = null;
            return currentSession;
        });
    return sessionPromise;
}
```
- Deduplicates concurrent session creation requests via `sessionPromise`

## 3. Key Features / UI Panels

### Menu Toggle
```javascript
menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("hidden");
    chatArea.classList.toggle("full");
});
```

### New Chat
- Calls `POST /create_teaching_session`
- Resets `chatBox` with welcome message: "Hello. I am Falcon AI..."
- Reloads sessions, marks new session as active

### addMessage(message, sender)
```javascript
function addMessage(message, sender)
```
- Creates `.message` div with `.user-message` or `.ai-message` class
- AI messages: renders via `marked.parse(message)`, appends action buttons
- User messages: plain `textContent`
- Auto-scrolls chatBox to bottom

### Action Buttons (per AI message)
- **Copy** (`copy-btn`): Copies inner text to clipboard, shows "Copied" for 1.5s
- **Examples** (`example-btn`): Sends "Give 5 simple real-world examples for this topic:\n\n{topic}" to `/text-chat`
- **Quiz Me** (`quiz-btn`): Sends "Create 5 multiple-choice questions from this topic. Include answers at the end.\n\n{topic}" to `/text-chat`
- **Regenerate** (`regen-btn`): Sends "Explain this topic again using a different teaching style and different examples:\n\n{topic}" to `/text-chat`, replaces current message content

### sendMessage()
```javascript
async function sendMessage()
```
- Ensures session exists via `ensureSession()`
- Shows thinking bubble ("⚡ Falcon AI is thinking...")
- POST to `/text-chat` with `{message, session_id}`
- On success: removes thinking bubble, adds AI message
- On error: removes thinking bubble, adds error message

### showThinking()
```javascript
function showThinking()
```
- Creates animated thinking bubble with `.thinking-message` class
- Returns element for later removal

### loadTeachingSessions()
```javascript
async function loadTeachingSessions()
```
- Fetches `GET /teaching_sessions`
- Populates `.chat-history` and `.archived-history` sections
- Each session item has: title, export (📄), archive/unarchive (📦/↩), delete (🗑) buttons
- Click on session loads messages via `GET /teaching_messages/{id}`

### Voice Input
```javascript
function createRecognition()
```
- Creates `SpeechRecognition` instance (en-US, single result, no interim)
- On result: sets `userInput.value` to transcript, calls `sendMessage()`
- Voice button states: 🎤 (idle) → 🔴 (listening) → 🎙 (processing)
- Shows notice if browser doesn't support speech recognition

### Session Search
- Filters `.history-item` elements by text match on input event

## 4. Data Structure & Persistence

### LocalStorage Keys
None.

### SessionStorage Keys
None.

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/create_teaching_session` | Create new teaching session |
| POST | `/text-chat` | Send message, get AI reply |
| GET | `/teaching_sessions` | List all teaching sessions |
| GET | `/teaching_messages/{id}` | Fetch messages for a session |
| DELETE | `/delete_teaching_session/{id}` | Delete a session |
| POST | `/archive_teaching_session/{id}` | Archive a session |
| POST | `/unarchive_teaching_session/{id}` | Unarchive a session |
| GET | `/export_teaching_pdf/{id}` | Download session as PDF |

## 5. Logic & Event Handlers

| Function | Trigger | Behavior |
|----------|---------|----------|
| `ensureSession()` | Page load, before any chat | Creates session if none exists, deduplicates |
| `addMessage(msg, sender)` | Chat flow | Renders message with markdown/HTML for AI |
| `sendMessage()` | Send button / Enter key | Sends message, shows thinking, renders response |
| `showThinking()` | Before API call | Creates animated "thinking" bubble |
| `loadTeachingSessions()` | Page load, after create/delete | Fetches and renders session sidebar |
| `createRecognition()` | Voice button click | Creates SpeechRecognition for voice input |
| Copy button handler | Click | Copies AI message text to clipboard |
| Examples button handler | Click | Requests 5 real-world examples for the topic |
| Quiz button handler | Click | Requests 5 MCQ questions for the topic |
| Regenerate button handler | Click | Re-explains topic with different style, replaces message |
| Export button handler | Click | Triggers PDF download via hidden link |
| Delete button handler | Click | Deletes session, reloads sidebar |
| Archive button handler | Click | Archives/unarchives session, reloads sidebar |
| Session click handler | Click | Switches active session, loads messages |
| Search handler | Input event | Filters session items by text |

## 6. UX & Styling Details

### Layout
- Sidebar hidden by default, chat area full width
- Toggle via `.hidden` / `.full` classes

### Message Styling
- User messages: `.user-message` class
- AI messages: `.ai-message` class with `.message-content` container
- Thinking message: `.thinking-message` with animated dots (`<span>.</span>` × 3)

### Action Buttons
- Displayed inline below AI message content
- Emoji prefixes: 📋 Copy, 💡 Examples, 🎯 Quiz Me, 🔄 Regenerate
- Copy button feedback: changes to "✅ Copied" for 1.5s

### Voice Button States
- Idle: 🎤
- Listening: 🔴 with `.listening` class
- Processing: 🎙

### Sidebar Items
- Active session: `.active-session` class
- Archive section: separate `.archived-history` container
- Session actions: export (📄), archive/unarchive (📦/↩), delete (🗑)
