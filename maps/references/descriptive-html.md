# Technical Analysis of descriptive.html

## 1. Overview
Descriptive exam interface for Falcon AI. Provides long-form answer writing with text input or file upload, category selection via sidebar, word/character counting, and timed exam controls.

## 2. Architecture & Setup
- **DOCTYPE:** HTML5
- **Language:** `en`
- **CSS:** `descriptive.css`
- **Scripts:** `descriptive.js` — Answer handling, category management, timer
- **Meta:** UTF-8, responsive viewport

## 3. Key Features / UI Panels
- **Background:** `.background` div
- **Menu Button:** `#menu-btn` (☰) — Toggles sidebar
- **Sidebar (`aside.sidebar`):**
  - Logo: `assets/Falcon 1.png` + "FALCON AI" title
  - Sidebar title: "DESCRIPTIVE EXAM" + "AI Powered Analytical Assessment"
  - Category list (`.category-list`):
    - Artificial Intelligence (active)
    - Physics
    - Mathematics
    - Programming
- **Main Content (`main.main-content`):**
  - **Page Header:** "Descriptive Examination" + "Deep Thinking • Research • Analysis"
  - **Question Card (`.question-card`):**
    - Question number: "Question 4"
    - Question text: "Explain the impact of Artificial Intelligence on modern education..."
    - **Answer Mode Toggle:** "Write Answer" (active) / "Upload File"
    - **Answer Section:** `<textarea class="answer-box">` — "Write your detailed answer here..."
    - **Upload Section:** File input (`.pdf, .doc, .docx`) + format note
    - **Exam Stats:** Words: 0, Characters: 0, Time Remaining: 45:00
    - **Action Buttons:** Previous, Save Draft, Submit Answer (`.submit-btn`), Next

## 4. Data Structure & Persistence
- Answer content in textarea
- Word/character counts updated in real-time
- Timer countdown in exam stats
- Category selection stored by `descriptive.js`

## 5. Logic & Event Handlers
- **Menu button:** `#menu-btn` toggles sidebar visibility
- **Category buttons:** Switch active exam category
- **Answer mode toggle:** Switches between textarea and file upload
- **Textarea input:** Updates word/character counts
- **File input:** Accepts PDF, DOC, DOCX files
- **Save Draft:** Saves current answer without submission
- **Submit Answer:** Submits current question answer
- **Previous/Next:** Navigate between questions

## 6. UX & Styling Details
- **Category active state:** `.active-category` class on selected category
- **Answer mode active:** `.active-mode` class on selected mode
- **Stats bar:** Real-time word, character, and time display
- **Action buttons:** Previous, Save Draft, Submit (highlighted), Next layout
- **Upload note:** "Supported formats: PDF, DOC, DOCX" guidance text
