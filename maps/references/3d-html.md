# Technical Analysis of 3d.html

## 1. Overview
3D holographic teaching interface for Falcon AI. Features an immersive space scene with a holographic AI bot, floating particles, lesson display, controls, and voice visualization. Provides the immersive 3D learning experience.

## 2. Architecture & Setup
- **DOCTYPE:** HTML5
- **Language:** `en`
- **CSS:** `3d.css`
- **Scripts:** `3d.js` — Hologram animation, lesson logic, chat, voice
- **Meta:** UTF-8, responsive viewport

## 3. Key Features / UI Panels
- **Menu Toggle:** `#menuToggle` (☰) — Toggles sidebar
- **Space Background:**
  - `.stars` — Primary star field
  - `.stars.stars2` — Secondary star layer
  - `.nebula` — Nebula element
- **Floating Particles:** 6 `<span>` elements in `.particles`
- **Sidebar (`aside.sidebar`):**
  - Logo: `../assets/Falcon 1.png`
  - Title: "FALCON AI"
  - Lesson Panel: `.lesson-panel` with `#lesson-list` container
- **Main Area (`main.main-area`):**
  - **Top Bar:** Title "3D Teaching" + subtitle "Immersive holographic AI learning experience"
  - **Hologram Section (`.hologram-section`):**
    - **AI Bot Container:** `.ai-core` (center), 3 rings (`.ring1`, `.ring2`, `.ring3`)
    - **Lesson Display:** Title "Solar System Simulation" + description
  - **Controls:** 3 buttons — Start Lesson, Voice Mode, Interactive Mode
  - **Chat History:** `#chat-history` container
  - **Voice Visualizer:** `#visualizer-section` with `#visualizer-canvas` + label
  - **Chat Input:** `#chat-input` + `#mic-btn` (SVG microphone) + `#send-btn`
  - **Voice Hint:** `#voice-hint` — "Tap to speak"

## 4. Data Structure & Persistence
- Lesson list stored in `#lesson-list` (populated by `3d.js`)
- Chat history rendered in `#chat-history`
- Voice visualizer uses canvas rendering

## 5. Logic & Event Handlers
- **Menu toggle:** `#menuToggle` shows/hides sidebar
- **Start Lesson:** Triggers holographic lesson animation
- **Voice Mode:** Activates voice interaction
- **Interactive Mode:** Enables interactive 3D exploration
- **Mic button:** `#mic-btn` starts voice input
- **Send button:** `#send-btn` submits text message
- **Voice hint:** `#voice-hint` displayed during voice flow

## 6. UX & Styling Details
- **Hologram effect:** AI core with 3 concentric rings for holographic appearance
- **Ring animation:** `.ring1`, `.ring2`, `.ring3` rotate independently
- **Space theme:** Stars, nebula background
- **Particles:** 6 floating spans for ambient depth
- **Visualizer:** Canvas-based audio visualization during AI speech
- **Controls:** 3 action buttons below hologram section
