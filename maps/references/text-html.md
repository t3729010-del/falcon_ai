# Technical Analysis of text.html

## 1. Overview
Text-based AI teaching chat interface for Falcon AI. Features a sidebar with session management, a main chat area with AI greeting, and input controls. Uses Markdown rendering for AI responses.

## 2. Architecture & Setup
- **DOCTYPE:** HTML5
- **Language:** `en`
- **CSS:** `text.css`
- **Scripts:**
  - `marked.js` CDN (`https://cdn.jsdelivr.net/npm/marked/marked.min.js`) — Markdown parser
  - `text.js` — Chat logic, session management
- **Meta:** UTF-8, responsive viewport

## 3. Key Features / UI Panels
- **Menu Toggle:** `.menu-toggle` (☰) — Toggles sidebar visibility
- **Space Background:**
  - `.stars` — Primary star field
  - `.stars.stars2` — Secondary star layer
  - `.nebula` — Nebula element
- **Sidebar (`aside.sidebar.active`):**
  - Logo: `../assets/Falcon 1.png`
  - Title: "FALCON AI"
  - New Session button: `.new-chat` — "+ New Session"
  - Search: `#sessionSearch` input — "Search lessons..."
  - Chat History: `.chat-history` — Active session list
  - Archived Lessons: `.archived-title` (📦) + `.archived-history`
- **Main Chat Area (`main.chat-area`):**
  - **Top Bar:** Title "Text Teaching" + subtitle
  - **Chat Box:** `.chat-box` container with default AI message "Hello. I am Falcon AI. What would you like to learn today?"
  - **Input Area:** Voice button (🎤) + text input + send button (➤)

## 4. Data Structure & Persistence
- Sessions managed via `text.js` (likely localStorage)
- Chat history rendered in `.chat-box`
- Archived lessons stored separately

## 5. Logic & Event Handlers
- **Menu toggle:** `.menu-toggle` shows/hides sidebar
- **New session:** `.new-chat` creates fresh chat
- **Session search:** `#sessionSearch` filters sessions
- **Voice button:** `.voice-btn` initiates voice input
- **Send button:** `.send-btn` submits message
- **Enter key:** Submits text input
- **Markdown rendering:** `marked.js` converts AI responses to HTML

## 6. UX & Styling Details
- **Space theme:** Multi-layered stars and nebula background
- **Sidebar default state:** `.active` class means sidebar is initially visible
- **Chat messages:** `.ai-message` class for AI responses with `.message-content` wrapper
- **Input area:** Horizontal layout with voice, text, and send buttons
- **Archived section:** Separated from active sessions with "Archived Lessons" header
