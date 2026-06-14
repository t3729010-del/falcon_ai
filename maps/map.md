# Falcon AI Frontend - Project Map

## 1. Overview

Falcon AI is an AI-powered educational platform with three core modules:
- **Emotional Supporter** - AI chat with avatar, lip-sync, voice, and audio visualization
- **Interactive Explainer** - Text-based and 3D holographic teaching modes
- **Quiz Assistant** - Upload materials, generate MCQ/descriptive quizzes, take exams, view reports

**Tech Stack:** Vanilla HTML/CSS/JS (no frameworks, no build system)
**Backend:** Python Flask at `http://127.0.0.1:5000`
**Static Server:** Python HTTP server at `http://127.0.0.1:5500`
**Voice Input:** MediaRecorder + Vosk (local speech-to-text, no API key)
**TTS:** Browser SpeechSynthesis API, gated behind voiceMode toggle

---

## 2. Page Navigation Flow

```mermaid
graph TD
    index[index.html<br/>Splash Screen] -->|5.5s timeout| dashboard[dashboard.html<br/>Main Hub]
    
    dashboard -->|Card 1| emotional[emotional.html<br/>Emotional Supporter]
    dashboard -->|Card 2| explainer[explainer.html<br/>Interactive Explainer]
    dashboard -->|Card 3| quiz[quiz-materials.html<br/>Quiz Materials]
    
    emotional -->|Admin link| admin[admin.html<br/>Avatar Diagnostics]
    
    explainer -->|3D Teaching| 3d[3d.html<br/>3D Teaching]
    explainer -->|Text Teaching| text[text.html<br/>Text Teaching]
    
    quiz -->|MCQ Quiz| mcq[mcq.html<br/>MCQ Center]
    quiz -->|Descriptive| descriptive[descriptive.html<br/>Descriptive Exam]
    
    mcq -->|Practice Mode| practice[practice.html<br/>Practice MCQ]
    mcq -->|Exam Mode| exam[exam.html<br/>Exam MCQ]
    
    practice -->|Report| practice-report[practice-report.html<br/>Practice Report]
    exam -->|Report| exam-report[exam-report.html<br/>Exam Report]
    
    practice-report -->|Review| review[review.html<br/>Question Review]
    exam-report -->|Back| exam
    
    practice -->|Stop Session| report[report.html<br/>Report Center]
    report -->|Review| review
    
    style index fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style dashboard fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style emotional fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style explainer fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style quiz fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style 3d fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style text fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style mcq fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style practice fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style exam fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style descriptive fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style report fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style exam-report fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style practice-report fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style review fill:#1a1a2e,stroke:#00d9ff,color:#fff
    style admin fill:#1a1a2e,stroke:#00d9ff,color:#fff
```

---

## 3. Frontend-to-Backend API Routes

```mermaid
graph LR
    subgraph Frontend
        emotional.js
        text.js
        3d.js
        quiz-materials.js
        mcq.js
        practice.js
        exam.js
        descriptive.js
        report.js
        review.js
        admin.js
        browser_avatar.js
    end
    
    subgraph Backend["Backend (Flask :5000)"]
        session["/api/sessions"]
        message["/api/messages"]
        chat["/api/chat"]
        chatstream["/api/chat-stream"]
        transcribe["/api/transcribe"]
        upload["/api/upload"]
        quiz["/api/quiz"]
        report_api["/api/report"]
        avatar_api["/api/avatar"]
        status["/api/status"]
    end
    
    emotional.js -->|CRUD sessions| session
    emotional.js -->|Send/receive messages| message
    emotional.js -->|AI chat| chat
    emotional.js -->|Streaming chat| chatstream
    emotional.js -->|Voice transcription| transcribe
    emotional.js -->|Upload photo| upload
    emotional.js -->|Generate avatar| avatar_api
    
    text.js -->|Session management| session
    text.js -->|AI teaching chat| chat
    text.js -->|Upload files| upload
    
    3d.js -->|Session management| session
    3d.js -->|AI teaching chat| chat
    
    quiz-materials.js -->|Upload materials| upload
    quiz-materials.js -->|List materials| upload
    
    mcq.js -->|Generate quiz| quiz
    practice.js -->|Submit answers| quiz
    practice.js -->|Save report| report_api
    exam.js -->|Submit exam| quiz
    exam.js -->|Save report| report_api
    
    descriptive.js -->|Submit answer| quiz
    
    report.js -->|Load reports| report_api
    report.js -->|Delete reports| report_api
    review.js -->|Load review data| report_api
    
    admin.js -->|Provider status| status
    admin.js -->|Test avatar| avatar_api
    
    browser_avatar.js -->|No backend needed| browser_avatar.js
    
    style Frontend fill:#0a1628,stroke:#00d9ff,color:#fff
    style Backend fill:#1a3a1a,stroke:#00ff88,color:#fff
```

---

## 4. Client-Side Data Flow

```mermaid
graph TD
    subgraph "sessionStorage"
        quiz_data[quizData<br/>MCQ questions + answers]
        exam_report[examReport<br/>exam results]
        practice_report[practiceReport<br/>practice results]
    end
    
    subgraph "localStorage"
        sessions[sessions<br/>emotional/text/3d sessions]
        materials[materials<br/>uploaded file metadata]
        reports[reports<br/>saved quiz reports]
    end
    
    mcq.js -->|store quiz data| quiz_data
    practice.js -->|read quiz data| quiz_data
    exam.js -->|read quiz data| quiz_data
    
    practice.js -->|save practice results| practice_report
    practice-report.html -->|read results| practice_report
    
    exam.js -->|save exam results| exam_report
    exam-report.html -->|read results| exam_report
    
    emotional.js -->|persist sessions| sessions
    text.js -->|persist sessions| sessions
    3d.js -->|persist sessions| sessions
    
    quiz-materials.js -->|store materials| materials
    
    report.js -->|load/save| reports
    
    style sessionStorage fill:#2a1a0a,stroke:#ffaa00,color:#fff
    style localStorage fill:#1a2a0a,stroke:#00ff88,color:#fff
```

---

## 5. Reference Files Index

### HTML Files (15)
| File | Reference | Purpose |
|------|-----------|---------|
| `index.html` | [index-html.md](./references/index-html.md) | Splash/loading screen, redirects to dashboard |
| `dashboard.html` | [dashboard-html.md](./references/dashboard-html.md) | Main hub with 3 feature cards |
| `emotional.html` | [emotional-html.md](./references/emotional-html.md) | Emotional supporter chat + SVG avatar + upload |
| `explainer.html` | [explainer-html.md](./references/explainer-html.md) | Explainer sub-menu (3D or Text) |
| `text.html` | [text-html.md](./references/text-html.md) | Text-based AI teaching chat |
| `3d.html` | [3d-html.md](./references/3d-html.md) | 3D holographic teaching interface |
| `quiz-materials.html` | [quiz-materials-html.md](./references/quiz-materials-html.md) | Upload study materials for quiz generation |
| `mcq.html` | [mcq-html.md](./references/mcq-html.md) | MCQ mode selector (Practice vs Exam) |
| `practice.html` | [practice-html.md](./references/practice-html.md) | Practice MCQ quiz with instant feedback |
| `exam.html` | [exam-html.md](./references/exam-html.md) | Timed MCQ exam (15/30/60 questions) |
| `descriptive.html` | [descriptive-html.md](./references/descriptive-html.md) | Descriptive text/file-based exam |
| `report.html` | [report-html.md](./references/report-html.md) | Report center with grade + history sidebar |
| `exam-report.html` | [exam-report-html.md](./references/exam-report-html.md) | Exam report display (inline script) |
| `practice-report.html` | [practice-report-html.md](./references/practice-report-html.md) | Practice report with review cards (inline script) |
| `review.html` | [review-html.md](./references/review-html.md) | Question review display |
| `admin.html` | [admin-html.md](./references/admin-html.md) | Avatar provider diagnostics dashboard |

### JavaScript Files (12)
| File | Reference | Purpose |
|------|-----------|---------|
| `emotional.js` | [emotional-js.md](./references/emotional-js.md) | Avatar system, lip-sync, TTS, voice input, audio visualizer, sessions, chat |
| `text.js` | [text-js.md](./references/text-js.md) | Text teaching: chat, sessions, copy/examples/quiz/regen, voice, PDF export |
| `3d.js` | [3d-js.md](./references/3d-js.md) | 3D teaching: sessions, visualizer, text/voice chat, speech synthesis |
| `quiz-materials.js` | [quiz-materials-js.md](./references/quiz-materials-js.md) | Material upload (drag & drop), material selection/deletion |
| `mcq.js` | [mcq-js.md](./references/mcq-js.md) | Quiz generation via backend API, mode routing |
| `practice.js` | [practice-js.md](./references/practice-js.md) | Practice MCQ: load questions, answer submission, feedback, report |
| `exam.js` | [exam-js.md](./references/exam-js.md) | Exam MCQ: timer, navigator, answer tracking, auto-submit, report |
| `descriptive.js` | [descriptive-js.md](./references/descriptive-js.md) | Descriptive exam: text area, file upload, timer, draft save, submit |
| `report.js` | [report-js.md](./references/report-js.md) | Report center: load/display reports, grade calc, history, deletion |
| `review.js` | [review-js.md](./references/review-js.md) | Review display: merges practice + exam data, renders review cards |
| `browser_avatar.js` | [browser-avatar-js.md](./references/browser-avatar-js.md) | Browser-side avatar: bilateral filter, color quantization, edge overlay |
| `admin.js` | [admin-js.md](./references/admin-js.md) | Admin diagnostics: provider status, test generation, auto-refresh |

### CSS Files (14)
| File | Reference | Purpose |
|------|-----------|---------|
| `emotional.css` | [emotional-css.md](./references/emotional-css.md) | Avatar animations, particles, chat bubbles, dropdown, modal |
| `3d.css` | [3d-css.md](./references/3d-css.md) | Space scene, hologram, AI bot rings, stars, nebula |
| `text.css` | [text-css.md](./references/text-css.md) | Teaching sidebar, chat area, markdown rendering |
| `quiz-materials.css` | [quiz-materials-css.md](./references/quiz-materials-css.md) | Upload UI, material cards, processing bar |
| `explainer.css` | [explainer-css.md](./references/explainer-css.md) | Space scene, cards |
| `dashboard.css` | [dashboard-css.md](./references/dashboard-css.md) | Navbar, cards, particles, glow effects |
| `descriptive.css` | [descriptive-css.md](./references/descriptive-css.md) | Sidebar, answer box, stats |
| `practice.css` | [practice-css.md](./references/practice-css.md) | Stats grid, question card, feedback |
| `review.css` | [review-css.md](./references/review-css.md) | Review cards, answer states, explanation boxes |
| `mcq.css` | [mcq-css.md](./references/mcq-css.md) | Mode cards, hero section |
| `report.css` | [report-css.md](./references/report-css.md) | Stats, grade display, sidebar |
| `exam.css` | [exam-css.md](./references/exam-css.md) | Navigator grid, timer, question card |
| `exam-report.css` | [exam-report-css.md](./references/exam-report-css.md) | Stats grid, score card |
| `practice-report.css` | [practice-report-css.md](./references/practice-report-css.md) | Stats, review section |
| `admin.css` | [admin-css.md](./references/admin-css.md) | Provider cards |
| `style.css` | [style-css.md](./references/style-css.md) | Splash screen: loading bar, animations |

### Config/Support Files (1)
| File | Reference | Purpose |
|------|-----------|---------|
| `server.py` | [server-py.md](./references/server-py.md) | Python HTTP server on port 5500 |
