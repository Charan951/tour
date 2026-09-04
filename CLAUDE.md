# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow: logs.md (READ FIRST on every feature/task request)

Before starting **any** new feature, change, or task:

1. **Read `logs.md`** at the repo root.
2. Search it for the requested feature/task.
   - **If it is already logged:** review that entry (and any linked notes) for prior
     decisions, files touched, and status before doing anything. Continue from there —
     do not redo settled work.
   - **If it is NOT logged:** append a new entry to `logs.md` *before* starting work, using
     the format below, then proceed.
3. When the task is finished (or paused), update its `logs.md` entry: set **Status** and
   add a one-line **Outcome** (files/areas changed, key decision).

Entry format (newest entries at the top of the log table/list in `logs.md`):

```
### <YYYY-MM-DD HH:MM> — <Feature name> — <Task name>
- Status: Planned | In progress | Done | Blocked
- Request: <what the user asked for, one line>
- Files/areas: <paths>
- Outcome: <what was done / decided>
```

Keep `logs.md` append-only history; keep durable architecture facts in `MEMORY.md`, not `logs.md`.

## Project

**HolidayCity** — enterprise travel booking & lead-management platform. Monorepo with three
deployables sharing one backend:

- `server/` — Express 4 + TypeScript REST API (`/api/v1`), MongoDB (Mongoose), Socket.io, Redis (optional).
- `client/` — React 19 + Vite 6 + Tailwind v4 SPA. Serves the public marketing site, the logged-in
  user dashboard, **and** the `/admin` back-office, all from one bundle.
- `mobile/` — Flutter app (Provider state, `http`), consumes the same `/api/v1`.

There is no test suite in any package.

## Commands

Run from repo root (each delegates into the sub-package via `npm --prefix`):

```bash
npm run dev            # server (tsx watch, :5000) + client (vite, :5173) concurrently
npm run dev:server     # backend only
npm run dev:client     # frontend only
npm run build          # build:server (tsc) then build:client (tsc -b && vite build)
npm run seed           # seed MongoDB (server/src/seed/seedData.ts)
npm run start          # tsc + node dist/index.js
```

Client dev server proxies `/api` → `http://127.0.0.1:5000`. Client also reads `VITE_API_URL`
(host only; `/api/v1` is appended in `client/src/api/apiClient.ts`).

Mobile: `cd mobile && flutter pub get && flutter run`. API base URL in `mobile/lib/config/api_config.dart`.

Lint/tests: none configured. Type-checking is the only static gate (`tsc`).

## Backend architecture

- **Entry:** `server/src/index.ts` — sets up compression, Helmet security headers, CORS,
  `express-mongo-sanitize`, mounts `routes/api.ts` at `/api/v1`, then a global error handler.
  Socket.io is attached to the HTTP server and exposed as `global.io` /
  `global.socketConnectedUsers`. On boot it also copies client logos into `mobile/assets/images/`.
- **All routes live in one file:** `server/src/routes/api.ts`. Pattern is
  `controller` → `model`. Controllers are in `server/src/controllers/`, Mongoose models in
  `server/src/models/`.
- **Auth:** JWT Bearer tokens. `authenticateToken` guards everything under `/api/v1/admin/*`.
  `requireRole([...])` checks `req.user.role`; **`Super Admin` bypasses every role check**.
  `optionalAuth` (defined inside `api.ts`) attaches `req.user` if a token is present but never blocks —
  used for public `my`-scoped endpoints (`/enquiries/my`, `/bookings/my`).
  Fallback JWT secret is hardcoded in `middleware/auth.ts` and `api.ts` — override via `JWT_SECRET`.
- **Caching (`middleware/cacheMiddleware.ts` + `config/redis.ts`):** multi-tier (browser +
  CDN `Cache-Control` + Redis). **Redis is optional** — `config/redis.ts` falls back to an
  in-process `MemoryCache` (LRU, 1000 items) when `REDIS_URL` is absent.
  A global `invalidateCache` middleware in `api.ts` clears the entire API cache on any
  successful `POST/PUT/PATCH/DELETE`. Many GET routes are deliberately left uncached
  ("Live MongoDB Queries with No-Cache Headers" per comments).
- **Realtime:** controllers emit Socket.io events after writes so admin panel / mobile stay in sync.
  Rooms: `general_updates` (join via `join_updates`), `chat_<topicId>` (join via `join_chat_topic`).
- **Uploads:** `routes/uploadRoutes.ts` + `controllers/uploadController.ts` → Cloudinary (`multer` memory storage).
- **SEO:** `controllers/sitemapController.ts` serves `/sitemap.xml` and `/api/v1/sitemap.xml`.
- **Rate limiting:** `authRateLimiter`, `enquiryRateLimiter`, `contactRateLimiter` from `middleware/security.ts`.
- **Email:** `services/emailService.ts` via `nodemailer`.

Domain models: `User`, `Role`, `Package`, `Destination`, `Banner`, `ThemeBanner`, `Enquiry` (CRM lead),
`Booking`, `ChatMessage`, `CMS` (blogs/testimonials/FAQ/settings), `AuditLog`.

## Frontend architecture

- **Single SPA, three audiences.** `client/src/App.tsx` is the router. Route trees:
  public marketing pages, user dashboard (`/dashboard`, `/profile`, `/my-bookings`,
  `/my-enquiries`, `/login` — all render `UserDashboardPage`), admin (`/admin/*`).
- **Mobile vs desktop is a runtime JS switch, not CSS.** `App.tsx` tracks
  `window.innerWidth < 1024` and swaps in dedicated `Mobile*Page` components
  (e.g. `MobilePackagesPage` vs `PackageCatalogPage`) that mirror the Flutter app.
  On mobile all web chrome (Navbar/Footer/FAB/Splash) is hidden.
- **Pages** in `client/src/pages/<Feature>/`, **admin pages** in `client/src/admin/pages/`.
  All pages are `React.lazy`-loaded.
- **API layer:** `client/src/api/apiClient.ts` — a single axios instance. Request interceptor
  attaches `localStorage` token, preferring user token `hc_token` then admin token `hc_access_token`.
  Response interceptor clears `clientCache`, dispatches `hc_data_updated` +
  `realtime:data_changed` window events after mutations, and handles 401/403.
- **Realtime sync:** `client/src/hooks/useRealtimeUpdates.ts` + `socket.io-client`.
- **Data fetching:** `@tanstack/react-query`. **Forms:** `react-hook-form` + `zod` via
  `@hookform/resolvers`. **Animation:** `framer-motion`. **Toasts:** `react-hot-toast`.
  **SEO:** `react-helmet-async`. **Charts:** `recharts`.
- **Path aliases:** `@` → `client/src`, `@shared` → `shared/`.

## Shared

`shared/types/index.ts` and `shared/validators/index.ts` — types and zod validators intended to be
shared across server and client (imported as `@shared/...` in the client).

## Deployment

Vercel. `vercel.json` (root and `client/`) rewrites all paths to `/index.html` (SPA fallback).
Server builds to `server/dist/`.

## .claude/ tooling

```
.claude/
├── CLAUDE.md        # index for this dir (root CLAUDE.md stays canonical)
├── settings.json    # committed project permissions/env (settings.local.json is git-ignored)
├── commands/        # /dev, /build, /seed, /log-feature
├── agents/          # api-route-builder, mongoose-model-reviewer
└── skills/add-api-route/SKILL.md
```

## Reference docs

The original root spec docs (`prd.md`, `phases.md`, `Information Architecture.md`,
`Admin Information Architecture.md`, `MongoDB Database Architecture.md`, `API Overview.md`,
`Frontend Architecture (React.js).md`, `UI UX Design System.md`, `security.md`, `seo.md`,
`optimisation.md`, `PROJECT_DOCUMENTATION.md`, `REALTIME_*.md`, `CRUD_OPERATIONS_FIXED.md`) were
**consolidated into `MEMORY.md` and deleted** on 2026-08-27. They were aspirational v1.0
specifications and overstated scope — see `MEMORY.md` §7 / §11 for the spec-vs-implementation gaps.
Recoverable from git history if needed.
