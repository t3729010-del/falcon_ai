# Technical Analysis of report.html

## 1. Overview
Report center for Falcon AI. Displays quiz results with stats (correct/incorrect/unattempted/percentage), grade display, review button, and a sidebar with report history.

## 2. Architecture & Setup
- **DOCTYPE:** HTML5
- **Language:** `en`
- **CSS:** `report.css`
- **Scripts:** `report.js` — Report loading, history management
- **Meta:** UTF-8, responsive viewport

## 3. Key Features / UI Panels
- **Background:** `.background` div
- **Top Bar:**
  - Menu button: `#menuBtn` (☰)
  - Logo: `assets/Falcon 1.png` + "FALCON AI" text
- **Sidebar (`aside.sidebar`):**
  - Title: "Report History"
  - History list: `#historyList` — Past report entries
- **Main Content (`main.main-content`):**
  - **Page Title:** "Report Center"
  - **Stats Grid (`.stats-grid`):**
    - Correct: `#correctCount` (default 0)
    - Incorrect: `#incorrectCount` (default 0)
    - Unattempted: `#unattemptedCount` (default 0)
    - Percentage: `#percentageCount` (default 0%)
  - **Report Card (`.report-card`):**
    - Grade title: "Grade"
    - Grade display: `#gradeText` — "A"
    - Review button: `#reviewBtn` — "Review Questions"

## 4. Data Structure & Persistence
- Report data loaded by `report.js` (likely from sessionStorage or localStorage)
- History list populated from stored reports
- Grade computed from percentage

## 5. Logic & Event Handlers
- **Menu button:** `#menuBtn` toggles sidebar
- **Review button:** `#reviewBtn` navigates to question review
- **History list:** Click to load previous report
- **Report loading:** `report.js` populates all stat fields

## 6. UX & Styling Details
- **Stats grid:** 4-card horizontal layout for key metrics
- **Report card:** Centered card with prominent grade display
- **Grade styling:** Large, highlighted grade letter
- **Review button:** Primary action CTA
- **Sidebar history:** Scrollable list of past reports
