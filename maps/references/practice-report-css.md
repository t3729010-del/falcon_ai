# Technical Analysis of practice-report.css

## 1. Overview
Stylesheet for the Practice Report display (79 lines). Shows practice session results with statistics, review cards for incorrect answers, and action buttons.

## 2. Architecture & Setup
- **Body**: `#020617` background
- **Space Background**: Fixed gradient (`#030712` → `#0a1628` → `#030712`) at 0.15 opacity

## 3. Key Features / UI Panels
- **Space Background**: Fixed gradient at low opacity
- **Report Container**: 90% width, 1400px max-width, centered, 40px padding
- **Report Title**: 60px, `#00d4ff` cyan, 40px margin-bottom
- **Stats Grid**: 4-column CSS Grid with 20px gap, 40px margin-bottom
- **Stat Card**: `#03142f` bg, `#0a335d` border, 20px radius, 30px padding, centered, h2 in cyan (50px)
- **Review Section**: `#03142f` bg, 25px radius, 30px padding
- **Review Card**: `#081c3a` bg, 5px left red border (`#ef4444`), 15px radius, 20px padding, h3 in cyan
- **Report Buttons**: Flex row with 20px gap
- **Buttons**: `#00d4ff` cyan bg, 12px radius, 18px font

## 4. Data Structure & Persistence
Stats displayed in grid cards. Incorrect answers shown in review cards with red border indicator.

## 5. Logic & Event Handlers
- Report buttons navigate to practice/exam modes
- Review cards are display-only

## 6. UX & Styling Details
- **Colors**: `#00d4ff` (cyan), `#020617` (dark bg), `#03142f` (card bg), `#0a335d` (card border), `#ef4444` (red review border), `#081c3a` (review card bg)
- **No custom animations** - static display
- **Card Border**: Review cards use 5px left border to indicate incorrect answers
