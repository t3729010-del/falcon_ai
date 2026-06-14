# Technical Analysis of pyproject.toml

## 1. Overview

This file defines the Python project configuration for **falcon-ai-backend** — an emotional support assistant and teaching platform built with Flask. It specifies project metadata, dependencies, build system, and tool configurations.

| Key | Value |
|-----|-------|
| Name | `falcon-ai-backend` |
| Version | `0.1.0` |
| Python | `>=3.10` |
| License | MIT |
| Build Backend | Hatchling |

## 2. Architecture & Setup

### Core Dependencies

| Package | Purpose |
|---------|---------|
| `flask>=2.0` | Web framework for HTTP routing and request handling |
| `flask-cors>=4.0` | Cross-origin resource sharing for frontend integration |
| `python-dotenv>=1.0` | Environment variable loading from `.env` files |
| `requests>=2.28` | HTTP client for external API calls |
| `reportlab>=4.0` | PDF document generation (reports, worksheets) |
| `PyPDF2>=3.0` | PDF parsing and text extraction |
| `textblob>=0.17` | Sentiment analysis and NLP processing |
| `psycopg2-binary>=2.9` | PostgreSQL database driver |
| `python-bidi>=0.4` | Bidirectional text support (Arabic/Hebrew) |
| `arabic-reshaper>=3.0` | Arabic text rendering for PDFs |
| `pillow>=10.0` | Image processing (avatar manipulation, thumbnails) |
| `werkzeug>=2.0` | WSGI utilities, password hashing, file handling |

## 3. Key Features / UI Panels

### Optional Dependency Groups

**Dev** (`[project.optional-dependencies] dev`)
| Package | Purpose |
|---------|---------|
| `pytest>=7.0` | Test framework for unit/integration tests |
| `pytest-cov>=4.0` | Code coverage reporting |
| `ruff>=0.1.0` | Fast Python linter and formatter |
| `mypy>=1.0` | Static type checking |
| `pre-commit>=3.0` | Git hook management for code quality |

**Avatar** (`[project.optional-dependencies] avatar`)
| Package | Purpose |
|---------|---------|
| `torch>=2.0` | Deep learning framework for avatar generation |
| `diffusers>=0.25` | Diffusion model pipelines (Stable Diffusion) |
| `transformers>=4.35` | HuggingFace transformer models |
| `accelerate>=0.25` | GPU/CPU training and inference optimization |
| `insightface>=0.7` | Face detection and analysis for avatar creation |
| `opencv-python>=4.8` | Computer vision utilities |
| `websocket-client>=1.6` | Real-time WebSocket communication |

**OCR** (`[project.optional-dependencies] ocr`)
| Package | Purpose |
|---------|---------|
| `pytesseract>=0.3` | Tesseract OCR wrapper for text extraction |
| `pdf2image>=1.17` | PDF to image conversion |
| `python-docx>=0.8` | Word document parsing |
| `python-pptx>=0.6` | PowerPoint file parsing |

## 4. Data Structure & Persistence

N/A — Database schema and persistence are defined elsewhere (e.g., SQLAlchemy models, migration files).

## 5. Logic & Event Handlers

### Build System

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

Uses Hatchling as the PEP 517 build backend. Builds with `python -m build`.

### Linting & Type Checking

```toml
[tool.ruff]
line-length = 100
target-version = "py310"

[tool.mypy]
python_version = "3.10"
ignore_missing_imports = true
```

- **Ruff**: Max line length 100, targeting Python 3.10 syntax
- **MyPy**: Python 3.10 mode, suppresses missing import errors for third-party libs

### Testing

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
```

Tests live in `tests/` directory, files follow `test_*.py` naming convention.

## 6. UX & Styling Details

N/A — This is a backend configuration file.
