# Technical Analysis of quiz-materials.css

## 1. Overview
Stylesheet for the quiz materials upload interface (860 lines). Provides space-themed layout with sidebar navigation, upload functionality, processing status, and material history grid.

## 2. Architecture & Setup
- **Reset**: Universal `*` reset with `box-sizing: border-box`
- **Body**: `#020617` background, `display:flex`, `min-height:100vh`
- **Space Background**: Fixed gradient overlay (`rgba(1,5,20,0.88-0.92)`) with `bgZoom` animation (18s)

## 3. Key Features / UI Panels
- **Space Background**: Fixed gradient with `bgZoom` animation (18s, scale 1→1.08)
- **Sidebar**: 320px fixed, `rgba(3,7,18,0.88)` with `backdrop-filter:blur(20px)`, flex column, 35px gap
- **Menu Button**: 60x60px, 18px radius, dark bg with cyan icon
- **Logo Area**: 75px logo with cyan drop-shadow, h1 with letter-spacing
- **Category Section**: Flex column with category buttons (20px radius, hover translateX + cyan border)
- **AI Status Panel**: Pushed to bottom (`margin-top:auto`), 28px radius card with status light
- **Status Light**: 18x18px green circle (`#00ff88`) with `pulseLight` animation (2s)
- **Main Content**: 60px padding, scrollable
- **Hero Section**: Clamped title (55-100px), cyan with text-shadow, descriptive paragraph
- **Upload Section**: CSS Grid (`minmax(380px,1fr)`) with upload and processing cards
- **Upload Box**: Dashed border (`rgba(0,217,255,0.35)`), 35px radius, blur backdrop, hover translateY(-8px)
- **Upload Icon**: 70px font-size, cyan
- **Upload Button**: 20px radius, cyan bg, hover scale(1.04)
- **Processing Card**: Similar to upload box with progress bar
- **Processing Bar**: 16px height, `loadingMove` animation (3s, width 35%→90%)
- **History Section**: Grid (`minmax(250px,1fr)`) of history cards
- **History Cards**: 30px radius, blur backdrop, hover translateY(-8px) + cyan border
- **File Icon**: 55px, cyan
- **Action Buttons**: Flex row of action buttons with hover translateY(-5px)
- **Delete Button**: Full-width red button
- **Material Actions**: Flex row with choose button (cyan)
- **Selected Material**: Cyan border + glow shadow
- **Sidebar Collapse**: `.collapsed` class with translateX(-100%), 0.4s transition

## 4. Data Structure & Persistence
Materials managed via `.history-card` elements. Active category via `.category-btn.active`. Selected material via `.selected-material`. Sidebar state via `.sidebar.collapsed`. Processing state via `.processing-card`.

## 5. Logic & Event Handlers
- `.menu-btn` toggles sidebar visibility
- `.category-btn` switches active category
- `.upload-btn` triggers file upload
- `.choose-btn` selects material for quiz generation
- `.delete-btn` removes material
- `.action-btn` initiates quiz actions
- `.status-light` indicates AI readiness

## 6. UX & Styling Details
- **Colors**: `#00d9ff` (cyan), `#020617` (dark bg), `#00ff88` (green status light), `#ef4444` (red delete), `#00d4ff` (cyan for selected/choose)
- **Key Animations**: `bgZoom` (18s, scale 1→1.08), `pulseLight` (2s, opacity 0.5→1), `loadingMove` (3s, width 35%→90%)
- **Responsive**: At 1000px, body stacks vertically, sidebar full-width, main content padding reduced
