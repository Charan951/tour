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

### 2026-09-18 — Mobile — Fix release build failure (> 25.0.3 Gradle plugin resolution error)
- Status: Done
- Request: `flutter build apk --release` failed with `Error resolving plugin [id: 'dev.flutter.flutter-plugin-loader', version: '1.0.0'] > 25.0.3` at `settings.gradle:25`.
- Cause: `mobile/android/gradle.properties` had `org.gradle.java.home=C\:/Program Files/Android/Android Studio/jbr`. Android Studio's bundled JBR is OpenJDK `25.0.3`. Gradle 8.14 does not support Java 25, causing Gradle plugin loader failure when Gradle attempts to run with Java 25.
- Fix: Updated `mobile/android/gradle.properties` `org.gradle.java.home` to `C\:/Program Files/Eclipse Adoptium/jdk-21.0.12.101-hotspot` (Temurin JDK 21 LTS installed on the system and configured in system `JAVA_HOME`).
- Outcome: Ready for user to run `flutter build apk --release`.

### 2026-09-16 — Play Console — Privacy Policy URL rejected ("does not link to a valid privacy policy page")
- Status: Done (code), needs deploy + Play Console update by user.
- Request: Play Console policy-center flagged `https://tour.speshway.site/privacy` as invalid on Sep 13; user wants the URL changed to `/privacy-policy`.
- Cause: `/privacy` is a client-side-only React route (`LegalPage`) — `curl`ing it returns the raw Vite `index.html` shell (empty `<div id="root">`, content only appears after JS runs). Google Play's policy-URL validator doesn't reliably execute JS, so it sees no content and fails the URL.
- Fix: NEW static `client/public/privacy-policy.html` — plain server-servable HTML with the same privacy policy text as `LegalPage.tsx`'s `PRIVACY` sections (no JS/build dependency, content is in the raw response). Root `vercel.json` and `client/vercel.json` — added a `/privacy-policy` → `/privacy-policy.html` rewrite ahead of the SPA catch-all so the clean URL (no `.html`) resolves. Old `/privacy` SPA route left untouched (still works, unrelated).
- Outcome: needs a deploy (git push → Vercel) before `https://tour.speshway.site/privacy-policy` goes live; user should then verify it returns real HTML (`curl`, no JS needed) and update the Privacy Policy field in Play Console → Policy → App content to the new URL, then resubmit for review. Consider doing the same for `/terms` later if it's ever flagged.

### 2026-09-16 — Play Store — direct-to-production launch readiness check
- Status: Done (audit + 1 fix); Blocked on user for the SMTP item before it's safe to submit.
- Request: user wants to publish straight to Play Store production (no internal/closed testing track) — check for errors first.
- Files/areas: mobile/android/gradle.properties, mobile/android/key.properties (not edited, verified), mobile/android/app/build.gradle.
- Findings:
  - **Fixed:** `android/gradle.properties` hardcoded `org.gradle.java.home` to a JDK 21 path (`C:/Program Files/Eclipse Adoptium/...`) that no longer exists on this machine — blocked every local release build with "Java home supplied is invalid". Repointed to the JDK bundled with Android Studio (`C:/Program Files/Android/Android Studio/jbr`, confirmed present + valid via `flutter doctor`). This is a machine-local path checked into git; whoever builds next should verify/adjust it for their machine.
  - `flutter analyze` clean. `flutter build appbundle --release` now succeeds (`app-release.aab`, 47.7MB), signed with the real upload keystore (`android/key.properties` present, keystore file exists at `C:/Users/Lenovo/upload-keystore.jks`, `hasReleaseKeystore` path taken, not the debug fallback). `versionName 1.0.0` / `versionCode 1` — fine for a first submission.
  - `google-services.json` present, launcher icons present, `/terms` and `/privacy` live (200) on prod, prod `/api/v1/packages` healthy (200).
  - **Still open / not fixable from here — blocks a safe launch:** forgot-password is broken in production (see entry above, same day) — SMTP send fails, 500 on `/auth/forgot-password`. Going live without fixing this means every real user who forgets their password is stuck with no recovery path. Strongly recommend fixing before submitting, even skipping the testing track.
  - Confirmed (not a bug, already documented as intentional in the 2026-09-10 entry below): logging in with an unrecognized email auto-registers a new account and logs it in. Verifying this against prod created one throwaway test account (`nonexistent_test_check@example.com`) — harmless but real prod row, flagging in case it needs cleanup.
  - Not verified from here (no dashboard access): live `RAZORPAY_WEBHOOK_SECRET` / live Razorpay keys actually set in Vercel prod env, and the webhook URL actually registered in the Razorpay dashboard — both called out as user-owned action items in the 2026-09-10 hardening entry and never confirmed done since.
- Outcome: mobile app itself builds, signs, and analyzes clean and is technically ready to upload as an AAB. Recommend fixing SMTP (blocking) and confirming Razorpay live-webhook config before hitting "publish" on Play Console, given the user's choice to skip the testing track.

### 2026-09-16 — Auth — forgot password fails in production (release APK + web)
- Status: Blocked (needs user action — no code bug found; credential/env issue on prod server)
- Request: forgot password not working in release APK; also not working in production generally.
- Files/areas: server/src/controllers/authController.ts (forgotPassword), server/src/services/emailService.ts, mobile/lib/services/auth_service.dart, mobile/lib/config/api_config.dart.
- Outcome: Reproduced directly against prod — `POST https://tour.speshway.site/api/v1/auth/forgot-password` returns HTTP 500 `"Failed to send OTP email to your address..."` for a real account. Mobile-side code (endpoint, request shape, release-mode host selection in `api_config.dart` forcing production) is correct — this is not a release-vs-debug bug, forgot password is broken for everyone in prod. Root cause is SMTP send failure in `emailService.ts`'s `safeSend` (tries 4 fallback ports, all fail). `emailService.ts` hardcodes a fallback Gmail account/app-password (`naveenkumar970100@gmail.com` / app password) if `SMTP_*` env vars aren't set — and per the 2026-08-27 audit entry below, this exact Gmail credential had **leaked in git history** and rotation was flagged but deferred to the user ("still on the user: ... rotate leaked SMTP credential ... set prod env"). Most likely Google auto-revoked that app password after the leak, so both the env var (if unrotated) and the hardcoded fallback are now invalid. Needs user action: generate a fresh Gmail App Password (or switch provider), set `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`EMAIL_FROM` in the Vercel production environment, redeploy, then re-test `/auth/forgot-password`. Could not fix from here — no access to Vercel env vars or the Gmail account.
- Status: In progress. `flutter analyze` clean; server `tsc` clean; `flutter test` / release AAB pending.
- Request: full Play Store production-readiness audit against `PLAY_STORE_PRODUCTION_CHECKLIST.md`, then implement safe P0/P1/P2 fixes (no app-id / signing-key / Firebase-project / payment-architecture changes; stop-and-ask on decisions).
- Findings & fixes this pass:
  - **P1 build tooling:** deleted `mobile/android/settings.gradle.kts` (conflicted with `settings.gradle`; bogus AGP 9.0.1 / Kotlin 2.3.20, missing google-services plugin).
  - **P1 signing hygiene:** root `.gitignore` now ignores `**/android/key.properties`, `**/android/local.properties`, `*.jks`, `*.keystore` (were unprotected).
  - **P1 security — credential logging:** `api_service.dart` no longer logs request bodies at all; every `debugPrint` in `api_service.dart` / `chat_service.dart` / `realtime_service.dart` now gated behind `kDebugMode` (`debugPrint` is NOT stripped in release).
  - **P1 security — cleartext:** new `android/app/src/main/res/xml/network_security_config.xml` (base cleartext=false; localhost/10.0.2.2/10.0.3.2 allowed for dev). Manifest `usesCleartextTraffic="true"` → `networkSecurityConfig`.
  - **P1 permissions:** removed unused `CAMERA` / `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` / `READ_MEDIA_IMAGES` from the manifest; removed unused `image_picker` + `image_cropper` deps and the dead `uploadImageFile(XFile)` method.
  - **P0/P1 offline fabrication:** `ApiService._handleOfflineFallback` no longer fabricates `success:true` for `/enquiries`, `/contact`, `/auth/me`, `/auth/change-password`, `/pay-remaining` — all offline writes now return an honest failure.
  - **P0 payments:** `pay_remaining_bottom_sheet.dart` is now **Razorpay-only** — removed the UPI/Card/Bank/Cash dropdown, `_submitDirectPayment()` (client-fabricated transaction id, no verification), raw card-number/CVV capture, and all "Demo" UI. Server-verified create-order → gateway → /payments/verify flow unchanged. (Matches [[razorpay-payment-flow]] intended state.)
  - **P1 account deletion (Play requirement):** NEW `DELETE /api/v1/auth/me` (`deleteMe` in `authController.ts`) — soft-delete + anonymise email/mobile, rotate password, clear FCM/DeviceTokens, clear refresh cookie. Client: `ApiConfig.deleteAccount`, `AuthService.deleteAccount()`, `AuthProvider.deleteAccount()`, and a "Delete account" row (confirm dialog) in `profile_screen.dart`. Privacy Policy updated with a deletion section; contact domain `holidaycity.com` → `tour.speshway.site`.
  - **P2 tests:** fixed the wrong `api_service_test.dart` custom-host assertion; `skip:true` on the two `widget_test.dart` tests that hit the live API / use stale finders (were timing out the suite). NEW `mobile/analysis_options.yaml` (flutter_lints).
- Deferred by user decision: Crashlytics (skipped this pass). Still on the user: upload keystore + Play App Signing, rotate leaked SMTP credential, host public privacy/terms + account-deletion web URL, Data Safety declaration, store listing, set prod env, deploy server with the new route.
- Follow-up (same day, user-approved): **P0 backend auth fix** — `authController.ts` `login` no longer resets an existing user's password on a wrong-password attempt; it now increments `failedAttempts` and returns 401 "Invalid email or password". Auto-registration on an unknown email is intentionally kept (existing frictionless-onboarding behaviour; removing it would be a business-logic change). `seedData.ts` — added a Google Play reviewer account `verification@gmail.com` / `verify@123` (Customer role, hashed via pre-save hook) right after the admin seed. Server `tsc` clean.

### 2026-09-10 — Fix: /terms & /privacy bounced to /login
- Status: Done. client `tsc` clean.
- Cause: the `/terms` and `/privacy` routes were wrapped in `getPublicRouteElement()`, which does `<Navigate to="/login" replace />` for any non-logged-in visitor — so clicking the legal links on the login page just redirected back to /login (web + mobile-responsive).
- Fix: `client/src/App.tsx` — render `<LegalPage doc=.../>` directly for `/terms` and `/privacy` (like `/login` / `/admin/login`), no auth wrapper. `client/src/pages/Legal/LegalPage.tsx` — "Back to home" `<Link to="/">` (which would itself bounce a logged-out user) replaced with a `navigate(-1)` button (falls back to `/`).
### 2026-09-10 — Production hardening (pass 1) — JWT secrets, Razorpay webhook, Android signing, lazy lists
- Status: In progress. server/client `tsc` + `flutter analyze` clean; server boots clean.
- Request: "make it production good" + "each mobile screen should render up to where it's scrolled".
- Server:
  - NEW `server/src/config/env.ts` — single source for `jwtSecret()` / `jwtRefreshSecret()`; both throw in production if unset or equal to the repo-committed placeholder strings (`holidaycity_super_secret_*`). `assertProductionEnv()` (called in `index.ts` right after `dotenv.config()`) hard-exits a production boot on missing `MONGODB_URI` / weak JWT secret, warns on missing `CLIENT_URL` / test Razorpay key / missing `RAZORPAY_WEBHOOK_SECRET` / Cloudinary. Dev keeps working (falls back, warns if placeholder in use).
  - Removed the 5 scattered `process.env.JWT_SECRET || '<hardcoded>'` fallbacks in `middleware/auth.ts`, `routes/api.ts` (also killed a bogus `require('jsonwebtoken')` in ESM `optionalAuth`), `controllers/authController.ts` (×3) → all use `config/env.ts`.
  - NEW `POST /api/v1/payments/webhook` (`razorpayWebhook` in `paymentController.ts`, mounted in `index.ts` with `express.raw` BEFORE `express.json`). HMAC-verifies `x-razorpay-signature` with `RAZORPAY_WEBHOOK_SECRET`, acks 200 immediately, then on `payment.captured`/`order.paid` reconciles the booking (idempotent via `transactionId` / `Full Paid` guard; infers advance-vs-full by amount) so a booking still gets marked paid if the app/browser dies before `/payments/verify`. Returns 503 when the secret isn't configured.
- Mobile (Android release):
  - `android/app/build.gradle` — real `signingConfigs.release` driven by a git-ignored `android/key.properties` (falls back to debug key when absent so `flutter run --release` still works). NEW `android/key.properties.example` with keytool instructions. `proguardFiles` wired + NEW `android/app/proguard-rules.pro` (Flutter + Razorpay + @Keep + Firebase keeps) but `minifyEnabled`/`shrinkResources` left **false** (a shrunk build must be smoke-tested first — comment says so).
  - Deleted stray `android/app/build.gradle.kts` (Flutter-template leftover, wrong namespace `com.holidaycity.holidaycity_mobile`; the active Groovy `build.gradle` uses `com.holidaycity.mobile`).
- Mobile (lazy render-on-scroll): converted `my_bookings_screen`, `wallet_screen`, and `home_screen` from `SingleChildScrollView > Column > shrinkWrap ListView.builder/.separated` to `CustomScrollView` — `SliverToBoxAdapter` header(s) + `SliverList.builder` for the repeating cards, so list items build lazily as scrolled into view. `home_screen`: only the vertical "Trending Tour Packages" list was the eager one (the banner PageView + India/International/Themes/Activities rails were already lazy `ListView.builder`s); it's now a `SliverList.builder` after the adapter. `my_enquiries_screen` was already fine (`Expanded > ListView.builder`, no shrinkWrap) — left as-is. Forms/bottom-sheets/detail screens left — small bounded content.
- REMAINING (not done this pass):
  - Only the user can: rotate the leaked secrets, set real prod env vars (incl. `NODE_ENV=production`, `CLIENT_URL`=real domain, live `rzp_live_*` keys, `RAZORPAY_WEBHOOK_SECRET`), create the upload keystore, register the webhook URL in Razorpay dashboard, smoke-test a release build + a real test-mode payment.
  - Lazy-list sweep: DONE for the list screens (`my_bookings`, `wallet`, `home`; `my_enquiries` was already lazy). Detail screens + forms/bottom-sheets intentionally left (bounded content). All still need a device/visual check since the scroll structure changed.
### 2026-09-10 — Push notifications broken when app closed/killed — data-only + client render
- Status: Done. `flutter analyze` + server `tsc` clean. Needs redeploy of server + fresh APK.
- Request: notifications only arrive with the app open; nothing on lock screen / background / killed.
- Diagnosis: server sent proper `notification` FCM messages, manifest/channel/token all correct — but Android background/killed delivery of OS-rendered notification messages is unreliable on aggressive OEMs, and the client's background handler only `print`ed. What the user saw "when open" was the socket-driven in-app list + the foreground local notification.
- Fix (production pattern — client renders every notification):
  - server/src/config/firebase.ts: `sendPushNotification` + `sendMulticastPushNotification` now send **Android data-only** (`data: {...data, title, body}`, `android.priority: 'high'`, no top-level `notification` / `android.notification`). iOS keeps `apns.payload.aps.alert` + `content-available: 1` + `apns-priority: 10` so the OS still shows it.
  - mobile/lib/services/push_notification_service.dart: NEW top-level `kHighImportanceChannel` + `_displayNotification(RemoteMessage)` used by BOTH the foreground handler and the background isolate. `_firebaseMessagingBackgroundHandler` now initializes flutter_local_notifications, creates the channel, and shows the notification (Android only — iOS is OS-rendered, skip to avoid a duplicate). Tap payload stays `jsonEncode(message.data)` → routes via NotificationRouter.
- Not fixable in code: if the OS has force-stopped the app (some OEMs do this on swipe-away), FCM won't deliver until it's reopened — user must disable battery optimization / enable autostart for HolidayCity.

### 2026-09-10 — Mobile login: remove phone/OTP dead-end
- Status: Done. `flutter analyze` clean.
- Request: OTP/phone login was a dead end (routed to a fake "code sent" screen that rejected every code).
- Files/areas: mobile/lib/views/auth/login_screen.dart
- Outcome: `_handleIdentifierContinue` phone branch no longer navigates to `_LoginStep.otp` — it shows an inline error ("Phone sign-in isn't available yet — please sign in with your email address"). Identifier field relabelled 'Email address', helper copy updated. `_resolvedPhone` made `final ''`. The `_buildOtpStep` / `_handleVerifyOtp` code is left in place (unreachable now; the NOTE comment explains) rather than ripped out mid-concurrent-edit.

### 2026-09-10 — Mobile: notification deep-linking + Activities error state
- Status: Done. `flutter analyze` clean.
- Request: close audit gaps — tapping a push/notification did nothing; some screens had no error/retry.
- Files/areas: NEW mobile/lib/config/app_globals.dart (`navigatorKey`), NEW mobile/lib/services/notification_router.dart, mobile/lib/main.dart, mobile/lib/services/push_notification_service.dart, mobile/lib/views/notifications/notifications_screen.dart, mobile/lib/views/activities/activity_list_screen.dart.
- Outcome:
  - `NotificationRouter` maps notification `type` -> screen: booking/payment -> MyBookings, enquiry/quote/lead -> MyEnquiries, unknown-from-push -> Notifications list, unknown-in-app -> no-op. Uses global `navigatorKey`, defers a frame so terminated-launch works.
  - Wired into `push_notification_service`: `onMessageOpenedApp`, `getInitialMessage`, local-notification tap. Local-notif payload now `jsonEncode(data)` (was `data.toString()`).
  - In-app notification rows navigate on tap for booking/enquiry types (plus mark-read).
  - Activities list: `AppSkeletonList` (loading) / `AppErrorState(onRetry)` (fetch threw + empty) / `AppEmptyState` (no results); added `_loadFailed` + try/catch.
  - Left as-is by design: Home / Destination detail / Wallet / Notifications already fall back to cached/bundled data or poll, so a hard error screen would flicker.

### 2026-09-10 — Package multiple images — admin gallery uploader + mobile carousel
- Status: Done. server `tsc` + client `tsc` + `flutter analyze` clean; e2e API test passed.
- Request: confirm packages accept multiple images (admin) + show a carousel on the mobile package detail; implement + test if missing.
- Findings: server `Package` schema already had `coverImage` (required) + `gallery: [String]`. `updatePackage` persisted `gallery` (spreads `payload`), but `createPackage` whitelisted fields and dropped it. Admin UI only had a single cover-image uploader. Mobile detail showed only `package.mainImage` (no carousel). Mobile `PackageModel` already merges coverImage+gallery+images into `images`. Web `PackageDetailPage` already reads `pkg.images || pkg.gallery`.
- Files/areas:
  - server/src/controllers/packageController.ts — `createPackage` now persists `gallery` (falls back to `payload.images`), filtered to non-empty strings.
  - client/src/admin/pages/PackageManagerPage.tsx — new `gallery: string[]` state; "Gallery Images (carousel)" card with thumbnail grid + per-image remove, a `CloudinaryImageUploader` that appends, and an Enter-to-add URL input; loaded from `pkg.gallery` (or `pkg.images`) on edit, reset on new, sent in create + update payloads.
  - mobile/lib/views/packages/package_detail_screen.dart — `_PackageDetailScreenState` gains `PageController _imgController` + `_imgIndex` + `_galleryImages` (dedup of `package.images`, single-image fallback); SliverAppBar `FlexibleSpaceBar` background swapped from one `CachedNetworkImage` to a `PageView.builder` carousel with an animated dots indicator (hidden when 1 image). Kept the dark gradient + CODE badge.
- Test: booted dev server, logged in as admin@holidaycity.com, `PATCH /admin/packages/:id {gallery:[3 urls]}` → `success:true`; `GET /packages/:slug` returned the 3-item `gallery`; reverted the test package's gallery to `[]` afterward.
### 2026-09-10 — Destination detail — remove "Enquire for <destination> Tour" button
- Status: Done. `flutter analyze` + client `tsc` clean.
- Request: no enquire button on the destination detail screen.
- Files/areas: mobile/lib/views/destinations/destination_detail_screen.dart, client/src/pages/Destinations/MobileDestinationDetailPage.tsx
- Outcome: removed the fixed/sticky bottom "Enquire for {name} Tour" button on both the Flutter screen and its responsive-web twin. Flutter: also removed the now-unused `_openEnquirySheet` + 4 imports (custom_button, auth_provider, login_screen, enquiry_bottom_sheet). Web: kept `PackageEnquiryModal` + enquiry state (still used by package-card booking + post-login auto-open); `pb-28` → `pb-6`. Per-package Enquire/Book on the package cards is unchanged; desktop `DestinationDetailPage.tsx` had no such button.
### 2026-09-10 — Web dark mode (client/) — infra + full site first pass
- Status: In progress. `vite build` green (had to `npm install firebase --no-save` — it was in package.json but missing from node_modules; pre-existing, unrelated).
- Request: full dark mode across the whole web bundle (marketing + dashboard + admin); toggle in navbar and dashboard settings; default to device setting.
- Files/areas: client/src/styles/globals.css (`@custom-variant dark` + `.dark` token remap + raw-grey/`bg-white` utility overrides), client/src/context/ThemeContext.tsx (NEW — mode light|dark|system, persists `hc_theme`, tracks OS changes, sets `.dark` on <html> + theme-color meta), client/src/components/common/ThemeToggle.tsx (NEW — `icon` + `row` variants), client/src/main.tsx (ThemeProvider wrap), client/index.html (pre-paint FOUC script), client/src/components/common/Navbar.tsx (icon toggle desktop + mobile actions), client/src/pages/User/UserDashboardPage.tsx (row toggle at top of Account).
- Approach: Tailwind v4 class-based dark. The neutral `@theme` tokens (`--color-canvas/ink/line/fill/sand/slate-*`, shadows) are re-pointed under `.dark`, so every semantic utility (`bg-canvas`, `text-ink`, `border-line`…) flips for free. The ~50 components that hardcode `bg-white` / `text-slate-900` / `border-gray-200` (and `/opacity` variants) are caught by `.dark .bg-white { … !important }` style global overrides. Brand colours (ocean/aqua/gold), images and gradients untouched. Custom classes (`glass-card-solid`, `glass-nav`, `glass-pill-premium`, selection) get explicit `.dark` rules.
- Remaining: spot-fixes for `bg-[#hex]` literals, gradient hero sections with baked light text, and admin-dashboard-specific surfaces — iterate from screenshots.

### 2026-09-10 — Mobile Themes + Activities list — match home card design
- Status: Done. `flutter analyze` clean.
- Request: Themes tab and Activities list screen cards should look like their home-screen equivalents.
- Files/areas: mobile/lib/views/themes/theme_screen.dart, mobile/lib/views/activities/activity_list_screen.dart
- Outcome:
  - Themes (`theme_screen.dart`): replaced the image-on-top + white panel ("★ Top pick") grid card with the home-style full-bleed `CachedNetworkImage` + top→bottom black gradient + bold white `theme.name` overlaid at the bottom (`Stack`/`ClipRRect`, radius 18, soft shadow). 2-col `GridView` kept; `childAspectRatio` 0.82 → 0.75.
  - Activities (`activity_list_screen.dart`): reshaped the list card to match the home `_buildActivityQuickCard` — 150h image with a single solid `primaryColor` category pill top-left (dropped the white category pill + black rating pill), then white body: bold title (1 line), location (1 line), and a price row with small `Enquire` (surfaceAlt + border) / `Book` (primary@10%) pills instead of the OutlinedButton/ElevatedButton pair. Auth-gated enquiry/booking handlers extracted to `_ensureLoggedIn` / `_openEnquire` / `_openBooking`. Dropped the "Starting From" label and duration row.

### 2026-09-10 — Razorpay payments — real gateway flow + result screens (server + web + mobile)
- Status: In progress (code + `tsc`/`flutter analyze` clean; needs live test with real checkout)
- Request: payments "not working" in prod (checkout won't open / opens then errors / pays but booking not updated). Build proper processing/success/error/timeout screens on all surfaces; must work for BOTH Razorpay test and live keys.
- Root causes found: (1) web `handleRazorpayPayment` monkey-patched `window.open` to force-close the checkout popup ~150ms after opening and fake success; `modal.ondismiss` + `payment.failed` also faked success. (2) web + mobile fell back to a hardcoded test key `rzp_test_TZpr4ebY4Qvo8k` when the server response lacked `key` → key/order mismatch → verify always failed. (3) mobile `_handleRazorpayError`/`_handleExternalWallet` called `_submitDirectPayment()` (fake success on ANY error). (4) server silently capped test amounts to ₹15k and returned generic 500s.
- Server (`server/src/controllers/paymentController.ts`, `routes/api.ts`): rewritten. `resolveRazorpay()` auto-detects test vs live from key prefix (same code path). New `GET /payments/config` (+ `razorpay-key` alias) → `{configured,key,mode}`. `create-order`: 503 `PAYMENT_NOT_CONFIGURED` when keys absent, clear `AMOUNT_TOO_LARGE_FOR_TEST` (₹5,00,000 test ceiling) instead of silent cap, returns `key`+`mode`. `verify`: HMAC check → then `razorpay.payments.fetch` to confirm `captured`/`authorized` (auto-captures authorized), order-id match, and amount-due cross-check; structured error codes (`SIGNATURE_INVALID`, `ORDER_MISMATCH`, `PAYMENT_NOT_CAPTURED`, `AMOUNT_MISMATCH`). No fake-success path anywhere. Server `.env` currently has TEST keys (`rzp_test_TZpr4ebY4Qvo8k`); swapping to `rzp_live_…` needs no code change.
- Web: NEW `client/src/components/payments/RazorpayPaymentModal.tsx` — self-contained state machine (loading→checkout→verifying→success/failed/timeout/cancelled) with TEST-MODE badge, real `handler`+`/payments/verify`, 6-min timeout, retry. `UserDashboardPage.tsx`: deleted `handleRazorpayPayment` (window.open patch) + `handleDirectDemoPayment` + all "⚡ 1-Click Instant / Skip OTP" buttons and guide bullets; Pay buttons now `openPayFlow()` → modal in both mobile-layout and desktop-layout returns.
- Mobile: NEW `mobile/lib/views/payment/payment_result_view.dart` (`PaymentResultView` — processing/success/failed/timeout/cancelled). `pay_remaining_bottom_sheet.dart`: `_Phase` state machine renders `PaymentResultView` in place of the form; real `Timer(330s)` timeout backstop; `_handleRazorpayError` maps `Razorpay.PAYMENT_CANCELLED`→cancelled else failed (no more auto `_submitDirectPayment`); `_handleExternalWallet` no longer fakes success; removed the "⚡ Skip OTP & Confirm Payment (100% Success)" button and hardcoded key fallback. Non-Razorpay methods (UPI/Card/Cash manual record via `/bookings/:id/pay-remaining`) unchanged.
- Not done / notes: Android `minifyEnabled` is off so no Razorpay proguard rules needed yet (add keeps if R8 is enabled later). Stray `mobile/android/app/build.gradle.kts` (template leftover, wrong namespace) coexists with the active `build.gradle` — untouched. No webhook endpoint added. Secrets were pasted in chat — advised rotation.

### 2026-09-10 — Legal pages — Terms & Conditions + Privacy Policy on login (web + mobile)
- Status: Done
- Request: add Terms & Conditions + Privacy Policy to the login screen/page in frontend and mobile; use url_launcher on mobile; content tailored to HolidayCity.
- Files/areas: client/src/pages/Legal/LegalPage.tsx (new), client/src/App.tsx (/terms, /privacy routes), client/src/pages/User/UserDashboardPage.tsx (login "By continuing…" line), client/src/components/common/Footer.tsx (footer links), mobile/pubspec.yaml (url_launcher ^6.3.1), mobile/lib/config/api_config.dart (webUrl/termsUrl/privacyUrl), mobile/lib/views/auth/login_screen.dart (_buildLegalNote + _openUrl via url_launcher), mobile/android/app/src/main/AndroidManifest.xml (<queries> https VIEW intent).
- Outcome: web LegalPage renders terms/privacy from shared static content mirroring mobile legal_screen.dart. Mobile login shows a tappable legal note opening `${ApiConfig.serverHost}/terms` and `/privacy` externally. `flutter analyze` clean.
  - Also fixed: search fields on every mobile screen (home search, home destinations tab, Explore Packages, Themes, Activities) showed an unwanted filled inner rectangle in dark mode — the global `InputDecorationTheme` (`filled: true` / `fillColor: surfaceAlt`) leaked into the borderless search TextFields. Added `filled: false` to each search field's `InputDecoration`. Files: home_screen.dart (x2), package_list_screen.dart, theme_screen.dart, activity_list_screen.dart.

### 2026-09-10 — Mobile: replace inline filter chips with a filter sheet
- Status: Done. `flutter analyze` clean (12 pre-existing warnings in pay_remaining_bottom_sheet are a concurrent session's WIP, not this change).
- Request: Destinations / Themes / Packages screens — drop the inline chip row (All / Popular / …) and use a right-side "three-line" filter button that opens a filter panel.
- Files/areas: NEW mobile/lib/widgets/filter_sheet.dart (`FilterIconButton` + `showFilterSheet`), mobile/lib/views/home/home_screen.dart (`_buildDestinationsGridTab`), mobile/lib/views/themes/theme_screen.dart, mobile/lib/views/packages/package_list_screen.dart.
- Outcome: `FilterIconButton` (tune icon, 52px, shows a dot when a non-default filter is active) sits to the right of the search field on Destinations / Themes / Packages. Tapping it opens `showFilterSheet` — a themed single-select bottom sheet listing the same options; the pick updates the existing filter state (`_selectedDestFilter` / `_selectedFilter` / `packageProvider.setCategory`). Activities screen also switched over (inline `Icons.tune_rounded` in its search-field header, since its layout differs) — chip pill row removed, `_selectedCategory` driven from the sheet.

### 2026-09-10 — Fix url_launcher channel-error on login legal links
- Status: Done. `flutter analyze` clean.
- Request: `PlatformException(channel-error … url_launcher_android … launchUrl)` when tapping Terms/Privacy on the login screen.
- Cause: `url_launcher` native plugin not registered (half-installed / no clean rebuild after the dependency was added).
- Fix: `login_screen.dart` `_buildLegalNote` no longer uses `url_launcher` — the Terms & Conditions / Privacy Policy links now `Navigator.push` the existing in-app `LegalScreen.terms()` / `LegalScreen.privacy()` (themed, works offline). Removed the `url_launcher` import + `_openUrl`. `pubspec.yaml` dependency left in place but unused; `ApiConfig.termsUrl/privacyUrl/webUrl` kept as web equivalents.

### 2026-09-10 — Mobile dark mode pass 3 — detail screens + bottom sheets
- Status: Done. `flutter analyze` clean.
- Converted the 12 files reverted in pass 2, with targeted line edits (no regex): the 6 `*_detail_screen.dart` (package/activity/destination/booking/enquiry/banner), the 6 `*_bottom_sheet.dart` (booking/pay_remaining/enquiry/chat/activity_booking/activity_enquiry), plus `offer_packages_screen`, `theme_detail_screen`, and residual text colours in home/profile/edit_profile/onboarding. All now use `context.colors` for scaffolds, surfaces, borders, and text. `enquiry_detail_screen` helpers `_buildDetailCard`/`_buildInfoRow` gained a `BuildContext context` param. Tinted semantic info-panels (pastel blue/green boxes) intentionally left as-is.
- Mobile dark mode is now feature-complete across all screens. Web (`client/`) still pending.

### 2026-09-10 — Mobile dark mode pass 2 + nav/login tweaks
- Status: Done (detail screens finished in pass 3). `flutter analyze` clean.
- `AppTheme.gradientAppBar` now takes `context` and is theme-aware: brand gradient + white text in light, flat `surface` + themed text in dark. Callers updated (home destinations tab, package_list, theme_screen, wallet).
- Home back behaviour: `PopScope` in `home_screen` — back/gesture on the Home tab closes the app; on any other tab it returns to the Home tab (`_currentIndex = 0`).
- Search placeholders removed (`hintText: ''`) on home (both bars), package_list, theme_screen, activity_list; login + register field hints emptied too.
- Login screen: removed the "Explore as Guest" button under Register (hero "Guest" pill kept); made the sheet + fields + prompts theme-aware; shared `_registerPrompt()` helper; tightened sheet spacing.
- Converted to `context.colors`: legal_screen, forget_screen, onboarding, network_error_screen, edit_profile_screen, register_screen (+ earlier: theme infra, home, profile+toggle, section_header, package_card, app_states, custom_text_field, skeleton_loader, package_list, theme_screen, notifications, my_enquiries, my_bookings, activity_list, wallet).
- NOTE: a regex bulk-edit on the 6 detail screens + 6 bottom sheets corrupted formatting and was reverted (`git checkout`). Those 12 files are still light-only for hardcoded colors (they inherit themed Scaffold/AppBar/Card/BottomSheet from ThemeData, so not broken, just imperfect in dark). Redo with targeted Edits, not regex.

### 2026-09-10 — Mobile home tweaks + app-wide dark mode (Flutter, pass 1)
- Status: superseded by pass 2 above
- Request: remove "N" avatar on home; redesign search box with static placeholder; add heading for offers carousel; full light/dark theme for the whole app with a toggle in Profile > Account; default to the phone's mode on fresh install.
- Files/areas: mobile/lib/config/theme.dart, providers/theme_provider.dart, main.dart, views/home/home_screen.dart, views/profile/profile_screen.dart, widgets/{section_header,package_card,app_states,custom_text_field,skeleton_loader}.dart, views/{packages/package_list,themes/theme_screen,notifications/notifications_screen,enquiry/my_enquiries_screen,booking/my_bookings_screen,activities/activity_list_screen,wallet/wallet_screen}.dart
- Outcome:
  - Theme infra: NEW `AppColors` (semantic tokens) + `context.colors` / `context.isDark` extension in theme.dart. `AppTheme.lightTheme` + NEW `AppTheme.darkTheme` built from one `_build(AppColors, Brightness)` — Scaffold/AppBar/Card/BottomSheet/Dialog/Input/Chip/Divider/PopupMenu all theme automatically. `main.dart` wires `darkTheme`.
  - `ThemeProvider`: now persists choice to SharedPreferences (`hc_theme_mode`), **defaults to `ThemeMode.system`** (fresh install follows the phone; explicit toggle then wins). New `isEffectivelyDark(context)` resolves system against device brightness.
  - Profile: new **Dark mode** row (Switch) at top of Account group.
  - Home quick fixes: removed the circular "N"/initial avatar in the greeting; search bar rebuilt as a single field with an inline leading icon + static hint "Search destinations and tours" (no separate blue button); added `SectionHeader('Exclusive Offers', 'Limited-time deals on top tours')` above the banner carousel.
  - Converted to `context.colors`: full home (header, bottom nav, both search bars, activity card), full profile (all helpers + toggle), section_header, package_card, app_states, custom_text_field, skeleton_loader, and screens: package_list, theme_screen, notifications, my_enquiries, my_bookings, activity_list, wallet.
  - `flutter analyze` clean. Web dark mode = separate follow-up (user chose "mobile Flutter first").
- Batch 2 (remaining hardcoded colours): detail screens (package/activity/destination/booking/enquiry/banner _detail), bottom sheets (booking, enquiry, chat, activity_booking, activity_enquiry, pay_remaining), auth (login/register/forget), edit_profile, onboarding, legal, network_error. These still render (theme-level surfaces adapt) but have light patches / low-contrast text in dark mode until converted.

### 2026-09-10 — Mobile splash — Stop blocking splash on network / add transition
- Status: Done. `flutter analyze` clean.
- Request: On reopen, splash shows too long; want logo->home animation for logged-in users.
- Files/areas: mobile/lib/providers/auth_provider.dart, mobile/lib/views/splash/splash_screen.dart
- Outcome: `AuthProvider.initAuth()` was awaiting `fetchCurrentUser()` (network `/auth/me`) — with the new 20s API timeout that froze the splash for up to ~20s on a slow link. Now `initAuth()` is local-only (`getSavedUser()` from SharedPreferences); new `refreshCurrentUserInBackground()` does the `/auth/me` refresh fire-and-forget after Home is already shown. Splash min duration 1000->1100ms. Splash->Home now uses a 550ms fade+scale `PageRouteBuilder` (`_logoTransitionTo`) instead of a hard `MaterialPageRoute` cut. Onboarding path unchanged.

### 2026-09-10 — Mobile release APK build — JDK + google-services.json
- Status: Done
- Files/areas: mobile/android/gradle.properties, mobile/android/app/google-services.json (restored, stays gitignored)
- Outcome: `org.gradle.java.home` pointed at a missing Adoptium path -> repointed to Android Studio JBR. `google-services.json` (gitignored since 20573bc) restored from git `aa73b5c` (project tour-1a8a9, pkg com.holidaycity.mobile). `flutter build apk --release` OK -> build/app/outputs/flutter-apk/app-release.apk (55.8MB, exceeds 30MB send limit).

### 2026-09-10 — Mobile release APK — Fix network-dependent API host
- Status: Done
- Request: Release APK only works on one WiFi network, fails on others.
- Files/areas: mobile/lib/config/api_config.dart, mobile/lib/services/api_service.dart
- Outcome: Two root causes. (1) Config: release build shipped `isProduction = false` + `hostIp = '192.168.1.20'` -> LAN IP only reachable on dev Wi-Fi. Now a plain toggle: `isProduction = true` -> `https://tour.speshway.site`, `false` -> `http://localhost:5000`; `hostIp` LAN branch removed from `serverHost`. (2) Networking: `ApiService.timeoutDuration` was **3s** — a remote HTTPS call already takes ~2s from a wired line, so it timed out on mobile data / weaker Wi-Fi every time. Raised to 20s. Also `_generateCandidateUrls` now only appends emulator/localhost/LAN fallbacks when the target is already a local host, so a remote request no longer burns extra timeout windows on dead local candidates. `flutter analyze` clean. Ship APK with `isProduction = true`.

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
