# Technical Analysis of mcq.js

## 1. Overview

`mcq.js` (118 lines) is the MCQ mode selector page. It provides two buttons — Practice and Exam — that trigger quiz generation from selected materials and redirect to the appropriate quiz page. It handles material validation, quiz generation via the backend, and stores the quiz ID for downstream pages.

## 2. Architecture & Setup

### DOM References
```javascript
const practiceBtn = document.getElementById("practiceBtn");
const examBtn = document.getElementById("examBtn");
```

### State
- No global state variables; relies on LocalStorage and SessionStorage for quiz ID persistence

## 3. Key Features / UI Panels

### generateQuiz(questionCount, btn, originalText)
```javascript
async function generateQuiz(questionCount, btn, originalText)
```
- Reads `selectedMaterials` from LocalStorage
- Validates at least one material is selected (alerts if empty)
- Sets button to "Generating..." state with `.generating` class, disabled
- POST to `/generate_selected_quiz` with `{material_ids, question_count}`
- On success: stores `quiz_id` in both SessionStorage and LocalStorage as `currentQuizId`
- On failure: restores button text, shows error alert
- Returns `quiz_id` or `null`

### Practice Button
```javascript
practiceBtn.addEventListener("click", async function() {
    const quizId = await generateQuiz(undefined, btn, "Start Practice");
    if (quizId) window.location.href = "practice.html";
});
```
- `question_count` is `undefined` (backend default)

### Exam Button
```javascript
examBtn.addEventListener("click", async function() {
    const quizId = await generateQuiz(50, btn, "Start Exam");
    if (quizId) window.location.href = "exam.html";
});
```
- `question_count` is `50`

## 4. Data Structure & Persistence

### LocalStorage Keys
| Key | Type | Description |
|-----|------|-------------|
| `currentQuizId` | `string` | ID of the generated quiz |
| `selectedMaterials` | `number[]` | Array of material IDs (read-only here) |

### SessionStorage Keys
| Key | Type | Description |
|-----|------|-------------|
| `currentQuizId` | `string` | ID of the generated quiz |

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/generate_selected_quiz` | Generate quiz from selected materials |

### Request Body
```json
{
    "material_ids": [1, 2, 3],
    "question_count": 50
}
```

### Response
```json
{
    "success": true,
    "quiz_id": "abc123"
}
```

## 5. Logic & Event Handlers

| Function | Trigger | Behavior |
|----------|---------|----------|
| `generateQuiz(count, btn, text)` | Practice/Exam button click | Validates materials, generates quiz, stores ID |
| Practice button handler | Click | Generates quiz (default count), redirects to practice.html |
| Exam button handler | Click | Generates quiz (50 questions), redirects to exam.html |

## 6. UX & Styling Details

### Button States
- Default: Original text ("Start Practice" / "Start Exam")
- Generating: Text changes to "Generating...", `.generating` class added, button disabled
- On error: Restored to original state

### Validation
- Alert shown if `selectedMaterials` is empty: "Please select materials first."
- Alert shown on API error with error message and backend reminder
