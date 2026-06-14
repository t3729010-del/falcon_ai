# Technical Analysis of exam.css

## 1. Overview
Stylesheet for the Exam Mode interface (202 lines). Features question panel with options, navigator grid for question tracking, and exam statistics.

## 2. Architecture & Setup
- **Reset**: Universal `*` reset with `box-sizing: border-box`
- **Body**: `#020817` background, `min-height:100vh`, `display:flex`
- **Background**: Fixed gradient overlay (`rgba(1,5,18,.88-.94)`)

## 3. Key Features / UI Panels
- **Background**: Fixed gradient overlay
- **Main Content**: flex:1, 30px/25px padding, `min-width:0`
- **Page Title**: 40px, cyan
- **Exam Size Container**: Flex row with size selection buttons (15px radius)
- **Exam Layout**: 2-column CSS Grid (`1fr 320px`) with 20px gap
- **Exam Stats**: 3-column grid with stat boxes (`#03142f` bg, 20px radius)
- **Stat Box**: h3 label (13px, gray), p value (26px, cyan, bold)
- **Question Card**: `#03142f` bg, 25px radius, 28px padding
- **Question Number**: Cyan color
- **Question Text**: 16px, 1.6 line-height
- **Options Container**: Flex column with 12px gap
- **Option**: 14px/18px padding, 15px radius, `rgba(255,255,255,.05)` bg, hover cyan tint
- **Selected Option**: Cyan bg, dark text, bold
- **Action Buttons**: Flex row with prev/next/submit buttons (15px radius, bold)
- **Navigator Panel**: `#03142f` bg, 25px radius, 20px padding, 75vh max-height, sticky, 300px width
- **Navigator Grid**: 3-column grid with 8px gap
- **Nav Button**: 44px height, 10px radius, blue (`#2563eb`) bg
- **Nav Button States**: `.current` (orange `#ff7b00`), `.answered` (green `#22c55e`), `.unanswered` (blue `#2563eb`)
- **Legend**: 13px text explaining nav button colors

## 4. Data Structure & Persistence
Exam state tracked via nav button classes: `.current` (active question), `.answered` (completed), `.unanswered` (pending). Selected option via `.option.selected`. Stats updated dynamically.

## 5. Logic & Event Handlers
- `.option` click selects answer
- `.prev-btn`/`.next-btn` navigate between questions
- `.submit-btn` submits exam
- `.nav-btn` click jumps to specific question
- `.exam-size-btn` selects question set size

## 6. UX & Styling Details
- **Colors**: `#00d9ff` (cyan), `#22c55e` (green/answered), `#ff7b00` (orange/current), `#2563eb` (blue/unanswered), `#020817` (dark bg), `#03142f` (card bg)
- **No custom keyframe animations** - transitions only
- **Navigator**: Sticky positioning with overflow scroll for long question lists
- **Responsive**: Grid collapses for smaller viewports
