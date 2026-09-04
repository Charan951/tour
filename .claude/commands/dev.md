---
description: Start the full local dev stack (Express API + Vite client)
---

Run the monorepo dev servers from the repo root:

```bash
npm run dev
```

This runs `dev:server` (tsx watch, http://localhost:5000) and `dev:client`
(Vite, http://localhost:5173) concurrently. The client proxies `/api` to
`127.0.0.1:5000`.

If the user only wants one side, use `npm run dev:server` or `npm run dev:client`.
Report the URLs once both are up; do not block waiting on the long-running process.
