# Technical Analysis of `.gitignore`

## 1. Overview
Excludes virtual environments and Python bytecode from version control.

## 2. Architecture & Setup
Two glob patterns covering all subdirectories:

| Pattern | Purpose |
|---|---|
| `**/.venv/` | Python virtual environment directories |
| `**/__pycache__/` | Compiled bytecode cache |

## 3. Key Features
- Recursive matching (`**`) ensures nested directories are covered regardless of depth.
