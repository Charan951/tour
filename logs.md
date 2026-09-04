# Work Logs

Append-only history of every feature / change / task worked on in this repo.

**Process (see `CLAUDE.md` → "Workflow: logs.md"):**
1. Before starting any new feature or task, read this file and search for it.
2. If it exists here — continue from the logged state, respect prior decisions.
3. If it does NOT exist here — add a new entry (below, newest first) with date, time,
   feature name and task name BEFORE starting work.
4. On finish/pause — update the entry's `Status` and `Outcome`.

Entry format:

```
### <YYYY-MM-DD HH:MM> — <Feature name> — <Task name>
- Status: Planned | In progress | Done | Blocked
- Request: <one line>
- Files/areas: <paths>
- Outcome: <what was done / decided>
```

---

## Entries (newest first)

### 2026-08-31 — /impeccable enhance — Flutter login layout
- Status: Done. `flutter analyze lib` ✅.
- The two-`Spacer` sheet (flex 3 + flex 4) left two large voids with the field floating in the middle. Rebuilt: grab handle → (22) → ocean micro-label → (8) → **contextual helper line** (step-aware) → (26) → field + primary button (natural flow, upper-third), then **one** `Spacer()` → "Don't have an account? Register" pinned to the bottom.
- `crossAxisAlignment: stretch` so field/buttons are consistently full-width. Hero title is step-aware again (Welcome Back / Enter your password / Verify your phone), empty subtitle slot removed, title 30→28, sheet overlap -26→-24 / radius 34→32 so it doesn't crowd the heading. Identifier field gets a real hint + `alternate_email` icon + inline error with icon.

### 2026-08-31 — Flutter UX hardening (part 2): finish the gaps
- Status: Done. `flutter analyze lib` ✅.
- Catalog state adoption: `package_list_screen` uses `AppSkeletonList` on first load + a search/filter-aware `AppEmptyState` ("Clear filters" action). `theme_screen` uses skeleton + `AppErrorState`(offline) + `AppEmptyState`.
- Tooltips: all 18 `IconButton`s in `lib/views` now have a `tooltip` (steppers, copy, close, back arrows, search clear/filter, password toggles).
- Offline write queue: NEW `services/offline_queue.dart` — durable SharedPreferences outbox. Enquiry submit now enqueues instead of showing a fake success when offline (and if a request drops mid-flight); `ConnectivityStatus` flushes the outbox oldest-first when connectivity returns; `main()` also flushes on launch.

### 2026-08-31 — Flutter UX hardening: states, offline, legal, a11y
- Status: Done. `flutter analyze lib` ✅.
- NEW `widgets/app_states.dart` — `AppLoading`, `Skeleton`, `AppSkeletonList`, `AppEmptyState` (icon + copy + optional action), `AppErrorState` (Try again). Semantics/liveRegion labelled.
- NEW `services/connectivity.dart` — `ConnectivityStatus` singleton (no plugin): `InternetAddress.lookup` on start + every 12s; `ApiService` reports true on success / false when all candidates fail. NEW `widgets/offline_banner.dart` `OfflineOverlay` wired once via `MaterialApp.builder` → app-wide "You're offline" bar on every screen.
- NEW `views/legal/legal_screen.dart` — `LegalScreen.privacy()` / `.terms()` static pages (web-parity copy). Linked from Profile → Account (two rows) and a tappable agreement line under the Register button.
- Accessibility: `MaterialApp.builder` clamps text scale to 0.9–1.3; `Semantics(button/selected/label)` on the home bottom-nav tabs; `tooltip` on the password-visibility toggles (login + register) and the profile back button; loading/offline widgets are `liveRegion`.
- State adoption: `my_bookings_screen` and `my_enquiries_screen` now use `AppSkeletonList` while loading, `AppErrorState(onRetry)` when empty + offline, `AppEmptyState` otherwise.
- Persistence: unchanged by design — catalog always has bundled fallback data (never blank); auth token/user persist via SharedPreferences. No response-cache layer added.

### 2026-08-31 — Flutter API: localhost + kill the slow multi-IP fallback
- Status: Done. `flutter analyze lib` ✅.
- `api_config.dart`: Android now defaults to `http://localhost:5000` (was `10.0.2.2`). Requires `adb reverse tcp:5000 tcp:5000` — loopback over USB, no Wi-Fi latency, no IP guessing.
- `api_service.dart`: `_generateCandidateUrls` no longer fans out over `[localhost, 10.0.2.2, 127.0.0.1, 192.168.1.32]` — that's what made every request slow (each dead candidate cost a full timeout). Now: configured URL, plus `10.0.2.2` ONLY when the host is a loopback name (emulator fallback). `timeoutDuration` 4s → 8s so a cold server isn't a false timeout.
- ACTION for the user: run `adb reverse tcp:5000 tcp:5000` (re-run after replug / `adb kill-server`). Then the app hits `localhost:5000` directly.

### 2026-08-31 — Flutter login/onboarding tweaks
- Status: Done. `flutter analyze lib` ✅.
- Onboarding auto-scroll interval 4s → **2s**.
- Login hero: **Guest** pill added top-right (→ HomeScreen); "Continue as Guest" removed from the form body. Hero images switched to `CachedNetworkImage` and the ocean tint lightened (0.92/0.85/0.80 → 0.74/0.62/0.55) so the photos are visible. "Server: …" line removed from the sheet — server-IP dialog now opens on a long-press of the logo chip.

### 2026-08-31 — Flutter: Android build config fix + login redesign + onboarding auto-scroll
- Status: Done. `flutter analyze lib` ✅.
- Android build unblocked: `gradle.properties` `org.gradle.java.home` → Android Studio JBR (JDK 21; the Adoptium jdk-21.0.6.7 path didn't exist). `app/build.gradle` `compileSdk`/`targetSdk` 34 → 36 (plugins require it; SDK 36 + build-tools 36.1.0 already installed). Deleted stray `android/build.gradle.kts`. `settings.gradle` Kotlin 2.0.21 → 2.2.20 (cached; clears the <2.1 deprecation warning).
- `login_screen.dart` redesigned to match the web mobile auth view: blue hero (travel-image `AnimatedSwitcher` carousel behind an ocean-gradient tint, 5s), white logo chip + "Welcome Back"/step title + subtitle, then a white sheet (`Transform.translate -26`, `borderRadius top 34`, grab handle, uppercase section label) wrapping the existing 3-step form. Back button steps back to identifier, else → HomeScreen.
- `onboarding_screen.dart`: `Timer.periodic(4s)` auto-advances the PageView, loops to slide 0 at the end, resets on manual swipe; added `initState`/`dispose` (also disposes `_pageController`).

### 2026-08-31 — Home value section (web) + Flutter home sync
- Status: Done. client build ✅ · `flutter analyze lib` ✅.
- Web (`HomePage.tsx`): new "Your trip deserves more than just a booking" section ABOVE Featured Tour Packages — photo collage (3 images + Compass badge + "Every trip / Human-planned" pill), `font-script` "Let's plan it together" eyebrow, two `glass-card-solid` feature cards (One consultant / Built around you), "About us" CTA. No fabricated stats (per PRODUCT.md).
- Web mobile (`MobileHomePage.tsx`): Specialization Themes moved to sit just above Trending Tour Packages; theme card name uses `themeName||name||title` fallback (names were blank); India/Intl heading subtitles removed; "Top Destination" script eyebrow (earlier this session).
- Flutter (`mobile/`): `SectionHeader` gained an optional `eyebrow` (GoogleFonts.parisienne). Home: India Tours / International Tours now show the "Top Destination" script eyebrow and no subtitle; Specialization Themes block relocated to just above Trending Tour Packages. Coverflow carousel NOT ported — native keeps the horizontal scrollers.

### 2026-08-31 — "Top Destination" script eyebrow above India & World sections
- Status: Done. client build ✅ .
- Added Google font **Parisienne** (index.html) → `--font-script` token in globals.css `@theme` → `font-script` utility.
- Script line "Top Destination" placed above the India and International headings on both HomePage.tsx (desktop) and MobileHomePage.tsx (mobile), `text-ocean-800`, negative bottom margin so it tucks into the heading like the travelnexy reference.
- Also this session: coverflow DRAG hint removed; carousel `overflow-x-clip` + `62vw/max-240` mobile cards to stop the mobile overflow; click-to-open fixed (dropped `setPointerCapture`); 5 cards (outer pair softened, not ghosted); `/themes` card emoji icon badge removed.

### 2026-08-31 — Coverflow — drag wired, hover DRAG hint, International uses it too
- Status: Done. client build ✅ .
- File: client/src/components/common/CoverflowCarousel.tsx; HomePage.tsx (International section → coverflow); MobileHomePage.tsx (International Tours → coverflow).
- Drag: `setPointerCapture` on pointerdown, `dragMoved`/`suppressClick` refs so a drag past 40px steps the carousel and swallows the card's navigation click; `touch-action: pan-y` keeps vertical page scroll; `cursor-grab/grabbing`.
- DRAG hint now reveals on `group-hover` of the active card (and while dragging) instead of showing on load; removed the `nudged` state.
- Card size from prior step: stage `h-340/400`, card `w-300/440` (shorter + wider).

### 2026-08-31 — Coverflow carousel — match travelnexy reference
- Status: Done. client build ✅ · detector [] .
- File: client/src/components/common/CoverflowCarousel.tsx (used by HomePage + MobileHomePage India Tours).
- Iterations this session: (1) flat 3-card fan → (2) curved/arc via translateY + rotate → (3) "no half cards" (trimmed to 3) → (4) THIS: match reference — 5 layers (centre + ±1 + ±2), outer pair heavily blurred (10px) / dim (0.42) / non-interactive, bleeding off the edges; larger stage (`max-w-[980px]`, `h-540`), bigger cards (`w-320`); centered "‹ DRAG ›" hint on the active card that fades after the first interaction or on hover (the ‹ › are real prev/next buttons). Removed the outer white round arrow buttons; kept the dot bar + ArrowLeft/Right keys. Autoplay 5s, paused on hover/drag, reduced-motion aware.

### 2026-08-31 — India Tours — fanned coverflow carousel (web + mobile-responsive)
- Status: Done. client build ✅ · detector [] .
- Request: replace the India-tour destination row with a fanned coverflow carousel like the travelnexy.com "Popular Destination" reference; center card large with a "Contact Us" CTA, neighbours receding.
- New: `client/src/components/common/CoverflowCarousel.tsx` — headless-ish, no new deps. Active card `scale(1)`, ±1 `scale .82 rotateY ∓11°`, ±2 `scale .64` blurred/dim, beyond hidden. Pointer-drag (45px threshold), prev/next buttons, dot bar, autoplay 4.5s paused on hover/drag, `prefers-reduced-motion` disables motion. On-brand tokens (`rounded-3xl2`, ocean scrim/shadow, Urbanist). CTA label configurable; side-card click recenters.
- Wired: `HomePage.tsx` domestic section (replaced the 4-up side-scroller) and `MobileHomePage.tsx` "India Tours" (replaced its scroller). "International Tours" stays a plain horizontal scroller on both.
- Flutter: NOT done — request was "web and mobile responsive". A 3D coverflow in Flutter is a separate task.

### 2026-08-31 — Home — India/International tour rows on mobile; drop desktop eyebrows
- Status: Done. client build ✅ · `flutter analyze lib` ✅
- Request: remove the "Incredible India" / "Global Getaways" kicker badges; mobile was missing India vs International tour sections.
- Files: client/src/pages/Home/HomePage.tsx (removed 2 eyebrow `<span>`s above the domestic/international section headings), client/src/pages/Home/MobileHomePage.tsx (split "Popular Destinations" → "India Tours" + "International Tours" horizontal scrollers via `indiaDestinations`/`intlDestinations` — same domestic predicate as HomePage), mobile/lib/views/home/home_screen.dart (new `_buildDestinationScroller(title, subtitle, list)` helper; Popular Destinations replaced with two calls split by `country == 'india'`; empty list renders nothing).
- Layout pass (same session): mobile home app bar gutter aligned to `px-4`, deliberate spacing rhythm, search field no longer overhangs the hero (removed `-mb-6`), content `pb-40` so the in-flow "Enquire Now" button clears the fixed MobileStickyBar.

### 2026-08-31 — Mobile home app bar redesign (web + Flutter)
- Status: Done. client build ✅ · detector [] · `flutter analyze lib` ✅
- Request: redesign the mobile home app bar to the reference — wordmark + notification bell (badge "2"), "Hello, {name} 👋", subtitle, and a search field straddling the header seam.
- Files: client/src/pages/Home/MobileHomePage.tsx; mobile/lib/views/home/home_screen.dart (`_buildHomeGradientHeader`).
- Web: replaced the centered white logo chip with a left plane-icon + "HolidayCity" wordmark, a bell button (→ /my-bookings) with a rose "2" badge, larger greeting, and a white search field with `-mb-[38px]` overlap (content wrapper now `pt-12`). Submit → `/packages?search=`.
- Flutter: same layout; `flight_takeoff` mark, `notifications_none` + badge, reuses `_searchController`, submit/tap → Packages tab (`_currentIndex = 3`). Bell is visual only (no notifications backend).

### 2026-08-31 — Profile + Edit Profile — full stack (backend + web + Flutter)
- Status: Done. server `tsc` ✅ · client `vite build` ✅ · impeccable detector [] · `flutter analyze lib` ✅
- Request: match the two reference mockups (Profile screen + new Edit Profile screen) end to end — backend, web mobile-responsive, and the Flutter app.
- Backend (`server/`):
  - `models/User.ts` — added `city: String` and `preferences: { language, currency }` (defaults English / INR).
  - `controllers/authController.ts` — new `updateMe` (PATCH) + `changePassword` (POST); added `shapeUser()` and reused it in `login`/`register` so responses now carry `city`, `avatar`, `preferences`.
  - `routes/api.ts` — `GET/PATCH /auth/me` + `POST /auth/change-password`, all behind `authenticateToken` (per-route, not the `/admin` guard). Avatar upload reuses existing `POST /upload/single` → Cloudinary URL → PATCH `avatar`.
- Web (`client/src/pages/User/UserDashboardPage.tsx`):
  - Profile screen redesigned to the reference: blue header (title + subtitle + bell w/ "2" badge), identity card (avatar, name, email, VERIFIED pill, "Edit Profile" btn, phone + city rows with Change, USER pill), two stat cards with "View …" links, "My Travel Activity" + "Account" grouped cards.
  - New `screen === 'editProfile'` (photo + Change Photo via `/upload/single`, Full Name, read-only verified Email, Phone, City, Security → Change Password, Preferred Language + Currency selects, Save Changes / Cancel) and `screen === 'changePassword'`.
  - Handlers: `openEditProfile`, `handleUpdateProfile` (PATCH `/auth/me`), `handleAvatarPick`, `handleChangePassword`; `persistUser()` keeps `hc_user` + context in sync.
- Flutter (`mobile/`):
  - `models/user_model.dart` — `city`, `language`, `currency` + `copyWith`; `config/api_config.dart` — `me` → `/auth/me`, added `updateProfile` / `changePassword` / `uploadImage`.
  - `services/auth_service.dart` + `providers/auth_provider.dart` — `updateProfile(changes)` + `changePassword(cur, new)`.
  - `views/profile/profile_screen.dart` — `_buildSignedInProfile` restyled to the reference (bell badge, VERIFIED, Edit Profile btn, phone/city info rows, stat cards with View links). Server-config dialog moved to a long-press on the header title.
  - NEW `views/profile/edit_profile_screen.dart` — matches ref 2. Avatar "Change Photo" is a paste-image-URL dialog (no `image_picker` dependency — can't `pub get` offline); everything else fully wired.
- Note: language/currency are stored on the user but not yet applied app-wide (i18n / price formatting is future work). Bell notifications are visual only (no notifications backend).

### 2026-08-27 — Mobile — Port web mobile-responsive redesign into Flutter (login/OTP, profile, gradient app bars)
- Status: Done. `flutter analyze` clean on all changed files (2 pre-existing unrelated errors in my_enquiries_screen.dart, untouched).
- Request: Port today's web mobile-responsive redesign (UserDashboardPage.tsx, MobileHomePage.tsx, MobileDestinationsPage.tsx, MobileThemesPage.tsx, MobilePackagesPage.tsx) to Flutter — login 2-step/OTP flow, profile signed-out menu + signed-in redesign, gradient app bars on Home/Profile/Destinations/Themes/Packages.
- Files/areas: mobile/lib/config/theme.dart (new `headerGradient`/`headerRadius`/`gradientAppBar()`), mobile/lib/views/auth/login_screen.dart (rewritten: 2-step identifier→password|OTP, show/hide password, 30s resend), mobile/lib/views/auth/register_screen.dart (single "Full Name" field, split client-side), mobile/lib/views/profile/profile_screen.dart (rewritten: signed-out plain menu + Log-in-first flow, signed-in gradient header + floating identity card + stat tiles + grouped list cards), mobile/lib/views/home/home_screen.dart (gradient header with white logo pill + greeting replacing the old white AppBar; destinations-tab AppBar now gradient), mobile/lib/views/packages/package_list_screen.dart + mobile/lib/views/themes/theme_screen.dart (gradient AppBar via `AppTheme.gradientAppBar`).
- Outcome: all API calls/providers/routes preserved — visual/flow port only. OTP has **no backend** (only /auth/login, /auth/register, /auth/forgot-password exist server-side); the OTP step is a real widget (30s countdown, 6-digit field, "Change number") but verify intentionally shows an honest "no OTP backend" message rather than fabricating a session — needs `/auth/send-otp` + `/auth/verify-otp` + SMS provider to go live. offer_packages_screen.dart / theme_detail_screen.dart / destination_detail_screen.dart were left unchanged (pushed detail screens already have their own white app bars with back nav, out of the listed "list screens" scope; theme_screen.dart previously had no Scaffold/AppBar at all — added one). MEMORY.md §2 mobile section updated with the new shared gradient pattern + OTP/full-name notes.

### 2026-08-31 — Auth — redirect to Home after login/register/OTP (web)
- Status: Done. Client build green.
- Request: web mobile login landed on the account/profile screen (route is /my-bookings) instead of Home.
- Files: client/src/pages/User/UserDashboardPage.tsx — added `navigate('/')` after a successful non-admin `handleLogin`, `handleRegister`, and `handleVerifyOtp`. Admin still routes to /admin/dashboard.
- Flutter: already correct — login `_postLoginFetchAndNavigate` and register both `pushReplacement`/`pushAndRemoveUntil` to `HomeScreen` (tab index 0). No change needed.

### 2026-08-31 — Profile nav tab RESTORED + Flutter Gradle offline fix
- Status: Done. Client build green; `flutter analyze lib` clean.
- Request: user wanted the Profile bottom-nav tab back (reverting the prior removal); Flutter `flutter run` was exiting 1.
- Files: client/src/components/common/MobileStickyBar.tsx (Profile tab + USER_ROUTES restored); mobile/lib/views/home/home_screen.dart (Profile tab restored, header avatar removed); mobile/android/gradle/wrapper/gradle-wrapper.properties (8.10.2→8.14, fully cached); mobile/android/settings.gradle (AGP 8.7.0→8.8.2, Kotlin 2.0.20→2.0.21 — both already in the local gradle cache).
- Note: `flutter run` "Exited (1)" was NOT a code error — Gradle wrapper 8.10.2 was a half-finished download (.part/.lck) and the machine has no network to complete it. Repointed to cached 8.14 + cached AGP/Kotlin. A first successful Android build still needs network once if any other artifact is missing.

### 2026-08-27 — Flutter app — match web mobile redesign, remove Profile nav tab
- Status: Done. `flutter analyze lib` → No issues found.
- Files: mobile/lib/views/home/home_screen.dart, .../auth/login_screen.dart, .../enquiry/my_enquiries_screen.dart, .../profile/profile_screen.dart
- Outcome: Flutter login/register/profile/home header + theme.dart were ALREADY ported in a prior pass (two-step identifier→password/OTP with 30s resend + honest OTP placeholder, single Full Name → split client-side, show/hide password, shared headerGradient/headerRadius). This pass: dropped the Profile bottom-nav tab (nav 5→4; `pages` still 5) and added a person/initial avatar to the home gradient header that opens Profile (index 4). Fixed 2 pre-existing compile errors (`FontWeight.black` → `w900` in my_enquiries_screen) + 2 const lints.

### 2026-08-27 — Mobile — home app bar restyled, Profile tab removed
- Status: Done. Build green.
- Files: client/src/pages/Home/MobileHomePage.tsx; client/src/components/common/MobileStickyBar.tsx
- Outcome: Mobile home header now uses the Profile-screen shape — `from-ocean-800 via-ocean-700 to-cyan-700` gradient, `rounded-b-[32px]`, centered white logo chip, greeting + subline in white inside the block (old white app bar + separate welcome header removed). Bottom nav dropped the Profile tab (now Home/Destinations/Themes/Packages); removed dead `USER_ROUTES` + `User` import and unused `useNavigate` on home.

### 2026-08-27 — Auth — single name field, backend made lastName optional
- Status: Done. Client + server build green.
- Files: client/src/pages/User/UserDashboardPage.tsx; server/src/models/User.ts; server/src/controllers/authController.ts
- Outcome: Register form reverted to one "Full name" field; handler splits on whitespace (first word → firstName, rest → lastName, may be ''). Backend now matches: `User.lastName` is `required:false, default:''` and `register` no longer 400s on missing lastName. All auth-form placeholders removed. Show/hide password on login + register. NOTE: needs `npm run seed` or a server restart to pick up the model change; run server after pulling.

### 2026-08-27 — Auth — real backend login/register, drop fake fallback
- Status: Done. Build green.
- Files: client/src/pages/User/UserDashboardPage.tsx
- Outcome: `handleLogin`/`handleRegister` no longer fabricate a local user on API failure — they surface `err.response.data.message` and abort. Sign-in only proceeds with a real `sessionToken`. Register form split into First/Last name (`regFirstName`/`regLastName`) since backend requires both. Removed the duplicate logout (header icon) on mobile Profile — only the Account-card "Log out" row remains. OTP path stays front-end-only (no SMS backend).

### 2026-08-27 — Mobile Profile (signed in) — redesign
- Status: Done. Build green.
- Files: client/src/pages/User/UserDashboardPage.tsx (`screen === 'profile'` block)
- Outcome: New layout on design tokens — gradient header with rounded-b, a floating white identity card (avatar overlaps header, name, email+Change, role pill), two stat cards, "My travel activity" and "Account" grouped list cards (support + logout row). Added hidden `username` inputs to login/register/OTP forms to clear the DevTools password-form a11y warning.

### 2026-08-27 — Login — two-step identifier flow (email→password / phone→OTP)
- Status: Done. Build green.
- Request: login step 1 asks phone-or-email; email → password screen, phone → OTP screen.
- Files/areas: client/src/pages/User/UserDashboardPage.tsx; client/src/components/common/MobileStickyBar.tsx (contact row now home-only)
- Outcome: Added `loginStep` state ('identifier'|'password'|'otp'). `handleIdentifierContinue` regex-detects email vs phone. Email path reuses `/auth/login`. Phone path = front-end OTP screen (6-digit input, 30s resend timer) — **no SMS backend exists**, so any 6 digits pass and a phone-derived user is stored locally. Back arrow steps back to identifier before closing. Fixed signed-out `fetchUserData` 400 spam with an early return.

### 2026-08-27 — Profile tab (signed out) — show menu first, login form on tap
- Status: Done. Build green.
- Request: "in profile page when i click login only then login page should come"
- Files/areas: client/src/pages/User/UserDashboardPage.tsx (the `if (!currentUser)` view)
- Outcome: Added `showAuthForm` state. Default unauth Profile view is now a plain-white menu page: sticky top bar (Home + logo), a gradient hero card with "Log in" + "Create account" CTAs, a 2×2 Explore grid (Offers/Destinations/Blogs/About), and a "Need help planning?" contact strip. Tapping a CTA sets `showAuthForm` and reveals the blue-hero login/register form; its back arrow returns to the menu.

### 2026-08-27 22:15 — DB seed (empty DB was the "no featured packages" cause)
- Status: Done. Build green.
- DB was empty → ran `npm run seed`; fixed a pre-existing seed bug (demo Enquiry objects missing required `enquiryId` + invalid status enum values in server/src/seed/seedData.ts). Re-seed completes clean; 6 packages + destinations + themes now serve.

### 2026-08-28 00:05 — ROOT CAUSE — `overflow-x: hidden` on BOTH html AND body broke `position: sticky` sitewide
- The real reason every sticky-based attempt failed: `globals.css` had `html, body { overflow-x: hidden }` AND `index.html` `<body class="… overflow-x-hidden">`. Two nested non-`visible`-overflow elements → `<body>` becomes a scroll-container that never scrolls (content-height; `<html>` scrolls) → `position: sticky` on any descendant is scoped to the dead `<body>` and never engages.
- Fix: `overflow-x: hidden` now on **`html` only** (still clips horizontal overflow page-wide); removed `overflow-x-hidden` from the `<body>` class. This also un-breaks the mobile AppBar `sticky top-0` and PackageDetailPage's `lg:sticky` sidebar.
- Combined with v7 (ScrollStack = sticky slots + small 18px gap + rAF JS scale/dim on the covered card; `overflow-y-auto` removed from MobileHomePage's content wrapper). Build green.
- Also (user request): hid scrollbars globally in `globals.css` — `html { scrollbar-width: none }` + `*::-webkit-scrollbar { display: none }`. Replaces the earlier themed 8px scrollbar. Content still scrolls.

### 2026-08-27 23:45 — ScrollStack v7 — native sticky pin + JS scale; removed the sticky-breaking wrapper
- v6 (pure-JS translateY pin) read as broken: huge `margin-bottom` (scroll-travel) showed as literal empty gap between cards, and JS-translate pin isn't as smooth as native.
- v7: **removed `overflow-y-auto` from `MobileHomePage`'s content `<div>`** — it never scrolled (content-height) but silently disabled `position: sticky` for all descendants, which is why every prior attempt "scrolled normal". Now the nearest overflow ancestor is `body` (the real scroll root), so sticky engages.
- ScrollStack: slots are `position: sticky; top: calc(stackTop + i*fan)` with a small **18px** `margin-bottom` (scroll travel now comes from card height, not dead space). Native sticky does the pin (smooth); a rAF window-scroll listener only sets `scale`(1→minScale)+dim on the covered card, CSS-`transition`ed. `prefers-reduced-motion` → plain list. No Lenis.
- `pages/Home/MobileHomePage.tsx`: `<ScrollStack stackTop={72} fan={8} minScale={0.93}>`.
- After 5 failed structural approaches (nested Lenis scroller / CSS sticky / CSS `animation-timeline: view()` / bounded viewport), root problem each time was `position: sticky` being scoped to MobileHomePage's non-scrolling `overflow-y-auto` wrapper, or a nested scroller trapping the scroll.
- v6 drops sticky AND nested scroll entirely. `ScrollStack` is a plain block; a rAF-throttled `window` scroll listener measures each (never-transformed) slot's live doc-top and sets `transform: translate3d(0,ty,0) scale(s)` on the card inside — translates it to pin at `stackTop + i*fan` from the viewport, scales/dims as the next card rides over, clamps release near the section bottom, re-measures on `img` load + resize. `margin-bottom` per slot = scroll travel. `prefers-reduced-motion` → plain list. No Lenis.
- `pages/Home/MobileHomePage.tsx` — `<ScrollStack stackTop={84} fan={8} minScale={0.9}>` around `packages.slice(0,6)` of `MobilePackageCard`. The `overflow-y-auto pb-24` wrapper is left as-is (v6 doesn't depend on it).

### 2026-08-27 22:45 — Feature — ScrollStack on mobile Home "Trending Packages"
- Status: Done. Build green.
- v1 used the pasted Lenis component → didn't work in mobile responsive: the internal `overflow-y:auto` scroller collapsed (unlayered `.scroll-stack-scroller{height:100%}` beat the consumer's `h-[72vh]` in the Tailwind v4 cascade) and a nested Lenis instance inside a parent that scrolls the window has nothing to drive it.
- v2 (pure-CSS sticky against page scroll) → "like normal scrolling": sticky was scoped to MobileHomePage's inner `overflow-y-auto` wrapper, which doesn't itself scroll, so it never pinned.
- v3 (pure-CSS `@supports animation-timeline: view()`) → "no smooth movement": sticky-while-pinned freezes `view()` progress, so no scroll-linked motion.
- v4 (own bounded `overflow-y:auto` viewport) → "after I scroll up there is no smooth scroll": a nested scroll container + `overscroll-behavior: contain` traps the scroll and hands back to the page jerkily on mobile.
- **v5 (shipped):** ROOT CAUSE was MobileHomePage's content wrapper `<div className="overflow-y-auto pb-24">` — it never actually scrolled (content-height) but its `overflow-y:auto` silently scoped `position: sticky` to a non-scrolling box, so every sticky descendant was dead. Changed it to plain `<div className="pb-24">`. `ScrollStack` now has **no overflow of its own** — rides the page (window/body) scroll. `position: sticky` pins each card to the viewport; a rAF-throttled `window` scroll listener smoothly scales(1→minScale)+dims each card as the next approaches its pin. `getScrollParent` normalises body/html → window. `margin-bottom: 240px` per slot = scroll travel between pins. `prefers-reduced-motion` → plain list.
- `pages/Home/MobileHomePage.tsx`: `<ScrollStack stackTop={84} fan={8} minScale={0.9} gap={240}>` around `packages.slice(0,6)` of `MobilePackageCard`.

### 2026-08-27 22:30 — Reverted — PillNav / SiteNav navigation swap (user: "undo that")
- Removed `client/src/components/common/{PillNav.tsx,PillNav.css,SiteNav.tsx}`; `npm uninstall gsap`;
  App.tsx restored to `<Navbar/>` (original `Navbar.tsx` was never touched). Build green, no dangling refs.
- KEPT: the DB seed + the seed-script bug fix (that resolved the reported "no featured packages" issue; unrelated to the nav experiment).

### 2026-08-27 21:30 — Design remediation — independent code review + fixes (batch 7, final)
- Status: COMPLETE. Independent code-reviewer subagent ran over the full ~45-file diff — no runtime errors, no layout-breaking issues. 4 low-severity findings, all fixed:
  1. globals.css rewrite had dropped `overflow-x: hidden` from the `html, body` base rule (index.html still had it on <body>). Restored — matches prior behaviour; this is NOT the deliberate "remove to expose overflow bugs" change, just a regression fix.
  2. MobileThemeDetailPage.tsx:90 — leftover `rating:` key in the theme-merge object → `blurb:` (finish the fabricated-rating rename; was harmless dead code).
  3. utils/imageUrl.ts — "already transformed" guard regex `[^/]*(f_|q_|w_)` could false-positive on a Cloudinary public_id containing `w_`/`f_`/`q_` (missed optimization, not breakage). Tightened to match real `key_value` transform tokens.
  4. BlogDetailPage.tsx — dropped `dangerouslySetInnerHTML` on `blog.content` (stored-XSS surface; no sanitizer in the CMS pipeline). Content now renders as safe plain-text paragraphs with preserved breaks. Loses rich formatting; safety wins.
- Outcome: `npm run build` green. 7 batches total. Remaining (browser only): deliberate `overflow-x` audit + spacing/rhythm polish + re-run /impeccable critique.

### 2026-08-27 21:00 — Design remediation (batch 6) — side-tab removed, FloatingActionWidget rebuilt
- Status: Chain complete. Public-surface detector 100% clean (client/src/pages + client/src/components → 0 findings). Build green.
- Files/areas:
  - HomePage.tsx — removed the rotated vertical "Enquiry Now" side-tab (detector `side-tab`; first-timer persona missed it). Enquiry path preserved via FloatingActionWidget + per-page CTAs.
  - FloatingActionWidget.tsx — rebuilt: removed hardcoded placeholder phone (`+919876543210`) → renders Call/WhatsApp only when real `settings.phones.*` exist; added an "Enquire" → /contact action; stripped `font-['Plus_Jakarta_Sans']`; removed the perpetual animation stack (animate-ping + phone-ring + glow-vivid + pulse + whatsapp-pulse) → calm hover-lift only; removed emoji from tooltips; aria-labels; tokens.
- Outcome: 6 batches, all build-verified. `git diff` client/: ~46 files, +1500 / −2100.
- REMAINING (needs a running browser — do NOT attempt blind): global `overflow-x: hidden` removal + real overflow-root fixes; spacing/rhythm polish on catalog + Mobile* pages; re-run /impeccable critique to re-score.

### 2026-08-27 20:40 — Design remediation (batch 5) — rem type scale, radii, catalog pagination
- Status: Chain complete for everything actionable without a browser. Build green; public-surface detector clean (remaining detector hits are admin-scope or the intentional DESIGN.md motion/gradient-text world).
- Files/areas:
  - rem type scale: `text-[Npx]` → `text-[<N/16>rem]` across 21 public files (WCAG 1.4.4 Resize Text; zero visual change at default zoom).
  - Off-scale radii: `rounded-[18px]/[20px]` → `rounded-2xl2` (16px), `rounded-[28px]` → `rounded-3xl2` (24px).
  - MobileHomePage h1 `text-lg font-semibold` → `font-display font-black` (+ removed emoji, honest tagline).
  - PackageCatalogPage — client-side pagination: renders 12, "Show more (+12)" button, resets on filter change (was rendering the full `limit=1000` result set).
  - ThemeCatalogPage h1 — dropped the 🎨 emoji + "crafted exclusively for your vacation vibe" fluff; honest heading.
- Outcome: build verified. Not done (needs running browser): global `overflow-x: hidden` + real overflow-root fixes; HomePage vertical "Enquiry Now" side-tab redesign (detector `side-tab`, Jordan-persona flag); deep visual polish. Admin pages left untouched (eval scope was public pages).

### 2026-08-27 20:00 — Design remediation (batch 4) — contrast, tablet, About/Contact, detector-clean
- Status: Chain substantially complete. Build green; `detect.mjs` returns 0 findings across all client/src/pages + client/src/components.
- Files/areas:
  - CTA contrast: `from-ocean-600 to-aqua-500` → `from-ocean-600 to-cyan-600` and `hover:to-[#4bb8b1]` → `hover:to-cyan-600` across 13 files (white text now ≥AA-large over the whole gradient).
  - Micro-type floor: `text-[9px]`/`[10px]`/`[10.5px]` → `text-[11px]` across pages + components (`text-[8.5px]` already handled).
  - AboutPage.tsx — rewritten from a 2-sentence stub into an honest "how working with us goes" page (no invented team/registrations/accreditations; content derived from the real consultant model).
  - ContactPage.tsx — rewritten: contact cards render only real `settings.*` values (no "+91 98765 43210" / "Kochi & Bangalore" placeholders); every field now has `htmlFor`/`id` + `aria-invalid` + `role="alert"` errors; tokens; honest "usually the same day" expectation (no fabricated SLA).
  - App.tsx — tablet frame: 640–1023px now sits the phone layout in a centered `max-w-[480px]` column with side borders instead of stretching full-width; viewport tracked by width not a bool.
  - PackageEnquiryModal — tier "Estimated Total" → "Indicative total" + "your consultant confirms the final price" note (tier ×1.25/×1.6 no longer reads as a firm quote).
  - Navbar admin button amber→ocean; PackageCatalogPage "Active" filter badge amber→white/20-on-gradient; MobileHomePage hero dots `transition: width` inline → Tailwind classes + `aria-label`.
- Outcome: all 4 batches build-verified; mechanical detector fully clean. Not done (needs a running browser to verify safely): global `overflow-x: hidden` removal + fixing the real overflow roots; deep visual polish on Themes/Packages catalog; `rem`-based type scale.

### 2026-08-27 19:15 — Design remediation (batch 3) — image pipeline, blog detail, fallback honesty
- Status: In progress — batches 1–3 landed & build-verified; detector clean on changed files.
- Files/areas:
  - utils/imageUrl.ts — added Cloudinary transform injection (f_auto,q_auto,w_N,c_limit,dpr_auto) to formatImageUrl(url, fb, width) + new formatSrcSet(url, widths). Applied to PackageCard, DestinationCard, HomePage hero (+ loading/fetchPriority/decoding), BlogsPage, BlogDetailPage.
  - NEW pages/Blogs/BlogDetailPage.tsx + route /blog/:slug & /blogs/:slug in App.tsx. BlogsPage rewritten: <article> → <Link to /blog/:slug>, safe stripHtml() excerpt (was raw {b.content}), skeleton loading, real empty-state CTA, tokens. globals.css: added .article-body long-form styles.
  - DestinationDetailPage.tsx — no longer renders FALLBACK_DESTINATIONS[0] (wrong entity) for an unknown slug → proper not-found with "ask a consultant"; no longer pads an empty package list with the entire FALLBACK_PACKAGES; theme chips gate on real data.
  - Fabricated theme rating strings ("4.9 ★ (348 Reviews)") neutralised → blurb in mobileDataFallback.ts FALLBACK_THEMES + MobileThemeDetailPage + MobileThemesPage; star icons dropped where the value is gone.
  - Stripped 28 inline style={{ fontFamily: 'Outfit'/'Inter' }} overrides from the 7 Mobile* pages (now dead weight after the !important font war was removed).
- Outcome: build green throughout; `detect.mjs` returns [] on all changed public files (the 5 gray-on-color amber warnings are resolved).

### 2026-08-27 18:30 — Design remediation (batch 2) — modals a11y, HomePage, token sweep, contrast, mobile contact
- Status: In progress — batches 1–2 landed & build-verified. Remaining: image pipeline, BlogsPage links/route, Destinations/Themes/About/Contact deep pass, tablet layer, residual text-[10px].
- Files/areas:
  - NEW client/src/components/common/Modal.tsx — a11y dialog shell (focus trap, role=dialog/aria-modal, Escape, focus return, body scroll-lock, backdrop close). Wired into PackageEnquiryModal, UserAuthModal, ChatModal (+ 44px close targets, aria-labels, heading ids, fixed "Instant Response Guaranteed"/"15-Min Response" fake-promise copy).
  - HomePage.tsx — sr-only <h1>; fabricated stats band ("25k+", "4.9 Trust Score") → honest "How it works" 4-step; removed fake per-theme ratings (SPECIALIZATION_THEMES rating→blurb); prefers-reduced-motion + document.hidden guards on all 4 autoplay carousels; hero pause/play toggle; 800ms poll → 120s safety-net (event-driven refresh stays primary).
  - Token sweep across 34 .tsx: [#0A6FB5]→ocean-600, [#063B6D]→ocean-800, [#57D0C9]→aqua-500, [#0891B2]→cyan-600, [#085a94]→ocean-700, [#F6C65B]→gold-500, [#F59E0B]→gold-600, [#25D366]→whatsapp, [#FAFAFC]/[#FCFCFC]→canvas (identical hex → zero visual change; real @theme token layer now in use — verified in built CSS).
  - text-slate-400 → text-slate-500 across 17 public files (WCAG 1.4.3 contrast).
  - Footer.tsx — dead href="#" social links → render only real settings.socialLinks.* (target/rel/aria-label, 44px); rewrote unverifiable "India's premier luxury travel agency / certified destination experts" claim.
  - MobileStickyBar.tsx — added persistent Call / WhatsApp / Enquire row (P1: no way to reach a human on mobile); tokens; text-[8.5px]→[11px].
- Outcome: `npm run build` green after every sub-step. P0 + both P0-a11y items + 5 of 9 P1s addressed.

### 2026-08-27 17:30 — Design remediation (batch 1 of chain) — foundation + P0 + splash removal
- Status: In progress — batch 1 landed & build-verified; batches 2–9 (HomePage, modal a11y primitive, full token migration, adapt) still to do.
- Request: /impeccable — "all at once" incl. token refactor; fabricated proof → wire to real backend data where it exists. Plus user follow-up: remove splash screen (web + mobile).
- Files/areas: client/src/styles/globals.css (rewrite: @theme token layer, one font, killed !important font war, reduced-motion block, Cool-Shadow tokens, .text-white/will-change fixes, .glass-card-solid); client/index.html (dropped unused Inter+Outfit link, Urbanist via <link>, token bg/text); client/tailwind.config.ts (stripped dead Poppins/Times); client/src/App.tsx (removed <SplashScreen>, token bg); DELETED client/src/components/common/SplashScreen.tsx; client/src/pages/Packages/PackageDetailPage.tsx (P0 FIX — deleted bespoke in-page sidebar w/ undeclared travelersCount, replaced with compact quote card → PackageEnquiryModal; removed duplicate useForm/submit; content honesty: featured/trending/rating/reviewCount gated on real fields; tokens); client/src/components/cards/PackageCard.tsx (real rating only, trending badge vs unconditional "Instant Confirmation", solid card no per-card blur, no gold fill, deeper CTA gradient, tokens; +trending/featured/reviewCount props); client/src/hooks/useRealtimeUpdates.ts + DELETED client/src/admin/components/PackageAdminExample.tsx (pre-existing build blockers — project's `npm run build` had NEVER passed; now green).
- Outcome: `npm run build` (tsc -b + vite) passes clean for the first time. P0 crash eliminated. Splash gone. Foundation token layer in place. Remaining chain tracked in MEMORY §6b priorities: HomePage (h1 + fabricated stats band + per-theme fake ratings), shared <Modal> a11y primitive for the 3 modals, contrast sweep (slate-400 text, cyan CTA half), carousel pause + motion scoping, image pipeline (Cloudinary transforms + srcset) + 800ms poll → socket, token-literal migration across remaining ~25 files, adapt (44px targets, MobileStickyBar contact actions, tablet, rem type).

### 2026-08-27 16:40 — Design evaluation — /impeccable critique + audit, all 9 public route types
- Status: Done (evaluation only; no fixes applied yet)
- Request: /impeccable "Evaluate for all public pages" — both critique + audit, all 9 public routes + mobile variants + shared chrome. Source-based (app needs Mongo/env, no browser automation) — degraded no-browser run, 3 isolated sub-agents.
- Files/areas: read-only across client/src/pages/** + client/src/components/** + globals.css + App.tsx + tailwind.config.ts + index.html. Snapshot: .impeccable/critique/2026-08-27T09-01-49Z__client-src-pages.md
- Outcome: Design Health 19/36 (Acceptable, heuristic 10 n/a). Audit Health 7/20 (Poor). Implementation Integrity FAIL (1/4). Verified P0: PackageDetailPage.tsx:856–900 use undeclared `travelersCount`/`setTravelersCount` → the in-page "Book Package Now" tab throws ReferenceError on render. Other systemic findings recorded in MEMORY.md §7. detect.mjs: 5 gray-on-color = contrast false-positives but real Gold-as-Pin violations. Recommended remediation chain: harden (modals + P0) → clarify (fabricated proof) → typeset (h1 + font war) → colorize (contrast + bg token) → animate (reduced-motion + carousel pause) → optimize (images/blur/polling) → document→extract (token layer) → adapt (touch/tablet/rem) → polish.

### 2026-08-27 16:10 — Design foundation — /impeccable init + document (PRODUCT.md, DESIGN.md)
- Status: Done
- Request: /impeccable "Build" — run the whole Build category efficiently at production level.
- Files/areas: PRODUCT.md (new), DESIGN.md (new), .impeccable/design.json (new sidecar).
- Outcome: init interview captured product truth — dual primary audience (travelers + consultants), real operating business (proof must be real, never fabricated), no brand elements locked, platform = web. document ran in scan mode against client/ code: real tokens live in globals.css `@theme`/`:root` (Urbanist single-family forced via !important; ocean palette #0A6FB5/#063B6D/#57D0C9 + gold #F6C65B; blue-tinted premium-card-shadow; ~25 keyframe motion vocab; radius 12/16/24/pill). DESIGN.md North Star "The Glass Concierge", elevation "luminous & layered", components "tactile & eager". Noted token drift: :root canvas #FAFAFC / ink #0F172A vs index.html hardcoded #FCFCFC / #1F2937 — :root is normative. shape/extract not run (feature-scoped, no target).

### 2026-08-27 15:45 — Docs consolidation — Fold all root .md specs into MEMORY.md, then delete
- Status: Done
- Request: Update MEMORY.md and logs.md from every root .md file, then delete all .md except CLAUDE.md / CLAUDE.local.md / MEMORY.md / logs.md / .claude/*.
- Files/areas: read + deleted prd.md, phases.md, PROJECT_DOCUMENTATION.md, Information Architecture.md, Admin Information Architecture.md, MongoDB Database Architecture.md, API Overview.md, Frontend Architecture (React.js).md, UI UX Design System.md, security.md, seo.md, optimisation.md, CRUD_OPERATIONS_FIXED.md, REALTIME_FIXED_WORKING.md, REALTIME_INTEGRATION_GUIDE.md, REALTIME_SETUP_COMPLETE.md. Rewrote MEMORY.md. Kept mobile/README.md (Flutter framework file).
- Outcome: MEMORY.md now carries product intent, IA/routes, DB design, design system, security/SEO/perf targets, realtime model, AND a "spec-vs-implementation" gap section (§7/§11) — the specs were aspirational v1.0 and overstate scope (34+ collections specced vs ~11 built; refresh-token/RBAC-permissions/Swagger/reports not implemented; deploy is Vercel not AWS). SECURITY: deleted PROJECT_DOCUMENTATION.md had a live Gmail SMTP app password in git history — flagged for rotation in MEMORY §7.

### 2026-08-27 15:20 — Claude tooling — Production-level .claude/ folder structure
- Status: Done
- Request: Make the .claude/ folder production-level: CLAUDE.md, commands/, skills/, agents/.
- Files/areas: .claude/CLAUDE.md, .claude/settings.json, .claude/commands/{dev,build,seed,log-feature}.md, .claude/agents/{api-route-builder,mongoose-model-reviewer}.md, .claude/skills/add-api-route/SKILL.md, .gitignore, CLAUDE.md
- Outcome: Added committed project settings (permission allowlist + .env read-deny), 4 slash commands, 2 subagents, 1 skill. Root CLAUDE.md gains a ".claude/ tooling" map. settings.local.json git-ignored.

### 2026-08-27 15:00 — Project scaffolding — Create CLAUDE.md, CLAUDE.local.md, logs.md, MEMORY.md
- Status: Done
- Request: Initialize CLAUDE.md; create CLAUDE.local.md, logs.md, MEMORY.md; add a logs-first workflow so every future feature request checks logs.md before work starts.
- Files/areas: CLAUDE.md, CLAUDE.local.md, logs.md, MEMORY.md
- Outcome: CLAUDE.md documents monorepo (server/client/mobile) + commands + architecture, and now opens with a "Workflow: logs.md" section. logs.md (this file) is the append-only work history. MEMORY.md holds durable architecture/decisions. CLAUDE.local.md is git-ignored personal notes.

### 2026-08-28 00:20 — Fix — mobile /themes cards: image not filling + generic "Theme" label
- `MobileThemesPage.tsx` card: was a fixed `aspectRatio:1.6/1` image box (~130px) inside a taller card with `flex-1` on a non-flex `<a>` parent (no-op) → image only filled the top third, rest white. Rewrote as a full-bleed card: `<img absolute inset-0 object-cover>` + bottom gradient scrim + white label overlay (matches DestinationCard / desktop theme tiles).
- Label showed "Theme" because `/themes` returns theme *banners* keyed `themeName`, not `name`. Added `theme?.themeName` as the first fallback; also pull `blurb || description`.

### 2026-08-28 00:30 — Add "back to home" button on mobile tab pages
- Added an `ArrowLeft` `<Link to="/">` in the sticky header of `MobileDestinationsPage`, `MobileThemesPage`, `MobilePackagesPage` (left of the page title, 36px target, `active:bg-slate-100`). Requested by user.

### 2026-08-28 00:50 — Mobile redesign — login, About, Contact + new FAQ page
- Login (`UserDashboardPage` unauth branch): replaced the centred-card-in-void layout with a full-bleed mobile sheet — ocean gradient header (inline "← Home", logo, heading) + white form sheet with `h-12` `rounded-2xl2` inputs, `htmlFor`/`autoComplete`, token colours, uppercase-label style; reverts to a centred `max-w-md` glass card at `sm:`. Login + register forms both restyled.
- NEW `pages/Faq/FaqPage.tsx` + route `/faq` (lazy). Fetches `/faq`, groups by category, accordion; mobile back button + `pb-28` for the sticky bar; skeleton + fallback FAQs + a "still not sure → /contact" CTA. Footer legal bar gains an FAQ link.
- About + Contact: mobile back button (`lg:hidden`), `pt-4 sm:pt-20`, `pb-28 sm:pb-16` (clears the 2-row MobileStickyBar), tighter mobile section gaps (`space-y-8/10 sm:space-y-12/16`), `text-3xl sm:` headings.

### 2026-08-28 01:15 — Sign-in page — blue hero with image carousel + logo
- `UserDashboardPage` unauth view: top = white page, blue band now `min-h-[46vh]` `relative overflow-hidden` with `<AuthHeroCarousel>` (4 Unsplash destination photos, 4.5s cross-fade, `prefers-reduced-motion` freezes it) behind an ocean-gradient tint. `/logo.png` in a white rounded pill top-right, `← Home` top-left, heading pinned bottom with drop-shadow. White form sheet fills the rest (`flex-1`, `rounded-t-3xl`, `pb-28`).
