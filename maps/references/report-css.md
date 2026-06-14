# Technical Analysis of report.css

## 1. Overview
Stylesheet for the Report Center interface (220 lines). Displays exam results with statistics grid, grade display, and sidebar history navigation.

## 2. Architecture & Setup
- **Reset**: Universal `*` reset with `box-sizing: border-box`, `font-family: Arial, Helvetica, sans-serif`
- **Body**: `#000814` background, `min-height:100vh`
- **Background**: Fixed gradient overlay with background image (`assets/background.jpg`)

## 3. Key Features / UI Panels
- **Background**: Fixed gradient + background image
- **Top Bar**: Fixed at top-left with menu button (60x60px, 18px radius, dark bg `#101b36`) and logo
- **Sidebar**: 340px fixed, `#00123d` bg, 130px top padding, border-right, hidden via `.hidden` (translateX -100%)
- **History Items**: 16px radius, `#111b37` bg, flex row with delete button
- **Delete Button**: Purple gradient with `uvGlow` animation, 8px radius
- **Main Content**: 360px left margin (offset for sidebar), 90px/40px padding, `.full` class reduces margin to 80px
- **Page Title**: 72px, `#11d7ff` cyan
- **Stats Grid**: 4-column CSS Grid with 25px gap
- **Stat Card**: `#001a4d` bg, 24px radius, 40px padding, centered
- **Stat Card h2**: 60px, `#11d7ff` cyan
- **Report Card**: Same bg, 30px radius, 50px padding, centered
- **Grade Title**: 50px
- **Grade Text**: 90px, green (`#31d25c`), bold
- **Review Button**: Full-width, `#11d7ff` cyan bg, 18px radius, 24px bold text

## 4. Data Structure & Persistence
Report data displayed via `.stat-card` and `.report-card` elements. History managed via `.history-item` with delete buttons.

## 5. Logic & Event Handlers
- `.menu-btn` toggles sidebar visibility
- `.history-item` click loads specific report
- `.delete-btn` removes history item
- `.review-btn` navigates to detailed review
- `.sidebar.hidden` toggles sidebar state

## 6. UX & Styling Details
- **Colors**: `#11d7ff` (cyan), `#000814` (dark bg), `#001a4d` (card bg), `#31d25c` (green/grade), `#111b37` (history item bg), `#7c3aed`/`#a855f7` (purple delete button)
- **Key Animations**: `uvGlow` (1.5s, background-position + box-shadow purple glow)
- **Sidebar Transition**: 0.3s ease for show/hide
