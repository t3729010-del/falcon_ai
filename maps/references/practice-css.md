# Technical Analysis of practice.css

## 1. Overview
Stylesheet for the Practice Mode quiz interface (266 lines). Provides question display with multiple-choice options, statistics grid, and action buttons for quiz navigation.

## 2. Architecture & Setup
- **Reset**: Universal `*` reset with `box-sizing: border-box`
- **Body**: `#020817` background, `min-height:100vh`, `display:flex`
- **Background**: Fixed gradient overlay (`rgba(1,5,18,.88-.94)`)

## 3. Key Features / UI Panels
- **Background**: Fixed gradient overlay
- **Main Content**: flex:1, 40px padding
- **Page Title**: 50px, cyan
- **Stats Grid**: 3-column CSS Grid with 20px gap
- **Stat Card**: `rgba(5,15,35,.92)` bg, 22px radius, centered text, h2 in cyan (36px)
- **Question Card**: Same bg as stat cards, 30px radius, 35px padding
- **Question Number**: Inline badge with `rgba(0,217,255,.1)` bg, cyan text, pill shape (999px radius)
- **Question Text**: 24px, 1.6 line-height
- **Options Container**: Flex column with 15px gap
- **Option**: 16px padding/radius, `rgba(255,255,255,.05)` bg, hover cyan border/bg
- **Selected Option**: Cyan border + `rgba(0,217,255,.12)` bg
- **Action Buttons**: Flex row with 15px gap, wrap
- **Submit Button**: Cyan bg, dark text
- **Next Button**: Green (`#22c55e`) bg
- **Stop Button**: Red (`#ef4444`) bg
- **All action buttons**: 16px radius, bold, hover translateY(-2px)
- **Feedback Card**: Same bg as stat cards, 25px radius, h3 in cyan

## 4. Data Structure & Persistence
Question state via `.question-number`. Selected option via `.selected-option`. Stats displayed via `.stat-card` elements.

## 5. Logic & Event Handlers
- `.option` click selects answer (adds `.selected-option`)
- `.submit-btn` submits current answer
- `.next-btn` advances to next question
- `.stop-btn` ends practice session
- Stats update dynamically via DOM manipulation

## 6. UX & Styling Details
- **Colors**: `#00d9ff` (cyan), `#22c55e` (green for next/correct), `#ef4444` (red for stop), `#020817` (dark bg), `#dbe4f0` (feedback text)
- **No custom keyframe animations** - transitions only
- **Responsive**: At 1000px, body stacks vertically, stats grid single column, action buttons stack, padding reduced
