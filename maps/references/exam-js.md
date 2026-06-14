# Technical Analysis of exam.js

## 1. Overview

`exam.js` (511 lines) implements the timed MCQ exam mode. Users select 15, 30, or 60 questions, then take a timed exam with a question navigator, live stats, and auto-submission on timeout. It supports free navigation between questions, answer persistence during the session, and generates a detailed report with review data on submission.

## 2. Architecture & Setup

### Global State
```javascript
let allQuestions = [];
let examQuestions = [];
let currentQuestion = 0;
let selectedAnswers = {};
let examSize = 15;
let timeRemaining = 0;
let timerInterval = null;
let correctAnswers = 0;
let incorrectAnswers = 0;
let unattemptedAnswers = 0;
```

### Initialization
- Three size buttons (15/30/60) bound to `startExam(size)`
- No auto-start; user must click a size button

## 3. Key Features / UI Panels

### Exam Size Selection
```javascript
document.getElementById("btn15").addEventListener("click", () => startExam(15));
document.getElementById("btn30").addEventListener("click", () => startExam(30));
document.getElementById("btn60").addEventListener("click", () => startExam(60));
```

### startExam(size)
```javascript
async function startExam(size)
```
- Sets `examSize`, reads `currentQuizId` from SessionStorage/LocalStorage
- If no quiz ID: reads `selectedMaterials` from LocalStorage, generates quiz via `POST /generate_selected_quiz`
- Fetches `GET /mcq_questions/{quizId}`, slices to `examSize`
- Initializes state, generates navigator, shows first question, starts timer
- Hides `.exam-size-container`

### generateNavigator()
```javascript
function generateNavigator()
```
- Creates numbered buttons in `#navigatorGrid`
- Each button navigates to that question on click
- Calls `updateNavigator()` for visual states

### showQuestion()
```javascript
function showQuestion()
```
- Renders question number, text, and 4 options
- Restores previously selected answer from `selectedAnswers[currentQuestion]`
- Binds option click handlers that update `selectedAnswers`, refresh UI

### updateStats()
```javascript
function updateStats()
```
- Counts answered questions from `selectedAnswers` keys
- Updates `#answeredCount` and `#remainingCount`

### updateNavigator()
```javascript
function updateNavigator()
```
- Updates navigator button classes:
  - `.current` — currently displayed question
  - `.answered` — has a selected answer
  - `.unanswered` — no answer selected

### startTimer()
```javascript
function startTimer()
```
- Sets `timeRemaining = examSize * 60` (seconds)
- Updates `#timer` display every second (M:SS format)
- Auto-submits when timer reaches 0

### Navigation
```javascript
document.getElementById("prevBtn").addEventListener("click", () => {
    if (currentQuestion > 0) { currentQuestion--; showQuestion(); updateNavigator(); }
});
document.getElementById("nextBtn").addEventListener("click", () => {
    if (currentQuestion < examQuestions.length - 1) { currentQuestion++; showQuestion(); updateNavigator(); }
});
```

### submitExam()
```javascript
function submitExam()
```
- Stops timer
- Counts correct/incorrect/unattempted by comparing `selectedAnswers` to `correct_answer`
- Calculates percentage
- Saves to SessionStorage:
  - `examReport`: `{total, correct, incorrect, unattempted, percentage}`
  - `examReviewData`: Array of `{question, selectedAnswer, correctAnswer, explanation, isCorrect, unattempted}`
- POST to `/save_report` with `{type: "exam", ...}`
- Redirects to `report.html`

## 4. Data Structure & Persistence

### LocalStorage Keys
| Key | Type | Description |
|-----|------|-------------|
| `currentQuizId` | `string` | Quiz ID (fallback read, write on generation) |
| `selectedMaterials` | `number[]` | Material IDs for quiz generation |

### SessionStorage Keys
| Key | Type | Description |
|-----|------|-------------|
| `currentQuizId` | `string` | Quiz ID (primary read/write) |
| `examReport` | `{total, correct, incorrect, unattempted, percentage}` | Exam results |
| `examReviewData` | `[{question, selectedAnswer, correctAnswer, explanation, isCorrect, unattempted}]` | Review data |

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/generate_selected_quiz` | Generate quiz (if no quiz ID exists) |
| GET | `/mcq_questions/{quizId}` | Fetch quiz questions |
| POST | `/save_report` | Save exam report to backend |

### Report Payload
```json
{
    "type": "exam",
    "total": 30,
    "correct": 25,
    "incorrect": 3,
    "unattempted": 2,
    "percentage": 83.3
}
```

## 5. Logic & Event Handlers

| Function | Trigger | Behavior |
|----------|---------|----------|
| `startExam(size)` | 15/30/60 button click | Generates or loads quiz, initializes exam |
| `generateNavigator()` | After exam start | Creates question navigator grid |
| `showQuestion()` | Navigation, option click | Renders current question and options |
| `updateStats()` | After answer selection | Updates answered/remaining counts |
| `updateNavigator()` | After navigation/answer | Updates navigator button visual states |
| `startTimer()` | After exam start | Countdown timer, auto-submits at 0 |
| `submitExam()` | Timer expiry / submit button | Calculates results, saves report, redirects |
| Prev button handler | Click | Moves to previous question |
| Next button handler | Click | Moves to next question |
| Submit exam button handler | Click | Triggers `submitExam()` |

## 6. UX & Styling Details

### Timer
- Format: `M:SS` (e.g., "14:59")
- Displayed in `#timer` element

### Navigator Button States
- `.current` — Current question
- `.answered` — Question has selected answer
- `.unanswered` — No answer selected

### Option Selection
- Selected option gets `.selected` class
- Persists when navigating away and back

### Exam Size Container
- Hidden after exam starts via `style.display = "none"`

### Statistics
- `#answeredCount`: Questions with selected answers
- `#remainingCount`: Questions without answers
