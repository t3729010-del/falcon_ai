# Technical Analysis of dashboard.css

## 1. Overview
Stylesheet for the Dashboard Hub landing page (370 lines). Minimalist design with floating glow effect, particle system, and card-based feature navigation.

## 2. Architecture & Setup
- **Reset**: Universal `*` reset with `box-sizing: border-box`
- **Body**: `#050816` background, `min-height:100vh`, `overflow:hidden`
- **Background Glow**: 800x800px centered radial gradient with `floatFalcon` animation

## 3. Key Features / UI Panels
- **Background Glow**: Absolute-positioned 800px circle, centered via `translate(-50%,-50%)`, cyan radial gradient (0.15 opacity), `floatFalcon` animation (6s)
- **Navbar**: Flex row with logo section, 50px horizontal padding
- **Logo**: 60px with cyan drop-shadow, h2 with letter-spacing 4px
- **Main Content**: 80vh height, flex column centered
- **Particles**: 8 absolutely-positioned cyan dots with individual `floatParticles` durations (8-15s)
- **Title**: 60px, cyan with triple text-shadow glow (`0 0 3px`, `0 0 8px`, `0 0 14px`)
- **Subtitle**: `#9ca3af` gray, 2px letter-spacing
- **Cards Container**: Flex row with 40px gap, wrap
- **Card**: 320px width, 40px/30px padding, `rgba(255,255,255,0.05)` bg, blur backdrop, 25px radius, 20px glow shadow
- **Card Hover**: translateY(-10px), cyan border + 30px glow
- **Card Title**: h2 in cyan
- **Card Text**: `#d1d5db` gray, 1.7 line-height
- **Button**: 30px radius, cyan bg, bold, hover scale(1.05) + 20px glow

## 4. Data Structure & Persistence
No data persistence. Pure display/navigation interface. Cards serve as navigation links.

## 5. Logic & Event Handlers
- Card buttons navigate to different hub sections
- No interactive state management

## 6. UX & Styling Details
- **Colors**: `#00d9ff` (cyan), `#050816` (dark bg), `#9ca3af` (subtitle gray), `#d1d5db` (card text)
- **Key Animations**: `floatFalcon` (6s, translateY 0→-20 with translate(-50%,-50%) preserved), `floatParticles` (10s base, each particle has unique 8-15s duration, translateY 0→-20 + opacity 0.2→0.6)
- **Particle Positions**: 8 particles distributed across viewport (top 15-90%, left 15-80%)
- **Card Shadow**: `0 0 20px rgba(0,217,255,0.1)` base, intensifies to `0 0 30px rgba(0,217,255,0.4)` on hover
