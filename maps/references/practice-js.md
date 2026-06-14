# Technical Analysis of practice.js

## 1. Overview

`practice.js` (349 lines) implements the Practice MCQ quiz mode. It presents questions one at a time with instant feedback (correct/incorrect + explanation), tracks statistics (attempted/correct/incorrect), and generates a report on completion. It supports stopping early or finishing all questions.

## 2. Architecture & Setup

### Global State
```javascript
let questions = [];
let currentQuestion = 0;
let attempted = 0;
let correct = 0;
let incorrect = 0;
let selectedAnswer = null;
let answeredCurrentQuestion = false;
let incorrectQuestions = [];
let userAnswers = [];
```

### Initialization
```javascript
loadQuestions();
```

## 3. Key Features / UI Panels

### loadQuestions()
```javascript
async function loadQuestions()
```
- Reads `currentQuizId` from SessionStorage (fallback to LocalStorage)
- Fetches `GET /mcq_questions/{quizId}`
- Validates questions exist, calls `showQuestion()`
- Error handling: displays message in `#questionText`

### showQuestion()
```javascript
function showQuestion()
```
- Resets `answeredCurrentQuestion` to false
- Enables submit button
- If `currentQuestion >= questions.length`, calls `showReport()`
- Sets `#questionNumber` to "Question N"
- Populates `#questionText` and 4 `.option` elements (A/B/C/D)
- Clears option styles and resets `selectedAnswer`
- Saves current `userAnswers` to SessionStorage `reviewData`

### Option Click Handlers
```javascript
document.querySelectorAll(".option").forEach((option, index) => {
    option.addEventListener("click", () => {
        // Remove selected from all, add to clicked
        selectedAnswer = ["A","B","C","D"][index];
    });
});
```

### Submit Handler
```javascript
document.querySelector(".submit-btn").addEventListener("click", () => {
    // Guard: skip if already answered or no selection
    // Record attempt, push to userAnswers[]
    // Color feedback: #22c55e (correct) / #ef4444 (incorrect)
    // Show explanation in #feedbackText
    // Update counters in #attemptedCount, #correctCount, #incorrectCount
    // Disable submit button
});
```

### Next Handler
```javascript
document.querySelector(".next-btn").addEventListener("click", () => {
    currentQuestion++;
    showQuestion();
});
```

### Stop Handler
```javascript
document.getElementById("stopBtn").addEventListener("click", showReport);
```

### showReport()
```javascript
function showReport()
```
- Calculates accuracy: `((correct / attempted) * 100).toFixed(1)`
- Saves to SessionStorage:
  - `practiceReport`: `{attempted, correct, incorrect, accuracy, incorrectQuestions}`
  - `reviewData`: `userAnswers[]`
- POST to `/save_report` with `{type: "practice", total, correct, incorrect, unattempted, percentage}`
- Redirects to `report.html`

## 4. Data Structure & Persistence

### LocalStorage Keys
| Key | Type | Description |
|-----|------|-------------|
| `currentQuizId` | `string` | Quiz ID (fallback read) |

### SessionStorage Keys
| Key | Type | Description |
|-----|------|-------------|
| `currentQuizId` | `string` | Quiz ID (primary read) |
| `practiceReport` | `{attempted, correct, incorrect, accuracy, incorrectQuestions}` | Practice results |
| `reviewData` | `[{question, selectedAnswer, correctAnswer, explanation, isCorrect}]` | Question review data |

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/mcq_questions/{quizId}` | Fetch quiz questions |
| POST | `/save_report` | Save practice report to backend |

### Report Payload
```json
{
    "type": "practice",
    "total": 20,
    "correct": 15,
    "incorrect": 3,
    "unattempted": 2,
    "percentage": 75.0
}
```

## 5. Logic & Event Handlers

| Function | Trigger | Behavior |
|----------|---------|----------|
| `loadQuestions()` | Page load | Fetches questions from backend |
| `showQuestion()` | Page load, next click, option click | Renders current question |
| Option click handlers | Click | Selects answer, updates UI |
| Submit handler | Click | Validates, records answer, shows feedback |
| Next handler | Click | Advances to next question |
| Stop handler | Click | Generates report early |
| `showReport()` | All questions done / stop | Calculates stats, saves report, redirects |

## 6. UX & Styling Details

### Feedback Colors
- Correct answer: `#22c55e` (green background)
- Incorrect answer: `#ef4444` (red background), correct option shown in green

### Feedback Text
- Correct: "✅ Correct! {explanation}"
- Incorrect: "❌ Incorrect. {explanation}"

### Statistics Display
- `#attemptedCount`: Total questions attempted
- `#correctCount`: Correct answers
- `#incorrectCount`: Incorrect answers

### Option States
- Default: No background
- Selected: `.selected-option` class
- After submit: Background colored based on correctness
