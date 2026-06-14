# Technical Analysis of app.py

## 1. Overview

`app.py` is the **main Flask application** for the Falcon AI backend. It serves as the HTTP API layer handling all client-server communication: emotional chat (OpenAI via OpenRouter), teaching/tutoring chat, PDF material upload and text extraction, MCQ quiz generation, learning report PDF export, avatar generation, and report persistence. It orchestrates calls to `database.py` for persistence, `avatar_manager.py` for image-to-avatar generation, and `extractor.py` for document text extraction.

**File location:** `/home/luca/falcon/backend/app.py` — 1560 lines.

---

## 2. Architecture & Setup

### Imports

| Category | Modules | Purpose |
|---|---|---|
| Web framework | `flask.Flask`, `flask.request`, `flask.jsonify`, `flask.send_file` | HTTP server, JSON responses, file serving |
| CORS | `flask_cors.CORS` | Cross-origin requests from frontend |
| HTTP client | `requests` | Calls to OpenRouter API (OpenAI/Mistral) |
| Env | `dotenv.load_dotenv` | Load `.env` from project root |
| PDF generation | `reportlab.platypus.SimpleDocTemplate`, `Paragraph`, `Spacer`, `HRFlowable` | Build study-report PDFs |
| PDF fonts | `reportlab.pdfbase.pdfmetrics`, `reportlab.pdfbase.ttfonts.TTFont` | Register NotoSans font family |
| RTL / Arabic | `arabic_reshaper`, `bidi.algorithm.get_display` | Arabic/Urdu text rendering in PDFs |
| PDF reading | `PyPDF2.PdfReader` | (Imported but unused — likely legacy) |
| Text extraction | `extractor.extract_text` | Extract text from uploaded files |
| Sentiment | `textblob.TextBlob` | Emotion detection on user messages |
| File utils | `werkzeug.utils.secure_filename`, `tempfile` | Safe file names, temp PDF storage |
| Internal | `database.*` (20+ functions), `avatar_manager.generate_avatar` | All persistence and avatar pipeline |

### Font Registration (lines 28–61)

Five NotoSans fonts are registered at module load:

- **NotoSans** — default Latin text
- **NotoSansArabic** — Arabic/Urdu (RTL)
- **NotoSansSC** — Simplified Chinese
- **NotoSansJP** — Japanese
- **NotoSansKR** — Korean

Font files are loaded from `backend/fonts/`.

### Environment Variables

| Key | Source | Usage |
|---|---|---|
| `OPENROUTER_API_KEY` | `.env` (parent directory) | Auth header for OpenRouter API |
| `HF_API_KEY` | `.env` (parent directory) | HuggingFace key (loaded but not directly used in routes) |

### App Initialization (lines 118–119)

```python
app = Flask(__name__)
CORS(app)
```

Minimal setup — no blueprints, no middleware, no auth. CORS is fully open.

### Constants

- `FALCON_PROMPT` (lines 122–133) — System prompt defining Falcon AI as an emotional support assistant.
- `UPLOAD_FOLDER` (line 937) — `backend/uploads/`, auto-created if missing.
- `user_id = 1` — **hardcoded** everywhere (single-user system).

---

## 3. Key Features / UI Panels

### Route Index

| Route | Method | Function | Domain |
|---|---|---|---|
| `/chat` | POST | `chat()` | Emotional chat (non-streaming) |
| `/chat-stream` | POST | `chat_stream()` | Emotional chat (SSE streaming) |
| `/create_session` | GET | `create_new_session()` | Session management |
| `/delete_session/<id>` | DELETE | `remove_session()` | Session management |
| `/archive_session/<id>` | POST | `archive_chat()` | Session management |
| `/unarchive_session/<id>` | POST | `unarchive_chat()` | Session management |
| `/sessions` | GET | `load_sessions()` | Session management |
| `/messages/<session_id>` | GET | `load_messages()` | Session management |
| `/text-chat` | POST | `text_chat()` | Teaching chat |
| `/create_teaching_session` | GET | `create_new_teaching_session()` | Teaching sessions |
| `/teaching_sessions` | GET | `load_teaching_sessions()` | Teaching sessions |
| `/teaching_messages/<session_id>` | GET | `load_teaching_messages()` | Teaching sessions |
| `/delete_teaching_session/<id>` | DELETE | `delete_teaching_session_route()` | Teaching sessions |
| `/archive_teaching_session/<id>` | POST | `archive_teaching_route()` | Teaching sessions |
| `/unarchive_teaching_session/<id>` | POST | `unarchive_teaching_route()` | Teaching sessions |
| `/export_teaching_pdf/<session_id>` | GET | `export_teaching_pdf()` | PDF export |
| `/upload_material` | POST | `upload_material()` | Materials |
| `/materials` | GET | `get_materials()` | Materials |
| `/generate_mcq/<material_id>` | POST | `generate_mcq()` | Quiz generation |
| `/generate_selected_quiz` | POST | `generate_selected_quiz()` | Quiz generation |
| `/mcq_questions/<quiz_id>` | GET | `load_mcq_questions()` | Quiz retrieval |
| `/test_mcq/<material_id>` | GET | `test_mcq()` | Testing shortcut |
| `/material/<material_id>` | DELETE | `delete_material_route()` | Materials |
| `/save_report` | POST | `save_report_route()` | Reports |
| `/reports` | GET | `get_reports_route()` | Reports |
| `/delete_report/<report_id>` | DELETE | `delete_report_route()` | Reports |
| `/generate_avatar` | POST | `generate_avatar()` | Avatar |
| `/avatar/diagnostics` | GET | `avatar_diagnostics()` | Avatar |

---

### 3A. Emotional Chat (`/chat` and `/chat-stream`)

#### Non-Streaming: `/chat`

**Request (POST JSON):**
```json
{
  "message": "I feel stressed",
  "session_id": 42
}
```

**Processing:**
1. Retrieves full chat history via `get_chat_history(session_id)`.
2. Detects name memory: if message contains "my name is", saves to memory; if "what is my name", returns cached name immediately.
3. Builds conversation context string from history.
4. Detects emotion via `detect_emotion()` (TextBlob polarity → "happy"/"sad"/"neutral").
5. Saves user message to DB with emotion tag.
6. Calls `generate_reply()` → OpenRouter API (`openai/gpt-oss-120b:free`) with system prompt + conversation + emotion.
7. Saves AI reply to DB.
8. Updates session title to first 40 chars of user message.

**Response:**
```json
{
  "reply": "I understand you're feeling...",
  "title": "I feel stressed",
  "emotion": "sad"
}
```

#### Streaming: `/chat-stream`

**Request (POST JSON):**
```json
{
  "message": "I feel stressed",
  "session_id": 42
}
```

**Processing:**
1. Same logic as `/chat` for history, emotion detection, and user message save.
2. Calls `generate_reply_stream()` which streams tokens from OpenRouter.
3. Returns SSE (Server-Sent Events) with `text/event-stream` content type.
4. Each token sent as `data: {token}\n\n`.
5. Ends with `data: [DONE]\n\n`.
6. After stream completes, saves full reply to DB and updates session title.

**Response:** Stream of SSE chunks:
```
data: I'm

data:  here

data:  for

data:  you.

data: [DONE]

```

**Error handling:** Wraps entire handler in try/except; returns error string in stream (no HTTP error status).

---

### 3B. Emotional Chat — Helper Functions

**`detect_emotion(text)`** (line 137)
- Uses `TextBlob(text).sentiment.polarity` (range -1.0 to 1.0).
- Polarity > 0.3 → "happy"
- Polarity < -0.3 → "sad"
- Otherwise → "neutral"

**`generate_reply(prompt)`** (line 150)
- POSTs to `https://openrouter.ai/api/v1/chat/completions`.
- Model: `openai/gpt-oss-120b:free`.
- Returns `choices[0].message.content`.
- On error, returns error message string (not an exception).

**`generate_reply_stream(prompt)`** (line 187)
- Same API call but with `"stream": True` in payload.
- Returns a generator yielding SSE chunks: `data: {token}\n\n`.
- Yields `data: [DONE]\n\n` at the end.
- Uses `response.iter_lines()` to read streamed response from OpenRouter.

---

### 3C. Chat Session Management

| Route | Request | Response | Notes |
|---|---|---|---|
| `GET /create_session` | — | `{"session_id": int}` | Creates with title "New Conversation", emotion "neutral" |
| `DELETE /delete_session/<id>` | — | `{"success": true}` | Hard delete |
| `POST /archive_session/<id>` | — | `{"success": true}` | Soft archive |
| `POST /unarchive_session/<id>` | — | `{"success": true}` | Restore |
| `GET /sessions` | — | `[{id, title, emotion, is_archived}]` | All sessions for user_id=1 |
| `GET /messages/<id>` | — | `[{sender, content, emotion}]` | Full message history |

---

### 3D. Teaching Chat (`/text-chat`)

**Request (POST JSON):**
```json
{
  "message": "Explain photosynthesis",
  "session_id": 5
}
```

**Processing:**
1. If session title is still "New Lesson", auto-updates to first 40 chars of message.
2. Saves user message via `save_teaching_message()`.
3. Calls OpenRouter with `TEACHER_PROMPT` (Falcon as expert teacher, no markdown, conversational).
4. Saves AI reply with sender "ai".

**Response:**
```json
{
  "reply": "Photosynthesis is the process by which..."
}
```

**Key difference from emotional chat:** No emotion detection, no conversation history context, no memory system. Simpler prompt structure.

---

### 3E. Teaching Session Management

| Route | Request | Response | Notes |
|---|---|---|---|
| `GET /create_teaching_session` | — | `{"session_id": int}` | Title defaults to "New Lesson" |
| `GET /teaching_sessions` | — | `[{id, title, is_archived}]` | No emotion field |
| `GET /teaching_messages/<id>` | — | `[{sender, content}]` | No emotion field |
| `DELETE /delete_teaching_session/<id>` | — | `{"success": true}` | Hard delete |
| `POST /archive_teaching_session/<id>` | — | `{"success": true}` | Soft archive |
| `POST /unarchive_teaching_session/<id>` | — | `{"success": true}` | Restore |

---

### 3F. PDF Export (`/export_teaching_pdf/<session_id>`)

**Request:** GET with session_id in URL.

**Processing:**
1. Fetches session title and all teaching messages.
2. Sends full conversation to OpenRouter to generate a structured study report (SUMMARY, KEY CONCEPTS, STUDY TIPS) in the same language as the lesson.
3. Detects text script via `get_font_for_text()` to select appropriate font.
4. For Arabic/Urdu text: applies RTL reshaping via `fix_rtl_text()`.
5. Builds a styled PDF using ReportLab:
   - Title: "FALCON AI LEARNING REPORT" in blue (#2563EB).
   - Section headings in dark (#111827).
   - Body text with leading=18.
   - Horizontal rules between sections.
   - Full conversation printed with labels "Falcon AI" / "User".
6. Returns PDF as download with sanitized filename.

**Response:** Binary PDF file (`Content-Type: application/pdf`), download name = `{title}.pdf`.

**Font selection logic (`get_font_for_text`):**
- Unicode ranges: CJK → NotoSansSC/JP/KR; Arabic → NotoSansArabic; default → NotoSans.

---

### 3G. Material Upload (`/upload_material`)

**Request (POST multipart):**
- Field: `file` — any document file.

**Processing:**
1. Validates file presence and non-empty filename (400 on failure).
2. Saves to `backend/uploads/` with `secure_filename()`.
3. Saves metadata to DB via `save_material()`.
4. Extracts text via `extractor.extract_text(filepath, extension)`.
5. Updates DB with extracted text via `update_material_text()`.

**Response:**
```json
{
  "success": true,
  "material_id": 12,
  "filename": "lecture-notes.pdf"
}
```

**Supported extensions:** Determined by `extractor.py` (typically PDF, DOCX, TXT).

---

### 3H. Material Listing & Deletion

| Route | Request | Response |
|---|---|---|
| `GET /materials` | — | `[{id, title, type, upload_date}]` — ordered by id DESC |
| `DELETE /material/<id>` | — | `{"success": true}` |

Note: `GET /materials` uses raw SQL (not a database.py function) — `SELECT id, title, material_type, upload_date FROM materials ORDER BY id DESC`.

---

### 3I. MCQ Quiz Generation

#### Single Material (`/generate_mcq/<material_id>`)

**Request:** POST with material_id in URL.

**Processing:**
1. Fetches material via `get_material_by_id()`. Returns 404 if not found, 400 if no extracted text.
2. Sends first 12,000 chars of extracted text to OpenRouter requesting 10 MCQ questions in JSON format.
3. **Fallback chain:** If primary model fails, retries with `mistralai/mistral-7b-instruct:free`.
4. Strips markdown code fences from response, parses JSON.
5. Creates quiz via `create_mcq_quiz()`, saves each question via `save_mcq_question()`.

**Response:**
```json
{
  "success": true,
  "quiz_id": 7,
  "questions_saved": 10
}
```

#### Multiple Materials (`/generate_selected_quiz`)

**Request (POST JSON):**
```json
{
  "material_ids": [1, 3, 5],
  "question_count": 15
}
```

**Processing:**
- Combines extracted text from all selected materials (up to 12,000 chars total).
- Same OpenRouter call + fallback chain.
- Validates each question has all required keys before saving.
- Skips malformed questions with console warning.

**Response:**
```json
{
  "success": true,
  "quiz_id": 8,
  "questions_saved": 14
}
```

#### Quiz Retrieval (`/mcq_questions/<quiz_id>`)

**Response:**
```json
[
  {
    "question": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_answer": "A",
    "explanation": "..."
  }
]
```

#### Test Endpoint (`/test_mcq/<material_id>`)

Shortcut: calls `generate_mcq()` directly via GET.

---

### 3J. Reports

| Route | Method | Request | Response |
|---|---|---|---|
| `/save_report` | POST | `{type, total, correct, incorrect, unattempted?, percentage, quiz_id?}` | `{success, report_id}` |
| `/reports` | GET | — | `[{id, type, total, correct, incorrect, unattempted, percentage, created_at}]` |
| `/delete_report/<id>` | DELETE | — | `{success}` |

Reports track quiz performance metrics. `created_at` is serialized via `.isoformat()`.

---

### 3K. Avatar Generation (`/generate_avatar`)

**Request (POST JSON):**
```json
{
  "image": "data:image/png;base64,iVBORw0KGgo..."
}
```

**Processing:**
1. Strips data URI prefix, base64-decodes to bytes.
2. Delegates to `avatar_manager.generate_avatar(image_bytes)`.
3. Provider chain (auto-detected): IdentityProvider → ComfyUIProvider → LocalProvider → HuggingFaceProvider → BrowserFallbackProvider.

**Response:** Varies by provider; always includes `success` boolean. May include `use_browser_fallback: true` if no server-side provider available.

#### Diagnostics (`GET /avatar/diagnostics`)

Returns provider status from `avatar_manager.get_diagnostics()`.

---

## 4. Data Structure & Persistence

### Database Layer

All persistence is via `database.py` functions (imported at lines 66–96, 100). The app never touches SQLite directly except in `GET /materials`.

#### Database Functions Used

| Function | Purpose | Tables |
|---|---|---|
| `create_session(user_id, title, emotion)` | New chat session | sessions |
| `save_message(session_id, sender, content, emotion)` | Chat message | messages |
| `get_sessions(user_id)` | List all sessions | sessions |
| `get_messages(session_id)` | Session messages | messages |
| `get_chat_history(session_id)` | Full history for context | messages |
| `delete_session(session_id)` | Hard delete | sessions |
| `archive_session(session_id)` | Soft archive | sessions |
| `unarchive_session(session_id)` | Restore | sessions |
| `update_session_title(session_id, title)` | Auto-title | sessions |
| `create_teaching_session(user_id, title)` | New lesson | teaching_sessions |
| `save_teaching_message(session_id, sender, content)` | Lesson message | teaching_messages |
| `get_teaching_sessions(user_id)` | List lessons | teaching_sessions |
| `get_teaching_messages(session_id)` | Lesson messages | teaching_messages |
| `get_teaching_session_title(session_id)` | Get title | teaching_sessions |
| `update_teaching_session_title(session_id, title)` | Auto-title | teaching_sessions |
| `delete_teaching_session(session_id)` | Hard delete | teaching_sessions |
| `archive_teaching_session(session_id)` | Soft archive | teaching_sessions |
| `unarchive_teaching_session(session_id)` | Restore | teaching_sessions |
| `save_material(user_id, title, file_name, file_path, material_type, status)` | Upload metadata | materials |
| `update_material_text(material_id, text)` | Store extracted text | materials |
| `get_material_by_id(material_id)` | Fetch material | materials |
| `delete_material(material_id)` | Hard delete | materials |
| `get_connection()` | Raw SQLite connection | (used in GET /materials) |
| `create_mcq_quiz(material_id, title)` | New quiz | mcq_quizzes |
| `save_mcq_question(quiz_id, question, a, b, c, d, answer, explanation)` | Store question | mcq_questions |
| `get_mcq_questions(quiz_id)` | Fetch quiz | mcq_questions |
| `save_report(user_id, type, total, correct, incorrect, unattempted, percentage, quiz_id)` | Quiz report | reports |
| `get_reports(user_id)` | List reports | reports |
| `delete_report(report_id)` | Hard delete | reports |
| `save_memory(user_id, key, value)` | Memory store | memory |
| `find_memory(user_id, key)` | Memory lookup | memory |

### Inferred Schema Relationships

```
users (id=1 hardcoded)
  ├── sessions (id, user_id, title, emotion, is_archived)
  │     └── messages (session_id, sender, content, emotion)
  ├── teaching_sessions (id, user_id, title, is_archived)
  │     └── teaching_messages (session_id, sender, content)
  ├── materials (id, user_id, title, file_name, file_path, material_type, extracted_text, status, upload_date)
  │     └── mcq_quizzes (id, material_id, title)
  │           └── mcq_questions (quiz_id, question, option_a–d, correct_answer, explanation)
  ├── reports (id, user_id, type, total, correct, incorrect, unattempted, percentage, created_at)
  └── memory (user_id, key, value)
```

---

## 5. Logic & Event Handlers

### Request Handling Flow

```
Client Request
  → Flask route dispatcher
    → Parse JSON / multipart
    → Validate inputs
    → Call database.py functions
    → (Optional) Call OpenRouter API
    → (Optional) Call avatar_manager / extractor
    → Build JSON response
    → Return jsonify(response_dict)
```

### Error Handling

- **Chat routes (`/chat`, `/text-chat`):** Catch-all try/except returning error string in `reply` field. No HTTP error status codes.
- **Material routes:** Return 400 for missing file/empty filename; 500 for database errors; 404 for missing material.
- **Quiz generation:** Returns 500 on JSON parse failure or API failure. Uses fallback model before giving up.
- **Reports:** Returns 500 on any exception, or empty array `[]` for GET failures.

**Weakness:** Error responses in chat routes are indistinguishable from real replies to the frontend (same `reply` key, 200 status).

### OpenRouter API Call Pattern

All AI calls share this structure:

```python
headers = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json"
}
payload = {
    "model": "openai/gpt-oss-120b:free",
    "messages": [{"role": "system", "content": prompt}]
}
response = requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers=headers, json=payload
)
```

Primary model: `openai/gpt-oss-120b:free`. Fallback: `mistralai/mistral-7b-instruct:free` (MCQ generation only).

### Text Extraction Pipeline

```
Upload file → save to disk → extract_text(filepath, extension)
  → update_material_text(material_id, text)
```

Handled by `extractor.py` (external module). Supports PDF, likely DOCX/TXT.

### PDF Generation Pipeline (Study Report)

```
Fetch messages → Build conversation string → Send to AI for summary
  → Detect script (Latin/CJK/Arabic) → Select font
  → If Arabic: reshape + RTL fix
  → Build ReportLab document with styled paragraphs
  → Write to temp file → Return as download
```

### Memory System

Simple key-value store for the emotional chat:
- Triggered by natural language ("my name is X", "what is my name").
- Stored per `user_id=1`.
- Only "name" key is actively used.

---

## 6. UX & Styling Details

N/A — backend-only file. However, notable response format conventions:

- All responses are JSON via `jsonify()`.
- Success responses include `"success": true` where applicable.
- Error responses vary: some return HTTP error codes (400, 404, 500), others embed errors in normal response fields.
- Session lists return arrays of objects, not wrapped in a container.
- Dates are returned as ISO 8601 strings (`.isoformat()`).
- PDF responses use `send_file()` with `as_attachment=True`.
