# Technical Analysis of falcon-sql.md

## 1. Overview
**falcon_ai** is the PostgreSQL 18.1 database powering the Falcon application. It stores user accounts, chat sessions, teaching sessions, uploaded learning materials, quizzes, and user memory preferences. The schema supports a conversational AI tutor platform with session-based chat, material management, and quiz generation.

## 2. Architecture & Setup
- **Database Engine**: PostgreSQL 18.1
- **Database Name**: `falcon_ai`
- **Connection String Format**:
  ```
  postgresql://<user>:<password>@<host>:<port>/falcon_ai
  ```
- **Restoration Instructions**:
  ```bash
  # Drop existing database (if needed)
  dropdb falcon_ai
  # Recreate
  createdb falcon_ai
  # Restore from dump
  pg_restore -d falcon_ai /path/to/falcon.sql
  ```
- **Dependencies**: Requires PostgreSQL 18.1+ installed and running.

## 3. Key Features / UI Panels
N/A (schema file)

## 4. Data Structure & Persistence

### 4.1 Schema Reference

| Table | Column | Type | Constraints | Description |
|-------|--------|------|-------------|-------------|
| **users** | id | SERIAL | PRIMARY KEY | Unique user identifier |
| | username | VARCHAR(50) | UNIQUE | Login username |
| | email | VARCHAR(255) | UNIQUE | User email address |
| | password_hash | TEXT | | Hashed password |
| | created_at | TIMESTAMP | DEFAULT NOW() | Account creation time |
| **sessions** | id | SERIAL | PRIMARY KEY | Chat session identifier |
| | user_id | INT | FK → users.id | Owner of the session |
| | title | VARCHAR(255) | | Session title |
| | emotion | VARCHAR(50) | | Detected emotion |
| | is_archived | BOOLEAN | DEFAULT false | Archive status |
| | created_at | TIMESTAMP | DEFAULT NOW() | Session creation time |
| **messages** | id | SERIAL | PRIMARY KEY | Message identifier |
| | session_id | INT | FK → sessions.id | Parent chat session |
| | sender | VARCHAR(20) | | 'user' or 'assistant' |
| | content | TEXT | | Message body |
| | emotion | VARCHAR(50) | | Detected emotion |
| | created_at | TIMESTAMP | DEFAULT NOW() | Message timestamp |
| **teaching_sessions** | id | SERIAL | PRIMARY KEY | Teaching session identifier |
| | user_id | INT | FK → users.id | Owner of the teaching session |
| | title | VARCHAR(255) | | Session title |
| | created_at | TIMESTAMP | DEFAULT NOW() | Session creation time |
| | is_archived | BOOLEAN | DEFAULT false | Archive status |
| **teaching_messages** | id | SERIAL | PRIMARY KEY | Teaching message identifier |
| | session_id | INT | FK → teaching_sessions.id (ON DELETE CASCADE) | Parent teaching session |
| | sender | VARCHAR(20) | | 'user' or 'assistant' |
| | content | TEXT | | Message body |
| | created_at | TIMESTAMP | DEFAULT NOW() | Message timestamp |
| **materials** | id | SERIAL | PRIMARY KEY | Material identifier |
| | user_id | INT | | Uploader's user ID |
| | title | TEXT | NOT NULL | Material title |
| | file_name | TEXT | NOT NULL | Original file name |
| | file_path | TEXT | NOT NULL | Stored file path |
| | material_type | TEXT | | MIME type or category |
| | upload_date | TIMESTAMP | DEFAULT NOW() | Upload timestamp |
| | status | TEXT | DEFAULT 'processing' | Processing status |
| | extracted_text | TEXT | | Extracted text content |
| **mcq_quizzes** | id | SERIAL | PRIMARY KEY | Quiz identifier |
| | material_id | INT | FK → materials.id | Source material |
| | title | TEXT | | Quiz title |
| | created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| **mcq_questions** | id | SERIAL | PRIMARY KEY | Question identifier |
| | quiz_id | INT | FK → mcq_quizzes.id | Parent quiz |
| | question | TEXT | | Question text |
| | option_a | TEXT | | Choice A |
| | option_b | TEXT | | Choice B |
| | option_c | TEXT | | Choice C |
| | option_d | TEXT | | Choice D |
| | correct_answer | TEXT | | Correct answer key |
| | explanation | TEXT | | Answer explanation |
| **descriptive_questions** | id | SERIAL | PRIMARY KEY | Question identifier |
| | material_id | INT | FK → materials.id | Source material |
| | question | TEXT | | Question text |
| | answer | TEXT | | Model answer |
| | marks | INT | | Marks awarded |
| | difficulty | TEXT | | Difficulty level |
| **memories** | id | SERIAL | PRIMARY KEY | Memory identifier |
| | user_id | INT | FK → users.id | Owner user |
| | memory_key | VARCHAR(100) | | Memory key name |
| | memory_value | TEXT | | Stored value |
| | created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

### 4.2 Sequence Values (as of dump)

| Sequence | Current Value |
|----------|---------------|
| users_id_seq | 2 |
| sessions_id_seq | 26 |
| messages_id_seq | 49 |
| teaching_sessions_id_seq | 27 |
| teaching_messages_id_seq | 30 |
| materials_id_seq | 27 |
| mcq_quizzes_id_seq | 45 |
| mcq_questions_id_seq | 485 |
| memories_id_seq | 8 |

### 4.3 Entity Relationship Diagram (ASCII)

```
+----------------+       +----------------+       +----------------+
|     users      |       |    sessions    |       |    messages    |
+----------------+       +----------------+       +----------------+
| id       (PK)  |<--+   | id       (PK)  |<--+   | id       (PK)  |
| username       |   |   | user_id  (FK)  |   |   | session_id(FK) |
| email          |   |   | title          |   |   | sender         |
| password_hash  |   |   | emotion        |   |   | content        |
| created_at     |   |   | is_archived    |   |   | emotion        |
+----------------+   |   | created_at     |   |   | created_at     |
                     |   +----------------+   |   +----------------+
                     |                          |
                     |   +----------------+   |
                     |   | teaching_msgs  |   |
                     |   +----------------+   |
                     |   | id       (PK)  |   |
                     |   | session_id(FK) |<--+
                     |   | sender         |
                     |   | content        |
                     |   | created_at     |
                     |   +----------------+
                     |
                     |   +----------------+       +----------------+
                     |   | teaching_sess  |       |   materials    |
                     |   +----------------+       +----------------+
                     |   | id       (PK)  |       | id       (PK)  |
                     +-->| user_id  (FK)  |       | user_id        |
                         | title          |       | title          |
                         | created_at     |       | file_name      |
                         | is_archived    |       | file_path      |
                         +----------------+       | material_type  |
                                                  | upload_date    |
                                                  | status         |
                                                  | extracted_text |
                                                  +-------+--------+
                                                          |
                          +----------------+              |
                          |  mcq_quizzes   |              |
                          +----------------+              |
                          | id       (PK)  |              |
                          | material_id(FK)|<-------------+
                          | title          |
                          | created_at     |
                          +-------+--------+
                                  |
                          +-------+--------+
                          |  mcq_questions |
                          +----------------+
                          | id       (PK)  |
                          | quiz_id  (FK)  |
                          | question       |
                          | option_a       |
                          | option_b       |
                          | option_c       |
                          | option_d       |
                          | correct_answer |
                          | explanation    |
                          +----------------+

+-------------------+       +------------------+
| descriptive_qs    |       |     memories     |
+-------------------+       +------------------+
| id       (PK)     |       | id       (PK)    |
| material_id (FK)  |<------+ user_id  (FK)    |
| question          |       | memory_key       |
| answer            |       | memory_value     |
| marks             |       | created_at       |
| difficulty        |       +------------------+
+-------------------+
```

## 5. Logic & Event Handlers
N/A (schema file)

## 6. UX & Styling Details
N/A (schema file)
