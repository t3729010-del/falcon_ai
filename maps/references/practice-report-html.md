# Technical Analysis of practice-report.html

## 1. Overview
Practice session report for Falcon AI. Displays stats (attempted/correct/incorrect/accuracy) and provides review cards for incorrect questions with explanations. Reads data from sessionStorage.

## 2. Architecture & Setup
- **DOCTYPE:** HTML5
- **Language:** `en`
- **CSS:** `practice-report.css`
- **Scripts:** Inline `<script>` tag — Reads from `sessionStorage.getItem("practiceReport")`
- **Meta:** UTF-8, responsive viewport

## 3. Key Features / UI Panels
- **Space Background:** `.space-bg` div
- **Report Container (`.report-container`):**
  - **Title:** "Practice Session Report"
  - **Stats Grid (`.stats-grid`):**
    - Attempted: `#attemptedCount` (default 0)
    - Correct: `#correctCount` (default 0)
    - Incorrect: `#incorrectCount` (default 0)
    - Accuracy: `#accuracyCount` (default 0%)
  - **Review Section (`.review-section`):**
    - Title: "Incorrect Questions Review"
    - Container: `#reviewContainer` — Dynamically populated review cards
  - **Action Buttons (`.report-buttons`):**
    - "Practice Again" → `practice.html`
    - "Back to MCQ Dashboard" → `mcq.html`

## 4. Data Structure & Persistence
- **Storage key:** `sessionStorage` → `"practiceReport"`
- **Expected JSON shape:**
  ```json
  {
    "attempted": number,
    "correct": number,
    "incorrect": number,
    "accuracy": number,
    "incorrectQuestions": [
      {
        "question": string,
        "userAnswer": string,
        "correctAnswer": string,
        "explanation": string
      }
    ]
  }
  ```
- **Review cards:** Generated via template literals with `innerHTML +=`

## 5. Logic & Event Handlers
- **Data load:** `JSON.parse(sessionStorage.getItem("practiceReport"))` on page load
- **DOM updates:** Sets textContent for stats cards
- **Review generation:** `report.incorrectQuestions.forEach()` iterates and renders review cards
- **Review card content:** Question, user answer, correct answer, explanation
- **Practice Again:** Navigates to `practice.html`
- **Back to Dashboard:** Navigates to `mcq.html`

## 6. UX & Styling Details
- **Stats grid:** 4-card horizontal layout for practice metrics
- **Review cards:** Individual cards per incorrect question with Q&A and explanation
- **Button layout:** Two side-by-side action buttons
- **Space theme:** `.space-bg` background element
