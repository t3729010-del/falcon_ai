# Technical Analysis of database.py

## 1. Overview

`database.py` is the **PostgreSQL CRUD layer** for the Falcon AI backend. It provides 27 functions that manage all persistent data across 8 tables: `sessions`, `messages`, `memories`, `teaching_sessions`, `teaching_messages`, `materials`, `mcq_quizzes`, `mcq_questions`, and `reports`. Every function opens a new connection, executes its query, commits if write, and closes both cursor and connection. No ORM is used — all queries are raw SQL via `psycopg2`.

## 2. Architecture & Setup

### Dependencies

| Import | Role |
|--------|------|
| `psycopg2` | PostgreSQL adapter for Python |

### Connection Configuration

```python
def get_connection():
    return psycopg2.connect(
        database="falcon_ai",
        user="postgres"
    )
```

- **Database**: `falcon_ai`
- **User**: `postgres` (no password, no host — relies on local socket/trust auth)
- Called at the start of every function; no connection pooling

### Pattern: Every Function Follows This Skeleton

```
conn = get_connection()
cursor = conn.cursor()
cursor.execute(SQL, params)
conn.commit()        # only on writes
result = cursor.fetchone() / fetchall()
cursor.close()
conn.close()
return result
```

No context managers, no error handling, no transactions wrapping multiple statements (except `delete_session`, `delete_teaching_session`, and `delete_material` which issue multiple DELETEs in sequence before a single commit).

## 3. Key Features / UI Panels

### 3.1 Session Management

| Function | Table | Operation | Parameters | Returns | Notes |
|----------|-------|-----------|------------|---------|-------|
| `create_session` | `sessions` | INSERT | `user_id, title, emotion` | `int` (new id) | Uses `RETURNING id` |
| `get_sessions` | `sessions` | SELECT | `user_id` | `list[tuple]` — `(id, title, emotion, is_archived)` | Ordered `id DESC` |
| `delete_session` | `messages` + `sessions` | DELETE | `session_id` | None | Deletes messages first, then session — no FK cascade assumed |
| `archive_session` | `sessions` | UPDATE | `session_id` | None | Sets `is_archived = TRUE` |
| `unarchive_session` | `sessions` | UPDATE | `session_id` | None | Sets `is_archived = FALSE` |
| `update_session_title` | `sessions` | UPDATE | `session_id, title` | None | Overwrites title |

### 3.2 Message Management

| Function | Table | Operation | Parameters | Returns | Notes |
|----------|-------|-----------|------------|---------|-------|
| `save_message` | `messages` | INSERT | `session_id, sender, content, emotion` | None | No RETURNING |
| `get_messages` | `messages` | SELECT | `session_id` | `list[tuple]` — `(sender, content, emotion)` | Ordered `id ASC` |
| `get_chat_history` | `messages` | SELECT | `session_id` | `list[tuple]` — `(sender, content)` | Same as `get_messages` but without `emotion` column |

### 3.3 Memory Management

| Function | Table | Operation | Parameters | Returns | Notes |
|----------|-------|-----------|------------|---------|-------|
| `save_memory` | `memories` | INSERT | `user_id, key, value` | None | Column mapping: `key` → `memory_key`, `value` → `memory_value` |
| `get_memories` | `memories` | SELECT | `user_id` | `list[tuple]` — `(memory_key, memory_value)` | All memories for user |
| `find_memory` | `memories` | SELECT | `user_id, key` | `tuple` or `None` | `LIMIT 1`, returns single row (wrapped in tuple) or `None` |

### 3.4 Teaching Session Management

| Function | Table | Operation | Parameters | Returns | Notes |
|----------|-------|-----------|------------|---------|-------|
| `create_teaching_session` | `teaching_sessions` | INSERT | `user_id, title` | `int` (new id) | Uses `RETURNING id` |
| `get_teaching_sessions` | `teaching_sessions` | SELECT | `user_id` | `list[tuple]` — `(id, title, is_archived)` | Ordered `id DESC` |
| `update_teaching_session_title` | `teaching_sessions` | UPDATE | `session_id, title` | None | |
| `delete_teaching_session` | `teaching_messages` + `teaching_sessions` | DELETE | `session_id` | None | Deletes messages first, then session |
| `archive_teaching_session` | `teaching_sessions` | UPDATE | `session_id` | None | Sets `is_archived = TRUE` |
| `unarchive_teaching_session` | `teaching_sessions` | UPDATE | `session_id` | None | Sets `is_archived = FALSE` |
| `get_teaching_session_title` | `teaching_sessions` | SELECT | `session_id` | `str` | Returns title string or `"Lesson"` as fallback |

### 3.5 Teaching Message Management

| Function | Table | Operation | Parameters | Returns | Notes |
|----------|-------|-----------|------------|---------|-------|
| `save_teaching_message` | `teaching_messages` | INSERT | `session_id, sender, content` | None | No emotion column (unlike regular messages) |
| `get_teaching_messages` | `teaching_messages` | SELECT | `session_id` | `list[tuple]` — `(sender, content)` | Ordered `id ASC` |

### 3.6 Material Management

| Function | Table | Operation | Parameters | Returns | Notes |
|----------|-------|-----------|------------|---------|-------|
| `save_material` | `materials` | INSERT | `user_id, title, file_name, file_path, material_type, status="uploaded"` | `int` (new id) | `status` defaults to `"uploaded"` |
| `update_material_text` | `materials` | UPDATE | `material_id, extracted_text` | None | Sets `extracted_text` column |
| `get_material_by_id` | `materials` | SELECT | `material_id` | `tuple` — `(id, title, extracted_text)` or `None` | Single row |
| `delete_material` | `mcq_questions` + `mcq_quizzes` + `materials` | DELETE | `material_id` | None | 3-step cascade: questions → quizzes → material |

### 3.7 Quiz (MCQ) Management

| Function | Table | Operation | Parameters | Returns | Notes |
|----------|-------|-----------|------------|---------|-------|
| `create_mcq_quiz` | `mcq_quizzes` | INSERT | `material_id, title` | `int` (new id) | Linked to material |
| `save_mcq_question` | `mcq_questions` | INSERT | `quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, explanation` | None | 8 columns, no RETURNING |
| `get_mcq_questions` | `mcq_questions` | SELECT | `quiz_id` | `list[tuple]` — `(question, option_a, option_b, option_c, option_d, correct_answer, explanation)` | Ordered by `id` |

### 3.8 Reports

| Function | Table | Operation | Parameters | Returns | Notes |
|----------|-------|-----------|------------|---------|-------|
| `save_report` | `reports` | INSERT | `user_id, report_type, total, correct, incorrect, unattempted, percentage, quiz_id=None` | `int` (new id) | `quiz_id` optional, uses `RETURNING id` |
| `delete_report` | `reports` | DELETE | `report_id` | None | |
| `get_reports` | `reports` | SELECT | `user_id` | `list[tuple]` — `(id, type, total, correct, incorrect, unattempted, percentage, created_at)` | Ordered `created_at DESC` |

## 4. Data Structure & Persistence

### Table Schema (inferred from queries)

```sql
-- Sessions (chat)
sessions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER,
    title       TEXT,
    emotion     TEXT,
    is_archived BOOLEAN DEFAULT FALSE
)

-- Messages (chat)
messages (
    id          SERIAL PRIMARY KEY,
    session_id  INTEGER REFERENCES sessions(id),
    sender      TEXT,
    content     TEXT,
    emotion     TEXT
)

-- Memories
memories (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER,
    memory_key    TEXT,
    memory_value  TEXT
)

-- Teaching Sessions
teaching_sessions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER,
    title       TEXT,
    is_archived BOOLEAN DEFAULT FALSE
)

-- Teaching Messages
teaching_messages (
    id          SERIAL PRIMARY KEY,
    session_id  INTEGER REFERENCES teaching_sessions(id),
    sender      TEXT,
    content     TEXT
)

-- Materials
materials (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER,
    title           TEXT,
    file_name       TEXT,
    file_path       TEXT,
    material_type   TEXT,
    status          TEXT DEFAULT 'uploaded',
    extracted_text  TEXT
)

-- MCQ Quizzes
mcq_quizzes (
    id           SERIAL PRIMARY KEY,
    material_id  INTEGER REFERENCES materials(id),
    title        TEXT
)

-- MCQ Questions
mcq_questions (
    id               SERIAL PRIMARY KEY,
    quiz_id          INTEGER REFERENCES mcq_quizzes(id),
    question         TEXT,
    option_a         TEXT,
    option_b         TEXT,
    option_c         TEXT,
    option_d         TEXT,
    correct_answer   TEXT,
    explanation      TEXT
)

-- Reports
reports (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER,
    type         TEXT,
    total        INTEGER,
    correct      INTEGER,
    incorrect    INTEGER,
    unattempted  INTEGER,
    percentage   REAL,
    quiz_id      INTEGER,
    created_at   TIMESTAMP DEFAULT NOW()
)
```

### Column Type Notes

- **All IDs**: Auto-incrementing `SERIAL` (integer)
- **Boolean flags**: `is_archived` on sessions/teaching_sessions, defaults not explicit in code but `FALSE` is the semantic default
- **Timestamps**: Only `reports.created_at` is explicitly returned; other tables may have timestamps not queried
- **Foreign keys**: Not enforced in code (no `ON DELETE CASCADE`); manual cascade deletes in `delete_session`, `delete_teaching_session`, `delete_material`

## 5. Logic & Event Handlers

### Transaction Handling

- **Single-statement writes**: Each function commits once after its INSERT/UPDATE/DELETE
- **Multi-statement deletes** (`delete_session`, `delete_teaching_session`, `delete_material`): Execute multiple DELETEs sequentially then commit once — if the second DELETE fails, the first is still committed (no rollback protection)
- **No explicit transactions**: No `BEGIN`/`ROLLBACK` blocks

### Error Patterns

- **No try/except anywhere**: All functions assume queries succeed. Connection errors, constraint violations, and missing rows will propagate as unhandled exceptions
- **No null checks**: `get_material_by_id` and `find_memory` return `None` implicitly when no row found, but callers must handle this
- **Fallback default**: `get_teaching_session_title` returns `"Lesson"` when no result found

### Key Behavioral Details

1. **`save_memory` does not upsert**: Multiple calls with the same `user_id` + `key` create duplicate rows. `find_memory` uses `LIMIT 1` so it returns only the first match
2. **`get_chat_history` vs `get_messages`**: Identical except `get_chat_history` omits the `emotion` column. `get_chat_history` is the legacy/LLM-friendly variant
3. **`delete_material` cascade**: Deletes `mcq_questions` → `mcq_quizzes` → `materials` in order. Questions are deleted by subquery on `quiz_id IN (SELECT id FROM mcq_quizzes WHERE material_id = ...)`
4. **`save_report.quiz_id`**: Optional parameter defaults to `None`, allowing reports not tied to a specific quiz
5. **Connection per call**: Every function creates and destroys a connection. No connection reuse or pooling

### Function Count by Domain

| Domain | Functions |
|--------|-----------|
| Connection | 1 |
| Session | 6 |
| Message | 3 |
| Memory | 3 |
| Teaching Session | 7 |
| Teaching Message | 2 |
| Material | 4 |
| Quiz (MCQ) | 3 |
| Reports | 3 |
| **Total** | **32** |

## 6. UX & Styling Details

N/A — backend-only file with no UI rendering.
