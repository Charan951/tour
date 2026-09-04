# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Travelers (public site).** Indian and NRI holiday-goers planning a domestic or international
trip — families, couples/honeymooners, solo travelers, corporate/MICE buyers, senior and student
groups. They arrive from search or referral, often on a phone, in a research-and-compare mindset:
they want to see destinations and packages, understand what a trip includes and costs, and reach a
human quickly rather than self-book and pay upfront. Success for them is submitting an enquiry (or a
booking with an advance) and getting a fast, knowledgeable reply.

**Travel consultants / operations staff (admin back-office).** Internal team working the lead
pipeline all day: reviewing incoming enquiries, contacting customers by phone/WhatsApp/email,
building quotes, converting leads to bookings, taking advance and balance payments, running
real-time support chat, and maintaining the package/destination/blog catalog and site CMS.
Success for them is zero lead leakage and fast throughput — every enquiry seen, assigned, and moved
forward without hunting through screens.

Both audiences are primary and equally weighted.

## Product Purpose

HolidayCity is a travel booking platform built on a **lead-generation model**: travelers discover
curated tour packages and destinations, submit detailed trip enquiries, and consultants convert
those enquiries into confirmed bookings through an integrated back-office. Bookings support advance
and remaining-balance payments, and travelers and consultants communicate through topic-threaded
real-time chat plus transactional email. The product exists because premium/custom holiday planning
still needs a human consultant in the loop; the platform makes that loop fast, organized, and
scalable instead of replacing it with a self-service checkout. Success is measured by qualified
enquiries captured, enquiry-to-booking conversion, and consultant response time.

## Positioning

A **consultant-mediated travel platform**, not a self-service OTA. The public site is a
high-conversion discovery and lead-capture surface with no upfront-payment wall; the back-office is
a purpose-built CRM where the same catalog, leads, bookings, payments, and customer chat live in one
system with real-time sync across web, admin, and the mobile app. The differentiator competitors
can't truthfully copy is the tight coupling: browse → enquire → consultant quote → booking →
advance/balance payment → in-context support chat, all on one data spine with live updates.

## Operating Context

- **Web client (React) is the design surface** for this work: one SPA serving the public marketing
  site, the logged-in traveler dashboard (bookings, enquiries, profile), and the `/admin`
  back-office.
- **Parallel surfaces (not designed here, but must stay coherent):** a Flutter mobile app that
  deliberately mirrors the web feature set and consumes the same `/api/v1` backend. The web SPA
  also swaps in dedicated mobile-optimized page components below 1024px width rather than relying
  only on responsive CSS.
- **Consultant workflow:** enquiry arrives → real-time notification → assign to a consultant →
  contact via integrated WhatsApp / phone / email → build quote → status transitions
  (New → Contacted → Quotation Sent → Negotiation → Confirmed → Completed, or Lost) → booking →
  advance payment → balance payment → support chat throughout → post-trip review request.
- **Traveler channels:** click-to-call, click-to-WhatsApp, enquiry forms (package-specific,
  destination-specific, contact), newsletter, and in-dashboard chat with the support team.
- **Real-time is a product expectation, not a nicety:** catalog edits, new leads, booking status,
  and chat messages propagate live to all connected clients; the admin panel shows a connection
  indicator and falls back to polling if the socket drops.
- **Content operations:** consultants maintain packages (day-wise itineraries, inclusions/
  exclusions, hotels, pricing, gallery), destinations (overview, best time, attractions, tips),
  travel themes, blogs, testimonials, FAQs, homepage banners, and global site/SEO settings through
  the CMS — the public site is fully content-driven from MongoDB.

## Capabilities and Constraints

**Implemented capabilities**

- Public catalog: destinations, packages (with itinerary/hotels/inclusions), travel themes, blogs,
  testimonials, FAQs — all live from MongoDB, SEO meta per entity, dynamic `/sitemap.xml`.
- Lead capture: enquiry forms with validation and rate limiting; newsletter; contact messages.
- Bookings: create booking, advance payment, remaining-balance payment; status lifecycle.
- Traveler dashboard: my bookings, my enquiries, profile; token-gated but with lightweight
  optional-auth reads.
- Admin back-office: lead CRM, bookings manager, package/destination/banner/theme managers, CMS
  manager, support messages inbox, dashboard with charts.
- Real-time chat: topic-threaded (per booking/enquiry), web + mobile + admin inbox, offline-email
  fallback when a recipient isn't connected.
- Cross-client real-time sync via Socket.io; multi-tab consistency; polling fallback.
- Cloudinary image uploads; transactional email (nodemailer/SMTP).

**Constraints**

- Auth is a single JWT Bearer access token in `localStorage` (traveler token `hc_token`, admin
  token `hc_access_token`); no refresh-token rotation. `Super Admin` role bypasses all role checks.
- Redis is optional; the cache falls back to an in-process LRU store, so the design cannot assume a
  shared cache across instances.
- All API routes are versioned under `/api/v1` and currently live in a single router module.
- Global API-cache invalidation fires on every successful write; many read endpoints are
  intentionally live/no-cache.
- Deployment is Vercel (static SPA + serverless-style server build), not the AWS/Nginx target
  described in older internal specs.

**Terminology**

- **Enquiry / Lead** — a traveler's trip request (ID like `HC-2026-1042`).
- **Booking** — a confirmed trip with payment tracking (ID like `BK-2026-1004`).
- **Package** — a sellable tour with itinerary, hotels, inclusions, pricing.
- **Destination** — a place with a guide; packages attach to destinations.
- **Theme** — persona/interest grouping (Honeymoon, Family, Adventure, Luxury, Wildlife,
  Pilgrimage, etc.).
- **Topic** — a chat thread bound to a specific booking or enquiry.

**Explicitly undecided / open**

- No brand elements are locked. The current name ("HolidayCity"), tagline
  ("Explore. Experience. Enjoy."), tropical ocean color palette, and Inter/Outfit typography are
  **current-state evidence, not binding constraints** — future design work may replace them.
- RBAC beyond coarse role-string checks (granular permission matrix) is specced but not built.

## Brand Commitments

None are binding. The product currently ships under the name **HolidayCity** with the tagline
**"Explore. Experience. Enjoy."**, a tropical-ocean visual identity, and a warm, expert,
reassuring voice aimed at holiday-planning travelers. These are recorded as the present state so
future work can recognize and deliberately evolve them — not as constraints to preserve.

## Evidence on Hand

- **Real, content-driven catalog:** packages, destinations, themes, blogs, testimonials, FAQs are
  authored by staff through the CMS and stored in MongoDB (not hardcoded).
- **Product documentation:** consolidated into [MEMORY.md](MEMORY.md) (architecture, data model,
  design system as-built, security/SEO/perf targets, spec-vs-implementation gaps).
- **Working application:** React client (`client/`), Express API (`server/`), Flutter app
  (`mobile/`), all runnable via `npm run dev` / `flutter run`.
- **This is a real business with real customers.** Customer-facing proof — testimonials, review
  counts, traveler statistics, office locations, partner logos, awards/accreditations — must be
  **real or supplied by the client**. Do not fabricate any of it. Placeholder counts currently
  visible in the UI are not verified data.
- **Assets present:** brand logo and favicon in `client/public/` (synced to the mobile app at
  server boot). No photography library, no verified testimonial corpus, no confirmed partner list
  in-repo.

## Product Principles

1. **The consultant is the product.** Every traveler surface exists to hand a qualified,
   well-briefed lead to a human fast; every admin surface exists to move that lead forward without
   friction. Design serves the handoff.
2. **One data spine, live everywhere.** Catalog, leads, bookings, payments, and chat are the same
   records across public site, dashboard, admin, and mobile, updating in real time. Never design a
   surface that implies a stale or siloed view.
3. **No payment wall on discovery.** Browsing and enquiring are always free and frictionless;
   payment appears only after a consultant-confirmed booking. Keep the enquiry path shorter than
   any alternative.
4. **Content-driven, not hardcoded.** The public site reflects whatever staff publish in the CMS.
   Design for variable-length itineraries, missing images, long destination names, and empty
   catalog states as normal cases.
5. **Truth over polish in proof.** This is a real business; social proof, numbers, and partner
   claims are only shown when real. An honest empty state beats an invented statistic.

## Accessibility & Inclusion

No formal standard has been committed. Practical requirements from the user base: mobile-first
(most traveler traffic is phones), usable on mid-range Android devices and slower networks, and
content legible for a broad non-specialist audience including older travelers. Treat WCAG 2.1 AA as
the working target for new work until the client sets a different bar.
