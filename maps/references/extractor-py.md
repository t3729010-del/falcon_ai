# Technical Analysis of extractor.py

## 1. Overview

Unified text extraction module that handles PDF, DOCX, PPTX, image, and plain text files. Provides a single entry point `extract_text()` that dispatches to format-specific extractors. Uses optional imports to gracefully degrade when libraries are unavailable.

## 2. Architecture & Setup

**Imports & Optional Dependencies**

| Library | Import | Purpose |
|---|---|---|
| `PyPDF2.PdfReader` | Direct | PDF text extraction |
| `pdf2image.convert_from_path` | Try/except | Fallback PDF OCR (converts pages to images) |
| `docx.Document` | Try/except | DOCX paragraph extraction |
| `pptx.Presentation` | Try/except | PPTX slide shape text extraction |
| `PIL.Image` | Direct | Image loading for OCR |
| `pytesseract` | Try/except | OCR engine for images and PDF fallback |

If an optional library is missing, its import is set to `None` and the corresponding extractor returns an empty string.

## 3. Key Features

### Entry Point: `extract_text(file_path, extension)`

Central dispatcher at line 130. Normalizes extension to lowercase, then routes to the correct extractor.

```python
def extract_text(file_path, extension):
    extension = extension.lower()
    if extension == "pdf":        return extract_pdf_text(file_path)
    elif extension == "docx":     return extract_docx_text(file_path)
    elif extension in ["ppt","pptx"]: return extract_pptx_text(file_path)
    elif extension in ["jpg","jpeg","png"]: return extract_image_text(file_path)
    elif extension == "txt":      # reads file directly with utf-8
    return ""
```

Supported extensions: `pdf`, `docx`, `ppt`, `pptx`, `jpg`, `jpeg`, `png`, `txt`. Unknown extensions return empty string.

### Format-Specific Extractors

#### `extract_pdf_text(pdf_path)` — lines 24-82
Two-phase extraction strategy:
1. **Primary**: Uses `PyPDF2.PdfReader` to iterate pages and call `page.extract_text()`. Concatenates all page text.
2. **OCR fallback** (only if primary yields empty/whitespace): Converts PDF to images via `pdf2image.convert_from_path`, then runs `pytesseract.image_to_string()` per page with `lang="eng"`.

Both phases catch exceptions and log errors. Returns best available text.

#### `extract_docx_text(path)` — lines 84-97
Opens document with `python-docx`, iterates `doc.paragraphs`, concatenates `paragraph.text` with newline separators. Returns empty string if `Document` is `None`.

#### `extract_pptx_text(path)` — lines 99-116
Opens presentation with `python-pptx`, iterates slides → shapes, checks `hasattr(shape, "text")` before extracting. Concatenates shape text with newlines. Returns empty string if `Presentation` is `None`.

#### `extract_image_text(path)` — lines 118-128
Opens image with PIL, runs `pytesseract.image_to_string()` with multi-language support: `lang="eng+urd+ara"` (English, Urdu, Arabic). Returns empty string if `pytesseract` is `None`.

#### Plain text handling — lines 150-159
Reads file directly with `open()` using UTF-8 encoding and `errors="ignore"` for resilience.

## 4. Error Handling

- All extractors catch broad `Exception` and log errors without crashing.
- PDF extractor prints diagnostics (`PDF PATH`, `Images Created`, `Page N OCR Length`, `FINAL OCR LENGTH`).
- Missing optional dependencies silently disable their format (return empty string).
- OCR errors are caught and logged at both page and final stages.

## 5. Data Flow

```
extract_text(file_path, ext)
  ├─ "pdf"  → extract_pdf_text()
  │           ├─ Try PyPDF2 first
  │           └─ Fallback: pdf2image + pytesseract OCR
  ├─ "docx" → extract_docx_text() → python-docx paragraphs
  ├─ "pptx" → extract_pptx_text() → python-pptx shapes
  ├─ "jpg"  → extract_image_text() → pytesseract OCR
  └─ "txt"  → direct file read (utf-8)
```
