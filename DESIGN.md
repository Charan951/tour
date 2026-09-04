---
name: HolidayCity
description: A consultant-mediated travel platform with a tropical-ocean, glass-forward identity.
colors:
  primary-ocean: "#0A6FB5"
  deep-sea: "#063B6D"
  secondary-ocean: "#58B8E8"
  tropical-aqua: "#57D0C9"
  ocean-cyan: "#0891B2"
  sunset-gold: "#F6C65B"
  gold-amber: "#F59E0B"
  whatsapp-green: "#25D366"
  ink: "#0F172A"
  slate-body: "#475569"
  slate-muted: "#94A3B8"
  slate-line: "#E2E8F0"
  slate-fill: "#F1F5F9"
  sand: "#F8F7F3"
  bg-canvas: "#FAFAFC"
  white: "#FFFFFF"
typography:
  display:
    fontFamily: "Urbanist, Manrope, 'Plus Jakarta Sans', sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 4rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Urbanist, Manrope, 'Plus Jakarta Sans', sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Urbanist, Manrope, 'Plus Jakarta Sans', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Urbanist, Manrope, 'Plus Jakarta Sans', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  price:
    fontFamily: "Urbanist, Manrope, 'Plus Jakarta Sans', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  label:
    fontFamily: "Urbanist, Manrope, 'Plus Jakarta Sans', sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.1em"
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary-ocean}"
    textColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.deep-sea}"
    textColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.slate-fill}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "10px 14px"
    typography: "{typography.label}"
  button-secondary-hover:
    backgroundColor: "{colors.slate-line}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "10px 14px"
  badge-code:
    backgroundColor: "{colors.slate-fill}"
    textColor: "{colors.primary-ocean}"
    rounded: "{rounded.sm}"
    padding: "2px 10px"
    typography: "{typography.label}"
  chip-nav-active:
    backgroundColor: "{colors.slate-fill}"
    textColor: "{colors.primary-ocean}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
---

# Design System: HolidayCity

## Overview

**Creative North Star: "The Glass Concierge"**

HolidayCity presents like the front desk of a premium travel house: frosted glass panels
resting over deep-ocean color, confident blues carrying the weight, gold used the way a concierge
uses a lapel pin — sparingly, and only to mark something worth noticing. The interface is warm and
reassuring rather than loud. It should feel like a knowledgeable person is already on your side,
because the product's entire premise is that a human consultant is — the UI's job is to get a
well-briefed enquiry to that person as fast as possible, and to let the back-office team move it
forward without friction.

The system is glass-forward and luminous: translucent surfaces (`backdrop-filter: blur(12–20px)`)
float above a near-white canvas (#FAFAFC) on soft, blue-tinted shadows, and depth is real — nothing
is flat by decree. Type is the counterweight. One family (Urbanist) does everything, but it is set
heavy — headings and labels run at 800–900 weight with tight tracking, so the layout stays crisp
and structured even under all the glass. Motion is present and physical (spring lifts, shimmer
sweeps, gentle glow pulses on live or interactive elements), tuned to reassure and confirm rather
than to demand attention.

Two audiences share this world at equal priority: travelers on the public site (Persuade) and
consultants in the `/admin` back-office (Operate). The glass identity is shared; the intensity is
not. Persuasive surfaces may use the full gradient-and-shimmer vocabulary; operational surfaces
keep the palette and the glass but lean on type weight and slate neutrals for structure.

**Key Characteristics:**
- Frosted glass over deep-ocean gradients on a near-white canvas.
- One typeface (Urbanist), set very heavy, doing all hierarchy work.
- Soft **blue-tinted** shadows — depth reads cool, never neutral-grey.
- Gold is a pin, not a paint — accent only, never a surface.
- Physical, spring-based motion; shimmer and glow reserved for interactive or live elements.
- Radius language is generous and consistent: 12–24px on everything, full-pill on badges.

## Colors

A tropical-ocean palette: two ocean blues and an aqua carry the brand, a warm gold accents it, and
a cool slate family builds every neutral surface, line, and secondary text tone.

### Primary
- **Ocean Blue** (#0A6FB5): the brand's load-bearing color. Primary CTAs, active nav state, link
  hover, focus borders, icon accents, the `--color-primary-ocean` token. If a screen has one blue,
  it is this one.
- **Deep Sea** (#063B6D): the darkest ocean tone. Price figures, the top stop of the primary button
  gradient, primary-button hover fill, dark glass panels (`glass-card-dark`), high-contrast headings
  over imagery.

### Secondary
- **Sky Ocean** (#58B8E8): lighter ocean blue for secondary emphasis, gradient midpoints, tints,
  and illustrative fills.
- **Tropical Aqua** (#57D0C9): the signature turnkey accent — the tail of the ocean→aqua CTA
  gradient, duration-badge icons, glow-pulse highlight color, decorative wave layers.
- **Ocean Cyan** (#0891B2): the third stop in the deep "Book Now" gradient
  (`#063B6D → #0A6FB5 → #0891B2`); rarely used alone.

### Tertiary
- **Sunset Gold** (#F6C65B): the concierge's pin. Star/rating badges, the `Sparkles` icon on
  booking CTAs, map-pin markers, small celebratory marks. Never a background, never body text.
- **Gold Amber** (#F59E0B): deeper amber for gold gradient text (`from-#B45309 to-#F59E0B`) and
  rating-badge fills where #F6C65B is too pale on white.
- **WhatsApp Green** (#25D366): reserved exclusively for the WhatsApp contact action and its pulse
  animation. Not a general success color.

### Neutral
- **Ink** (#0F172A): primary text and headings; the `--color-text-main` token (Tailwind slate-950/900 range).
- **Slate Body** (#475569): secondary body copy, descriptions, list text.
- **Slate Muted** (#94A3B8): micro-labels ("Starting From"), placeholders, timestamps, disabled text.
- **Slate Line** (#E2E8F0): borders, dividers, card hairlines, the `border-t` under card footers.
- **Slate Fill** (#F1F5F9): secondary/ghost button background, code-badge background, scrollbar track,
  inert chips.
- **Sand** (#F8F7F3): optional warm off-white for alternating sections when pure canvas feels cold;
  the `--color-sand` token.
- **Canvas** (#FAFAFC): the page background; the `--color-bg-light` token. Everything else floats on this.
- **White** (#FFFFFF): glass panel base (at 0.85–0.95 alpha), card surfaces, text on ocean fills.

### Named Rules
**The Gold-as-Pin Rule.** Gold (#F6C65B / #F59E0B) only ever appears as an icon, a small badge, or
a thin gradient on text — never as a fill behind content, never as body text, never on more than a
few square centimeters of any screen. Its scarcity is what makes it read as premium.

**The One Blue Rule.** Within a single component, pick one ocean blue as the actor. Gradients may
travel across two or three stops, but flat elements, borders, and text should not mix #0A6FB5 and
#063B6D as if they were interchangeable — they are a hierarchy, not a set.

**The Cool-Shadow Rule.** Every shadow is tinted with ocean blue
(`rgba(10,111,181,·)` or `rgba(6,59,109,·)`), never plain `rgba(0,0,0,·)`. Neutral-black shadows
look borrowed from another system.

## Typography

**Display / Body / Label Font:** Urbanist (with Manrope, then Plus Jakarta Sans, then system sans as fallback)

**Character:** One geometric humanist sans does every job. There is no serif, no second family, no
mono. Hierarchy comes entirely from **weight and size**: Urbanist is set unusually heavy — 800 for
nearly all headings, 900 for prices and micro-labels, 400–500 for running text — with negative
tracking on headings (−0.015em) and wide positive tracking on uppercase labels (+0.1em). The result
is structured and confident without a display face. The current build applies this family with
`!important` across all elements; treat single-family as an invariant, not an accident.

### Hierarchy
- **Display** (800, `clamp(2.25rem, 5vw, 4rem)`, line-height 1.05, −0.015em): hero headlines,
  page-title moments on Persuade surfaces. One per view.
- **Headline** (800, 1.875rem/`text-3xl`, line-height 1.15, −0.015em): section headers.
- **Title** (800, 1.125rem/`text-lg`, line-height 1.3, −0.01em): card titles (e.g. `PackageCard`
  h3), modal headers, list-group headings. Hover shifts to Ocean Blue on interactive titles.
- **Body** (400–500, 1rem, line-height 1.6): descriptions, itinerary text, form help. Cap measure
  at ~65–75ch.
- **Price** (900, 1.5rem/`text-2xl`, line-height 1.1, −0.02em): the "₹18,500" figure, always in
  Deep Sea (#063B6D), struck-through original in Slate Muted beside it.
- **Label** (900, 0.6875rem–0.75rem, +0.1em, UPPERCASE): the system's signature micro-type —
  "STARTING FROM", package codes, "INSTANT CONFIRMATION", badge text. Always uppercase, always
  black weight, always wide-tracked.

### Named Rules
**The Heavy-or-Nothing Rule.** Headings, buttons, badges, and labels are 800 or 900 — there is no
600 "semibold heading" in this system. Body text is 400–500. The gap between those two zones is the
hierarchy; don't fill it with medium weights.

**The Uppercase-Label Rule.** Any text below ~13px is uppercase, black weight, and tracked to
+0.1em. Small-and-sentence-case does not exist here; small means label, and labels shout quietly.

## Layout

A centered single-column shell: `max-w-7xl` (1280px) content width with `px-4 sm:px-6 lg:px-8`
gutters. The fixed top navbar is compact (~52–56px) and always translucent white
(`bg-white/90–95` + `backdrop-blur-md`) with a slate hairline bottom border; it tightens padding
and deepens its shadow past 20px of scroll rather than changing color.

Card grids are the primary content pattern — responsive 1 → 2 → 3 columns with `gap-6`/`gap-8`.
Card internal padding is 20px (`p-5`) for the body, with a 16–20px gap between a card's media,
content, and footer zones; the footer is separated by a Slate Line `border-t` with `pt-4 mt-4`.

Density differs by mode: Persuade surfaces breathe (generous section spacing, large media,
`rounded-3xl` cards); Operate surfaces (`/admin`) compress to tables, `rounded-xl` panels, tighter
vertical rhythm, and slate-neutral backgrounds. Below 1024px the app swaps in dedicated
mobile page components rather than only reflowing — design mobile layouts as their own compositions,
thumb-first, with a persistent bottom action bar (Call / WhatsApp / Enquire) on traveler surfaces.

Spacing rhythm follows the Tailwind 4px scale; the common steps in this system are 4 / 8 / 12 / 20 / 32.

## Elevation & Depth

**Luminous and layered.** Depth is built from three cooperating tools, not one: (1) translucent
glass surfaces that let the canvas show through, (2) soft **ocean-tinted** drop shadows, and
(3) motion — a `glowPulse` or `shimmer` that signals a surface is interactive or carrying live
data. Surfaces are *not* flat at rest; a resting card already carries a gentle shadow. Glow and
shimmer are legitimate elevation cues here, but they belong to elements that are interactive, live,
or being hovered — not to static text blocks.

### Shadow Vocabulary
- **Resting card** (`box-shadow: 0 10px 30px -5px rgba(10,111,181,0.08), 0 4px 12px -2px rgba(0,0,0,0.03)`):
  the default `premium-card-shadow` — present at rest, barely there.
- **Raised / hover** (`box-shadow: 0 24px 48px -12px rgba(10,111,181,0.18), 0 8px 24px -4px rgba(0,0,0,0.06)`
  with `transform: translateY(-5px)`): card and CTA hover.
- **Glass panel** (`box-shadow: 0 16px 40px rgba(6,59,109,0.07)`): frosted surfaces
  (`glass-card`), lighter and cooler than the card shadow.
- **Dark glass** (`box-shadow: 0 20px 50px rgba(0,0,0,0.35)`): the one place a near-black shadow is
  allowed — `glass-card-dark` panels sitting on imagery.
- **Live glow** (`glowPulseVivid`: animated between `0 0 16px rgba(10,111,181,0.35)` and
  `0 0 30px rgba(10,111,181,0.65)`): connection indicators, real-time badges, primary CTAs at rest
  on Persuade surfaces.

### Named Rules
**The Cool-Shadow Rule.** (Repeated from Colors because it lives here too.) Shadows carry ocean
blue, not black. The only exception is dark glass over photography.

**The Glow-Means-Alive Rule.** A pulsing glow or a shimmer sweep signals "interactive or live".
Never apply it to a passive heading, paragraph, or decorative divider — it makes the UI feel noisy
and cries wolf on the indicators that actually matter (socket connection, new lead, unread chat).

## Shapes

Rounded, generous, and consistent. The radius scale in use: **6px** (`rounded-md`) on the smallest
badges, **12px** (`rounded-xl`, the single most common value) on inputs, chips, and admin panels,
**16px** (`rounded-2xl`) on buttons and nested cards, **24px** (`rounded-3xl`) on primary content
cards and hero glass panels, and **full-pill** (`9999px`) on status badges, nav chips, rating
pills, and the scrollbar thumb. Nothing in this system has a sharp 0px corner.

Borders are hairline (1px) and low-contrast: Slate Line (#E2E8F0) on neutral surfaces, or a
translucent white (`border-white/60–80`) on glass. Overlay badges on imagery use a
`border-white/20` to separate from the photo. Borders define edges quietly; the shadow and the
blur do the separating.

Media inside cards is full-bleed to the card's rounded edge (`overflow-hidden` on a `rounded-3xl`
container), with a bottom-up dark gradient scrim (`from-slate-950/85 to-transparent`) so white
overlay text and badges stay legible on any photo.

## Components

### Buttons
- **Shape:** 16px radius (`rounded-2xl`); pill (`rounded-full`) for compact inline/badge-style actions.
- **Primary (general):** ocean→aqua gradient `linear-gradient(90deg, #0A6FB5, #57D0C9)`, white
  Label-style text, `premium` shadow. Hover deepens to `#085A94 → #4BB8B1` and lifts
  (`translateY(-2–4px)`, `scale(1.02–1.05)` via spring). The dominant CTA across the app.
- **Primary (booking / highest intent):** the deep three-stop gradient
  `linear-gradient(90deg, #063B6D, #0A6FB5, #0891B2)` with a `shimmer-sheen` sweep on hover and a
  gold `Sparkles` icon. Reserve for "Book Now" and payment confirmation — the moment money is at stake.
- **Secondary / Ghost:** Slate Fill (#F1F5F9) background, Ink text, 1px Slate Line border; hover to
  Slate Line (#E2E8F0) fill; `active:scale-95`. Used for "Details", "Cancel", low-emphasis paths.
- **Focus:** visible focus ring in Ocean Blue (`box-shadow: 0 0 0 3px rgba(10,111,181,0.35)`) —
  add this everywhere; the current build under-specifies keyboard focus and it must not regress.
- **Tap:** every button scales to ~0.95–0.97 on press. Tactile feedback is part of the identity.

### Chips / Badges
- **Code badge:** Slate Fill background, Ocean Blue Label text, 6px radius, 1px tinted border —
  package codes, categories.
- **Overlay badge (on imagery):** `rgba(2,6,23,0.7)` + `backdrop-blur-md`, white Label text,
  `border-white/20`, full-pill — duration, location, rating over photos.
- **Status / semantic pill:** full-pill, Label text, tinted background at ~10% + solid border at
  ~20% of the semantic hue (emerald for confirmed/instant, amber for pending, rose for lost).
- **Nav chip (active):** Ocean Blue text on `rgba(10,111,181,0.1)` fill, full-pill, 1px
  `rgba(10,111,181,0.2)` border, `scale-105`.

### Cards / Containers
- **Corner:** 24px (`rounded-3xl`) for content cards; 12–16px for admin panels and nested blocks.
- **Background:** glass (`rgba(255,255,255,0.85)` + `blur(20px)`) or solid White; `border-white/80`.
- **Shadow:** `premium-card-shadow` at rest → raised shadow + `translateY(-5–8px)` on hover
  (spring, `stiffness ~280, damping ~20`).
- **Internal padding:** 20px (`p-5`) body; media zone full-bleed; footer divided by Slate Line `border-t`.
- **Title hover:** interactive card titles shift to Ocean Blue on group-hover.

### Inputs / Fields
- **Style:** White background, 1px Slate Line border, 12px radius (`rounded-xl`), Body text, Ink color.
- **Label:** Label-style micro-type (uppercase, black, tracked) above the field.
- **Focus:** border shifts to Ocean Blue (`focus:border-[#0A6FB5]`) plus a 3px
  `rgba(10,111,181,0.2)` ring; optionally lighten background to pure White. The border-shift is the
  established pattern (94 usages) — keep it, but always pair it with the ring for visibility.
- **Error:** border and helper text in rose-500; **disabled:** Slate Fill background, Slate Muted text.

### Navigation
- **Top bar:** fixed, `bg-white/90–95` + `backdrop-blur-md`, ~52–56px tall, slate hairline bottom
  border, logo left (image, up to ~240–320px wide), heavy `font-black` `text-xs/sm` links right.
- **Link states:** default Ink; hover to Ocean Blue with an animated 2px underline that scales in
  from the left (`origin-left`, 200ms); active becomes a full-pill Ocean-tint chip (see Nav chip).
- **Mobile:** hamburger → full-height sheet; on traveler routes below 1024px the top bar and the
  rest of the web chrome are replaced by the mobile page components' own bottom action bar.

### Signature Component — the Live Indicator
A small full-pill badge with a pulsing dot and Label text — green + `glowPulseVivid` for
"Live Real-Time Auto-Sync Active", amber for "Fallback Mode – Polling". It appears in admin manager
headers and reflects the socket connection. This is the one place glow is not decoration: it is
status. Keep it small, keep it honest, and never reuse its glow treatment on marketing elements.

## Do's and Don'ts

### Do:
- **Do** keep Ocean Blue (#0A6FB5) as the single load-bearing blue; let Deep Sea (#063B6D) be its
  darker rank for prices, hovers, and dark glass — not a coequal.
- **Do** tint every shadow with ocean blue (`rgba(10,111,181,·)` / `rgba(6,59,109,·)`); reserve
  black shadows for dark glass over photography only.
- **Do** set all headings, buttons, badges, and labels at Urbanist 800–900 with the tracking rules
  (−0.015em headings, +0.1em uppercase labels); body stays 400–500.
- **Do** use the deep three-stop gradient + `shimmer-sheen` + gold `Sparkles` only for "Book Now"
  and payment-confirmation actions; use the flat ocean→aqua gradient for every other primary CTA.
- **Do** give every interactive element a visible Ocean-Blue focus ring and a ~0.95 press scale.
- **Do** use `rounded-xl`/`rounded-2xl`/`rounded-3xl` consistently and full-pill for badges; never
  ship a 0px corner.
- **Do** design `/admin` (Operate) surfaces with the same palette and glass but calmer: more slate
  neutrals, `rounded-xl`, tighter rhythm, motion limited to feedback and the Live Indicator.
- **Do** design real empty and loading states — variable itinerary lengths, missing images, empty
  catalogs are normal per PRODUCT.md, not edge cases.

### Don't:
- **Don't** use gold as a background, as body text, or on more than a small badge/icon's worth of
  any screen (the Gold-as-Pin Rule).
- **Don't** apply glow, shimmer, or `animate-pulse` to passive text, headings, or dividers — it's
  reserved for interactive or live elements (the Glow-Means-Alive Rule).
- **Don't** introduce a second typeface, a serif, or a mono; hierarchy is weight and size only.
- **Don't** fill the weight gap with 600 "semibold" headings — it's 800/900 or it's body.
- **Don't** flatten cards to zero elevation at rest; this system reads depth as identity.
- **Don't** repaint the WhatsApp green (#25D366) as a generic success color — it belongs to the
  WhatsApp action alone.
- **Don't** carry the full Persuade shimmer/gradient/sparkle vocabulary into dense admin tables;
  keep operational surfaces quiet.
- **Don't** treat the `:root` tokens (canvas #FAFAFC, ink #0F172A) and the hardcoded
  `index.html` body values (#FCFCFC, #1F2937) as two systems — the `:root` tokens are normative;
  align strays to them.
