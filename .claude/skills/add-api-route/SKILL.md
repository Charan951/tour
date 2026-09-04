---
name: add-api-route
description: >
  Step-by-step recipe for adding a new REST endpoint to the HolidayCity backend
  (route + controller + model), keeping auth, roles, caching, realtime, and shared
  types consistent with the existing codebase. Use when the user asks to add a
  backend API endpoint, resource, or CRUD set under /api/v1.
---

# Add an API route

## 0. Pre-work
- Do the `logs.md` check (root `CLAUDE.md` → "Workflow: logs.md"). Add an entry if missing.
- Skim `CLAUDE.md` backend section + `API Overview.md`.

## 1. Model — `server/src/models/<Name>.ts`
- Define the Mongoose schema. Add `{ timestamps: true }`.
- Add indexes for every field you will filter or sort on.
- Generate `slug` on save if the resource is user-facing (copy pattern from `Package.ts`).

## 2. Controller — `server/src/controllers/<name>Controller.ts`
- One exported handler per operation: `get<Name>s`, `get<Name>BySlug`, `create<Name>`,
  `update<Name>`, `delete<Name>`.
- Respond with `res.json({ success: true, message, data })`.
- List handlers: `.lean()`, `.select(...)`, `.limit(...)`.
- After a mutation that the admin panel / mobile should see live, emit via `global.io`
  (see `bookingController.ts` / `enquiryController.ts`).

## 3. Route — `server/src/routes/api.ts`
- Public reads: add near the other public `router.get(...)` lines.
- Admin writes: add under the `router.use('/admin', authenticateToken)` block, with
  `requireRole([...])` matching the role list used by sibling resources.
- Add `cacheMiddleware(ttl)` **only** if this GET should be cached; otherwise leave it live.
- Do NOT add manual cache-busting — `invalidateCache` already clears the API cache on writes.

## 4. Shared contract (if the client consumes it)
- Add types to `shared/types/index.ts` and zod schemas to `shared/validators/index.ts`.

## 5. Verify
- `npm run build:server` — must pass with zero TS errors.
- Manually hit the endpoint (curl / REST client) against `npm run dev:server`.

## 6. Close out
- Update the `logs.md` entry (`Status`, `Files/areas`, `Outcome`).
- If it changes architecture or adds an integration, update `MEMORY.md`.
