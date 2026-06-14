# Technical Analysis of review.css

## 1. Overview
Stylesheet for the Review Display interface (259 lines). Shows question review cards with correct/wrong/unattempted indicators, source badges, and explanations.

## 2. Architecture & Setup
- **Reset**: Universal `*` reset with `box-sizing: border-box`, `font-family: Arial, sans-serif`
- **Body**: `#020817` background, `min-height:100vh`
- **Background**: Fixed gradient overlay (`rgba(0,0,0,.85)`)

## 3. Key Features / UI Panels
- **Background**: Fixed gradient overlay
- **Top Bar**: Flex row with logo (70x70px) and logo text (`#11d7ff` cyan)
- **Back Section**: 40px horizontal padding with back button (cyan bg, 12px radius)
- **Main Content**: 40px padding
- **Page Title**: 48px, `#11d7ff` cyan
- **Review Card**: `rgba(0,24,70,0.75)` bg, 25px radius, blur backdrop, cyan border, hover translateY(-4px)
- **Card Header**: Flex row with source badge and question number
- **Source Badges**: Pill-shaped badges with purple gradient background and `uvGlow` animation
- **Question Number**: 22px, `#11d7ff` cyan
- **Question Text**: 28px, bold, 1.5 line-height
- **Answer Row**: 22px, with color-coded values
- **Correct Answer**: Green (`#22c55e`), bold
- **Wrong Answer**: Red (`#ff5757`), bold
- **Unattempted Answer**: Yellow (`#f59e0b`), bold
- **Answer Value**: Bold with `rgba(255,255,255,.1)` bg pill
- **Explanation Box**: Dark bg (`rgba(0,0,0,0.35)`), left cyan border (4px), blur backdrop, 12px radius
- **Explanation Title**: `#11d7ff` cyan, 20px
- **Explanation Text**: `#d7d7d7` gray, 1.8 line-height
- **Empty State**: Centered gray text (24px, `#a0aec0`)
- **Word Wrap**: All review card content uses `word-wrap: break-word`

## 4. Data Structure & Persistence
Review data rendered via `.review-card` elements. Source indicated by `.badge-practice` or `.badge-exam`. Answer status via `.correct-answer`, `.wrong-answer`, `.unattempted-answer` classes.

## 5. Logic & Event Handlers
- `.back-btn` navigates to previous page
- Review cards are display-only (no interactive state)
- Source badges indicate question origin

## 6. UX & Styling Details
- **Colors**: `#11d7ff` (cyan), `#22c55e` (green/correct), `#ff5757` (red/wrong), `#f59e0b` (yellow/unattempted), `#7c3aed`/`#a855f7` (purple badges), `#020817` (dark bg)
- **Key Animations**: `uvGlow` (2s, background-position 0%→100% + box-shadow 10px→20px purple glow)
- **Card Shadow**: `0 0 20px rgba(17,215,255,0.08)` base, intensifies on hover
- **Overflow**: Cards use `overflow: hidden` with comprehensive word-wrap rules
