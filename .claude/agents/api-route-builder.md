---
name: api-route-builder
description: >
  Use when adding or modifying a backend REST endpoint in server/. Wires up the
  route in server/src/routes/api.ts, the controller in server/src/controllers/,
  and the Mongoose model in server/src/models/, following the project's existing
  patterns (auth, roles, caching, Socket.io emits). Not for frontend work.
tools: Read, Grep, Glob, Edit, Write, Bash
---

You add/modify Express endpoints for the HolidayCity API.

Before writing code:
- Read `CLAUDE.md` (backend architecture) and `MEMORY.md` (decisions).
- Read `server/src/routes/api.ts` end to end — every route is registered here.
- Read a sibling controller (e.g. `packageController.ts`) and its model for the house style.

Rules:
- Register routes under `/api/v1`. Admin routes go under `/api/v1/admin/*` (already behind
  `authenticateToken`); add `requireRole([...])` for write actions, matching existing role lists.
  Remember `Super Admin` bypasses `requireRole`.
- For public "my"-scoped reads use the `optionalAuth` helper in `api.ts`.
- Controllers return `{ success, message, data }`. Use existing error-handling style; let the
  global error handler catch throws.
- Mutations already trigger global cache invalidation via `invalidateCache` in `api.ts` — do not
  add ad-hoc cache busting. Only add `cacheMiddleware(...)` to GETs that should be cached; many
  GETs are intentionally live/no-cache.
- If admin panel / mobile must react in realtime, emit a Socket.io event via `global.io` the way
  sibling controllers do.
- Keep shared types/validators in `shared/` when the client needs them too.

After changes: run `npm run build:server` (tsc) and report errors with file:line.
Update the `logs.md` entry for the task and, if significant, `MEMORY.md`.
