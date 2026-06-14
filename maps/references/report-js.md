# Technical Analysis of report.js

## 1. Overview

`report.js` (285 lines) implements the report center page. It displays quiz results (practice or exam) with correct/incorrect/unattempted counts, percentage, and a letter grade. It provides a review button to navigate to detailed question review, loads report history from the backend, and supports deleting individual reports.

## 2. Architecture & Setup

### DOM References
```javascript
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const mainContent = document.getElementById("mainContent");
const historyList = document.getElementById("historyList");
```

### State
```javascript
const practiceReport = JSON.parse(sessionStorage.getItem("practiceReport"));
const examReport = JSON.parse(sessionStorage.getItem("examReport"));
```

### Initialization
```javascript
// Display current report (practice or exam)
// loadHistory() fetches and renders history sidebar
loadHistory();
```

## 3. Key Features / UI Panels

### Menu Toggle
```javascript
menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("hidden");
    mainContent.classList.toggle("full");
});
```

### Current Report Display
- Priority: `practiceReport` > `examReport`
- Populates `#correctCount`, `#incorrectCount`, `#unattemptedCount`, `#percentageCount`
- Calls `setGrade()` for letter grade

### Practice Report Display
```javascript
if (practiceReport) {
    document.getElementById("correctCount").textContent = practiceReport.correct;
    document.getElementById("incorrectCount").textContent = practiceReport.incorrect;
    document.getElementById("unattemptedCount").textContent = 0;
    document.getElementById("percentageCount").textContent = practiceReport.accuracy + "%";
    setGrade(parseFloat(practiceReport.accuracy));
}
```

### Exam Report Display
```javascript
else if (examReport) {
    document.getElementById("correctCount").textContent = examReport.correct;
    document.getElementById("incorrectCount").textContent = examReport.incorrect;
    document.getElementById("unattemptedCount").textContent = examReport.unattempted;
    document.getElementById("percentageCount").textContent = examReport.percentage + "%";
    setGrade(parseFloat(examReport.percentage));
}
```

### setGrade(score)
```javascript
function setGrade(score)
```
- Maps numeric score to letter grade:
  - 90+ = A+
  - 80+ = A
  - 70+ = B
  - 60+ = C
  - 50+ = D
  - Below 50 = F
- Updates `#gradeText` element

### Review Button
```javascript
document.getElementById("reviewBtn").addEventListener("click", () => {
    window.location.href = "review.html";
});
```

### loadHistory()
```javascript
async function loadHistory()
```
- Fetches `GET /reports`
- Renders history items with:
  - Label: "Practice" or "Exam" based on `report.type`
  - Session number (descending order)
  - Percentage display
  - Delete button
- Click on history item updates the main report display

### deleteReport(id, element)
```javascript
async function deleteReport(id, element)
```
- `DELETE /delete_report/{id}`
- Removes the history item element from DOM

## 4. Data Structure & Persistence

### LocalStorage Keys
None.

### SessionStorage Keys
| Key | Type | Description |
|-----|------|-------------|
| `practiceReport` | `{attempted, correct, incorrect, accuracy, incorrectQuestions}` | Practice results |
| `examReport` | `{total, correct, incorrect, unattempted, percentage}` | Exam results |

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/reports` | Fetch all saved reports |
| DELETE | `/delete_report/{id}` | Delete a specific report |

## 5. Logic & Event Handlers

| Function | Trigger | Behavior |
|----------|---------|----------|
| Menu toggle handler | Click | Toggles sidebar visibility |
| `setGrade(score)` | After report display | Converts percentage to letter grade |
| Review button handler | Click | Navigates to review.html |
| `loadHistory()` | Page load, after delete | Fetches and renders report history |
| `deleteReport(id, el)` | Delete button click | Deletes report from backend and DOM |
| History item click handler | Click | Displays that report's stats in main view |

## 6. UX & Styling Details

### Grade Display
- `#gradeText` shows letter grade (A+, A, B, C, D, F)

### Report Stats
- `#correctCount`: Correct answers
- `#incorrectCount`: Incorrect answers
- `#unattemptedCount`: Unattempted (0 for practice)
- `#percentageCount`: Percentage with % suffix

### History Items
- `.history-item` class with `.history-info` span and `.delete-btn` button
- Practice sessions labeled "Practice Session #N"
- Exam sessions labeled "Exam Session #N"
- Delete button: "✕" character

### Layout
- Sidebar: `.hidden` class toggle
- Main content: `.full` class toggle
