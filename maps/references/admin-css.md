# Technical Analysis of admin.css

## 1. Overview
Stylesheet for the Admin Diagnostics interface (45 lines). Compact layout for AI provider status, requirements display, and diagnostic actions.

## 2. Architecture & Setup
- **Reset**: Universal `*` reset (single-line)
- **Body**: `#040816` background, `padding: 24px`
- **Font**: Arial, sans-serif

## 3. Key Features / UI Panels
- **Admin Container**: 960px max-width, centered
- **Admin Header**: Flex row with h1 (24px, cyan) and back link
- **Back Link**: Cyan text, 1px border, 8px radius, hover glow
- **Status Summary**: 2-column grid with status cards
- **Status Cards**: `rgba(255,255,255,0.04)` bg, 16px radius, label (12px uppercase gray), value (28px bold white), active-provider value in cyan
- **Provider Grid**: Single-column grid of provider cards
- **Provider Cards**: 16px radius, border color indicates state:
  - `.available`: green border (`rgba(34,197,94,0.3)`)
  - `.unavailable`: red border, 0.7 opacity
  - `.active`: cyan border + glow
- **Provider Badge**: 20px radius pill, color-coded (ready=green, unavailable=red, active=cyan)
- **Provider Stats**: 3-column grid within card (12px font, gray labels)
- **Actions**: Flex row with action buttons (12px radius)
- **Refresh Button**: Cyan outline style
- **Test Avatar Button**: Solid cyan bg
- **Requirements Section**: h2 in cyan (18px)
- **Req Grid**: Auto-fit grid (`minmax(220px,1fr)`)
- **Req Cards**: 12px radius, code snippets in cyan, list items in gray
- **Identity Card**: Purple-tinted border/background

## 4. Data Structure & Persistence
Provider state via `.provider-card` classes (`.available`, `.unavailable`, `.active`). Badge state via `.provider-badge` (`.ready`, `.unavailable`, `.active`).

## 5. Logic & Event Handlers
- `#refresh-btn` refreshes provider status
- `#test-avatar-btn` tests avatar generation
- `.back-link` navigates to main dashboard
- Provider cards are display-only

## 6. UX & Styling Details
- **Colors**: `#00d9ff` (cyan), `#040816` (dark bg), `#22c55e` (green/available), `#ff6b6b` (red/unavailable), `#a78bfa` (purple/identity)
- **No custom animations** - transitions only (0.2s ease)
- **Typography**: Compact 12-16px font sizes for dense information display
