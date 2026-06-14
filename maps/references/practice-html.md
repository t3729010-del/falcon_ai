# Technical Analysis of practice.html

## 1. Overview
Practice MCQ quiz interface for Falcon AI. Displays questions with options, tracks attempted/correct/incorrect counts, provides feedback explanations, and supports stopping the session.

## 2. Architecture & Setup
- **DOCTYPE:** HTML5
- **Language:** `en`
- **CSS:** `practice.css`
- **Scripts:** `practice.js` — Quiz logic, scoring, feedback
- **Meta:** UTF-8, responsive viewport

## 3. Key Features / UI Panels
- **Background:** `.background` div
- **Main Content (`main.main-content`):**
  - **Page Title:** "Practice Mode"
  - **Stats Grid (`.stats-grid`):**
    - Attempted: `#attemptedCount` (default 0)
    - Correct: `#correctCount` (default 0)
    - Incorrect: `#incorrectCount` (default 0)
  - **Question Card (`.question-card`):**
    - Question number: `#questionNumber` — "Question 1"
    - Question text: `#questionText` — "Loading Question..."
    - Options container: `#optionsContainer` — 4 option divs (A-D)
    - Action buttons: Submit Answer, Next Question, Stop Session (`#stopBtn`)
  - **Feedback Card (`.feedback-card`):**
    - Title: "Explanation"
    - Feedback text: `#feedbackText` — "Answer a question to receive detailed AI feedback."

## 4. Data Structure & Persistence
- Quiz questions loaded by `practice.js`
- Stats tracked in DOM: `#attemptedCount`, `#correctCount`, `#incorrectCount`
- Feedback rendered in `#feedbackText`
- Session end triggers report generation

## 5. Logic & Event Handlers
- **Submit Answer:** Validates selection and scores
- **Next Question:** Advances to next question
- **Stop Session:** `#stopBtn` ends session and generates report
- **Option selection:** Click handlers on `.option` divs
- **Feedback display:** Shows explanation after answer submission

## 6. UX & Styling Details
- **Stats grid:** 3-card horizontal layout for real-time scoring
- **Question card:** Centered card with number, text, 4 options, and 3 action buttons
- **Feedback card:** Separate card below question with explanation text
- **Option styling:** `.option` divs with hover/selection states
