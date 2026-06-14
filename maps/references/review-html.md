# Technical Analysis of review.html

## 1. Overview
Question review display for Falcon AI. Shows detailed review of exam/practice questions with answers and explanations. Minimal page with top bar, back navigation, and dynamically populated review container.

## 2. Architecture & Setup
- **DOCTYPE:** HTML5
- **Language:** `en`
- **CSS:** `review.css`
- **Scripts:** `review.js` — Loads and renders review data
- **Meta:** UTF-8, responsive viewport

## 3. Key Features / UI Panels
- **Background:** `.background` div
- **Top Bar:**
  - Logo: `assets/Falcon 1.png`
  - Logo text: "FALCON AI"
- **Back Section:**
  - Back button: `#backBtn` — "← Back To Report"
- **Main Content (`main.main-content`):**
  - Page title: "Question Review"
  - Review container: `#reviewContainer` — Dynamically populated by `review.js`

## 4. Data Structure & Persistence
- Review data loaded by `review.js` (likely from sessionStorage or passed state)
- Review container populated dynamically

## 5. Logic & Event Handlers
- **Back button:** `#backBtn` — Returns to report page
- **Review loading:** `review.js` fetches and renders question review data

## 6. UX & Styling Details
- **Minimal layout:** Top bar, back button, title, and review container
- **Back button:** "← Back To Report" with arrow for clear navigation
- **Review container:** Scrollable area for review cards
