# Technical Analysis of server.py

## 1. Overview
A minimal Python HTTP server that serves static frontend files on port 5500. The server provides a development-friendly way to test the frontend without a full web server stack.

## 2. Architecture & Setup
- **Imports:** `http.server`, `socketserver`, `os` (standard library only)
- **Configuration:** Port defined as constant `PORT = 5500`
- **Initialization:** Changes working directory to the script's location using `os.chdir(os.path.dirname(os.path.abspath(__file__)))`

## 3. Key Features / UI Panels
- Serves all static files in the frontend directory recursively
- Listens on all interfaces (`""`) on port 5500
- Prints startup messages with the URL and instructions to stop

## 4. Data Structure & Persistence
- **No data persistence** - This is a stateless file server
- Files served directly from disk without caching layer

## 5. Logic & Event Handlers
- **`handler`**: Assigned `http.server.SimpleHTTPRequestHandler` for handling requests
- **`httpd.serve_forever()`**: Main event loop listening for connections
- **Graceful shutdown**: Uses context manager (`with` statement) for proper socket cleanup on `CTRL+C`

## 6. UX & Styling Details
- **Console Output:**
  - URL format: `http://127.0.0.1:{PORT}` (blue color implied by standard terminal)
  - Stop instruction: `Press CTRL+C to stop`
- **No frontend styling** - Server only, no CSS or UI components
- **Layout**: Terminal-based output only

---

**File:** `/home/luca/falcon/frontend/server.py` (13 lines)
**Last Updated:** 2026-06-14