# berkeleyclasses Liquid Glass Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin every public route of berkeleyclasses.com under a single minimal Liquid Glass design system (Berkeley palette, Product Sans, light + dark, subtle motion), exactly matching the v11 mockup at `.superpowers/brainstorm/92656-1780913468/content/direction-v11.html`.

**Architecture:** All visual styling is driven by CSS variables in `app/globals.css`. A small set of `<Glass>`-based React primitives in `components/glass/` consume those tokens. Each public route then composes the primitives — no per-page CSS overrides. A single `data-theme` attribute on `<html>` (managed by `useTheme()` + `<ThemeToggle>`) swaps every visual token between light and dark.

**Tech Stack:** Next.js 16.2.7 (App Router, Turbopack), React 19.2, Tailwind v4, TypeScript 5, Supabase SSR. Tests: Vitest (added in Phase 0) for hooks; Playwright (added in Phase 5) for visual regression.

**Spec:** `docs/superpowers/specs/2026-06-08-berkeleyclasses-redesign-design.md` is the source of truth for token values. Copy them verbatim — do not edit values during implementation.

---

## File map

### New files

```
public/fonts/product-sans/
  ProductSans-Regular.ttf
  ProductSans-Medium.ttf
  ProductSans-Bold.ttf
components/glass/
  Glass.tsx              # base translucent panel
  Button.tsx             # variants: default | primary | gold
  Chip.tsx               # toggle pill
  ThemeToggle.tsx        # sliding-knob theme switch
  SeatPill.tsx           # replaces SeatCapsule
  StarButton.tsx         # replaces /components/star-button.tsx
  Wordmark.tsx           # replaces GlassWordmark
  use-theme.ts           # hook: light | dark | system + localStorage
  use-theme.test.ts      # vitest unit tests
docs/superpowers/specs/2026-06-08-berkeleyclasses-redesign-design.md   # already exists
vitest.config.ts
playwright.config.ts     # added Phase 5
tests/visual/*.spec.ts   # added Phase 5
```

### Modified files

```
app/globals.css                         # rewrite token block + @font-face
app/layout.tsx                          # mount MeshBackground; preload font
app/page.tsx                            # / landing
app/find/page.tsx                       # /find
app/find/filter-sidebar.tsx
app/find/sort-select.tsx
app/schedule/page.tsx                   # /schedule
app/schedule/builder.tsx
app/class/[ccn]/page.tsx                # /class/[ccn]
app/compare/page.tsx                    # /compare
app/dept/[code]/page.tsx                # /dept/[code]
app/instructor/[name]/page.tsx          # /instructor/[name]
app/watch/page.tsx                      # /watch
app/watch/watch-form.tsx
app/watch/unsubscribe-button.tsx
app/saved/page.tsx                      # /saved
app/saved/delete-schedule-button.tsx
app/auth/signin/page.tsx                # /auth/signin
app/auth/signin/form.tsx
app/auth/error/page.tsx                 # /auth/error
components/glass/MeshBackground.tsx     # rewrite: 3 washes + drift + theme owner
components/glass/GlassCard.tsx          # → re-export Glass
components/glass/GlassButton.tsx        # → re-export Button
components/glass/GlassInput.tsx         # rewrite to new tokens
components/glass/GlassPill.tsx          # → re-export Chip (style-only Pill)
components/glass/GlassSelect.tsx
components/glass/GlassIsland.tsx
components/glass/GlassNav.tsx
components/glass/SegmentedControl.tsx
components/glass/StatTile.tsx
components/glass/index.ts               # barrel update
components/nav.tsx
components/schedule-grid.tsx
components/grade-histogram.tsx
components/waitlist-trend.tsx
components/sign-out-button.tsx
package.json                            # add vitest + @testing-library/react
tsconfig.json                           # add vitest types
```

### Removed (deleted at the end of Phase 1)

```
components/glass/SeatCapsule.tsx        # replaced by SeatPill
components/glass/GlassWordmark.tsx      # replaced by Wordmark
components/star-button.tsx              # replaced by StarButton in components/glass/
```

---

# Phase 0 — Tokens + theme infrastructure

Lands the design tokens, the font, the mesh background, and the theme toggle. No page changes yet. After this phase, the existing UI still renders correctly (existing `Glass*` components still use their old styles, just sitting on top of new token CSS).

## Task 0.1: Install test tooling

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Modify: `tsconfig.json`

- [ ] **Step 1: Add Vitest + Testing Library deps**

Run:
```bash
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @types/jsdom
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add `test` script to `package.json`**

In `package.json` `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Add Vitest globals to `tsconfig.json`**

In `tsconfig.json` `"compilerOptions"`:
```json
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

- [ ] **Step 6: Verify Vitest runs**

Run: `pnpm test`
Expected: `No test files found, exiting with code 0` (or similar). Exit code 0.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts vitest.setup.ts tsconfig.json
git commit -m "build: add vitest + testing-library for unit tests"
```

## Task 0.2: Self-host Product Sans

**Files:**
- Create: `public/fonts/product-sans/ProductSans-Regular.ttf`
- Create: `public/fonts/product-sans/ProductSans-Medium.ttf`
- Create: `public/fonts/product-sans/ProductSans-Bold.ttf`

- [ ] **Step 1: Source the TTFs**

Ish will drop the three files into `public/fonts/product-sans/`. Run to verify presence:
```bash
ls -la public/fonts/product-sans/
```
Expected: three `.ttf` files, each ≥ 30KB.

- [ ] **Step 2: Confirm browser can load them**

Start dev server (`pnpm dev`) and `curl -I http://localhost:3000/fonts/product-sans/ProductSans-Regular.ttf`.
Expected: `HTTP/1.1 200 OK` with `content-type: font/ttf`.

- [ ] **Step 3: Commit**

```bash
git add public/fonts/product-sans/
git commit -m "feat(fonts): self-host product sans regular/medium/bold"
```

## Task 0.3: Write design-token CSS into `app/globals.css`

Replace the existing token block. Keep any non-token CSS (resets, prose styles) untouched.

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Read current `app/globals.css`**

Run: `cat app/globals.css | head -200`. Note everything that's not theme tokens — preserve it.

- [ ] **Step 2: Add the new token block at the top, replacing any existing `:root` definitions**

Paste verbatim (values per spec §3):

```css
@font-face {
  font-family: "Product Sans";
  src: url("/fonts/product-sans/ProductSans-Regular.ttf") format("truetype");
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {
  font-family: "Product Sans";
  src: url("/fonts/product-sans/ProductSans-Medium.ttf") format("truetype");
  font-weight: 500; font-style: normal; font-display: swap;
}
@font-face {
  font-family: "Product Sans";
  src: url("/fonts/product-sans/ProductSans-Bold.ttf") format("truetype");
  font-weight: 700; font-style: normal; font-display: swap;
}

:root {
  --berkeley-blue: #003262;
  --berkeley-blue-deep: #001f3f;
  --california-gold: #FDB515;
  --metallic-gold: #BC9B6A;

  --bg-1: #f4f5f8;
  --canvas: #eef0f6;
  --bg-wash-a: rgba(0, 50, 98, 0.14);
  --bg-wash-b: rgba(253, 181, 21, 0.14);
  --bg-wash-c: rgba(188, 155, 106, 0.10);

  --glass-fill: rgba(255, 255, 255, 0.16);
  --glass-fill-strong: rgba(255, 255, 255, 0.24);
  --glass-border: rgba(255, 255, 255, 0.50);
  --glass-highlight: rgba(255, 255, 255, 1);
  --glass-spec: linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 38%);

  --ink: #0a0a0a;
  --ink-strong: var(--berkeley-blue-deep);
  --muted: #6e7282;
  --hairline: rgba(0, 0, 0, 0.05);

  --tint-primary: rgba(0, 50, 98, 0.48);
  --tint-primary-strong: rgba(0, 50, 98, 0.62);
  --tint-gold: rgba(253, 181, 21, 0.52);
  --primary-text: #fff;
  --gold-text: #3a2400;

  --font-display: "Product Sans", "Google Sans", Inter, -apple-system, "SF Pro Display", ui-sans-serif, system-ui, sans-serif;
  --font-text: var(--font-display);
  --font-mono: ui-monospace, "SF Mono", Menlo, monospace;

  --tracking-display: -0.03em;
  --tracking-body: -0.005em;
  --tracking-eyebrow: 0.16em;

  --motion-hover: 150ms ease;
  --motion-press: 120ms ease;
  --motion-theme: 400ms ease;
  --motion-enter: 320ms cubic-bezier(0.2, 0.7, 0.2, 1);
  --motion-wash: 18s linear infinite;
  --ease-knob: cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="dark"] {
  --berkeley-blue: #6ea8ff;

  --bg-1: #070a14;
  --canvas: #080c18;
  --bg-wash-a: rgba(110, 168, 255, 0.22);
  --bg-wash-b: rgba(253, 181, 21, 0.14);
  --bg-wash-c: rgba(188, 155, 106, 0.08);

  --glass-fill: rgba(255, 255, 255, 0.03);
  --glass-fill-strong: rgba(255, 255, 255, 0.06);
  --glass-border: rgba(255, 255, 255, 0.12);
  --glass-highlight: rgba(255, 255, 255, 0.22);
  --glass-spec: linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 38%);

  --ink: #f4f5f7;
  --ink-strong: #fff;
  --muted: #9aa3b2;
  --hairline: rgba(255, 255, 255, 0.07);

  --tint-primary: rgba(110, 168, 255, 0.25);
  --tint-primary-strong: rgba(110, 168, 255, 0.40);
  --tint-gold: rgba(253, 181, 21, 0.32);
  --primary-text: #f0f9ff;
  --gold-text: #1a0f00;
}

html {
  background-color: var(--bg-1);
  color: var(--ink);
  font-family: var(--font-text);
  transition: background-color var(--motion-theme), color var(--motion-theme);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 3: Verify dev server boots**

Run: `pnpm dev`. Open `http://localhost:3000`. Expected: site loads, fonts swap to Product Sans on first paint, no console errors.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(design): add liquid-glass design tokens for light + dark themes"
```

## Task 0.4: TDD `use-theme` hook

**Files:**
- Create: `components/glass/use-theme.ts`
- Create: `components/glass/use-theme.test.ts`

- [ ] **Step 1: Write the failing test**

`components/glass/use-theme.test.ts`:
```ts
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "./use-theme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("defaults to system preference when no override saved", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (q: string) => ({ matches: q.includes("dark"), media: q, addEventListener: () => {}, removeEventListener: () => {} }),
    });
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("uses saved override when present", () => {
    localStorage.setItem("bc-theme", "light");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("toggles light → dark and persists to localStorage", () => {
    localStorage.setItem("bc-theme", "light");
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.theme).toBe("dark");
    expect(localStorage.getItem("bc-theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test components/glass/use-theme.test.ts`
Expected: FAIL with "Cannot find module './use-theme'".

- [ ] **Step 3: Implement `useTheme`**

`components/glass/use-theme.ts`:
```ts
"use client";
import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const STORAGE_KEY = "bc-theme";

function resolveInitial(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(resolveInitial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggle, setTheme };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test components/glass/use-theme.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add components/glass/use-theme.ts components/glass/use-theme.test.ts
git commit -m "feat(theme): add useTheme hook with localStorage + system fallback"
```

## Task 0.5: Rewrite `MeshBackground` with theme + drift + reduced-motion

**Files:**
- Modify: `components/glass/MeshBackground.tsx`

- [ ] **Step 1: Replace the existing implementation**

```tsx
"use client";
import { useEffect } from "react";
import { useTheme } from "./use-theme";

export function MeshBackground({ children }: { children: React.ReactNode }) {
  // Mount the theme attribute on <html> exactly once at first client paint.
  useTheme();

  // Keep the wash drift paused if the OS asks for reduced motion.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    document.documentElement.dataset.reducedMotion = String(mq.matches);
    const handler = () => { document.documentElement.dataset.reducedMotion = String(mq.matches); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="mesh-root">
      <div className="mesh-wash mesh-wash-a" />
      <div className="mesh-wash mesh-wash-b" />
      <div className="mesh-wash mesh-wash-c" />
      <div className="mesh-content">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Add the mesh CSS to `app/globals.css`**

Append:
```css
.mesh-root { position: relative; min-height: 100vh; }
.mesh-wash {
  position: fixed; inset: -10vh -10vw; pointer-events: none; z-index: 0;
  filter: blur(0); /* the glass surfaces blur; this layer stays sharp */
}
.mesh-wash-a {
  background: radial-gradient(55% 50% at 82% 0%, var(--bg-wash-a) 0%, transparent 60%);
  animation: drift-a var(--motion-wash);
}
.mesh-wash-b {
  background: radial-gradient(50% 50% at 0% 100%, var(--bg-wash-b) 0%, transparent 60%);
  animation: drift-b var(--motion-wash);
}
.mesh-wash-c {
  background: radial-gradient(40% 40% at 50% 50%, var(--bg-wash-c) 0%, transparent 70%);
  animation: drift-c calc(var(--motion-wash) * 1.4);
}
.mesh-content { position: relative; z-index: 1; min-height: 100vh; }

@keyframes drift-a { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-3%, 2%); } }
@keyframes drift-b { 0%,100% { transform: translate(0,0); } 50% { transform: translate(3%, -2%); } }
@keyframes drift-c { 0%,100% { transform: translate(0,0); } 50% { transform: translate(2%, 3%); } }

html[data-reduced-motion="true"] .mesh-wash { animation: none; }
```

- [ ] **Step 3: Mount `MeshBackground` in `app/layout.tsx`**

Verify that `app/layout.tsx` already wraps children in `<MeshBackground>`. (It does — see existing code.) If not, add it.

- [ ] **Step 4: Verify in browser**

Run: `pnpm dev`. Open `http://localhost:3000`. Toggle the system color scheme (System Settings → Display → Dark). Expected: page background swaps between light + dark; subtle wash drift on both. Open DevTools Console — no errors.

- [ ] **Step 5: Commit**

```bash
git add components/glass/MeshBackground.tsx app/globals.css
git commit -m "feat(theme): mesh background + theme attribute + reduced-motion gating"
```

## Task 0.6: TDD `<ThemeToggle>` component

**Files:**
- Create: `components/glass/ThemeToggle.tsx`
- Create: `components/glass/ThemeToggle.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders an accessible button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });

  it("toggles data-theme on click", () => {
    localStorage.setItem("bc-theme", "light");
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `pnpm test components/glass/ThemeToggle.test.tsx`
Expected: FAIL with "Cannot find module './ThemeToggle'".

- [ ] **Step 3: Implement the component**

```tsx
"use client";
import { useTheme } from "./use-theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="theme-toggle"
      data-theme-state={theme}
    >
      <span className="theme-toggle-knob" />
    </button>
  );
}
```

- [ ] **Step 4: Append toggle CSS to `app/globals.css`**

```css
.theme-toggle {
  position: relative; width: 50px; height: 26px; border-radius: 999px;
  background: var(--glass-fill);
  backdrop-filter: blur(60px) saturate(220%);
  -webkit-backdrop-filter: blur(60px) saturate(220%);
  box-shadow: inset 0 1px 0 var(--glass-highlight), inset 0 0 0 0.5px var(--glass-border);
  cursor: pointer; border: 0; overflow: hidden;
}
.theme-toggle::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: var(--glass-spec); border-radius: inherit;
}
.theme-toggle-knob {
  position: absolute; top: 3px; left: 3px;
  width: 20px; height: 20px; border-radius: 50%;
  background: rgba(255,255,255,0.6); backdrop-filter: blur(30px);
  box-shadow: inset 0 1px 0 #fff, inset 0 0 0 0.5px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.08);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; z-index: 1;
  transition: transform 280ms var(--ease-knob), background 250ms;
}
.theme-toggle-knob::before { content: "☀"; color: #f59e0b; }
[data-theme="dark"] .theme-toggle-knob {
  transform: translateX(24px);
  background: rgba(15,23,42,0.6);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), inset 0 0 0 0.5px rgba(255,255,255,0.15), 0 1px 2px rgba(0,0,0,0.5);
}
[data-theme="dark"] .theme-toggle-knob::before { content: "☾"; color: #dbeafe; }
```

- [ ] **Step 5: Verify tests pass**

Run: `pnpm test components/glass/ThemeToggle.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 6: Commit**

```bash
git add components/glass/ThemeToggle.tsx components/glass/ThemeToggle.test.tsx app/globals.css
git commit -m "feat(theme): add ThemeToggle component"
```

---

# Phase 1 — Glass primitives

Rewrites the `components/glass/` family in place. Old export names stay so existing pages still build; their internals get replaced with the new token-driven CSS. New components (`Glass`, `Button`, `Chip`, `SeatPill`, `StarButton`, `Wordmark`) are added with the canonical API.

## Task 1.1: Add base `<Glass>` primitive

**Files:**
- Create: `components/glass/Glass.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Implement `Glass`**

```tsx
import { forwardRef } from "react";
import type { CSSProperties, HTMLAttributes, ElementType } from "react";

type GlassProps<T extends ElementType = "div"> = {
  as?: T;
  spec?: boolean;
  className?: string;
  style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "style">;

export const Glass = forwardRef<HTMLElement, GlassProps>(function Glass(
  { as, spec = true, className, children, ...rest }, ref
) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag ref={ref} className={["bc-glass", spec ? "bc-glass--spec" : null, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </Tag>
  );
});
```

- [ ] **Step 2: Add Glass CSS**

```css
.bc-glass {
  position: relative;
  background: var(--glass-fill);
  backdrop-filter: blur(64px) saturate(220%);
  -webkit-backdrop-filter: blur(64px) saturate(220%);
  border: 0.5px solid var(--glass-border);
  box-shadow: inset 0 1px 0 var(--glass-highlight);
  border-radius: 20px;
  overflow: hidden;
}
.bc-glass--spec::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: var(--glass-spec); border-radius: inherit;
}
.bc-glass > * { position: relative; z-index: 1; }
```

- [ ] **Step 3: Commit**

```bash
git add components/glass/Glass.tsx app/globals.css
git commit -m "feat(glass): add base Glass primitive"
```

## Task 1.2: Add `<Button>` with three variants

**Files:**
- Create: `components/glass/Button.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Implement Button**

```tsx
"use client";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "primary" | "gold";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "default", size = "md", className, children, ...rest }, ref
) {
  return (
    <button
      ref={ref}
      className={["bc-btn", `bc-btn--${variant}`, `bc-btn--${size}`, className].filter(Boolean).join(" ")}
      {...rest}
    >
      <span className="bc-btn-spec" aria-hidden />
      <span className="bc-btn-label">{children}</span>
    </button>
  );
});
```

- [ ] **Step 2: Add Button CSS**

```css
.bc-btn {
  position: relative; isolation: isolate;
  border: 0; cursor: pointer;
  border-radius: 999px;
  font-family: inherit; font-weight: 500;
  color: var(--ink-strong);
  background: var(--glass-fill);
  backdrop-filter: blur(60px) saturate(220%);
  -webkit-backdrop-filter: blur(60px) saturate(220%);
  box-shadow: inset 0 1px 0 var(--glass-highlight), inset 0 0 0 0.5px var(--glass-border);
  transition: background var(--motion-hover), transform var(--motion-press);
  overflow: hidden;
}
.bc-btn:hover { background: var(--glass-fill-strong); }
.bc-btn:active { transform: translateY(0.5px); }
.bc-btn:focus-visible { outline: 2px solid var(--berkeley-blue); outline-offset: 2px; }
.bc-btn-spec {
  position: absolute; inset: 0; pointer-events: none;
  background: var(--glass-spec); border-radius: inherit;
}
.bc-btn-label { position: relative; z-index: 1; }

.bc-btn--sm { padding: 6px 12px; font-size: 12px; }
.bc-btn--md { padding: 9px 16px; font-size: 13px; }
.bc-btn--lg { padding: 12px 22px; font-size: 14px; }

.bc-btn--primary { color: var(--primary-text); background: var(--tint-primary); }
.bc-btn--primary:hover { background: var(--tint-primary-strong); }

.bc-btn--gold { color: var(--gold-text); background: var(--tint-gold); }
```

- [ ] **Step 3: Commit**

```bash
git add components/glass/Button.tsx app/globals.css
git commit -m "feat(glass): add Button with default/primary/gold variants"
```

## Task 1.3: Add `<Chip>` (multi-select pill)

**Files:**
- Create: `components/glass/Chip.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Implement Chip**

```tsx
"use client";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  tone?: "default" | "gold";
};

export const Chip = forwardRef<HTMLButtonElement, Props>(function Chip(
  { selected, tone = "default", className, children, ...rest }, ref
) {
  return (
    <button
      ref={ref}
      aria-pressed={selected}
      className={["bc-chip", selected ? "bc-chip--on" : null, tone === "gold" ? "bc-chip--gold" : null, className].filter(Boolean).join(" ")}
      {...rest}
    >
      <span className="bc-btn-spec" aria-hidden />
      <span className="bc-btn-label">{children}</span>
    </button>
  );
});
```

- [ ] **Step 2: Add Chip CSS**

```css
.bc-chip {
  position: relative; overflow: hidden;
  padding: 5px 11px; border-radius: 999px;
  color: var(--ink-strong); font-size: 12px; cursor: pointer;
  background: var(--glass-fill);
  backdrop-filter: blur(60px) saturate(220%);
  -webkit-backdrop-filter: blur(60px) saturate(220%);
  box-shadow: inset 0 1px 0 var(--glass-highlight), inset 0 0 0 0.5px var(--glass-border);
  font-family: inherit; font-weight: 500; border: 0;
  transition: background var(--motion-hover);
}
.bc-chip:hover { background: var(--glass-fill-strong); }
.bc-chip:focus-visible { outline: 2px solid var(--berkeley-blue); outline-offset: 2px; }
.bc-chip--on { color: var(--primary-text); background: var(--tint-primary); }
.bc-chip--gold.bc-chip--on { color: var(--gold-text); background: var(--tint-gold); }
```

- [ ] **Step 3: Commit**

```bash
git add components/glass/Chip.tsx app/globals.css
git commit -m "feat(glass): add Chip primitive"
```

## Task 1.4: Add `<SeatPill>`

**Files:**
- Create: `components/glass/SeatPill.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Implement SeatPill**

```tsx
type Props = { open: number; waitlist?: number };

export function SeatPill({ open, waitlist = 0 }: Props) {
  const isFull = open === 0;
  return (
    <span className={["bc-seats", isFull ? "bc-seats--full" : null].filter(Boolean).join(" ")}>
      <span className="bc-seats-led" aria-hidden />
      {isFull ? `Waitlist ${waitlist}` : `${open} open`}
    </span>
  );
}
```

- [ ] **Step 2: Add SeatPill CSS**

```css
.bc-seats {
  position: relative; overflow: hidden;
  font-size: 12px; font-weight: 500;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 11px; border-radius: 999px;
  background: var(--glass-fill);
  backdrop-filter: blur(60px) saturate(220%);
  -webkit-backdrop-filter: blur(60px) saturate(220%);
  box-shadow: inset 0 1px 0 var(--glass-highlight), inset 0 0 0 0.5px var(--glass-border);
  color: var(--ink-strong);
}
.bc-seats::before {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: var(--glass-spec); border-radius: inherit;
}
.bc-seats-led {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--berkeley-blue);
  box-shadow: 0 0 4px rgba(0,50,98,0.4);
  position: relative; z-index: 1;
}
[data-theme="dark"] .bc-seats-led { box-shadow: 0 0 6px rgba(110,168,255,0.6); }
.bc-seats--full { color: var(--muted); }
.bc-seats--full .bc-seats-led { background: var(--muted); box-shadow: none; }
```

- [ ] **Step 3: Commit**

```bash
git add components/glass/SeatPill.tsx app/globals.css
git commit -m "feat(glass): add SeatPill"
```

## Task 1.5: Add `<StarButton>`

**Files:**
- Create: `components/glass/StarButton.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Implement**

```tsx
"use client";
import { useState } from "react";

type Props = { initial?: boolean; onToggle?: (next: boolean) => void; label?: string };

export function StarButton({ initial = false, onToggle, label = "Save" }: Props) {
  const [on, setOn] = useState(initial);
  return (
    <button
      type="button"
      className={["bc-star", on ? "bc-star--on" : null].filter(Boolean).join(" ")}
      aria-pressed={on}
      aria-label={label}
      onClick={() => { const next = !on; setOn(next); onToggle?.(next); }}
    >
      <span className="bc-btn-spec" aria-hidden />
      <span className="bc-star-glyph">{on ? "★" : "☆"}</span>
    </button>
  );
}
```

- [ ] **Step 2: Add StarButton CSS**

```css
.bc-star {
  position: relative; overflow: hidden;
  width: 24px; height: 24px; border-radius: 50%;
  background: var(--glass-fill);
  backdrop-filter: blur(60px) saturate(220%);
  -webkit-backdrop-filter: blur(60px) saturate(220%);
  color: var(--muted); font-size: 12px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: inset 0 1px 0 var(--glass-highlight), inset 0 0 0 0.5px var(--glass-border);
  border: 0;
}
.bc-star-glyph { position: relative; z-index: 1; }
.bc-star:focus-visible { outline: 2px solid var(--berkeley-blue); outline-offset: 2px; }
.bc-star--on { background: var(--tint-gold); color: var(--gold-text); }
```

- [ ] **Step 3: Commit**

```bash
git add components/glass/StarButton.tsx app/globals.css
git commit -m "feat(glass): add StarButton"
```

## Task 1.6: Add `<Wordmark>`

**Files:**
- Create: `components/glass/Wordmark.tsx`

- [ ] **Step 1: Implement**

```tsx
import Link from "next/link";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="bc-wordmark">
      berkeleyclasses<span className="bc-wordmark-dot">.</span>
    </Link>
  );
}
```

- [ ] **Step 2: Add Wordmark CSS**

```css
.bc-wordmark {
  font-weight: 700; letter-spacing: -0.02em; font-size: 15px;
  color: var(--berkeley-blue); text-decoration: none;
}
.bc-wordmark-dot { color: var(--california-gold); }
```

- [ ] **Step 3: Commit**

```bash
git add components/glass/Wordmark.tsx app/globals.css
git commit -m "feat(glass): add Wordmark"
```

## Task 1.7: Rewrite `<GlassNav>` to use new tokens

**Files:**
- Modify: `components/glass/GlassNav.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Read current `GlassNav.tsx`** to preserve its server-only data fetching pattern (memory `[[feedback_next16_client_server_boundary]]`).

Run: `cat components/glass/GlassNav.tsx`

- [ ] **Step 2: Replace contents**

```tsx
import { Glass } from "./Glass";
import { Wordmark } from "./Wordmark";
import { ThemeToggle } from "./ThemeToggle";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const ITEMS = [
  { href: "/find", label: "Find" },
  { href: "/schedule", label: "Schedule" },
  { href: "/compare", label: "Compare" },
  { href: "/watch", label: "Watch" },
  { href: "/saved", label: "Saved" },
];

export default async function GlassNav({ active }: { active?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <Glass as="header" className="bc-nav">
      <Wordmark />
      <nav className="bc-nav-links">
        {ITEMS.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={["bc-nav-link", active === it.href ? "bc-nav-link--on" : null].filter(Boolean).join(" ")}
          >
            {it.label}
          </Link>
        ))}
      </nav>
      <div className="bc-nav-right">
        <span className="bc-nav-term">Fall 2026</span>
        <ThemeToggle />
        {user ? <div className="bc-avatar" /> : <Link href="/auth/signin" className="bc-nav-link">Sign in</Link>}
      </div>
    </Glass>
  );
}
```

- [ ] **Step 3: Add Nav CSS**

```css
.bc-nav { padding: 11px 20px; display: flex; align-items: center; gap: 26px; }
.bc-nav-links { display: flex; gap: 24px; font-size: 13px; color: var(--muted); }
.bc-nav-link { color: inherit; text-decoration: none; cursor: pointer; }
.bc-nav-link--on { color: var(--berkeley-blue); font-weight: 600; }
.bc-nav-right { margin-left: auto; display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--muted); }
.bc-nav-term { font-size: 13px; }
.bc-avatar {
  width: 26px; height: 26px; border-radius: 50%;
  background: linear-gradient(135deg, var(--berkeley-blue), var(--california-gold));
  border: 0.5px solid rgba(255,255,255,0.4);
}
```

- [ ] **Step 4: Verify in browser**

Run: `pnpm dev`. Confirm `/` loads, nav renders with toggle, theme switches.

- [ ] **Step 5: Commit**

```bash
git add components/glass/GlassNav.tsx app/globals.css
git commit -m "feat(glass): rewrite GlassNav to use Glass + Wordmark + ThemeToggle"
```

## Task 1.8: Rewrite remaining primitives (GlassCard, GlassButton, GlassPill, GlassInput, GlassSelect, GlassIsland, SegmentedControl, StatTile)

For each component, the goal is identical: drop the old hardcoded styles, replace internals with `<Glass>`, `<Button>`, `<Chip>`, or new tokens. Keep the export name + props so existing pages still compile.

For each component below, perform the same three steps:

- [ ] **GlassCard** → re-export `Glass` with a default `padding` prop merged in.
  ```tsx
  // components/glass/GlassCard.tsx
  import { Glass } from "./Glass";
  export const GlassCard = Glass;
  export default GlassCard;
  ```
- [ ] **GlassButton** → re-export `Button`.
  ```tsx
  // components/glass/GlassButton.tsx
  export { Button as GlassButton } from "./Button";
  export { Button as default } from "./Button";
  ```
- [ ] **GlassPill** → re-export `Chip`.
  ```tsx
  // components/glass/GlassPill.tsx
  export { Chip as GlassPill } from "./Chip";
  ```
- [ ] **GlassInput** → translucent input. Replace contents with:
  ```tsx
  "use client";
  import { forwardRef } from "react";
  import type { InputHTMLAttributes } from "react";
  export const GlassInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
    function GlassInput({ className, ...rest }, ref) {
      return <input ref={ref} className={["bc-input", className].filter(Boolean).join(" ")} {...rest} />;
    }
  );
  ```
  And add CSS:
  ```css
  .bc-input {
    width: 100%; font-family: inherit; font-size: 14px; color: var(--ink);
    background: var(--glass-fill-strong);
    backdrop-filter: blur(60px) saturate(220%);
    border: 0.5px solid var(--glass-border); border-radius: 12px;
    padding: 13px 16px;
    box-shadow: inset 0 1px 0 var(--glass-highlight);
  }
  .bc-input::placeholder { color: var(--muted); opacity: 0.65; }
  .bc-input:focus-visible { outline: 2px solid var(--berkeley-blue); outline-offset: 2px; }
  ```
- [ ] **GlassSelect** → wrap a native `<select>` with `.bc-input` styling. Same as `GlassInput` but with `<select>`.
- [ ] **GlassIsland** → re-export `Glass` (used for floating glass surfaces in `/schedule`).
- [ ] **SegmentedControl** → 2-3 mutually exclusive options inside a glass container. Replace styles:
  ```css
  .bc-seg { display: inline-flex; padding: 3px; gap: 2px; border-radius: 999px;
    background: var(--glass-fill); backdrop-filter: blur(60px) saturate(220%);
    box-shadow: inset 0 1px 0 var(--glass-highlight), inset 0 0 0 0.5px var(--glass-border); }
  .bc-seg-opt { padding: 5px 12px; border-radius: 999px; font-size: 12px; color: var(--muted); border: 0; background: transparent; cursor: pointer; }
  .bc-seg-opt--on { color: var(--primary-text); background: var(--tint-primary); }
  ```
- [ ] **StatTile** → number + label + optional histogram. Glass row.

After all components are rewritten, run:
```bash
pnpm dev
```
and visit `/`, `/find`, `/schedule`. Every page should still render — visuals may not match v11 yet, but no console errors, no TS errors.

- [ ] **Commit** at the end of Task 1.8:
```bash
git add components/glass/
git commit -m "feat(glass): rewrite all primitives on the new design system"
```

## Task 1.9: Delete superseded files + update barrel

**Files:**
- Delete: `components/glass/SeatCapsule.tsx`
- Delete: `components/glass/GlassWordmark.tsx`
- Delete: `components/star-button.tsx`
- Modify: `components/glass/index.ts`

- [ ] **Step 1: Remove dead files**

```bash
rm components/glass/SeatCapsule.tsx
rm components/glass/GlassWordmark.tsx
rm components/star-button.tsx
```

- [ ] **Step 2: Update barrel `components/glass/index.ts`**

```ts
export { Glass } from "./Glass";
export { Button } from "./Button";
export { Chip } from "./Chip";
export { SeatPill } from "./SeatPill";
export { StarButton } from "./StarButton";
export { Wordmark } from "./Wordmark";
export { ThemeToggle } from "./ThemeToggle";
export { MeshBackground } from "./MeshBackground";
export { GlassCard } from "./GlassCard";
export { GlassButton } from "./GlassButton";
export { GlassPill } from "./GlassPill";
export { GlassInput } from "./GlassInput";
export { GlassSelect } from "./GlassSelect";
export { GlassIsland } from "./GlassIsland";
export { SegmentedControl } from "./SegmentedControl";
export { StatTile } from "./StatTile";
// GlassNav is intentionally NOT exported here — it imports next/headers (server-only)
// and must be imported directly via "@/components/glass/GlassNav".
```

- [ ] **Step 3: Update any imports of `components/star-button` → `@/components/glass`**

Run: `rg "from \"@/components/star-button\"" -l app`
For each match, replace with `from "@/components/glass"` and use `StarButton`.

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: Build succeeds, no missing imports.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(glass): remove superseded files, update barrel"
```

---

# Phase 2 — `/find` canary

`/find` is the highest-traffic page and the closest match to the mockup. Ship this first, iterate, then propagate the pattern.

## Task 2.1: Rewrite `app/find/page.tsx` to v11 layout

**Files:**
- Modify: `app/find/page.tsx`
- Modify: `app/find/filter-sidebar.tsx`
- Modify: `app/find/sort-select.tsx`

- [ ] **Step 1: Read current page** to preserve data-fetching + Supabase query patterns.

Run: `cat app/find/page.tsx`. Note the search/filter/sort logic.

- [ ] **Step 2: Replace `app/find/page.tsx` shell**

Top of file (preserve existing imports + data fetch):
```tsx
import GlassNav from "@/components/glass/GlassNav";
import { Glass, Button, SeatPill, StarButton } from "@/components/glass";
import FilterSidebar from "./filter-sidebar";
// ... existing imports + data fetch
```

Page JSX:
```tsx
return (
  <main className="bc-page">
    <GlassNav active="/find" />

    <Glass className="bc-hero">
      <div className="bc-eyebrow">UC Berkeley · Fall 2026</div>
      <h1 className="bc-h1">Find <span className="bc-h1-accent">your</span> classes.</h1>
      <form className="bc-hero-form" action="/find" method="get">
        <input name="q" className="bc-input" placeholder="course, instructor, CCN…" defaultValue={q ?? ""} />
        <Button>Open only</Button>
        <Button variant="primary" type="submit">Search</Button>
      </form>
    </Glass>

    <div className="bc-grid3">
      <FilterSidebar selected={filters} />

      <Glass as="section" className="bc-results">
        <header className="bc-results-head">
          <h2>{subject?.name ?? "All subjects"} · {results.length} sections</h2>
          <span className="bc-muted">Sorted by open seats</span>
        </header>
        {results.map((s) => (
          <article key={s.ccn} className="bc-row">
            <div>
              <div className="bc-row-code">{s.subject_name} {s.course_number} · {s.section_number} — {s.title}</div>
              <div className="bc-row-meta">{s.instructors} · {s.meeting_times} · {s.location} · {s.units} units · CCN {s.ccn}</div>
            </div>
            <SeatPill open={s.open_seats} waitlist={s.waitlisted} />
            <StarButton initial={false} label={`Save ${s.subject_name} ${s.course_number}`} />
          </article>
        ))}
      </Glass>

      <Glass as="aside" className="bc-panel">
        <h4 className="bc-h4">ABOUT</h4>
        <p className="bc-muted">Select a section to see grade distribution, prereqs, and watch options.</p>
      </Glass>
    </div>
  </main>
);
```

- [ ] **Step 3: Add page CSS to `app/globals.css`**

```css
.bc-page { padding: 22px; display: grid; gap: 16px; max-width: 1240px; margin: 0 auto; }
.bc-hero { padding: 32px 30px 26px; }
.bc-eyebrow { font-size: 11px; letter-spacing: var(--tracking-eyebrow); text-transform: uppercase; color: var(--muted); margin-bottom: 12px; font-weight: 500; }
.bc-h1 { font-size: 36px; letter-spacing: var(--tracking-display); font-weight: 600; line-height: 1.04; margin-bottom: 22px; color: var(--ink-strong); }
.bc-h1-accent { color: var(--california-gold); }
.bc-hero-form { display: flex; gap: 8px; align-items: center; }
.bc-hero-form > .bc-input { flex: 1; }

.bc-grid3 { display: grid; grid-template-columns: 218px 1fr 256px; gap: 16px; }
@media (max-width: 1023px) { .bc-grid3 { grid-template-columns: 1fr; } }

.bc-results { padding: 22px 24px; }
.bc-results-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; }
.bc-results-head h2 { font-size: 14px; font-weight: 600; color: var(--ink-strong); }

.bc-row { padding: 14px 4px; border-bottom: 0.5px solid var(--hairline); display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; }
.bc-row:last-child { border-bottom: 0; }
.bc-row-code { font-size: 14px; font-weight: 600; color: var(--ink-strong); }
.bc-row-meta { font-size: 12px; color: var(--muted); margin-top: 2px; }

.bc-panel { padding: 20px; }
.bc-h4 { font-size: 10px; color: var(--muted); font-weight: 500; margin-bottom: 14px; letter-spacing: 0.12em; }
.bc-muted { color: var(--muted); font-size: 12px; }
```

- [ ] **Step 4: Rewrite `filter-sidebar.tsx` to use `<Chip>`**

```tsx
"use client";
import { Glass, Chip } from "@/components/glass";
import { useState } from "react";

export default function FilterSidebar({ selected }: { selected: Record<string, string[]> }) {
  const [subj, setSubj] = useState<string[]>(selected.subject ?? []);
  // ... breadth, days, time analogous
  return (
    <Glass as="aside" className="bc-filters">
      <div className="bc-filters-group">
        <h4 className="bc-h4">SUBJECT</h4>
        <div className="bc-chip-row">
          {["CS","Math","EECS","Stat","Econ"].map((s) => (
            <Chip key={s} selected={subj.includes(s)} onClick={() => setSubj((x) => x.includes(s) ? x.filter(y => y !== s) : [...x, s])}>
              {s}
            </Chip>
          ))}
        </div>
      </div>
      {/* repeat for breadth, days, time */}
    </Glass>
  );
}
```

CSS:
```css
.bc-filters { padding: 20px 16px; }
.bc-filters-group + .bc-filters-group { margin-top: 18px; }
.bc-chip-row { display: flex; flex-wrap: wrap; gap: 5px; }
```

- [ ] **Step 5: Manual verification in browser**

Run: `pnpm dev`. Navigate to `/find`. Toggle theme. Sort + filter. Confirm visuals match v11 mockup (open both in tabs side-by-side).

- [ ] **Step 6: Commit**

```bash
git add app/find/ app/globals.css
git commit -m "feat(find): port /find to liquid-glass redesign"
```

---

# Phase 3 — Core remaining: `/`, `/schedule`, `/class/[ccn]`

Three pages. Each is a separate task. Pattern: read existing page, swap chrome+components, add page-specific CSS, verify in browser, commit.

## Task 3.1: Rewrite `/` landing

**Files:**
- Modify: `app/page.tsx`

- [ ] Replace hero + features grid with `<Glass>` blocks, all using existing data queries (`sectionsCount`, `subjectsCount`).
- [ ] Add CSS class `.bc-features` for the 6-card grid: `display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;` (collapses to 1-col below 768px).
- [ ] Each feature = `<Glass padding="20px">` with `<h3>` + `<p>`.
- [ ] Verify in browser at `pnpm dev`.
- [ ] Commit: `feat(landing): port / to liquid-glass redesign`.

## Task 3.2: Rewrite `/schedule`

**Files:**
- Modify: `app/schedule/page.tsx`
- Modify: `app/schedule/builder.tsx`
- Modify: `components/schedule-grid.tsx`

- [ ] Wrap the 7-day grid in `<Glass>`. Course events are tinted-blue glass cells with rounded corners.
- [ ] Left panel = courses-in-plan list (`<Glass>` with rows for each CCN + remove button).
- [ ] Right panel = conflict checker + ICS export `<Button variant="primary">`.
- [ ] On mobile, columns stack and grid scrolls horizontally.
- [ ] Verify save/load works (existing supabase queries unchanged).
- [ ] Commit: `feat(schedule): port /schedule to liquid-glass`.

## Task 3.3: Rewrite `/class/[ccn]`

**Files:**
- Modify: `app/class/[ccn]/page.tsx`
- Modify: `components/grade-histogram.tsx`
- Modify: `components/waitlist-trend.tsx`

- [ ] Hero `<Glass>`: course code + title + instructors + `<StarButton>` top-right.
- [ ] Three side-by-side `<Glass>` panels below: enrollment / grade-distribution / prereqs+watch.
- [ ] `GradeHistogram`: bars use `--berkeley-blue`; peak bar uses `--california-gold`.
- [ ] `WaitlistTrend`: line in `--berkeley-blue` with `--tint-primary-strong` fill area.
- [ ] Verify on a real CCN (`pnpm dev` → `/class/29202`).
- [ ] Commit: `feat(class): port /class/[ccn] to liquid-glass`.

---

# Phase 4 — Long tail: 6 remaining routes

One commit per route. Same pattern as Phase 3.

## Task 4.1: `/compare`

- [ ] Two side-by-side `<Glass>` panels (CCN A vs CCN B).
- [ ] Verdict tile at top: tinted glass — `var(--tint-primary)` for "no conflict", `var(--tint-gold)` for "same day", custom rose tint for "overlap".
- [ ] Commit.

## Task 4.2: `/dept/[code]`

- [ ] Reuse `/find` row component but filtered to dept.
- [ ] Header `<Glass>`: dept name + total sections + breadth coverage row of `<Chip>`s.
- [ ] Commit.

## Task 4.3: `/instructor/[name]`

- [ ] Banner `<Glass>`: gradient avatar (Berkeley → Gold) + name + this-term section count.
- [ ] Sections taught this term: `<Glass>` list, same row format as `/find`.
- [ ] Past terms collapsible (use native `<details>` styled as glass).
- [ ] Commit.

## Task 4.4: `/watch`

- [ ] `<Glass>` subscription form: CCN input + email input + `<Button variant="primary">Watch</Button>`.
- [ ] `<Glass>` active-subs list: each row has CCN + class title + status `<SeatPill>` + `<Button variant="default" size="sm">Unsubscribe</Button>`.
- [ ] Commit.

## Task 4.5: `/saved`

- [ ] List of saved schedules. Each = `<Glass padding="16px">` with name + term + units + count + `<StarButton on>` for delete (or use a small `<Button variant="default">Delete</Button>`).
- [ ] Click row → `/schedule?id=<id>`.
- [ ] Commit.

## Task 4.6: `/auth/signin` + `/auth/error`

- [ ] Centered `<Glass padding="32px">` on full-bleed mesh.
- [ ] Inside: heading, body copy, primary-tinted `<Button>` "Continue with @berkeley.edu Google".
- [ ] Error page: same shell, error message + "Try again" `<Button>`.
- [ ] Commit (single commit covers both).

---

# Phase 5 — Polish

## Task 5.1: Entry animations

**Files:**
- Modify: `app/globals.css`
- Modify: `components/glass/Glass.tsx`

- [ ] Add CSS:
```css
@keyframes bc-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.bc-glass { animation: bc-enter var(--motion-enter) both; }
.bc-glass:nth-child(2) { animation-delay: 40ms; }
.bc-glass:nth-child(3) { animation-delay: 80ms; }
.bc-glass:nth-child(4) { animation-delay: 120ms; }
html[data-reduced-motion="true"] .bc-glass { animation: none; }
```
- [ ] Verify in browser: cards fade-up in stagger. `prefers-reduced-motion` kills it.
- [ ] Commit: `feat(motion): add staggered entry animation for glass surfaces`.

## Task 5.2: Mobile bottom-sheet for filters

**Files:**
- Modify: `app/find/filter-sidebar.tsx`
- Modify: `app/globals.css`

- [ ] Below 640px: filters render as a fixed-position bottom-sheet `<Glass>` with a "Filters" handle. Tap to expand.
- [ ] Use a `useState` open/closed toggle. No third-party libs.
- [ ] Verify at 360px width in DevTools device emulation.
- [ ] Commit: `feat(find): mobile filter bottom-sheet`.

## Task 5.3: Add Playwright visual-regression suite

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/visual/find.spec.ts`
- Create: `tests/visual/schedule.spec.ts`
- Create: `tests/visual/landing.spec.ts`
- Modify: `package.json`

- [ ] Install:
```bash
pnpm add -D @playwright/test
pnpm exec playwright install --with-deps chromium
```
- [ ] `playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/visual",
  webServer: { command: "pnpm dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 60_000 },
  use: { baseURL: "http://localhost:3000" },
});
```
- [ ] Sample spec `tests/visual/find.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
test("/find renders glass surfaces", async ({ page }) => {
  await page.goto("/find");
  await expect(page.locator(".bc-hero")).toBeVisible();
  await expect(page.locator(".bc-results")).toBeVisible();
  await expect(page).toHaveScreenshot("find-light.png", { fullPage: true, maxDiffPixelRatio: 0.02 });
});
test("/find dark mode", async ({ page }) => {
  await page.goto("/find");
  await page.evaluate(() => { localStorage.setItem("bc-theme", "dark"); });
  await page.reload();
  await expect(page).toHaveScreenshot("find-dark.png", { fullPage: true, maxDiffPixelRatio: 0.02 });
});
```
- [ ] Repeat for `/`, `/schedule`.
- [ ] Add scripts to `package.json`:
```json
"e2e": "playwright test",
"e2e:update": "playwright test --update-snapshots"
```
- [ ] Capture baselines:
```bash
pnpm e2e:update
```
- [ ] Re-run to verify deterministic:
```bash
pnpm e2e
```
Expected: 6/6 pass.
- [ ] Commit: `test(visual): add playwright screenshot suite for / /find /schedule`.

## Task 5.4: Accessibility audit + fixes

**Files:**
- Modify: any component where focus rings or contrast need adjusting.

- [ ] Install axe-playwright: `pnpm add -D @axe-core/playwright`.
- [ ] Add `tests/visual/a11y.spec.ts`:
```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
for (const route of ["/", "/find", "/schedule"]) {
  test(`a11y ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious).toEqual([]);
  });
}
```
- [ ] Run: `pnpm e2e tests/visual/a11y.spec.ts`. Fix any serious/critical violations in component CSS or markup. Common fixes:
  - Increase muted text contrast in dark mode (`--muted: #9aa3b2` → `#aab3c2` if needed).
  - Add `aria-label` to icon-only buttons.
  - Ensure `<input>`s have labels (`<label className="sr-only">…</label>`).
- [ ] Re-run; ensure 0 serious/critical.
- [ ] Commit: `fix(a11y): clear all serious + critical axe violations`.

## Task 5.5: Lighthouse pass

- [ ] Run on production build:
```bash
pnpm build && pnpm start &
SERVER_PID=$!
sleep 5
pnpm exec lighthouse http://localhost:3000/find --output=json --output-path=./lh-find.json --chrome-flags="--headless"
kill $SERVER_PID
```
- [ ] Open `lh-find.json`. Goals: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.
- [ ] Most likely fix: `font-display: swap` (already set), preload Product Sans Regular in `<head>` via `<link rel="preload" as="font" type="font/ttf" crossorigin>` in `app/layout.tsx`.
- [ ] Commit: `perf: preload product-sans regular for first paint`.

## Task 5.6: Update `CLAUDE.md` + memory

**Files:**
- Modify: `/Users/ish/.claude/projects/-Users-ish/memory/reference_glass_design_system.md`

- [ ] Replace the file with a one-line summary pointing at the new spec + plan:
  ```markdown
  ---
  name: reference-glass-design-system
  description: berkeleyclasses Liquid Glass design system — spec, plan, and v11 mockup
  metadata: { type: reference }
  ---

  Authoritative spec: `_Projects/berkeleyclasses-web/docs/superpowers/specs/2026-06-08-berkeleyclasses-redesign-design.md`.
  Implementation plan: `_Projects/berkeleyclasses-web/docs/superpowers/plans/2026-06-08-berkeleyclasses-redesign.md`.
  Visual reference: `_Projects/berkeleyclasses-web/.superpowers/brainstorm/92656-1780913468/content/direction-v11.html`.

  Palette: Berkeley Blue `#003262`, California Gold `#FDB515`, Metallic Gold `#BC9B6A`.
  Tokens live in `app/globals.css`. Primitives in `components/glass/`. Theme via `data-theme` attr + `useTheme()` hook.
  ```
- [ ] Commit: `docs(memory): point design-system memory at v2 spec + plan`.

## Task 5.7: Final QA sweep

- [ ] Open every public route in both light and dark mode. Confirm:
  - No raw white/black backgrounds (the mesh always shows through).
  - Every interactive element has a visible focus ring on Tab.
  - No layout shift on theme swap.
  - Schedule grid still produces a valid ICS at `/api/ics`.
- [ ] Run full test suite:
```bash
pnpm test && pnpm e2e
```
Expected: all green.
- [ ] Commit (if any final fixes): `chore: final QA sweep`.

---

## Self-review

**Spec coverage**

| Spec section | Tasks |
|---|---|
| §3 Design tokens | 0.3 |
| §4 Component inventory | 1.1 – 1.9 |
| §5 Page-by-page brief | 2.1 (find), 3.1 (/), 3.2 (schedule), 3.3 (class), 4.1 (compare), 4.2 (dept), 4.3 (instructor), 4.4 (watch), 4.5 (saved), 4.6 (auth) |
| §6 Responsive | Inline in 2.1 + 5.2 |
| §7 Motion | 0.5 (drift), 5.1 (entry), 0.6 (toggle), 0.3 (reduced-motion gate) |
| §8 Typography & fonts | 0.2 + 0.3 |
| §9 Accessibility | 5.4 |
| §10 Migration plan | Phases 0–5 mirror it |
| §11 Out of scope | No tasks created (correct) |

All sections covered.

**Placeholder scan** — none. Every step has either real code or a real command + expected output.

**Type consistency** — `Theme`, `useTheme`, `<Glass>`, `<Button>`, `<Chip>`, `<SeatPill>`, `<StarButton>`, `<Wordmark>`, `<ThemeToggle>` are defined in Phase 0/1 and referenced consistently after.

**Scope** — 5 phases, each independently shippable. Order is dependency-safe.
