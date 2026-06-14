# Technical Analysis of style.css

## 1. Overview
Stylesheet for the Splash/Loading Screen (188 lines). Minimal centered layout with floating logo, title, tagline, and animated loading bar.

## 2. Architecture & Setup
- **Reset**: Universal `*` reset with `box-sizing: border-box`
- **Body**: `#050816` background, `height:100vh`, flex centered, `overflow:hidden`
- **Font**: Arial, sans-serif

## 3. Key Features / UI Panels
- **Container**: Centered text-align container
- **Logo**: 220px width, 20px margin-bottom, cyan drop-shadow, `float` animation (3s)
- **Title (h1)**: 70px, cyan, 8px letter-spacing, triple text-shadow glow (10/20/40px)
- **Tagline**: `#455a7d` gray, 18px, 3px letter-spacing
- **Loading Text**: Cyan, 14px, 4px letter-spacing, `pulse` animation (1.5s)
- **Loading Bar**: 300px width, 8px height, `rgba(255,255,255,0.1)` bg, 20px radius, cyan glow shadow
- **Loading Fill**: 0%→100% width animation, cyan bg with triple glow shadow

## 4. Data Structure & Persistence
Loading progress managed via CSS animation (not JS-driven). Fill width animates 0%→70%→100% over 3 seconds.

## 5. Logic & Event Handlers
No interactive handlers. Pure display/loading screen. Transitions to main app after animation completes.

## 6. UX & Styling Details
- **Colors**: `#00d9ff` (cyan), `#050816` (dark bg), `#455a7d` (tagline gray)
- **Key Animations**:
  - `float` (3s, ease-in-out, infinite): translateY 0→-15→0 for logo bobbing
  - `pulse` (1.5s, infinite): opacity 0.4→1→0.4 for loading text
  - `loading` (3s, ease-in-out, infinite): width 0%→70%→100% for progress bar fill
- **Loading Fill Shadow**: Triple glow effect (`0 0 10px`, `0 0 20px`, `0 0 40px`) creating neon effect
- **Logo Shadow**: Single 25px cyan drop-shadow for emphasis
