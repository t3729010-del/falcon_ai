# Technical Analysis of quiz-materials.js

## 1. Overview

`quiz-materials.js` (426 lines) handles material upload and management for quiz generation. It supports category selection, file input via button and drag & drop, file upload to the backend, material card rendering with selection toggling, deletion, and navigation guards that prevent quiz/descriptive mode without selected materials.

## 2. Architecture & Setup

### Imports / Dependencies
- No external JS libraries
- Browser-native: `fetch`, `FormData`, `FileReader`, `dragover`/`drop` events

### Global State
```javascript
let selectedMaterialIds = JSON.parse(localStorage.getItem("selectedMaterials")) || [];
```

### DOM References (inside DOMContentLoaded)
```javascript
const menuBtn = document.querySelector(".menu-btn");
const sidebar = document.querySelector(".sidebar");
const categoryButtons = document.querySelectorAll(".category-btn");
const uploadBox = document.querySelector(".upload-box");
const uploadBtn = document.querySelector(".upload-btn");
const processingFill = document.querySelector(".processing-fill");
const processingText = document.querySelector(".processing-card span");
const fileInput = document.createElement("input"); // Dynamically created
```

### Initialization
```javascript
document.addEventListener("DOMContentLoaded", () => {
    loadMaterials();
    // ... event bindings
});
```

## 3. Key Features / UI Panels

### Category Selection
```javascript
categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        categoryButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
    });
});
```
- Single-select behavior; only one category active at a time

### File Input
```javascript
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.multiple = true;
fileInput.accept = ".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg";
```
- Hidden input triggered by upload button click
- Accepted formats: PDF, PowerPoint, Word, PNG, JPG

### Drag & Drop
```javascript
uploadBox.addEventListener("dragover", e => {
    e.preventDefault();
    uploadBox.style.borderColor = "#00d9ff";
});
uploadBox.addEventListener("dragleave", () => {
    uploadBox.style.borderColor = "rgba(0,217,255,0.35)";
});
uploadBox.addEventListener("drop", e => {
    e.preventDefault();
    uploadBox.style.borderColor = "rgba(0,217,255,0.35)";
    handleFiles(e.dataTransfer.files);
});
```
- Border color changes on dragover (#00d9ff) and resets on dragleave/drop

### handleFiles(files)
```javascript
async function handleFiles(files)
```
- Shows "Uploading material..." text
- Calls `simulateProgress()` for visual feedback
- Iterates files, creates `FormData` with file, POSTs to `/upload_material`
- On success: reloads materials list
- Sets text to "Quiz generation ready" after completion

### simulateProgress()
```javascript
function simulateProgress()
```
- Increments `.processing-fill` width by 10% every 250ms up to 100%

### addMaterialCard(fileName)
```javascript
function addMaterialCard(fileName)
```
- Creates `.history-card` with file icon, title, "Uploaded just now" text
- Prepends to `.history-grid`

### loadMaterials()
```javascript
async function loadMaterials()
```
- Fetches `GET /materials`
- Renders cards with: file icon, title, type, "Choose" button, "Delete" button
- Restores selection state from LocalStorage
- Selected cards get `.selected-material` class and "Selected ✓" text

### deleteMaterial(materialId)
```javascript
async function deleteMaterial(materialId)
```
- Confirmation dialog before deletion
- `DELETE /material/{id}`
- Removes from `selectedMaterialIds` if present
- Updates LocalStorage, reloads materials

### toggleMaterial(id, button)
```javascript
function toggleMaterial(id, button)
```
- Adds/removes ID from `selectedMaterialIds`
- Toggles button text ("Choose" ↔ "Selected ✓")
- Toggles `.selected-material` class on card
- Persists to LocalStorage

### Navigation Guards
```javascript
const mcqLink = document.querySelector('a[href="mcq.html"]');
mcqLink.addEventListener("click", function(e) {
    if (selectedMaterialIds.length === 0) {
        e.preventDefault();
        alert("Please select at least one file first.");
        return;
    }
    localStorage.setItem("selectedMaterials", JSON.stringify(selectedMaterialIds));
});
```
- Same guard on descriptive link
- Blocks navigation if no materials selected
- Saves selections to LocalStorage before navigation

## 4. Data Structure & Persistence

### LocalStorage Keys
| Key | Type | Description |
|-----|------|-------------|
| `selectedMaterials` | `number[]` | Array of selected material IDs |

### SessionStorage Keys
None.

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/upload_material` | Upload a material file (FormData) |
| GET | `/materials` | List all uploaded materials |
| DELETE | `/material/{id}` | Delete a material |

## 5. Logic & Event Handlers

| Function | Trigger | Behavior |
|----------|---------|----------|
| `loadMaterials()` | Page load, after upload/delete | Fetches and renders material cards |
| `handleFiles(files)` | File input change, drag & drop | Uploads files to backend |
| `simulateProgress()` | During upload | Animates progress bar |
| `addMaterialCard(name)` | After upload | Adds card to grid |
| `deleteMaterial(id)` | Delete button click | Confirms and deletes material |
| `toggleMaterial(id, btn)` | Choose button click | Toggles material selection |
| Category button handler | Click | Sets active category |
| Upload button handler | Click | Triggers hidden file input |
| MCQ link guard | Click | Blocks if no materials selected |
| Descriptive link guard | Click | Blocks if no materials selected |
| Menu toggle handler | Click | Toggles sidebar collapsed state |

## 6. UX & Styling Details

### Upload Box
- Default border: `rgba(0,217,255,0.35)`
- Dragover border: `#00d9ff`
- Processing bar: `.processing-fill` element with animated width

### Material Cards
- `.history-card` class with file icon (📄), title, type
- Selected state: `.selected-material` class, button text "Selected ✓"
- Default state: button text "Choose"

### Category Buttons
- Single active at a time via `.active` class

### Sidebar
- Toggle via `.collapsed` class on `.sidebar`
