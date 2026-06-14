# Technical Analysis of exam-report.html

## 1. Overview
Exam report display for Falcon AI. Shows exam results with total questions, correct/incorrect/unattempted counts, percentage, and letter grade. Reads data from sessionStorage. Includes back navigation to exam mode.

## 2. Architecture & Setup
- **DOCTYPE:** HTML5
- **Language:** `en`
- **CSS:** `exam-report.css`
- **Scripts:** Inline `<script>` tag — Reads from `sessionStorage.getItem("examReport")`
- **Meta:** UTF-8, responsive viewport

## 3. Key Features / UI Panels
- **Background:** `.background` div
- **Report Container (`.report-container`):**
  - **Title:** "Exam Report"
  - **Stats Grid (`.stats-grid`):**
    - Total Questions: `#totalQuestions` (default 0)
    - Correct: `#correctAnswers` (default 0)
    - Incorrect: `#incorrectAnswers` (default 0)
    - Unattempted: `#unattemptedAnswers` (default 0)
  - **Score Card (`.score-card`):**
    - "Percentage" heading
    - Percentage display: `#percentage` — "0%"
    - Grade display: `#grade` — "A"
  - **Back Button:** `onclick="window.location.href='exam.html'"` — "Back To Exam Mode"

## 4. Data Structure & Persistence
- **Storage key:** `sessionStorage` → `"examReport"`
- **Expected JSON shape:**
  ```json
  {
    "total": number,
    "correct": number,
    "incorrect": number,
    "unattempted": number,
    "percentage": number
  }
  ```
- **Grade logic (inline):**
  - ≥90: "A+"
  - ≥80: "A"
  - ≥70: "B"
  - ≥60: "C"
  - ≥50: "D"
  - <50: "F"

## 5. Logic & Event Handlers
- **Data load:** `JSON.parse(sessionStorage.getItem("examReport"))` on page load
- **DOM updates:** Sets textContent for `#totalQuestions`, `#correctAnswers`, `#incorrectAnswers`, `#unattemptedAnswers`, `#percentage`, `#grade`
- **Back button:** `onclick="window.location.href='exam.html'"` — Returns to exam mode
- **Grade calculation:** Percentage-based grading in inline script

## 6. UX & Styling Details
- **Stats grid:** 4-card horizontal layout for exam metrics
- **Score card:** Prominent percentage and grade display
- **Grade styling:** Large text for visual emphasis
- **Back button:** Navigation CTA to return to exam
