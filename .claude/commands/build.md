---
description: Production build of server (tsc) and client (vite)
---

From the repo root:

```bash
npm run build
```

Runs `build:server` (`tsc` -> `server/dist/`) then `build:client`
(`tsc -b && vite build` -> `client/dist/`). Type errors fail the build — this is
the project's only static gate, so treat a clean build as the pass criteria.

Report any TypeScript errors with file:line; do not "fix" by loosening tsconfig
without asking.
