# Technical Analysis of descriptive.js

## 1. Overview

`descriptive.js` (129 lines) implements a descriptive exam interface with text/file upload modes, a countdown timer, word/character counting, category selection, draft saving, and answer submission. It supports a 45-minute timer, Ctrl+S keyboard shortcut for quick save, and persists drafts via LocalStorage.

## 2. Architecture & Setup

### DOM References
```javascript
const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");
const answerBox = document.querySelector(".answer-box");
const uploadSection = document.querySelector(".upload-section");
const writeBtn = document.querySelectorAll(".mode-btn")[0];
const uploadBtn = document.querySelectorAll(".mode-btn")[1];
const fileInput = document.querySelector(".upload-section input");
const categories = document.querySelectorAll(".category");
const wordsDisplay = document.querySelector(".exam-stats div:nth-child(1)");
const charsDisplay = document.querySelector(".exam-stats div:nth-child(2)");
const timerDisplay = document.querySelector(".exam-stats div:nth-child(3)");
const actionBtns = document.querySelectorAll(".action-btn");
const prevBtn = actionBtns[0];
const saveBtn = actionBtns[1];
const submitBtn = actionBtns[2];
const nextBtn = actionBtns[3];
```

### Timer State
```javascript
let timerMinutes = 45;
let timerSeconds = 0;
let timerInterval;
```

### Initialization
```javascript
// Load saved draft
const savedDraft = localStorage.getItem("descriptiveDraft");
if (savedDraft) {
    answerBox.value = savedDraft;
    answerBox.dispatchEvent(new Event("input"));
}
startTimer();
```

## 3. Key Features / UI Panels

### Sidebar Toggle
```javascript
menuBtn.addEventListener("click", () => sidebar.classList.toggle("sidebar-hidden"));
```

### Answer Box Input Handler
```javascript
answerBox.addEventListener("input", () => {
    const text = answerBox.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    wordsDisplay.textContent = `Words: ${words}`;
    charsDisplay.textContent = `Characters: ${chars}`;
});
```
- Live word and character count updates

### Timer
```javascript
function startTimer() {
    timerInterval = setInterval(() => {
        if (timerSeconds === 0) {
            if (timerMinutes === 0) {
                clearInterval(timerInterval);
                timerDisplay.textContent = "Time Remaining: 00:00";
                alert("Time is up! Your exam will be submitted.");
                return;
            }
            timerMinutes--;
            timerSeconds = 59;
        } else {
            timerSeconds--;
        }
        timerDisplay.textContent = `Time Remaining: ${mm}:${ss}`;
    }, 1000);
}
```
- 45-minute countdown
- Auto-alerts on expiry (does not auto-submit)

### Write/Upload Mode Toggle
```javascript
writeBtn.addEventListener("click", () => {
    writeBtn.classList.add("active-mode");
    uploadBtn.classList.remove("active-mode");
    answerBox.style.display = "";
    uploadSection.style.display = "none";
});
uploadBtn.addEventListener("click", () => {
    uploadBtn.classList.add("active-mode");
    writeBtn.classList.remove("active-mode");
    answerBox.style.display = "none";
    uploadSection.style.display = "block";
});
```
- Write mode: shows textarea
- Upload mode: shows file input section

### File Input
```javascript
fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            answerBox.value = ev.target.result;
            answerBox.dispatchEvent(new Event("input"));
        };
        if (file.type === "text/plain") {
            reader.readAsText(file);
        } else {
            alert("File selected: " + file.name + " (" + (file.size / 1024).toFixed(1) + " KB)");
        }
    }
});
```
- Text files: content loaded into answer box
- Other files: shows name and size alert

### Category Selection
```javascript
categories.forEach((cat) => {
    cat.addEventListener("click", () => {
        categories.forEach((c) => c.classList.remove("active-category"));
        cat.classList.add("active-category");
    });
});
```
- Single-select, `.active-category` class

### Save Draft
```javascript
saveBtn.addEventListener("click", () => {
    const text = answerBox.value.trim();
    if (!text) { alert("Write an answer before saving."); return; }
    localStorage.setItem("descriptiveDraft", text);
    alert("Draft saved successfully!");
});
```

### Submit
```javascript
submitBtn.addEventListener("click", () => {
    const text = answerBox.value.trim();
    if (!text) { alert("Please write an answer before submitting."); return; }
    if (confirm("Are you sure you want to submit your answer?")) {
        clearInterval(timerInterval);
        localStorage.setItem("descriptiveAnswer", text);
        alert("Answer submitted successfully!");
    }
});
```
- Confirmation dialog before submission
- Stops timer, saves answer to LocalStorage

### Ctrl+S Shortcut
```javascript
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        saveBtn.click();
    }
});
```
- Prevents browser save dialog, triggers save draft

## 4. Data Structure & Persistence

### LocalStorage Keys
| Key | Type | Description |
|-----|------|-------------|
| `descriptiveDraft` | `string` | Saved draft text (restored on page load) |
| `descriptiveAnswer` | `string` | Submitted answer text |

### SessionStorage Keys
None.

### API Endpoints
None (descriptive.js is purely client-side).

## 5. Logic & Event Handlers

| Function | Trigger | Behavior |
|----------|---------|----------|
| `startTimer()` | Page load | Starts 45-minute countdown |
| Answer box input handler | Text input | Updates word/character counts |
| Write mode handler | Click | Shows textarea, hides upload |
| Upload mode handler | Click | Shows file input, hides textarea |
| File input handler | File selected | Loads text file content or shows alert |
| Category handler | Click | Sets active category |
| Save draft handler | Click | Saves draft to LocalStorage |
| Submit handler | Click | Confirms, stops timer, saves answer |
| Ctrl+S handler | Keydown | Triggers save draft |
| Menu toggle handler | Click | Toggles sidebar |

## 6. UX & Styling Details

### Timer Display
- Format: "Time Remaining: MM:SS"
- Starts at 45:00

### Mode Toggle
- Active mode: `.active-mode` class on button
- Write mode: answer box visible, upload hidden
- Upload mode: upload section visible, answer box hidden

### Statistics Display
- Words count: `exam-stats div:nth-child(1)`
- Characters count: `exam-stats div:nth-child(2)`
- Timer: `exam-stats div:nth-child(3)`

### Action Buttons
- Prev, Save, Submit, Next (indexed from `.action-btn` NodeList)
