# Technical Analysis of text.css

## 1. Overview
Stylesheet for the text-based teaching/chat interface (943 lines). Features space-themed background, sidebar with session management, message rendering with markdown support, and voice input.

## 2. Architecture & Setup
- **Reset**: Universal `*` reset with `box-sizing: border-box`
- **Body**: `#030712` background, `overflow:hidden`, `display:flex`, `height:100vh`
- **Space Background**: Fixed with background image (`assets/interactiveexplainer.png`), radial gradient overlay, `spaceBgZoom` animation (10s)
- **Dual stars**: `.stars` (80px grid, 0.25 opacity, 25s) and `.stars2` (120px grid, 0.12 opacity, 35s)

## 3. Key Features / UI Panels
- **Space Scene**: Fixed background with image, gradient overlay, stars, and nebula
- **Stars**: CSS starfield with `moveStars` animation (25s for primary, 35s for secondary)
- **Nebula**: Radial gradient with `screen` blend mode, 0.3 opacity, `slowZoom` animation (8s)
- **Sidebar**: 320px fixed, `rgba(5,8,22,0.85)` with `backdrop-filter:blur(20px)`, flex column
- **Logo Section**: 60px logo with cyan drop-shadow, h2 with letter-spacing
- **New Chat Button**: Full-width cyan button with hover translateY(-3px)
- **Chat History**: Scrollable flex column with history items (18px padding, 16px radius, hover right-shift + cyan border)
- **Chat Area**: Flex column, 30px padding, transitions for sidebar toggle
- **Top Bar**: Clamped title (40-70px), cyan with text-shadow
- **Chat Box**: Scrollable flex column with 25px gap
- **Messages**: AI (left-aligned, `rgba(0,217,255,0.08)` bg) and User (right-aligned, `rgba(255,255,255,0.05)` bg)
- **Message Content**: 700px max-width, 22px padding, 22px radius, blur backdrop
- **Markdown Styling**: h1/h2/h3 in cyan, lists with margin, code with bg highlight, pre with dark bg
- **Message Actions**: Flex row of action buttons with cyan accent, hover glow
- **Input Area**: Flex row with blur backdrop, 22px padding, 24px radius
- **Buttons**: 60px circular voice/send buttons, voice-btn.listening shows red with `micPulse`
- **Voice Notice**: Red text with `fadeNotice` animation (3s)
- **Scrollbar**: 8px width, cyan thumb
- **Menu Toggle**: Fixed 55px button with blur backdrop
- **Sidebar Animation**: 0.4s ease transition, `.hidden` class for translateX(-100%)
- **Active Session**: Cyan border + shadow + background highlight
- **Delete/Archive/Export Buttons**: Color-coded action buttons per session
- **Session Search**: Full-width input with dark bg
- **Thinking Message**: `pulseThinking` animation with blinking dots

## 4. Data Structure & Persistence
Sessions managed via `.history-item`, `.active-session`, `.archived-title` classes. Sidebar state via `.sidebar.hidden`. Session actions: delete (`.delete-session-btn`), archive (`.archive-session-btn`), export (`.export-session-btn`).

## 5. Logic & Event Handlers
- `.menu-toggle` toggles sidebar via `.sidebar.hidden`
- `.history-item` click loads chat session
- `.new-chat` creates new session
- `.active-session` highlights current session
- `.voice-btn.listening` toggles voice input state
- `.send-btn` submits text messages
- `.message-actions button` triggers message-specific actions
- `.delete-session-btn` removes session
- `.archive-session-btn` archives session
- `.export-session-btn` exports session data
- `.dots span` animation for thinking indicator

## 6. UX & Styling Details
- **Colors**: `#00d9ff` (cyan), `#030712` (dark bg), `#ff2222` (red for voice listening), `#ff6b6b` (red for notices/deletes), `#4CAF50` (green for archive), `#2196F3` (blue for export)
- **Key Animations**: `moveStars` (25s, translateY 0→-500), `slowZoom` (8s, scale 1→1.08), `micPulse` (0.8s, scale 1.05→1 + expanding red shadows), `fadeNotice` (3s, opacity fade), `blink` (opacity 0.2→1), `pulseThinking` (opacity 0.7→1), `spaceBgZoom` (10s, scale 1→1.05)
- **Scrollbar**: Custom 8px webkit scrollbar with cyan thumb
- **Responsive**: Sidebar hidden below 1000px, chat area full width
