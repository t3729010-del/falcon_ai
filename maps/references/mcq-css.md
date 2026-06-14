# Technical Analysis of mcq.css

## 1. Overview
Stylesheet for the MCQ Center hub page (235 lines). Displays mode selection cards for Practice and Exam modes with feature descriptions and action buttons.

## 2. Architecture & Setup
- **Reset**: Universal `*` reset with `box-sizing: border-box`
- **Body**: `min-height:100vh`, `overflow-x:hidden`
- **Background**: Fixed gradient overlay (`rgba(1,5,18,.85-.92)`)

## 3. Key Features / UI Panels
- **Background**: Fixed gradient overlay
- **Container**: 90% width, 1400px max-width, centered, 50px vertical padding
- **Logo Section**: Flex row with 75px rounded logo, h1 in cyan, paragraph in `#b8c5d6`
- **Hero**: Centered section with 60px h2 in cyan, descriptive paragraph (800px max-width, `#b8c5d6`)
- **Mode Container**: 2-column CSS Grid (`minmax(400px,1fr)`) with 40px gap
- **Mode Card**: `rgba(5,15,35,.9)` bg, cyan border (0.15), 30px radius, blur backdrop, hover translateY(-6px)
- **Mode Icon**: 55px emoji/icon
- **Mode Card Title**: h3 in cyan (32px)
- **Mode List**: Bullet points with `#d8e6f5` text
- **Practice Button**: Full-width, cyan bg, dark text
- **Exam Button**: Full-width, green (`#22c55e`) bg, white text
- **Generating State**: Purple gradient animation (`uvGlow`) with `cursor:not-allowed`

## 4. Data Structure & Persistence
Mode selection state managed via button classes. `.mode-btn.generating` indicates quiz generation in progress.

## 5. Logic & Event Handlers
- `.practice-btn` initiates practice mode
- `.exam-btn` initiates exam mode
- `.mode-btn.generating` disables interaction during generation

## 6. UX & Styling Details
- **Colors**: `#00d9ff` (cyan), `#22c55e` (green/exam), `#7c3aed`/`#a855f7` (purple/generating), `#020817` (dark bg)
- **Key Animations**: `uvGlow` (1.5s, background-position 0%→100% + expanding purple box-shadow)
- **Card Shadow**: `0 0 20px rgba(0,217,255,.1)` base, intensifies on hover
- **Responsive**: At 768px, hero title shrinks to 38px, mode grid single column
