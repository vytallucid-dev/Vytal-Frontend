# Claude Code Prompt — Apply the Vytal Health design system to the entire frontend

> Paste this as your task. Attach `vytal_stock_health_revamp.html` as the **canonical visual reference**, and optionally the other prototype HTMLs (`vytal_health_hub_full.html`, the three tool files, the two health-tab files) as secondary examples of the same system applied to different layouts.

---

## Mission

I have a working Next.js + TypeScript frontend. Its **functionality and information architecture are fine — I am not changing those.** What I want is a **complete visual re-theme**: apply one cohesive, modern, dark design system across the whole app so every screen looks like it belongs to the same product.

The design system is fully defined in the attached prototype HTML files. **`vytal_stock_health_revamp.html` is the principal reference** — when any visual question is ambiguous, match what that file does. The other HTMLs show the same system applied to dashboards, tools, and tabbed pages; use them to see how the system scales to different layouts.

**This is a re-skin, not a rewrite.** Preserve all logic, routing, state, data flow, and page structure. Change how things *look*, not what they *do*.

---

## Operating constraints (read before starting)

1. **Do not change behavior.** No routing, data-fetching, state, business logic, or IA changes. If a component's markup must change to restyle it, keep its props, behavior, and output identical.
2. **Work incrementally, not in one giant diff.** Phase the work (see "Execution plan"), and commit per phase/area so changes stay reviewable. Verify the app still builds and each screen still works after each area.
3. **Single source of truth.** All colors, fonts, radii, and spacing come from **one central token layer** — never hardcode hex values or font names in components again. After this work, a global look change should be a token edit, not a find-and-replace.
4. **Detect, then adapt.** First inspect how the codebase currently handles styling (Tailwind? CSS Modules? styled-components? a theme file?) and fonts. Map this design system into the *existing* mechanism rather than bolting on a parallel one. If it's Tailwind, put tokens in `globals.css` as CSS variables and reference them from `tailwind.config` theme extensions. If it's CSS Modules/vanilla, centralize the same CSS variables in a global stylesheet.
5. **When unsure, open the principal HTML and copy it.** Exact values are below, but the reference file is the tie-breaker.

---

## Phase 1 — Establish the design tokens (the foundation; do this first)

Create the central token layer with these **exact** values. These are the system's DNA — use these names everywhere.

```css
:root{
  /* base + surfaces (dark, layered depth via surfaces — not heavy shadows) */
  --bg:#090a0d;          /* app background, near-black */
  --surface:#111319;     /* default card surface */
  --surface2:#171a20;    /* raised surface / hover lift */
  --surface3:#20242c;    /* highest surface / track & bar backgrounds */

  /* hairline borders (depth comes from these, kept subtle) */
  --line:rgba(255,255,255,.06);
  --line2:rgba(255,255,255,.10);
  --line3:rgba(255,255,255,.17);

  /* text — warm off-white, stepping down in emphasis */
  --ink:#f1efe9;         /* primary */
  --ink2:#9b9c9c;        /* secondary */
  --ink3:#62646c;        /* tertiary / muted / labels */

  /* CONDITION SCALE — health bands. red→amber→gold→green→COOL BLUE. */
  --c-fragile:#e2584d;   /* Fragile  (<55) */
  --c-below:#e0913f;     /* Below par (55–62) */
  --c-steady:#cda74f;    /* Steady   (62–68) */
  --c-healthy:#48ba7c;   /* Healthy  (68–74) */
  --c-pristine:#4ea1e6;  /* Pristine (≥74) — COOL BLUE, deliberately NOT green */

  /* PILLAR identity colors — fixed, consistent everywhere */
  --p-found:#5d92d8;     /* Foundation — blue */
  --p-mom:#a085d8;       /* Momentum  — violet */
  --p-mkt:#d6a652;       /* Market    — gold */
  --p-own:#4fb6a4;       /* Ownership — teal */

  /* SEMANTIC severity (each has a fill, a soft bg, a border) */
  --crit:#e2584d; --crit-bg:rgba(226,88,77,.12);  --crit-bd:rgba(226,88,77,.40);
  --high:#e0a13e; --high-bg:rgba(224,161,62,.12);  --high-bd:rgba(224,161,62,.38);
  --rec:#48ba7c;  --rec-bg:rgba(72,186,124,.12);   --rec-bd:rgba(72,186,124,.40);
  --ctx:#7f93b2;  --ctx-bg:rgba(127,147,178,.11);  --ctx-bd:rgba(127,147,178,.32);
}
```

Also establish scale tokens (match the prototypes): **radii** card 16px, inner element 12–14px, pill/chip/button 8–9px, hero 20–22px; **base spacing unit 8px**; **page shell** `max-width:1500px; margin:0 auto; padding:0 26px` (full-bleed, centered); **transitions** .15s–.2s ease.

If Tailwind: extend the theme so these become usable utilities (e.g. `bg-surface`, `text-ink2`, `border-line`, `text-pristine`, `text-p-found`) all pointing at the CSS variables. Don't leave components using arbitrary `[#hex]` values.

## Phase 2 — Typography (the three-font system)

Load via **`next/font`** (not the Google `@import` the prototypes use — that's a prototype shortcut). Expose each as a CSS variable and wire to tokens:

- **Inter** → `--font-ui` — all interface text, body, labels, buttons. The default.
- **Fraunces** (serif display) → `--font-display` — stock/entity **names**, the **diagnosis / verdict sentences**, and section heroes. Used sparingly, for editorial weight.
- **IBM Plex Mono** → `--font-mono` — **every number, without exception**: scores, percentages, prices, dates, ratios, table cells. Always with `font-variant-numeric: tabular-nums; letter-spacing:-.01em`.

Create a `.num` utility (mono + tabular-nums) and apply it to all numeric output. This single rule does a huge amount of the "feels like a financial product" work — enforce it everywhere.

Typographic patterns to reproduce (from the principal HTML):
- **Section eyebrow:** ~10.5px, weight 600, `letter-spacing:.16em`, uppercase, `--ink3`, laid out as a flex row with a 1px `--line` rule filling the remaining width, and an optional right-aligned "pill" tag (mono, `--ink2`, `bg:--surface2`, `border:1px --line2`, `border-radius:20px`).
- **Kicker / sub-label:** ~10px, 600, `.15em`, uppercase, `--ink3`.
- **Hero name:** Fraunces 500, large (~32–36px).
- **Diagnosis sentence:** Fraunces 400, ~22px, `line-height:1.45`.

## Phase 3 — Build the primitive component vocabulary

Extract these reusable primitives (as your framework's components) so the rest of the app is composed from them, not from ad-hoc styles. Match the principal HTML's specs:

- **Card** — `bg:--surface`, `border:1px --line`, `radius:16px`, `padding:20px 22px`. Variants: **top-accent** (`border-top:2px solid <pillar>` — used for pillar cards), **left-accent** (`border-left:3px solid <severity>` — used for finding/attention cards), **hero** (larger radius, a low-opacity gradient wash + a soft radial glow in one corner; see the verdict hero in the reference).
- **SectionHeader / Eyebrow** — the divider-with-label pattern above.
- **Chip / Tag** — inline-flex, ~12px, `padding:6px 12px`, `radius:9px`, `border:1px --line2`, `color:--ink2`, `bg:--surface2`; semantic variants recolor to `--high`/`--crit`/`--rec` with their `-bg`/`-bd`.
- **Stat / Number** — wraps numeric values in `.num`; large-figure variant for hero numbers (mono, weight 500).
- **Meter / Bar** — `height:6–9px`, `radius:4–6px`, `bg:--surface3`, a colored fill, `transition:width`.
- **Gauge** — circular SVG (r≈26, stroke-width≈6, track `--surface3`, value-colored arc, mono number centered) for pillar scores.
- **Button / Action** — `bg:--surface`, `border:1px --line2`, `color:--ink2`, ~12px, `padding:7px 12px`, `radius:8px`, line icon ~14px, gap 7px; hover → `border:--line3` + `color:--ink`.
- **Expandable** — a chevron that rotates 180° on `.open`; used for "tap to expand" cards/rows and the collapsible raw-data sections.
- **Table** (dense/financial) — mono cells, hairline `--line` row borders, sticky first column where horizontal scroll is needed, sortable headers with a small arrow indicator, pass/fail cell coloring (`--rec` / `--high`). See the raw-data floors in the PG and Portfolio HTMLs.

**Icons:** use **line icons** (stroke-based, `stroke-width:2`, `currentColor`, sized 14–18px) — e.g. lucide-react if available. **No emoji as UI icons.**

**Interaction states (global):** hover lifts surface to `--surface2` and brightens the border; `:focus-visible` shows `outline:2px solid var(--c-pristine); outline-offset:2px`. Keep transitions quick (.15s).

## Phase 4 — Apply across the app

Now propagate, **shared-and-most-used first** for maximum reach with least churn:

1. **Global shell, layout, navigation, and any app-frame chrome** — adopt the shell tokens, the dark base, the slim-strip pattern (the prototypes deliberately avoid a heavy top masthead on full-page surfaces; a slim context/breadcrumb strip only).
2. **The shared primitives' current equivalents** — wherever the app already has cards, buttons, badges, tables, replace their styling with the Phase-3 primitives.
3. **Then screen by screen.** For each page: swap ad-hoc colors/fonts/spacing for tokens and primitives; apply the eyebrow-section rhythm; ensure every number is `.num`; ensure entity names and any verdict/summary lines use the display serif. Verify it still works before moving on.
4. **Final consistency sweep:** grep for raw hex values, off-system font references, and non-mono numbers; eliminate them. Confirm dark mode is the single source (no leftover light-theme styling fighting it).

---

## The design principles (so you stay consistent on anything not spelled out)

- **Distinct section treatments, never a wall of identical cards.** Each major section should feel visually differentiated (the reference uses different layouts, accents, and chart treatments per section). Uniformity is the thing to avoid.
- **Color is semantic, never decorative.** A colored accent always *means* something (a condition band, a pillar identity, a severity). Don't add color for prettiness.
- **Depth from surfaces + hairlines, not heavy shadows.** Layer `--surface` → `--surface2` → `--surface3` and use thin borders. Avoid drop-shadow-heavy "floating card" looks and avoid glassmorphism overload — keep it clean and flat-with-depth.
- **Subtle glows/gradients only at moments of emphasis** (hero, active/attention states) — low opacity, never everywhere.
- **Numbers mono, names/verdicts serif, everything else Inter.** This split is most of the aesthetic.
- **Density that breathes.** The product is information-dense, but with generous internal spacing and clear rhythm — dense ≠ cramped.
- **Restraint in the middle, intensity at the edges.** Calm/neutral states stay quiet and low-contrast; critical/extreme states earn stronger color and presence.

## Locked decisions (do not "improve" these)

- **Pristine is cool blue (`#4ea1e6`), never green.** The top of the health scale must not read as "best / max buy."
- The **five condition colors** and **four pillar colors** above are fixed identities — reuse them, don't substitute.
- **Every number is IBM Plex Mono.**
- **Dark base**, warm off-white text (`--ink`), the surface-layer depth model.
- **Line icons, no emoji.**

## Do NOT

- Change routing, data, state, logic, or information architecture.
- Restructure component behavior — restyle only.
- Introduce a different color story, additional accent palettes, or other fonts.
- Add heavy shadows, gradients-everywhere, or glassmorphism beyond the subtle touches in the reference.
- Make every section look the same.
- Break existing responsive behavior — keep layouts working down to mobile (the prototypes collapse multi-column grids to single column at narrow widths; preserve that).

## Deliverable / acceptance

When done, I should have:
1. A **single token layer** (CSS variables + theme config) holding every color/font/radius/spacing value above, referenced by everything.
2. The **three fonts** wired via `next/font` and applied per their roles, with all numbers mono.
3. A **set of restyled primitive components** (Card, SectionHeader, Chip, Stat, Meter, Gauge, Button, Expandable, Table) that the app is composed from.
4. **Every screen** re-themed to this system, visually consistent with `vytal_stock_health_revamp.html`, with **no behavior changes** and **no raw hex / off-system fonts** left in components.

Start by inspecting the current styling setup and showing me the plan (which styling mechanism you'll map tokens into, and the order of areas you'll convert), then proceed phase by phase.
