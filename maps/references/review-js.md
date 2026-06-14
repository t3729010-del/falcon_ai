# Technical Analysis of review.js

## 1. Overview

`review.js` (168 lines) displays a detailed question-by-question review after a practice or exam session. It merges data from both practice and exam SessionStorage sources, renders review cards with correct/wrong/unattempted states, and provides explanations for each answer.

## 2. Architecture & Setup

### DOM References
```javascript
// #backBtn — navigates back to report.html
// #reviewContainer — container for review cards
```

### State
```javascript
const practiceData = JSON.parse(sessionStorage.getItem("reviewData")) || [];
const examData = JSON.parse(sessionStorage.getItem("examReviewData")) || [];
const allData = [
    ...practiceData.map(d => ({...d, source: "Practice"})),
    ...examData.map(d => ({...d, source: "Exam"}))
];
```

### Initialization
- Data loading and rendering happen in a try/catch block at file scope

## 3. Key Features / UI Panels

### Back Button
```javascript
document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "report.html";
});
```

### Data Merging
- Practice data gets `source: "Practice"` field
- Exam data gets `source: "Exam"` field
- Combined into single `allData` array

### Review Card Rendering
For each item in `allData`:
```javascript
// Card structure:
// - .card-header: source badge + question number
// - .question-text: the question
// - .answer-row: user's answer with status icon
// - .answer-row.correct-answer: correct answer
// - .explanation-box: why the answer is correct/incorrect
```

### Answer State Logic
```javascript
if (item.unattempted) {
    answerClass = "unattempted-answer";
    statusIcon = "warning";
    reason = "Correct answer was {correctAnswer}. {explanation}";
} else if (item.isCorrect) {
    answerClass = "correct-answer";
    statusIcon = "check";
    reason = "{correctAnswer} is correct because: {explanation}";
} else {
    answerClass = "wrong-answer";
    statusIcon = "x";
    reason = "You selected {selectedAnswer} but the correct answer is {correctAnswer}. {explanation}";
}
```

### Empty State
```javascript
if (allData.length === 0) {
    reviewContainer.innerHTML = `<div class="empty-state">
        No review data found. Complete a practice or exam session first.
    </div>`;
}
```

### Error Handling
```javascript
} catch(error) {
    document.getElementById("reviewContainer").innerHTML = `<div class="empty-state">
        Error loading review data. Please try again.
    </div>`;
}
```

## 4. Data Structure & Persistence

### LocalStorage Keys
None.

### SessionStorage Keys
| Key | Type | Description |
|-----|------|-------------|
| `reviewData` | `[{question, selectedAnswer, correctAnswer, explanation, isCorrect}]` | Practice review data |
| `examReviewData` | `[{question, selectedAnswer, correctAnswer, explanation, isCorrect, unattempted}]` | Exam review data |

### API Endpoints
None (purely client-side rendering from SessionStorage).

## 5. Logic & Event Handlers

| Function | Trigger | Behavior |
|----------|---------|----------|
| Back button handler | Click | Navigates to report.html |
| Data merge (top-level) | Page load | Combines practice + exam data |
| Card rendering (top-level) | Page load | Creates review cards for each question |
| Empty state check | Page load | Shows message if no review data |
| Error handler | Page load | Shows error message on exception |

## 6. UX & Styling Details

### Review Card Structure
- `.review-card` class for each question

### Source Badges
- `.source-badge` with `.badge-practice` or `.badge-exam` modifier
- Displayed in `.card-header`

### Answer States
- `.correct-answer`: Green styling for correct answers
- `.wrong-answer`: Red styling for incorrect answers
- `.unattempted-answer`: Warning styling for unattempted questions

### Status Icons
- Correct: checkmark icon
- Wrong: X icon
- Unattempted: warning icon

### Explanation Box
- `.explanation-box` with `.explanation-title` and `.explanation-text`
- Title varies by state: "Why This Is Correct", "Explanation", or "Why Your Answer Was Wrong"
