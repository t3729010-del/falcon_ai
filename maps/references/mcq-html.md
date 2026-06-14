# Technical Analysis of mcq.html

## 1. Overview
MCQ mode selector for Falcon AI. Presents two learning modes — Practice Mode (unlimited learning with feedback) and Exam Mode (timed assessment with 15/30/60 questions). Gateway to quiz interfaces.

## 2. Architecture & Setup
- **DOCTYPE:** HTML5
- **Language:** `en`
- **CSS:** `mcq.css`
- **Scripts:** `mcq.js` — Mode selection logic
- **Meta:** UTF-8, responsive viewport
- **Favicon:** `favicon.ico`

## 3. Key Features / UI Panels
- **Background:** `.background` div
- **Container (`.container`):**
  - **Logo Section:** `assets/Falcon 1.png` + "FALCON AI" heading + "MCQ Assessment Center" subtitle
  - **Hero Section:** "Choose Your Learning Mode" heading + descriptive text
  - **Mode Container (`.mode-container`):**
    - **Practice Mode Card:**
      - Icon: 📚
      - Title: "Practice Mode"
      - Feature list: Unlimited learning, Instant feedback, Detailed explanations, Performance report
      - Button: `#practiceBtn` (`.practice-btn`) — "Start Practice"
    - **Exam Mode Card:**
      - Icon: 📝
      - Title: "Exam Mode"
      - Feature list: Timed assessment, 15/30/60 MCQs, Real exam experience, Detailed result analysis
      - Button: `#examBtn` (`.exam-btn`) — "Start Exam"

## 4. Data Structure & Persistence
No data persistence. Mode selection page only.

## 5. Logic & Event Handlers
- **Practice button:** `#practiceBtn` — Navigates to practice mode (handled by `mcq.js`)
- **Exam button:** `#examBtn` — Navigates to exam mode (handled by `mcq.js`)

## 6. UX & Styling Details
- **Mode cards:** Side-by-side cards with icon, title, feature list, and CTA
- **Practice card:** Green-accented CTA (`.practice-btn`)
- **Exam card:** Blue-accented CTA (`.exam-btn`)
- **Feature lists:** Bullet-style `<ul>` with `<li>` items
