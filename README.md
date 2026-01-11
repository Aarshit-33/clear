# Daily Control Room

A personal cognitive offloading & decision-making system.

## Philosophy
-   **Dump, don't manage.**
-   **Backend decides, frontend obeys.**
-   **One screen per mode.**

## Quick Start

1.  **Server**:
    ```bash
    cd server
    npm install
    npm run dev
    ```

2.  **Client**:
    ```bash
    cd client
    npm install
    npm run dev
    ```

3.  **Open**: http://localhost:5173

## Features
-   **The Dump**: Type anything, hit Cmd+Enter. It's gone.
-   **The Brain**: Background worker processes dumps into tasks.
-   **Daily Focus**: Every morning (or manually), the system picks your Top 3 tasks.

## AI Configuration
To enable smart task extraction, add your Google Gemini API key to `server/.env`:
```
GEMINI_API_KEY=...
```
Without it, the system uses a simple fallback (1 dump = 1 task).
