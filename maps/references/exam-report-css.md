# Technical Analysis of exam-report.css

## 1. Overview
Stylesheet for the Exam Report display (93 lines). Centered report card showing exam results with percentage, grade, and navigation.

## 2. Architecture & Setup
- **Reset**: Universal `*` reset with `box-sizing: border-box`
- **Body**: `#020817` background, `min-height:100vh`, flex centered
- **Background**: Fixed gradient overlay (`rgba(1,5,18,.88-.94)`)

## 3. Key Features / UI Panels
- **Background**: Fixed gradient overlay
- **Report Container**: 90% width, 1200px max-width, centered
- **Title**: 55px, cyan, centered, 40px margin-bottom
- **Stats Grid**: 4-column CSS Grid with 20px gap, 35px margin-bottom
- **Stat Card**: `#03142f` bg, 30px padding, 20px radius, centered, p value in cyan (40px)
- **Score Card**: `#03142f` bg, 25px radius, 40px padding, centered
- **Percentage**: 70px, cyan, 20px vertical margin
- **Grade**: 80px, green (`#22c55e`), bold
- **Back Button**: Full-width, cyan bg, 18px radius, 18px bold text, 30px margin-top

## 4. Data Structure & Persistence
Report data passed via DOM. Grade and percentage displayed in score card. Stats in grid cards.

## 5. Logic & Event Handlers
- `.back-btn` navigates to previous page (exam or practice)

## 6. UX & Styling Details
- **Colors**: `#00d9ff` (cyan), `#22c55e` (green/grade), `#020817` (dark bg), `#03142f` (card bg)
- **No custom animations** - static display
- **Layout**: Vertically and horizontally centered via flexbox on body
