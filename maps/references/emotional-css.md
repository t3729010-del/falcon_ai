# Technical Analysis of emotional.css

## 1. Overview
Primary stylesheet for the Emotional Avatar supporter interface (2010 lines). Provides comprehensive styling for avatar components, voice interactions, chat system, session management, and the humanoid bot display.

## 2. Architecture & Setup
- **Reset**: Universal `*` reset with `box-sizing: border-box`
- **Base font**: Arial, sans-serif
- **Body background**: `#040816` (deep navy)
- **Color scheme**: Cyan accent (`#00d9ff`), white text, rgba overlays with backdrop-filter blur effects
- **Layout**: Flexbox and CSS Grid throughout

## 3. Key Features / UI Panels
- **Floating Avatar Button**: Fixed-position circular toggle (56x56px) with glassmorphism (`rgba(5,10,25,0.85)` + `backdrop-filter:blur(16px)`). Plus icon rotates 90deg on hover.
- **Avatar Dropdown Menu**: 240px-wide dropdown positioned below floating button with `.hidden-dropdown` toggle for opacity/visibility transitions.
- **Activation Modal**: Centered overlay card with `.modalEnter` keyframe (scale 0.9→1 + translateY 20→0).
- **Avatar Container**: Absolute-centered wrapper with rings (`.avatar-ring-outer` 320px, `.avatar-ring-inner` 260px), glow overlays per state.
- **Image-Based Avatar**: 260x260px circular wrapper with blink overlay, CSS-filter stylization fallback with holographic border.
- **Preview Modal**: 500px max-width card for avatar image preview with `.fadeInImage` animation.
- **Avatar State Animations**: idle (`idleBreathe`), listening (`listenLean`), thinking (`thinkTilt`), speaking (`speakNod`), error (red glow).
- **Sidebar**: 300px fixed left sidebar with session items, search, archive section, overlay.
- **Session Menu**: Dropdown menus per session item with fade animation, delete/archive actions.
- **Background**: Fixed radial gradients (purple + cyan) with `z-index:-10`.
- **Particles**: 6 absolutely-positioned cyan dots with `floatParticle` animation.
- **Navbar**: Logo with drop-shadow, cyan title with letter-spacing.
- **Humanoid Display**: No wrapper section — elements are direct children of `<main class="main-content">`. Platform glow (`.platform`) uses `position:relative; margin: -60px auto 0 auto` to overlay the humanoid image's bottom. Humanoid SVG has triple drop-shadow and `floatBot`/`glowPulse` animations.
- **Main Content Layout**: Flex column with `align-items:center`, `height:calc(100vh - 80px)`, `overflow-y:auto`. After hiding hero elements (on chat start), `chat-history` fills remaining space via `flex:1`.
- **Emotion Grid**: Auto-fit grid (`minmax(180px,1fr)`) of 12 emoji-labeled buttons — 8 emotions + 4 quick tools (`.tool-btn`). Has `flex-shrink:0`.
- **Voice Visualizer**: Canvas-based with cyan border, label with `visLabelPulse`.
- **Chat History**: Flex-growing container (`flex:1; min-height:0`) with `overflow-y:auto` for scrolling. User messages (cyan bg) and falcon messages (white bg) as bubbles.
- **Chat Input**: Flex row with text input, mic button (state-driven colors), send button. Has `flex-shrink:0; padding-bottom:20px`.
- **Voice Input**: Large 88px circular mic button with state colors (green=listening, purple=speaking, amber=processing). `.mic-btn.recording` adds red border + pulse animation.
- **Voice Toggle**: 44px circular button (`.voice-toggle-btn`) with gray default state, cyan when `.active` (`.voice-toggle-btn.active`).
- **Avatar Loading Overlay**: Spinner with `avatarSpin` animation, pulsing text.
- **Avatar Generation Error**: Centered error state with retry button.
- **Avatar Stage Track**: Horizontal dot progress indicator with active/done states.

## 4. Data Structure & Persistence
No direct data persistence. Session state managed via DOM classes: `.active-session`, `.hidden-dropdown`, `.hidden-modal`, `.hidden-avatar`, `.hidden-archive`, `.show-dropdown`. Avatar states applied as class modifiers on `.avatar-container`: `.idle`, `.listening`, `.thinking`, `.speaking`, `.error`.

## 5. Logic & Event Handlers
- `.floating-avatar-btn` toggles dropdown visibility
- `.avatar-dropdown-item` buttons trigger avatar actions
- `.modal-overlay` / `.hidden-modal` toggle activation modal
- `.mic-btn.listening/.processing/.speaking` state classes for voice input
- `.voice-btn.listening/.speaking/.processing` state classes for standalone voice
- `.session-item .session-menu` toggles `.session-dropdown` via `.show-dropdown`
- `.delete-btn` removes sessions, `.archive-title` toggles archive list
- `.avatar-retry-btn` retries avatar generation
- `.sidebar-overlay.show` displays backdrop for mobile sidebar

## 6. UX & Styling Details
- **Colors**: `#00d9ff` (cyan accent), `#040816` (dark bg), `#22c55e` (green/listening), `#ff6b6b` (red/error), `#a78bfa` (purple/speaking), `#f59e0b` (amber/processing)
- **Key Animations**: `ringPulse` (4s, scale 1→1.08), `blink` (scaleY 1→0.1→1), `idleBreathe` (4s, translateY 0→-6), `thinkTilt` (3s, rotate 3deg), `speakNod` (1.2s, rotate 1.5deg), `listenLean` (3.5s, rotate 2deg), `imgBreathe`/`imgListen`/`imgThink`/`imgSpeak`/`imgBlink` (image avatar variants), `holographicRotate` (hue-rotate 0→360), `voicePulse` (box-shadow + scale), `floatBot` (4s, translateY 0→-15), `glowPulse` (3s, drop-shadow intensity), `floatParticle` (8s, translateY + opacity), `avatarSpin` (0.8s rotate), `avatarTextPulse` (opacity 0.6→1)
- **Accessibility**: `prefers-reduced-motion` disables all animations; `focus-visible` outlines on buttons/inputs
- **Responsive**: At 600px breakpoint, avatar shrinks to 200px, rings/images resize, floating button and dropdown reposition
- **Backdrop blur**: Extensively used (`blur(16-20px)`) for glassmorphism on sidebar, dropdowns, modals, cards
