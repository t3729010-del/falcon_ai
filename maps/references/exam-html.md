# Technical Analysis of exam.html

## 1. Overview
Timed MCQ exam interface for Falcon AI. Features exam size selection (15/30/60 questions), a timer, question navigator grid, and navigation controls. Simulates a real examination environment.

## 2. Architecture & Setup
- **DOCTYPE:** HTML5
- **Language:** `en`
- **CSS:** `exam.css`
- **Scripts:** `exam.js` — Exam timer, navigation, submission logic
- **Meta:** UTF-8, responsive viewport

## 3. Key Features / UI Panels
- **Background:** `.background` div
- **Main Content (`main.main-content`):**
  - **Page Title:** "Exam Mode"
  - **Exam Size Container (`.exam-size-container`):**
    - `#btn15` — "15 MCQs"
    - `#btn30` — "30 MCQs"
    - `#btn60` — "60 MCQs"
  - **Exam Layout (`.exam-layout`):**
    - **Question Panel (`.question-panel`):**
      - **Exam Stats (`.exam-stats`):**
        - Timer: `#timer` — "00:00"
        - Answered: `#answeredCount` — "0"
        - Remaining: `#remainingCount` — "0"
      - **Question Card (`.question-card`):**
        - Question number: `#questionNumber` — "Question 1"
        - Question text: `#questionText` — "Loading Question..."
        - Options container: `.options-container` — 4 option divs (A-D)
        - Action buttons: Previous (`#prevBtn`), Next (`#nextBtn`), Submit Exam (`#submitExamBtn`)
    - **Navigator Panel (`.navigator-panel`):**
      - Title: "Question Navigator"
      - Grid: `#navigatorGrid` — Clickable question numbers
      - Legend: 🟧 Current, 🟩 Answered, 🟦 Unanswered

## 4. Data Structure & Persistence
- Timer state tracked in `#timer`
- Answer count tracked in `#answeredCount` and `#remainingCount`
- Navigator grid dynamically generated in `#navigatorGrid`
- Exam report stored in sessionStorage as `"examReport"`

## 5. Logic & Event Handlers
- **Exam size buttons:** `#btn15`, `#btn30`, `#btn60` — Select exam size and start
- **Previous button:** `#prevBtn` — Navigate to previous question
- **Next button:** `#nextBtn` — Navigate to next question
- **Submit exam:** `#submitExamBtn` — End exam and generate report
- **Navigator grid:** Click to jump to specific question
- **Timer:** Countdown managed by `exam.js`

## 6. UX & Styling Details
- **Exam layout:** Two-column layout — question panel (left) + navigator (right)
- **Timer display:** Prominent countdown in exam stats
- **Navigator grid:** Color-coded squares for question status
- **Legend:** Visual reference for grid colors
- **Size selector:** 3 buttons for different exam lengths
