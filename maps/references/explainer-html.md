# Technical Analysis of explainer.html

## 1. Overview
Explainer sub-menu page for Falcon AI. Provides a space-themed selection screen with two learning modes: 3D Teaching and Text Teaching. Acts as a gateway to the teaching interfaces.

## 2. Architecture & Setup
- **DOCTYPE:** HTML5
- **Language:** `en`
- **CSS:** `explainer.css`
- **Scripts:** None (inline `onclick` handlers)
- **Meta:** UTF-8, responsive viewport

## 3. Key Features / UI Panels
- **Space Scene (`.space-scene`):**
  - `.stars` — Primary star field
  - `.stars.stars2` — Secondary star layer
  - `.nebula` — Nebula background element
  - `.planet.planet1` — First planet
  - `.planet.planet2` — Second planet
  - `.asteroids` — Asteroid field
- **Navbar:**
  - Logo: `assets/Falcon 1.png`
  - Title: "FALCON AI"
- **Main Content:**
  - Heading: "Interactive Explainer"
  - Subtitle: "Choose how Falcon AI will guide your learning experience."
- **Cards (`.cards-container`):**
  - **3D Teaching Card:** Description + `onclick="window.location.href='3d.html'"` button "Enter 3D Learning"
  - **Text Teaching Card:** Description + `onclick="window.location.href='text.html'"` button "Enter Text Learning"

## 4. Data Structure & Persistence
No data persistence. Pure navigation page.

## 5. Logic & Event Handlers
- **3D button:** `onclick="window.location.href='3d.html'"` — Navigates to 3D teaching
- **Text button:** `onclick="window.location.href='text.html'"` — Navigates to text teaching

## 6. UX & Styling Details
- **Space theme:** Multi-layered star field, nebula, planets, and asteroids
- **Card layout:** Two side-by-side cards with descriptive text and CTA buttons
- **Visual depth:** Multiple background layers create parallax-like depth
