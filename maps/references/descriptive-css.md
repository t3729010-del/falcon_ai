# Technical Analysis of descriptive.css

## 1. Overview
Stylesheet for the Descriptive Exam interface (364 lines). Provides sidebar navigation with categories, question display, answer input modes, file upload, and exam statistics.

## 2. Architecture & Setup
- **Reset**: Universal `*` reset with `box-sizing: border-box`, `font-family: Segoe UI, sans-serif`
- **Body**: `#020814` background, `min-height:100vh`, `display:flex`
- **Background**: Fixed gradient (`#071426` → `#020814`) with dark overlay (`rgba(0,0,0,0.55)`)

## 3. Key Features / UI Panels
- **Background**: Fixed gradient with `::after` pseudo-element dark overlay
- **Menu Button**: Fixed 60x60px at top-left, 18px radius, dark bg, cyan icon
- **Sidebar**: 340px fixed, `rgba(0,0,0,.55)` with blur, 120px top padding for menu clearance
- **Sidebar Hidden**: `.sidebar-hidden` with translateX(-100%)
- **Logo Section**: 80px logo, h1 in cyan
- **Sidebar Title**: h2 in cyan (20px), descriptive paragraph in `#cfd6df`
- **Category List**: Flex column with category buttons (20px radius, hover cyan bg)
- **Active Category**: Cyan border + background highlight
- **Main Content**: flex:1, 50px padding
- **Page Header**: 56px h1 in cyan, 22px paragraph in `#cfd6df`
- **Question Card**: 900px max-width, `rgba(0,8,30,.75)` bg with blur, 35px radius, 40px padding
- **Question Number**: Inline badge with cyan bg
- **Question Text**: 22px, cyan, 1.7 line-height
- **Answer Mode**: Flex row of mode buttons (30px radius, active mode in cyan)
- **Answer Box**: Full-width textarea, 350px min-height, 20px radius, dark bg
- **Upload Section**: File upload area with styled input
- **Exam Stats**: Flex row with stat boxes (15px radius)
- **Action Buttons**: Flex row centered, action button in cyan, submit button in white

## 4. Data Structure & Persistence
Categories managed via `.category` buttons with `.active-category` state. Answer modes via `.mode-btn` with `.active-mode`. Question state via `.question-number`.

## 5. Logic & Event Handlers
- `.menu-btn` toggles sidebar
- `.category` buttons filter questions by category
- `.mode-btn` switches answer mode (text/file)
- `.answer-box` captures text input
- `.upload-section input` handles file upload
- `.submit-btn` submits answer
- `.action-btn` triggers next/previous actions

## 6. UX & Styling Details
- **Colors**: `#00d9ff` (cyan), `#020814` (dark bg), `#1d2b45` (inactive mode bg), `#cfd6df` (subtitle gray), `#a6b2c2` (placeholder gray)
- **No custom animations** - relies on transitions only
- **Responsive**: At 900px, sidebar becomes fixed overlay (300px), menu button visible, main padding reduced, stats/buttons stack vertically
- **Desktop**: Menu button hidden above 901px (sidebar always visible)
