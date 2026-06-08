# berkeleyclasses.com — Liquid Glass Redesign

**Date:** 2026-06-08
**Status:** Brainstorming → spec → awaiting user review
**Author:** Ishaan Pandey
**Reference mockup:** `.superpowers/brainstorm/92656-1780913468/content/direction-v11.html`

---

## 1. Goal

Replace the current "looks ass / messy / too much noise" Liquid Glass v1 UI with a quieter, more refined Apple-inspired Liquid Glass system anchored to the official UC Berkeley palette. Site should feel like a calm, premium native macOS Tahoe-era surface — not a desktop, not a marketing site, not a college portal.

Target: every public route (10) ships under the new system in v1.

## 2. Visual principles

1. **Glass, not metal.** Surfaces are translucent (~16% white in light, ~3% in dark) with 60–64px backdrop blur and a soft top specular sheen. No multi-stop gradients on controls. No drop shadows that imply mass.
2. **Berkeley palette, used sparingly.** Berkeley Blue `#003262` = primary semantic accent. California Gold `#FDB515` = warm secondary accent (peak grade, saved star, "would take again" stat). Metallic Gold `#BC9B6A` reserved for "saved" / "sealed" status surfaces only.
3. **Type does the hierarchy.** Product Sans (self-hosted), 4 weights, 6 type sizes max. Headlines in deep ink, meta in muted, accents in palette.
4. **One CTA, one accent per surface.** Don't paint every button blue. Only the primary action in any frame is tinted.
5. **Density without noise.** Hairline dividers between rows (no card-per-section). Capsule pills for filters + statuses only. No rainbow.
6. **Motion is decoration that earns its place.** Subtle entry + hover + theme + ambient wash drift. Always respects `prefers-reduced-motion`.

## 3. Design tokens (CSS variables)

All tokens live in a single `app/globals.css` block. Both themes share the same variable names; only values differ.

### Palette (raw)

```css
--berkeley-blue: #003262;
--berkeley-blue-deep: #001f3f;
--california-gold: #FDB515;
--metallic-gold: #BC9B6A;
```

### Semantic tokens — light theme

```css
--bg-1: #f4f5f8;
--canvas: #eef0f6;
--bg-wash-a: rgba(0,50,98,0.14);    /* Berkeley wash */
--bg-wash-b: rgba(253,181,21,0.14); /* Gold wash */
--bg-wash-c: rgba(188,155,106,0.10);/* Metallic wash */

--glass-fill: rgba(255,255,255,0.16);
--glass-fill-strong: rgba(255,255,255,0.24);
--glass-border: rgba(255,255,255,0.50);
--glass-highlight: rgba(255,255,255,1.0);
--glass-spec: linear-gradient(180deg,
              rgba(255,255,255,0.45) 0%,
              rgba(255,255,255,0) 38%);

--ink: #0a0a0a;
--ink-strong: var(--berkeley-blue-deep);
--muted: #6e7282;
--hairline: rgba(0,0,0,0.05);

--tint-primary: rgba(0,50,98,0.48);
--tint-primary-strong: rgba(0,50,98,0.62);
--tint-gold: rgba(253,181,21,0.52);
--primary-text: #fff;
--gold-text: #3a2400;
```

### Semantic tokens — dark theme (`[data-theme="dark"]`)

```css
--berkeley-blue: #6ea8ff;  /* brightened for contrast */
--bg-1: #070a14;
--canvas: #080c18;
--bg-wash-a: rgba(110,168,255,0.22);
--bg-wash-b: rgba(253,181,21,0.14);
--bg-wash-c: rgba(188,155,106,0.08);

--glass-fill: rgba(255,255,255,0.03);
--glass-fill-strong: rgba(255,255,255,0.06);
--glass-border: rgba(255,255,255,0.12);
--glass-highlight: rgba(255,255,255,0.22);
--glass-spec: linear-gradient(180deg,
              rgba(255,255,255,0.10) 0%,
              rgba(255,255,255,0) 38%);

--ink: #f4f5f7;
--ink-strong: #fff;
--muted: #9aa3b2;
--hairline: rgba(255,255,255,0.07);

--tint-primary: rgba(110,168,255,0.25);
--tint-primary-strong: rgba(110,168,255,0.40);
--tint-gold: rgba(253,181,21,0.32);
--primary-text: #f0f9ff;
--gold-text: #1a0f00;
```

### Type tokens

```css
--font-display: "Product Sans", "Google Sans", Inter, -apple-system,
                "SF Pro Display", ui-sans-serif, system-ui, sans-serif;
--font-text: var(--font-display);
--font-mono: ui-monospace, "SF Mono", Menlo, monospace;

--text-eyebrow: 11px;       /* uppercase 0.16em label */
--text-meta: 12px;          /* secondary row info */
--text-body: 14px;          /* default */
--text-heading-sm: 15px;    /* card titles */
--text-heading-md: 22px;    /* section / page subheads */
--text-display: 36px;       /* hero h1 */

--tracking-display: -0.03em;
--tracking-body: -0.005em;
--tracking-eyebrow: 0.16em;
```

### Motion tokens

```css
--motion-hover: 150ms ease;
--motion-press: 120ms ease;
--motion-theme: 400ms ease;
--motion-enter: 320ms cubic-bezier(0.2, 0.7, 0.2, 1);
--motion-wash: 18s linear infinite; /* slow ambient drift */
--ease-knob: cubic-bezier(0.4, 0, 0.2, 1);
```

## 4. Component inventory

All components live in `components/glass/` and replace today's `Glass*` set 1:1.

### Surfaces

- `<Glass>` — base translucent panel. Props: `as`, `padding`, `radius`, `spec` (default true). Implements: backdrop-filter, border, top-highlight, specular gradient overlay.
- `<MeshBackground>` — page-level ambient washes (3 radial gradients + slow drift animation). Owns the `data-theme` attribute on `<html>`.

### Controls

- `<Button>` — variants: `default` (clear glass), `primary` (Berkeley-tinted glass), `gold` (Cal-Gold-tinted glass). Sizes `sm | md | lg`. Hover deepens fill; press translates 0.5px.
- `<Pill>` — capsule version of Button. Same variants, smaller padding. Used for chips, filters, statuses.
- `<Chip>` — multi-select toggle. Same shape as Pill, but selected state uses tinted glass.
- `<Input>` / `<SearchInput>` — translucent input with specular sheen + inset highlight.
- `<SegmentedControl>` — 2–3 mutually-exclusive options, single rounded glass container with sliding indicator.
- `<ThemeToggle>` — sliding-knob glass capsule. Sun ↔ moon. Reads/writes `data-theme` + localStorage.

### Status / data

- `<SeatPill>` — capsule pill with glowing LED. Variants: `open`, `low` (≤3), `full` (waitlist). LED color = Berkeley Blue when open, muted when full.
- `<StarButton>` — circular glass button. `on` = gold-tinted. Toggles save state.
- `<StatTile>` — number + label + optional histogram. Used in About panel + dashboards.
- `<GradeHistogram>` — bar chart. Bars = `--berkeley-blue`. Peak bar = `--california-gold`.

### Navigation

- `<GlassNav>` — top nav bar. Sticky w/ stronger blur when scrolled (54px → 48px height, fill `0.16 → 0.24`).
- `<Wordmark>` — "berkeleyclasses." with palette-tinted dot.

## 5. Page-by-page brief

All routes ship in v1. Each gets a redesign brief (not a full mock) — `frontend-design` skill will turn each brief into code during implementation.

| Route | Brief |
|---|---|
| `/` (landing) | Hero `<Glass>` w/ headline + search → 6-feature grid in clear-glass cards → footer. Replace current 6 mismatched feature blocks. Live sections-count + subjects-count from existing Supabase queries stays in the hero subtitle. |
| `/find` | The hero of the redesign (matches v11 mockup). 3-col layout: filters / results / about-selected-class panel. Mobile: filters collapse into a glass sheet. |
| `/schedule` | Builder layout: left panel = courses-in-plan list, center = 7-day grid (existing `<ScheduleGrid>` reskinned with glass cell backgrounds + Berkeley-blue events), right = conflict checker + ICS export button. |
| `/compare` | Two side-by-side glass panels for the two CCNs being compared. Conflict verdict in a tinted glass card at the top: green-glass = no conflict, gold-glass = same-day no overlap, red-glass = overlap. |
| `/class/[ccn]` | Full-bleed `<Glass>` hero with course code + title + instructor. Three side-by-side glass panels below: enrollment / grade-distribution / prereqs+watchlist. Save-star top-right. |
| `/dept/[code]` | List of every section in dept. Same row layout as `/find`. Header = dept name + total sections + breadth coverage row. |
| `/instructor/[name]` | Instructor banner (avatar gradient + name + dept count) → sections taught this term → past terms collapsible. |
| `/watch` | Two glass panels: subscription form (CCN + email) + active subscriptions list. Each subscription = a row w/ status pill (`watching`, `notified`, `paused`) and unsubscribe button. |
| `/saved` | List of saved schedules. Each = glass card w/ name + term + units + course count + delete star-button. Click → opens in `/schedule`. |
| `/auth/signin`, `/auth/callback`, `/auth/error` | Centered glass card on full-bleed mesh. Sign-in form: Google OAuth button (Berkeley-tinted glass) with `@berkeley.edu` restriction note. |
| `/api/ics/*` | No UI change. |

## 6. Responsive behavior

- Desktop ≥1024px: 3-col grid on `/find`. 2-col on `/compare`. Full features visible.
- Tablet 640–1023px: stack to 2-col where possible. Filter sidebars collapse to a top filter bar `<Glass>`. Schedule grid scrolls horizontally.
- Mobile <640px: single column. Filters open in a bottom-sheet `<Glass>`. Nav collapses to wordmark + theme toggle + hamburger.

## 7. Motion

Per Q4 answer: subtle entry + hover + theme transition, with one ambient wash drift. Never distracting.

- **Hover (150ms):** glass fill goes `0.16 → 0.24`. No transform.
- **Press (120ms):** `translateY(0.5px)`. No scale.
- **Theme swap (400ms):** all `--bg-*`, `--glass-*`, `--ink*` vars transition together via `transition: background-color, color, box-shadow`.
- **Card entry (320ms, stagger 40ms):** opacity 0→1 + translateY(8px→0) on mount. Only first viewport's worth.
- **Ambient mesh drift (18s loop):** the 3 radial wash centers gently shift x/y by ~5%. Background-only — no paint above the canvas layer. Pauses on `prefers-reduced-motion: reduce`.
- **Theme-toggle knob (280ms `cubic-bezier(0.4,0,0.2,1)`):** sliding between sun ↔ moon position.

Reduced motion: all entries become instant; ambient drift stops; hover stays.

## 8. Typography & font hosting

**Decision (Q2):** Self-host Product Sans.

- Source TTFs go in `public/fonts/product-sans/`.
- Declared via `@font-face` in `app/globals.css` with `font-display: swap`.
- Fallback chain (in case TTFs fail to load): `Google Sans → Inter → -apple-system → SF Pro Display → system-ui`.
- Inter loaded from Google Fonts as backup so the cascade has at least one webfont guaranteed.
- License risk: Product Sans is Google's internal font; not formally licensed for third-party use. Acceptable risk for a student-built site against a non-commercial use; will swap to Google Sans Text if a takedown ever arrives.

## 9. Accessibility

- **Contrast.** Body ink on glass = 4.5:1 minimum against the resolved blurred background. Verified via storybook + real backdrops, not flat-color stand-ins.
- **Focus ring.** Every interactive element gets `:focus-visible` = 2px Berkeley Blue ring + 2px transparent offset. Same in both themes (offset hides the ring against the glass).
- **Reduced motion.** Honored across all transitions (per §7).
- **Color independence.** Status indicators (open vs full) never rely on color alone — every pill has a label ("12 open", "Waitlist 7").
- **Keyboard navigation.** Tab order matches visual order. Theme toggle, search, filters, results, panel — in that order.
- **Screen reader.** Glass surfaces are semantic regions (`<header>`, `<nav>`, `<main>`, `<aside>`). No role-less divs that should be landmarks.

## 10. Migration plan

Order matters — keep prod live the whole time.

1. **Phase 0 — tokens.** Drop the new `app/globals.css` token block + `<MeshBackground>` + `@font-face`. Verify no visual regressions because nothing consumes the new tokens yet.
2. **Phase 1 — primitives.** Rewrite `components/glass/*` in place with the new recipes. Keep exports identical (`<GlassCard>` keeps existing props). Run typecheck.
3. **Phase 2 — `/find`.** First page port. Treat as the canary. Land + ship. Iterate.
4. **Phase 3 — `/schedule`, `/class/[ccn]`, `/`.** High-traffic pages next.
5. **Phase 4 — `/compare`, `/dept`, `/instructor`, `/watch`, `/saved`, `/auth/*`.** Remaining routes.
6. **Phase 5 — polish.** Mesh drift, entry animations, dark-mode contrast audit, mobile bottom-sheet, a11y audit, lighthouse pass.

Each phase is a separate PR. No backward-compat shims — the new tokens replace the old; if a page hasn't been migrated yet, it still renders correctly because the token names overlap.

## 11. Out of scope (v1)

- New features (this is design-only — existing functionality preserved).
- Real-time updates / push notifications.
- Schedule sharing.
- Mobile native apps.
- Onboarding flow (deferred — user opted to keep it out of v1; can ship as a separate spec).
- Public API.
- Search ranking changes.
- New analytics.

## 12. Open questions (resolved during brainstorm)

| # | Question | Answer |
|---|---|---|
| Q1 | Scope of v1 | All 10 public routes |
| Q2 | Product Sans handling | Self-host TTFs in `public/fonts/` |
| Q3 | Dark mode default | Match OS, save user override to localStorage |
| Q4 | Motion budget | Subtle entry + hover + theme + ambient wash drift; respects `prefers-reduced-motion` |

## 13. Reference

- Approved direction mockup: `.superpowers/brainstorm/92656-1780913468/content/direction-v11.html`
- Apple macOS 26 Tahoe Liquid Glass template (Figma): `figma.com/design/blP0lgm2Y3sLUtUw3usp1M` node `121:18094`
- Berkeley palette source: provided by user 2026-06-08 (Pantone 282 / 123 / 874)
- Existing memory: `[[reference_glass_design_system]]`, `[[feedback_next16_client_server_boundary]]`
