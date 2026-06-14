# Technical Analysis of index.html

## 1. Overview
Splash/loading screen for Falcon AI. Displays branding, logo, tagline, and an animated loading bar while initializing neural systems. Auto-redirects to the dashboard after 5.5 seconds.

## 2. Architecture & Setup
- **DOCTYPE:** HTML5 (`<!DOCTYPE html>`)
- **Language:** `en`
- **CSS:** `style.css` (global styles)
- **Scripts:** Inline `<script>` tag with a single `setTimeout` call
- **Meta:** UTF-8 charset, responsive viewport

## 3. Key Features / UI Panels
- **Logo Image:** `assets/Falcon 1.png` with class `logo`
- **Title:** `<h1>FALCON AI</h1>`
- **Tagline:** `<p class="tagline">Your Advanced Educational Platform</p>`
- **Loading Bar:** `.loading-bar` container with `.loading-fill` animated child
- **Loading Text:** `<p class="loading-text">Initializing Neural Systems...</p>`
- **Container:** All elements wrapped in `<div class="container">`

## 4. Data Structure & Persistence
No data persistence. Purely a static splash screen with a timed redirect.

## 5. Logic & Event Handlers
- **Auto-redirect:** `setTimeout(() => { window.location.href = "dashboard.html"; }, 5500);`
  - After 5500ms, navigates the browser to `dashboard.html`
  - No other event listeners or handlers

## 6. UX & Styling Details
- **Loading animation:** `.loading-fill` expands within `.loading-bar` (controlled by `style.css`)
- **Loading text message:** "Initializing Neural Systems..."
- **Redirect timing:** 5.5 seconds total before navigation
