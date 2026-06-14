# Technical Analysis of explainer.css

## 1. Overview
Stylesheet for the Explainer Hub landing page (646 lines). Features cosmic space scene with planets and asteroids, navigation bar, and card-based feature display.

## 2. Architecture & Setup
- **Reset**: Universal `*` reset with `box-sizing: border-box`
- **Body**: `#050816` background, `min-height:100vh`, `overflow-x:hidden`
- **Space Scene**: Fixed with `perspective:1000px`, radial gradient background (`#071426` → `#030712`)

## 3. Key Features / UI Panels
- **Space Scene**: Fixed full-viewport container with perspective for depth
- **Stars**: Dual-layer CSS starfield (80px/120px grids, 0.25/0.12 opacity)
- **Nebula**: Radial gradient with `screen` blend mode, 0.35 opacity, `slowZoom` (15s)
- **Planets**: Two decorative planets with radial gradients and glow shadows
  - Planet 1: `clamp(160px,20vw,320px)`, positioned right, cyan gradient, `floatPlanet` (6s)
  - Planet 2: `clamp(90px,12vw,180px)`, positioned left-bottom, blue gradient, `floatPlanet2` (9s)
- **Asteroids**: Dot pattern (`300px` grid) with `driftAsteroids` animation (30s)
- **Navbar**: Flex row with logo and logo text, `z-index:2`
- **Logo**: 60px with cyan drop-shadow, h2 with letter-spacing 4px
- **Main Content**: Flex column, centered, 120px top padding, `z-index:2`
- **Title**: Clamped (42-92px), cyan with double text-shadow glow
- **Subtitle**: `#b8c0cc` color, 4px letter-spacing, 1.8 line-height
- **Cards Container**: Flex row with 60px gap, wrap, centered
- **Card**: 420px width, 60px/45px padding, `rgba(5,8,22,0.78)` bg, blur backdrop, 25px radius, top light pseudo-element (`::before`)
- **Card Hover**: translateY(-12px) + scale(1.03), cyan border + glow
- **Button**: Full-width, 40px radius, cyan bg, bold, hover scale(1.04) + glow
- **Session Items**: Flex row with dropdown menus for session management

## 4. Data Structure & Persistence
Session state managed via `.session-item`, `.session-dropdown`, `.show-dropdown` classes. Delete via `.delete-btn`.

## 5. Logic & Event Handlers
- `.session-menu` toggles `.session-dropdown` via `.show-dropdown`
- `.delete-btn` removes sessions
- Card buttons navigate to features
- Session items handle chat/history management

## 6. UX & Styling Details
- **Colors**: `#00d9ff` (cyan), `#050816` (dark bg), `#b8c0cc` (subtitle gray), `#d1d5db` (card text)
- **Key Animations**: `moveStars` (45s, translateY 0→-500), `slowZoom` (15s, scale 1→1.05/1.08), `floatPlanet` (6s, translateY 0→-20 + rotate 8deg), `floatPlanet2` (9s, translateY 0→25), `driftAsteroids` (30s, translateX 0→-300)
- **Card Light**: `::before` pseudo-element creates top-edge cyan gradient line
- **Responsive**: At 900px, cards stack vertically, card width 90%, main padding reduced
