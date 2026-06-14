# Technical Analysis of dashboard.html

## 1. Overview
Main hub of the Falcon AI platform. Presents three feature cards for Emotional Supporter, Interactive Explainer, and Quiz Assistant, each linking to a dedicated page. Features animated particles and a background glow.

## 2. Architecture & Setup
- **DOCTYPE:** HTML5
- **Language:** `en`
- **CSS:** `dashboard.css`
- **Scripts:** None (pure HTML navigation)
- **Meta:** UTF-8, responsive viewport

## 3. Key Features / UI Panels
- **Particles:** 8 `<span>` elements inside `<div class="particles">`
- **Background layers:** `.background` and `.bg-glow` divs
- **Navbar:**
  - Logo image: `assets/Falcon 1.png`
  - Title: `<h2>FALCON AI</h2>`
- **Main Content:**
  - Heading: "Choose Your Learning Experience"
  - Subtitle: "Specialized intelligent learning systems powered by Falcon AI."
- **Cards Container (`.cards-container`):**
  - **Card 1 - Emotional Supporter:** Description + `<a href="emotional.html">` with button "Enter Support Mode"
  - **Card 2 - Interactive Explainer:** Description + `<a href="explainer.html">` with button "Start Learning"
  - **Card 3 - Quiz Assistant:** Description + `<a href="quiz-materials.html">` with button "Begin Challenge"

## 4. Data Structure & Persistence
No data persistence. Static navigation hub.

## 5. Logic & Event Handlers
- Card buttons are wrapped in `<a>` tags for direct navigation
- No JavaScript logic

## 6. UX & Styling Details
- **Particles animation:** 8 floating spans for visual effect
- **Background glow:** `.bg-glow` provides ambient lighting effect
- **Card layout:** Horizontal grid of 3 cards with title, description, and CTA button
