# Strategic Code Documentation Skill

This skill defines the standardized method for documenting any code file, asset, or configuration within the project's `maps/references/` system. Use thisapproach to ensure technical documentation remains high-fidelity, consistent, and actionable.

## 1. Documentation Objective
Every reference document must provide a "blueprint" of the file such that another developer (or AI) can understand the logic, data flow, and visual implementation without reading the raw source code.

## 2. File-Specific Documentation Patterns

### A. UI/Frontend Files (.html, .js, .css, .jsx, .vue)
Focus on the interaction between markup and logic.
- **Visual Structure**: Describe the screen layout (Sidebar, Header, Main Container).
- **Component Breakdown**: Document individual UI sections (KPI Cards, Data Tables, Modals).
- **State Management**: List global variables and reactive states.
- **Function Mapping**: Table of key functions, their parameters, and their impact on the UI.
- **Styling Tokens**: Document specific CSS variables or unique class patterns used.

### B. Logic & API Files (.js, .py, .go, .ts)
Focus on data processing and business rules.
- **Entry Points**: Document the main exported functions or classes.
- **Dependencies**: List imported libraries and their specific role in this file.
- **Flow Diagrams**: (Optional) Use Mermaid to visualize complex logical branches.
- **Error Handling**: Document how failures are caught and reported.

### C. Data & Configuration (.json, .env, .yaml, .sql)
Focus on schema and environment requirements.
- **Schema Reference**: Provide a sample JSON object or SQL table definition.
- **Key Descriptions**: Table explaining every key/variable and its expected value type.
- **Security**: For `.env`, document what keys are required without exposing actual secrets.

### D. Assets (Images, Icons, Fonts)
Focus on usage and placement.
- **Source/Origin**: Where the asset came from (e.g., Lucide, Google Fonts).
- **Implementation**: How it is referenced in code (e.g., `<i data-lucide="...">`).

---

## 3. Standard Document Structure
Follow this header hierarchy for all reference files in `maps/references/`:

1.  **# Technical Analysis of [filename]**
2.  **## 1. Overview**: Brief summary of the file's primary responsibility.
3.  **## 2. Architecture & Setup**: Imports, styles, and initialization.
4.  **## 3. Key Features / UI Panels**: Detailed breakdown of functionality.
5.  **## 4. Data Structure & Persistence**: Schema and storage details.
6.  **## 5. Logic & Event Handlers**: Specific function documentation.
7.  **## 6. UX & Styling Details**: Colors, animations, and layout specifics.

---

## 4. Maintenance Rules
- **Sync Requirement**: Documentation MUST be updated immediately after any code change.
- **Link Integrity**: Always use relative links to other reference files (e.g., `[common.js](./common-js.md)`).
- **No Placeholders**: If a feature is implemented, its logic must be described, not just listed.
- **Code Snippets**: Use small, representative JSON or code blocks. Do not dump the entire file.
