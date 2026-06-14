# Technical Analysis of quiz-materials.html

## 1. Overview
Upload study materials page for Falcon AI quiz generation. Allows users to upload PDFs, slides, notes, and images, then generates quizzes. Features a sidebar with material type categories and a processing indicator.

## 2. Architecture & Setup
- **DOCTYPE:** HTML5
- **Language:** `en`
- **CSS:** `quiz-materials.css`
- **Scripts:** `quiz-materials.js` — Upload handling, material management
- **Meta:** UTF-8, responsive viewport

## 3. Key Features / UI Panels
- **Space Background:** `.space-bg` div
- **Sidebar (`aside.sidebar`):**
  - **Sidebar Header:** Menu button (☰) + Logo area (`assets/Falcon 1.png` + "FALCON AI" text)
  - **Category Section:** 5 material type buttons — PDF Notes (active), Lecture Slides, Assignments, Research Papers, Images & Screenshots
  - **AI Status:** "Falcon AI Status" heading + status text + `.status-light` indicator
- **Main Content (`main.main-content`):**
  - **Hero Section:** Title "Upload Learning Materials" + description
  - **Upload Section:**
    - **Drop Zone (`.upload-box`):** Upload icon (⬆), "Drag & Drop Files" heading, file type description, "Choose Files" button with hidden `#fileInput` (multiple)
    - **AI Processing Card:** "AI Processing" heading, description, `.processing-bar` with `.processing-fill`, "Neural analysis initializing..." text
  - **Material History:** "Recent Materials" heading with `#materialCount` span, `.history-grid` container
  - **Action Buttons:** "Start MCQ Quiz" (`<a href="mcq.html">`) + "Start Descriptive Quiz" (`<a href="descriptive.html">`)

## 4. Data Structure & Persistence
- Material history stored in `.history-grid` (populated by JS)
- File input supports multiple files
- Material count displayed via `#materialCount`

## 5. Logic & Event Handlers
- **Category buttons:** Filter materials by type
- **File input:** `#fileInput` accepts files on click
- **Drag & drop:** `.upload-box` handles drag events
- **MCQ link:** Navigates to `mcq.html`
- **Descriptive link:** Navigates to `descriptive.html`
- **Processing bar:** Animates during AI analysis

## 6. UX & Styling Details
- **Upload icon:** Large ⬆ arrow for visual clarity
- **Processing animation:** `.processing-fill` expands within `.processing-bar`
- **Status light:** `.status-light` provides visual AI readiness indicator
- **History grid:** Grid layout for uploaded material cards
- **Category active state:** `.active` class on PDF Notes button
