# Project Memory

Durable context for **HolidayCity**. Per-task history → `logs.md`. Commands/architecture → `CLAUDE.md`.
Product truth → `PRODUCT.md`. Visual system → `DESIGN.md` (+ `.impeccable/design.json` sidecar).
Both written 2026-08-27 via `/impeccable init` + `document`.

> This file absorbs the content of the original root spec docs (`prd.md`, `phases.md`,
> `Information Architecture.md`, `Admin Information Architecture.md`,
> `MongoDB Database Architecture.md`, `API Overview.md`, `Frontend Architecture (React.js).md`,
> `UI UX Design System.md`, `security.md`, `seo.md`, `optimisation.md`,
> `PROJECT_DOCUMENTATION.md`, `CRUD_OPERATIONS_FIXED.md`, `REALTIME_*.md`), which were
> deleted on 2026-08-27 after extraction. They were **v1.0 "Approved" specifications** —
> aspirational targets. Where spec and code disagree, **the code wins** (see §7/§11).

---

## 1. Project Snapshot

- Product: travel **lead-generation + booking** platform. Tagline "Explore. Experience. Enjoy."
  Visitors browse packages/destinations, submit enquiries; consultants convert leads to bookings
  via the admin back-office. Also real-time chat support + advance/remaining booking payments.
- Framework: React 19 (client) / Express 4 (server) / Flutter (mobile)
- Language: TypeScript (client + server), Dart (mobile)
- Package manager: npm monorepo — root delegates via `npm --prefix`
- Build: Vite 6 (client), tsc (server), Flutter (mobile)
- Architecture: one Express `/api/v1` backend serves the React SPA **and** the Flutter app
- Styling: Tailwind CSS v4 (beta) via `@tailwindcss/vite`
- State: @tanstack/react-query (server state); React state/Context for UI; Provider (mobile)
- Routing: react-router-dom v7 — single SPA holds public site + user dashboard + `/admin`
- Backend API: REST `/api/v1`, all routes in `server/src/routes/api.ts`; Socket.io for realtime
- Auth: JWT Bearer tokens (`Authorization: Bearer`). `Super Admin` role bypasses every `requireRole`
- Realtime: Socket.io — DB writes emit `<entity>:created|updated|deleted` to `general_updates`;
  chat rooms `chat_<topicId>`
- Media: Cloudinary (multer memory storage)
- Email: nodemailer / SMTP (Gmail in the documented setup) — booking/enquiry/payment/chat notifications
- Cache: Redis optional; falls back to in-process LRU MemoryCache (1000 items)
- Testing: none
- Deployment: Vercel (SPA rewrite → /index.html); server builds to `server/dist/`.
  Spec targeted AWS EC2 + Nginx + PM2 + CloudFront — not the current deploy.

## 2. Architecture

### Backend (`server/src/`)
- `index.ts` — bootstrap: compression, Helmet headers, CORS, `express-mongo-sanitize`,
  mounts `routes/api.ts` at `/api/v1`, global error handler, Socket.io on the HTTP server
  (`global.io`, `global.socketConnectedUsers`). Also copies client logos → `mobile/assets/images/` on boot.
- `routes/api.ts` — **every route lives here**. Public routes first; everything under
  `/api/v1/admin/*` is behind `authenticateToken`. `optionalAuth` (defined in this file) attaches
  `req.user` if a token is present but never blocks — used by `/enquiries/my`, `/bookings/my`.
  A global `invalidateCache` middleware clears the whole API cache after any successful
  `POST/PUT/PATCH/DELETE`.
- `controllers/*` → `models/*` (Mongoose). Controllers respond `{ success, message, data }`.
- `middleware/`: `auth.ts` (`authenticateToken`, `requireRole`), `security.ts` (Helmet/CORS,
  `authRateLimiter` / `enquiryRateLimiter` / `contactRateLimiter`, global error handler),
  `cacheMiddleware.ts` (multi-tier browser + CDN `Cache-Control` + Redis/memory), `rateLimiter.ts`.
- `config/`: `db.ts` (Mongoose connect), `redis.ts` (ioredis + MemoryCache fallback,
  `getCache/setCache/clearCachePattern/getCacheStatus`), `cloudinary.ts`,
  `socketEvents.ts` (`emitCreate/emitUpdate/emitDelete/emitToRoom/broadcastToAll`), `socketInit.ts`.
- `controllers/sitemapController.ts` serves `/sitemap.xml` and `/api/v1/sitemap.xml` (cached 300s).
- `routes/uploadRoutes.ts` + `uploadController.ts` → Cloudinary image upload.
- `services/emailService.ts` — nodemailer HTML templates.
- `seed/seedData.ts` — `npm run seed`.

### Frontend (`client/src/`)
- `App.tsx` is the router. Route groups: public marketing pages; user dashboard
  (`/dashboard`, `/profile`, `/my-bookings`, `/my-enquiries`, `/login` → all render
  `UserDashboardPage`); admin (`/admin/*`).
- **Mobile vs desktop is a runtime JS switch, not CSS**: `App.tsx` tracks `window.innerWidth < 1024`
  and swaps dedicated `Mobile*Page` components (mirror the Flutter app). On mobile all web chrome
  (Navbar/Footer/FloatingActionWidget/SplashScreen) is hidden; nav is bottom-tab style.
- Pages in `pages/<Feature>/`, admin pages in `admin/pages/`. All `React.lazy`-loaded.
- `api/apiClient.ts` — single axios instance. `baseURL` from `VITE_API_URL` (host only) + `/api/v1`,
  else `/api/v1` (Vite dev proxies to `127.0.0.1:5000`). Request interceptor adds bearer token,
  preferring user token `hc_token` then admin token `hc_access_token`. Response interceptor: after
  mutations clears `clientCache`, dispatches `hc_data_updated` + `realtime:data_changed` window
  events; on 401/403 handles session expiry.
- `hooks/useRealtimeUpdates.ts` — socket.io-client hook: `onPackageUpdate` / `onDestinationUpdate` /
  `onBlogUpdate` / `onDataUpdate(type,data)`, `isConnected`, `forceRefresh`, plus
  `disconnectSocket` / `reconnectSocket` exports. Auto-reconnect (10 attempts) + polling fallback.
  Admin manager pages use this instead of polling for instant multi-tab sync.
- Libs: react-hook-form + zod (`@hookform/resolvers`), framer-motion, react-hot-toast,
  lucide-react, recharts (admin charts), react-helmet-async (SEO), swiper, dayjs.
- Path aliases: `@` → `client/src`, `@shared` → `shared/`.

### Mobile (`mobile/lib/`)
- Flutter, Provider state, `http`. `config/api_config.dart` holds the API base URL.
- `services/*` call `/api/v1`; `providers/*` hold state; `views/*` are screens
  (auth, home, packages, destinations, themes, booking, enquiry, chat, profile, onboarding, splash).
- Chat via `views/chat/chat_bottom_sheet.dart`; bookings support pay-remaining bottom sheet.
- Shared visual pattern (2026-08-27 web-mobile-redesign port): `AppTheme.headerGradient`
  (primaryDarkColor → primaryColor → secondaryColor) + `AppTheme.headerRadius` (rounded bottom
  32px) + `AppTheme.gradientAppBar(title:)` helper in `config/theme.dart` — used by Home's
  gradient header (logo pill + greeting), Profile's signed-in header, and the Destinations/
  Themes/Packages list app bars. Reuse this helper for any new gradient app bar rather than
  hand-rolling the gradient again.
- `login_screen.dart` implements a 2-step login (identifier → password | OTP) matching the web
  `UserDashboardPage.tsx`. **OTP has no backend** — auth endpoints are `/auth/login`,
  `/auth/register`, `/auth/forgot-password`, and (2026-08-31) `GET/PATCH /auth/me` +
  `POST /auth/change-password` (`authController.ts`, each `authenticateToken`-guarded per-route).
  `updateMe` edits firstName/lastName/mobile/city/avatar/preferences; `User` model gained
  `city` + `preferences {language,currency}`; `login`/`register` responses include those via
  `shapeUser()`. Web Edit Profile / Change Password = `UserDashboardPage.tsx`
  `screen === 'editProfile' | 'changePassword'`; Flutter = `views/profile/edit_profile_screen.dart`
  (avatar via paste-URL dialog — no `image_picker` dep). The OTP step is a real widget
  flow (30s resend countdown, 6-digit input) but `_handleVerifyOtp` intentionally refuses to
  fabricate a session and tells the user to use email/password instead. Needs
  `/auth/send-otp` + `/auth/verify-otp` + an SMS provider to become real.
- `register_screen.dart` uses a single "Full Name" field (not first/last split), matching the
  web client — split client-side (`first word → firstName`, `remainder → lastName`, may be
  empty) before calling `AuthProvider.register()`.
- `profile_screen.dart`: signed-out state defaults to a plain white menu (Log in action + quick
  links); the real login form (embedded `LoginScreen`) only shows after tapping "Log in", with a
  back arrow to the menu. Signed-in state uses the gradient header + floating white identity
  card + stat tiles + grouped list cards pattern (ported from `UserDashboardPage.tsx`'s mobile
  profile screen).

### Shared (`shared/`)
- `types/index.ts`, `validators/index.ts` (zod) — imported in client as `@shared/*`.

## 3. Design System

- Aesthetic: "Premium Tropical Luxury Glassmorphism + 3D kinetic motion."
- Brand colors: Primary Ocean `#0A6FB5`, Secondary/Sky `#58B8E8`, Tropical Aqua `#57D0C9`,
  Sunset Gold `#F6C65B`, Deep Sea `#063B6D`, Warm Sand `#F8F7F3`, BG `#FCFCFC`, Text `#1F2937`.
  WhatsApp green `#25D366`.
- Radii 12/20/28/pill; layered shadows `sm/md/lg/floating`; glass = `backdrop-blur(16px)` +
  translucent white fill + light border.
- Typography: body/UI **Inter**; headings/display **Outfit**. Scale display-hero 64 → caption 14.
- Motion: Framer Motion (cards/modals/accordions), spec also names GSAP+ScrollTrigger, R3F,
  Lenis, Swiper. 3D tilt (`rotateX/Y ±6–8°`, scale 1.04) on desktop only — disabled on touch,
  replaced with 2D `translateY(-4px)` + `scale(1.02)`; respect 60fps / battery on mobile.
- Breakpoints (Tailwind, mobile-first): `<640` default, `sm 640`, `md 768`, `lg 1024`,
  `xl 1280`, `2xl 1536`. **Note:** the app's mobile/desktop component swap keys on `lg` (1024).

## 4. Engineering Decisions

- Mobile UI = separate `Mobile*Page` React components chosen at runtime (parity with Flutter app),
  not responsive CSS. (pre-existing)
- Global API-cache invalidation on every successful mutating request, so admin panel + mobile
  stay in sync simply. (pre-existing)
- Realtime via Socket.io events emitted from controllers after writes; client manager pages
  listen instead of polling (was 800ms polling; now <50ms push). (pre-existing)
- Redis is optional; MemoryCache fallback keeps single-instance deploys working with no Redis. (pre-existing)
- `logs.md` is the mandatory pre-work checklist for every feature/task. (2026-08-27)
- Root spec docs consolidated into MEMORY.md and deleted. (2026-08-27)

## 5. Completed Major Work

- Public marketing site, user dashboard, admin back-office, Flutter mobile app.
- Lead/enquiry CRM, bookings (with advance + remaining-balance payment), topic-threaded
  real-time chat support (web ChatModal + Flutter bottom sheet + admin 2-pane inbox).
- Cloudinary image uploads; dynamic XML sitemap; CMS (blogs/testimonials/FAQ/settings);
  banners + theme banners.
- Socket.io realtime for package/destination CRUD across tabs; email notifications for
  booking/enquiry/payment/chat events.

## 6. Current Work

- None tracked. New work goes in `logs.md`.

## 6a. Remediation status (2026-08-27, `/impeccable` — in progress)

`client/` `npm run build` (tsc -b + vite) **now passes** — it had never passed before (fixed
pre-existing breaks in `useRealtimeUpdates.ts`, deleted dead `admin/components/PackageAdminExample.tsx`).

**Landed & build-verified (batch 1):**
- `globals.css` rewritten: Tailwind v4 `@theme` token layer (`--color-ocean-{100..900}`,
  `aqua`, `gold-{500,600}`, `ink`, `slate-{body,muted,faint}`, `line`, `fill`, `canvas`;
  `--radius-{xl2,2xl2,3xl2}`; `--shadow-{card,raised,glass,focus}`; `--ease-{smooth,spring}`).
  One font (`--font-sans` = Urbanist). `!important` font war removed. `@media
  (prefers-reduced-motion: reduce)` block added. `.text-white !important` removed. `will-change`
  moved into `:hover`. Themed `::selection` + `:focus-visible`. New `.glass-card-solid` for grid cards.
- `index.html`: dropped the unused render-blocking Inter+Outfit font link; Urbanist via `<link>`
  (not CSS `@import`); `bg-canvas text-ink` tokens.
- `tailwind.config.ts`: dead Poppins/Times `fontFamily` removed — now content-only.
- `App.tsx`: **SplashScreen removed** (user request) + `SplashScreen.tsx` deleted; root uses tokens.
- `PackageDetailPage.tsx`: **P0 fixed** — deleted the in-page enquiry/booking sidebar (undeclared
  `travelersCount`); replaced with a compact sticky quote card → shared `PackageEnquiryModal`
  (`initialMode`). Removed the duplicate `useForm`/submit + dead state/imports. Fabricated content
  now gated on real fields (`pkg.featured`/`trending`/`rating`/`reviewCount`); tokens applied.
- `PackageCard.tsx`: real `rating` only (no `|| 4.9`); `trending` badge replaces unconditional
  "Instant Confirmation"; solid card (no per-card `backdrop-blur`); no gold fill; deeper CTA
  gradient; token classes; `+trending/featured/reviewCount` props.

**Batch 2 landed & build-verified:**
- NEW `components/common/Modal.tsx` — a11y dialog shell (focus trap, `role="dialog"`/`aria-modal`,
  Escape, focus return, body scroll-lock, backdrop close). Wired into `PackageEnquiryModal`,
  `UserAuthModal`, `ChatModal` (44px close targets, `aria-label`s, heading `id`s, fake-promise
  copy fixed).
- `HomePage.tsx` — `sr-only <h1>`; fabricated stats band → honest "How it works"; fake per-theme
  ratings removed (`SPECIALIZATION_THEMES` `rating` → `blurb`); `prefers-reduced-motion` +
  `document.hidden` guards on all 4 autoplay carousels; hero pause/play toggle; 800ms poll → 120s
  safety-net (event-driven `hc_data_updated` refresh stays primary).
- **Token layer now in use:** 34 `.tsx` files swept — `[#0A6FB5]`→`ocean-600` etc. (identical hex,
  zero visual change). `text-slate-400`→`text-slate-500` on 17 public files.
- `Footer.tsx` — dead `href="#"` social links now render only real `settings.socialLinks.*`;
  unverifiable "premier luxury agency / certified experts" claim rewritten.
- `MobileStickyBar.tsx` — persistent Call / WhatsApp / Enquire row added (fixes the
  no-human-contact-on-mobile P1).

**Batch 3 landed & build-verified (detector clean on changed files):**
- `utils/imageUrl.ts` — `formatImageUrl(url, fb, width)` now injects Cloudinary
  `f_auto,q_auto,w_N,c_limit,dpr_auto`; new `formatSrcSet(url, widths)`. Applied to PackageCard,
  DestinationCard, HomePage hero (+ `loading`/`fetchPriority`/`decoding`), BlogsPage, BlogDetailPage.
- **BlogsPage fixed** — cards are `<Link to="/blog/:slug">`, safe `stripHtml()` excerpt (was raw
  `{b.content}`), skeletons, real empty-state CTA. NEW `pages/Blogs/BlogDetailPage.tsx` + routes
  `/blog/:slug` and `/blogs/:slug`. `globals.css` gained `.article-body` long-form styles.
- **DestinationDetailPage** — no longer renders `FALLBACK_DESTINATIONS[0]` (wrong entity) for an
  unknown slug (proper not-found + "ask a consultant"); no longer pads an empty package list with
  the whole `FALLBACK_PACKAGES`.
- Fabricated theme rating strings ("4.9 ★ (348 Reviews)") neutralised → `blurb` in
  `mobileDataFallback.ts` + `MobileThemeDetailPage` + `MobileThemesPage`.
- Stripped 28 inline `style={{ fontFamily: 'Outfit'/'Inter' }}` overrides from the 7 `Mobile*`
  pages (dead weight now the `!important` cascade is gone).

**Batch 4 landed & build-verified — mechanical detector now fully clean (0 findings) across
`client/src/pages` + `client/src/components`:**
- CTA contrast: `to-aqua-500` → `to-cyan-600` on gradient buttons (13 files); micro-type floor
  raised to `text-[11px]`.
- `AboutPage` rewritten (honest consultant-model page, no fabricated proof).
- `ContactPage` rewritten — contact cards only show real `settings.*` values (no placeholder
  phone/address); form fields have `htmlFor`/`id` + `aria-invalid` + `role="alert"`.
- `App.tsx` tablet frame — 640–1023px shows the phone layout in a centered `max-w-[480px]`
  column instead of stretched.
- `PackageEnquiryModal` tier total relabelled "Indicative total" with a "consultant confirms the
  final price" note.
- `Navbar` admin button + `PackageCatalogPage` filter badge de-golded; `MobileHomePage` hero
  dots use classes not inline `transition: width`.

**Batch 5:** rem type scale (`text-[Npx]` → rem, 21 files); off-scale radii → `rounded-2xl2/3xl2`;
`MobileHomePage` h1 weight fix; **PackageCatalogPage client-side pagination** (12 + "Show more",
was rendering the whole `limit=1000` set); `ThemeCatalogPage` h1 de-emoji/de-fluff.

**Remediation chain is complete for everything doable without a browser.** Build green; the
public-surface mechanical detector is clean. Remaining detector hits are all either admin-scope
(`BannerManagerPage`, `AdminMessagesPage` — outside the "public pages" eval) or the **intentional
DESIGN.md world** (`--ease-spring` bounce curve, `.gradient-text-*`, blockquote `border-left`).

**Batch 7 (final — independent review):** a `code-reviewer` subagent audited the full ~45-file
diff → no runtime errors, no layout breakage. 4 low-sev fixes applied: restored `overflow-x:
hidden` to the `html, body` base rule (rewrite had dropped it); `MobileThemeDetailPage:90`
`rating:`→`blurb:`; tightened the `imageUrl.ts` Cloudinary "already-transformed" guard regex;
**removed `dangerouslySetInnerHTML` from `BlogDetailPage`** (CMS content → safe plain-text
paragraphs; no sanitizer in the pipeline). Build green.

**Batch 6:** removed the HomePage rotated "Enquiry Now" side-tab (detector `side-tab` cleared);
rebuilt `FloatingActionWidget` — no more hardcoded placeholder phone (renders Call/WhatsApp only
when real `settings.phones.*` exist), added an Enquire→/contact action, dropped the perpetual
5-animation stack and the `font-['Plus_Jakarta_Sans']` override. **`client/src/pages` +
`client/src/components` now return 0 detector findings.**

**Static overflow scan (2026-08-27):** grepped the public surface for `100vw`/`w-screen`,
negative margins, wide fixed `w-[NNNpx]`, unwrapped wide rows. Result: **no real
horizontal-overflow roots.** The only `100vw` is an image `sizes=` hint; `-mx-1` is paired with
`px-1` on `overflow-x-auto` scrollers (net zero); the widest fixed element is a 220–280px footer
logo that fits a 360px viewport. So `overflow-x: hidden` on `html/body` is purely defensive and
isn't masking a known bug — the audit's concern doesn't materialise here. Left in place.

**Genuinely done from source — nothing further is safely actionable without a browser.**
What remains is judgment-on-rendered-pixels, not fixes: subjective spacing/rhythm polish on the
catalog + `Mobile*` pages, and the visual half of a re-run `/impeccable critique`. Both need the
app running (`npm run dev`, needs `server/.env`).

**Never in scope:** admin back-office. Its 2 residual detector hits (`BannerManagerPage` amber
button, `AdminMessagesPage` `border-l-4`) live there and were left untouched.

Baseline critique snapshot: `.impeccable/critique/2026-08-27T09-01-49Z__client-src-pages.md`.
Re-run `/impeccable critique` after browser QA to re-score.

## 6b. Design/UX evaluation findings (2026-08-27, `/impeccable critique` + `audit`, public pages)

Source-based (no browser). Design Health **19/36** (Acceptable). Audit Health **7/20** (Poor).
Implementation Integrity **FAIL**. Full snapshot:
`.impeccable/critique/2026-08-27T09-01-49Z__client-src-pages.md`. Priorities for future work:

- **[P0] `PackageDetailPage.tsx` in-page "Book Package Now" tab crashes** — lines ~856–900 use
  `travelersCount` / `setTravelersCount` which are never declared (state is
  `adultsCount`/`childrenCount`). ReferenceError on render. Fix = delete the bespoke in-page
  sidebar form; route all enquiry/booking through `PackageEnquiryModal` (there are currently
  two enquiry systems).
- **[P0] All 3 modals** (`PackageEnquiryModal`, `UserAuthModal`, `ChatModal`) lack the dialog
  a11y contract: no `role="dialog"`/`aria-modal`, focus trap, Escape, focus return, body
  scroll-lock. Needs one shared `<Modal>` primitive.
- **[P1] Fabricated / unverified social proof site-wide** — Home stats band (`25k+`, `4.9`),
  per-theme "4.9 ★ (348 Reviews)" strings, "(526 reviews)" on every package, hardcoded rating
  fallbacks `4.9`/`4.5`/`4.92` in PackageCard / PackageDetailPage / MobilePackageDetailPage /
  `mobileDataFallback.ts`, "Best Seller 2026" / "Instant Confirmation" on every item. **Real
  business** — trust/legal risk. Wire to real backend data or remove; no invented fallbacks.
- **[P1] No design-token layer in force** — 400–600 hardcoded `[#hex]` class literals; `:root`
  ocean palette defined in `globals.css` but never referenced from JSX. Font declaration war:
  `index.html` loads Inter+Outfit (never rendered), `globals.css` `@import`s 4 families +
  forces Urbanist via `!important`, `tailwind.config.ts` names Poppins/Times (dead), mobile
  pages set inert inline `fontFamily`. Broken token `--font-[#0A6FB5]`.
- **[P1] HomePage has no `<h1>`** and no hero headline copy (a11y + SEO + persuasion).
- **[P1] Motion ungoverned** — zero `prefers-reduced-motion` vs ~25 infinite keyframes; hero
  auto-advances with no pause (WCAG 2.2.2 A); HomePage 800ms polling loop (battery/data on the
  mid-range-Android primary persona) — replace with the existing Socket.io channel.
- **[P1] Contrast** — white text on the cyan half of the `#0A6FB5→#57D0C9` primary CTA (~2:1);
  `text-slate-400` as body text on white (~2.6:1). Both site-wide.
- **[P1] Mobile has no persistent "talk to a human"** — `FloatingActionWidget` hidden on
  mobile; `MobileStickyBar` is nav-only. Add call/WhatsApp/enquire.
- **[P1] IA doesn't encode the consultant-mediated model** — UI reads as a self-service OTA
  ("Instant Confirmation", forced account creation before a *booking request*). No "how it
  works", no consultant identity.
- **[P2]** Silent failures masked by `FALLBACK_*` data (`DestinationDetailPage` renders the
  wrong destination for an unknown slug); BlogsPage cards aren't links & no `/blog/:slug`
  route, raw `{b.content}` excerpt; image pipeline ignores Cloudinary transforms + no
  `srcset`; `backdrop-blur(20px)` on every grid card; sub-44px touch targets; tablet
  768–1023px unstyled; `text-[8.5–11px]` pixel-locked in 100+ places.
- **Strengths to keep:** PackageDetailPage itinerary/inclusions column, PackageEnquiryModal
  (WhatsApp fallback), route-level code-splitting, the `SEO` component + JSON-LD, catalog
  skeletons, graceful API fallbacks.

## 7. Known Issues / Spec-vs-Implementation gaps

- **Secret leak:** the deleted `PROJECT_DOCUMENTATION.md` contained a real Gmail SMTP app
  password and sender address in git history. That credential should be rotated; never commit
  secrets — use `server/.env`.
- Fallback `JWT_SECRET` is hardcoded in `server/src/middleware/auth.ts` and `routes/api.ts`;
  must be overridden via env in production.
- Spec described **refresh tokens in HTTP-Only cookies with rotation**; implementation uses a
  single JWT Bearer access token in `localStorage`. No `/auth/refresh` in the real router.
- Spec DB design lists **34+ collections** (continents/countries/states/cities, quotations,
  followups, customers, permissions, sessions, mediaLibrary, redirects, seoPages, analytics…).
  Implemented models are ~11: `User`, `Role`, `Package`, `Destination`, `Banner`, `ThemeBanner`,
  `Enquiry`, `Booking`, `ChatMessage`, `CMS`, `AuditLog`. Geography is flat (destination has a
  `slug`), not the Continent→Country→State→City tree.
- Spec RBAC roles: `Super Admin`, `Admin`, `Sales Executive`, `Content Manager`,
  `Marketing Executive` (+ granular permission matrix). Code only checks role strings in
  `requireRole([...])` lists; no `permissions` collection.
- Swagger/OpenAPI (`/api-docs`), Reports/Analytics endpoints, Media Library, `/admin/customers`,
  `/admin/countries`, quotation builder — specced, not implemented.
- Deployment target in specs (AWS EC2/Nginx/PM2/CloudFront) ≠ actual (Vercel).

## 8. Important Constraints

- Do not introduce a competing memory/log system — use `MEMORY.md` + `logs.md`.
- No test framework; `npm run build` (tsc) is the only static gate.
- Keep secrets in `.env` only (see §7).
- Don't add manual client/server cache-busting — the global invalidation already covers writes.

## 9. Important APIs / Integrations

- MongoDB Atlas (Mongoose). Cloudinary (images, WebP/AVIF `f_auto,q_auto`). Redis (optional cache).
- nodemailer/SMTP (Gmail app password in documented setup) — transactional email.
- Socket.io (realtime CRUD + chat). Google Maps / GA4 / WhatsApp click-to-chat: specced, verify in code.

## 10. Response & API conventions (from spec, partially enforced)

- Success: `{ success:true, message, data, meta? }`. Error: `{ success:false, message, errors[] }`.
- Status codes: 200/201 ok, 400 bad request, 401 no/expired token, 403 RBAC, 404 not found,
  422 validation, 429 rate limit, 500 server error.
- Rate limits (spec): lead forms 5 / 30 min, contact 10 / hr, read APIs 100 / 15 min.
- Security (spec): bcryptjs 12 salt rounds, Helmet CSP/HSTS/X-Frame-Options, `express-mongo-sanitize`,
  signed Cloudinary uploads, immutable audit log (`AuditLog` model exists).
- SEO (spec): dynamic `<SEO>` (react-helmet-async), JSON-LD `TouristTrip`/`FAQPage`/`BreadcrumbList`/
  `Organization`, dynamic `/sitemap.xml` (cached, auto-updates on publish), `robots.txt` blocks
  `/admin/` + `/api/`, CWV targets LCP<2.5s / CLS<0.1 / INP<200ms, Lighthouse Perf≥95 / SEO 100.
- Perf (spec): CloudFront edge → Redis cache keys (home 15m, popular packages 30m, destinations 1h,
  settings 24h) → Mongo; route-level code splitting; hero image <300KB WebP/AVIF; debounced search 300ms.

## 11. Do Not Repeat

- Don't treat the old spec docs as current truth — they overstate scope (see §7). Verify in code.
- Don't reintroduce 800ms polling in admin manager pages — use `useRealtimeUpdates`.
- Don't recreate a geography Continent/Country/State/City hierarchy unless explicitly asked;
  the app uses flat slugged destinations.

## 12. Last Updated

2026-08-27
