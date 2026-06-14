# Technical Analysis of admin.js

## 1. Overview

`admin.js` (100 lines) implements an avatar provider diagnostics dashboard. It displays the status of all avatar generation providers (active, available, unavailable), shows generation statistics (timing, counts, errors), and allows testing avatar generation with a synthetic test image. It auto-refreshes every 10 seconds.

## 2. Architecture & Setup

### DOM References
```javascript
// #refresh-btn — manually refresh diagnostics
// #test-avatar-btn — test avatar generation
// #active-provider — displays active provider name
// #available-count — displays available/total providers
// #provider-grid — container for provider cards
```

### Initialization
```javascript
loadDiagnostics();
setInterval(loadDiagnostics, 10000);  // Auto-refresh every 10s
```

## 3. Key Features / UI Panels

### loadDiagnostics()
```javascript
async function loadDiagnostics()
```
- Fetches `GET /avatar/diagnostics`
- Updates `#active-provider` with provider name
- Updates `#available-count` with "{available} / {total}" format
- Renders provider cards in `#provider-grid`:
  - Provider name and status badge
  - Model name and detail
  - Last error (if any)
  - Statistics: generation time, total generations, failed generations
- Error handling: shows error message in provider grid

### Provider Card Structure
```javascript
const grid = document.getElementById('provider-grid');
grid.innerHTML = data.providers.map(p => {
    const isActive = p.name === data.active_provider;
    const statusClass = p.available ? 'available' : 'unavailable';
    const badgeClass = p.available ? 'ready' : 'unavailable';
    const activeClass = isActive ? 'active' : '';
    const badgeText = isActive ? 'ACTIVE' : p.available ? 'READY' : 'UNAVAILABLE';
    // Returns HTML string for provider card
}).join('');
```

### Test Avatar Generation
```javascript
document.getElementById('test-avatar-btn').addEventListener('click', async () => {
    // Creates synthetic test image (256x256 canvas with face-like shapes)
    // Sends to POST /generate_avatar
    // Displays result alert with provider name and timing
});
```

- Creates 256×256 canvas with:
  - Dark background (`#0a1628`)
  - Face ellipse (`#d4b896`)
  - Eye ellipses (`#333`)
  - Smile arc
- Converts to base64 data URL
- POSTs to `/generate_avatar`
- Result handling:
  - `use_browser_fallback`: Shows browser fallback notice
  - `success`: Shows provider name and inference time
  - `error`: Shows error message

### Refresh Button
```javascript
document.getElementById('refresh-btn').addEventListener('click', loadDiagnostics);
```

## 4. Data Structure & Persistence

### LocalStorage Keys
None.

### SessionStorage Keys
None.

### API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/avatar/diagnostics` | Fetch provider diagnostics |
| POST | `/generate_avatar` | Test avatar generation |

### Diagnostics Response
```json
{
    "active_provider": "provider_name",
    "available_count": 2,
    "total_providers": 3,
    "providers": [
        {
            "name": "provider_name",
            "model": "model_name",
            "detail": "description",
            "available": true,
            "last_error": null,
            "last_generation_time_ms": 1500,
            "total_generations": 42,
            "failed_generations": 2
        }
    ]
}
```

## 5. Logic & Event Handlers

| Function | Trigger | Behavior |
|----------|---------|----------|
| `loadDiagnostics()` | Page load, refresh button, every 10s | Fetches and renders provider status |
| Refresh button handler | Click | Manually triggers `loadDiagnostics()` |
| Test avatar button handler | Click | Creates test image, sends to backend, shows result |
| Auto-refresh | setInterval | Calls `loadDiagnostics()` every 10 seconds |

## 6. UX & Styling Details

### Provider Cards
- `.provider-card` base class
- Status classes: `.available`, `.unavailable`, `.active`
- Badge classes: `.ready`, `.unavailable`, `.active`

### Badge Text
- Active provider: "● ACTIVE"
- Available provider: "READY"
- Unavailable provider: "UNAVAILABLE"

### Provider Statistics
- Generation time: `{time}ms` or "—"
- Total generations: count
- Failed generations: count

### Test Button States
- Default: "Test Avatar Generation"
- Testing: "Testing..." (disabled)
- After: Restored to default, diagnostics refreshed

### Auto-refresh
- 10-second interval for live monitoring
- Manual refresh available via button
