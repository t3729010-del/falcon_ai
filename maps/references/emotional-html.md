# Technical Analysis of emotional.html

## 1. Overview
Emotional supporter chat interface for Falcon AI. Full-featured page with sidebar session management, animated SVG avatar, emotion selection grid, voice visualization, and chat input. Designed for emotionally intelligent academic support.

## 2. Architecture & Setup
- **DOCTYPE:** HTML5
- **Language:** `en`
- **CSS:** `emotional.css`
- **Scripts:**
  - `browser_avatar.js` - Avatar generation and photo upload logic
  - `emotional.js` - Chat, session management, voice, emotion handling
- **Meta:** UTF-8, responsive viewport

## 3. Key Features / UI Panels
### Sidebar (`#sidebar`)
- **New Chat Button:** `#new-chat-btn` — Creates new session
- **Search:** `#search-conversations` input — Filters session list
- **Recents:** `.session-list` — Active session list
- **Archive:** `.archive-list` with `#archive-toggle` toggle — Archived sessions

### Floating Avatar Button
- `#avatar-toggle-btn` (`.floating-avatar-btn`) — Activates avatar dropdown
- Displays `+` icon

### Avatar Dropdown Menu (`#avatar-dropdown`)
- **Upload Photo:** `data-action="upload"` — Opens file picker
- **Use Default Avatar:** `data-action="default"` — Activates SVG avatar
- **Deactivate Avatar:** `data-action="deactivate"` — Hides avatar
- **Cancel:** `data-action="cancel"` — Closes dropdown

### Hidden File Input
- `#avatar-file-input` — Accepts `.jpg, .jpeg, .png, .webp`

### Avatar Preview Modal (`#avatar-preview-modal`)
- Preview image: `#avatar-preview-img`
- Confirm button: `#confirm-avatar-btn`
- Cancel button: `#cancel-preview-btn`

### Navbar
- Menu button: `#menu-btn` (☰)
- Logo: `assets/Falcon 1.png`
- Title: "FALCON AI"

### Main Content
- **Header:** "Emotional Supporter" title + subtitle
- **Humanoid Section (`#humanoid-section`):**
  - Static humanoid: `assets/falcon-humanoid.png`
  - Avatar container (`#avatar-container`): SVG-based interactive avatar with rings, eyes, brows, mouth
  - SVG gradients: `ambientGlow`, `hairGrad`
  - SVG filter: `glowFilter`
  - Image wrapper: `#avatar-image-wrapper` for uploaded photos
- **Emotion Grid:** 8 buttons — Happy, Calm, Motivated, Thoughtful, Confused, Sad, Overwhelmed, Frustrated
- **Chat History:** `#chat-history`
- **Voice Visualizer:** `#visualizer-section` with `<canvas id="visualizer-canvas">` and label
- **Quick Tools:** Study Motivation, Focus Booster, Confidence Builder, Burnout Recovery
- **Chat Input:** `#chat-input` text field + `#mic-btn` (SVG microphone) + `#send-btn`
- **Voice Hint:** `#voice-hint` — "Tap to speak"

## 4. Data Structure & Persistence
- Sessions stored via `emotional.js` (likely localStorage)
- Avatar photo stored in `#avatar-image-el` src
- Chat history rendered in `#chat-history`

## 5. Logic & Event Handlers
- **Sidebar toggle:** `#menu-btn` shows/hides sidebar
- **New session:** `#new-chat-btn` creates fresh chat
- **Session search:** `#search-conversations` filters list
- **Archive toggle:** `#archive-toggle` expands/collapses archive
- **Avatar activate:** `#avatar-toggle-btn` toggles dropdown
- **Upload photo:** `data-action="upload"` triggers `#avatar-file-input` click
- **Default avatar:** `data-action="default"` shows SVG avatar
- **Deactivate:** `data-action="deactivate"` hides avatar
- **File input:** `#avatar-file-input` change event loads preview
- **Preview confirm:** `#confirm-avatar-btn` applies uploaded photo
- **Preview cancel:** `#cancel-preview-btn` closes modal
- **Emotion buttons:** Send emotion context to AI
- **Mic button:** `#mic-btn` initiates voice input
- **Send button:** `#send-btn` submits chat message
- **Voice hint:** `#voice-hint` shown during voice flow

## 6. UX & Styling Details
- **SVG Avatar:** Full humanoid with ambient glow, face, eyes with pupils, brows, hair, mouth — all with `#00d9ff` cyan accents
- **Avatar rings:** `.avatar-ring-outer` and `.avatar-ring-inner` for animation
- **Particles:** 6 floating spans for ambient effect
- **Emotion grid:** 2x4 grid of emoji-labeled buttons
- **Voice visualizer:** Canvas-based audio visualization
- **Quick tools:** 4 horizontal tool buttons
