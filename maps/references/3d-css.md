# Technical Analysis of 3d.css

## 1. Overview
Stylesheet for the 3D teaching interface (1074 lines). Provides space-themed visual environment with holographic AI bot, lesson sidebar, chat system, and voice visualizer.

## 2. Architecture & Setup
- **Reset**: Universal `*` reset with `box-sizing: border-box`
- **Body**: `#030712` background, `overflow:hidden`, `display:flex`, `height:100vh` (full viewport flex layout)
- **Space Scene**: Fixed full-viewport container with radial gradient background (`#071426` → `#030712`)
- **Dual-layer stars**: `.stars` (80px grid, 0.2 opacity) and `.stars2` (120px grid, 0.1 opacity) with different animation durations

## 3. Key Features / UI Panels
- **Space Scene**: Fixed background with stars and nebula layers
- **Stars**: CSS-only starfield using `radial-gradient(white 1px, transparent 1px)` with `moveStars` animation (45s/70s)
- **Nebula**: Radial gradient (`#0a2647`) with `screen` blend mode, `slowZoom` animation (15s)
- **Sidebar**: 300px fixed with `rgba(5,8,22,0.82)` background, `backdrop-filter:blur(20px)`, 30px padding, flex column layout
- **Logo**: 60px image with cyan drop-shadow, h2 with letter-spacing 4px
- **Lesson Panel**: Flex column with scrollable lesson list (custom scrollbar: 4px width, purple thumb)
- **Lesson Items**: 14px padding, 14px border-radius, hover translates right 6px with purple border
- **New Lesson Button**: Dashed border (`rgba(168,85,247,0.3)`), purple accent color scheme
- **Main Area**: 40px 60px padding, flex column with space-between
- **Top Bar**: Clamped title (50-90px), cyan with text-shadow glow
- **Hologram Section**: Flex-centered container for AI bot
- **AI Bot Container**: 320x320px relative container
- **AI Core**: 120x120px radial gradient circle (`#00d9ff` → `#005b7a`) with `pulseCore` animation
- **AI Rings**: 3 concentric rings (180/250/320px) with `rotateRing`/`rotateRingReverse` animations (12s/18s/24s)
- **Lesson Display**: Frosted glass card (24px radius, blur backdrop) with hover translateY(-4px)
- **Controls**: Flex row of 40px radius buttons with scale/hover glow effects
- **Particles**: 6 cyan dots with `floatParticles` animation (8s linear)
- **Chat History**: 300px scrollable container with cyan-tinted background, user/falcon message bubbles
- **Visualizer**: Canvas container with cyan border, pulsing label
- **Chat Input**: Flex row with text input, mic button (state colors), send button
- **Menu Toggle**: Fixed 48px button with blur backdrop for mobile sidebar
- **Responsive**: At 1000px, sidebar hides, controls stack vertically

## 4. Data Structure & Persistence
Lesson items managed via `.lesson-item` and `.lesson-item.active` classes. Sidebar toggle via `.hide-sidebar` (translateX -100% + opacity 0 + pointer-events none). Menu toggle via `.menu-toggle` visibility.

## 5. Logic & Event Handlers
- `.menu-toggle` toggles sidebar visibility via `.hide-sidebar`
- `.lesson-item` click handlers set `.active` class
- `.lesson-delete` button removes lesson items (opacity reveal on hover)
- `.new-lesson-btn` creates new lessons
- `.mic-btn.listening/.processing/.speaking` voice state management
- `.send-btn` submits chat messages
- `.voice-hint.listening/.speaking/.processing` reflects voice state

## 6. UX & Styling Details
- **Colors**: `#00d9ff` (cyan), `#a855f7` (purple for lessons), `#030712` (dark bg), `#22c55e` (green/listening), `#f59e0b` (amber/processing), `#a78bfa` (purple/speaking)
- **Key Animations**: `moveStars` (45s, translateY 0→-500), `slowZoom` (15s, scale 1→1.08), `pulseCore` (3s, scale 1→1.08 + shadow), `rotateRing` (12s, 0→360deg), `rotateRingReverse` (18s, 360→0), `floatParticles` (8s, translateY 0→-20 + opacity), `voicePulse` (box-shadow + scale), `voiceHintPulse` (opacity 0.5→1)
- **Scrollbar**: Custom 4px webkit scrollbar with purple track
- **Responsive**: Sidebar hidden below 1000px, menu toggle button appears
