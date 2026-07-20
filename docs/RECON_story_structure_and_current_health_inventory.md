# RECON — Story structure (verbatim) + current Health tab component inventory

**Model: Sonnet · Thinking: low · READ-ONLY**

Pure extraction. Do not build, edit, or propose. Report only what is literally in the repo and live
DB. Where absent, say "not present." Never infer.

Two goals: (1) the **exact story movement structure** so a visual redesign maps to real movements, not
invented ones; (2) a **full inventory of the current shipped Health tab** so the rebuild preserves
what exists instead of replacing it.

Scope: `Vytal-Backend` + `Vytal-Frontend`, live DB.

---

## 1. The story, movement by movement — verbatim

The user wants the story rendered as a **designed, visual object** (beats with figures and chips), not
a prose paragraph. To design beats I need the real movement taxonomy.

- **Quote the story composer's full output type**, and the per-movement shape. Every field on a
  movement.
- **How many distinct movement *kinds* exist?** Quote the enum/tag that distinguishes them (the
  handoff implied composition / coverage / construction / concentration as movement themes — quote the
  actual discriminator).
- For **each movement kind**, quote:
  - what `text` it composes (one real example each),
  - which **figures** it references (the numbers embedded — are they structured fields, or only inside
    the prose string?),
  - which **finding ids** it "spends" (`used`),
  - any **emphasis / weight / order** field.
- **Critical:** are the figures in a movement available as **structured data** (e.g.
  `{coveragePct: 37, scoredScore: 70}`) or **only interpolated into the `text` string**? This decides
  whether a visual beat can render its own number/bar or must parse prose. Quote the movement object
  to prove it.

## 2. Find a book WITH a story and dump it

The screenshots show a `story: null` book. I need a populated one.

- Query the snapshot table for rows where `story IS NOT NULL`. Report how many, and the user/book id
  of each.
- **Dump the full `story` value of one populated book, verbatim and whole** — every movement, every
  field, unedited.
- Report that book's `healthRead`, `constructionRead`, `constructionData` summary
  (archetype/exposures), and `fired_findings` count — so the story's movements can be matched to the
  data they describe.

## 3. The CURRENT Health tab — full component inventory (what to preserve)

The current tab (per screenshots) has a rich shipped design. I must keep it, not replace it. For each
section below, report the **component file, the fields it reads, and quote its section header string**:

- The top **"two reads of your book"** co-hero pair — the two question-framed cards ("Are the things
  you own sound?" / "Is this book safely held?"), their number/band/coverage/archetype rendering.
- The **"quality − flags" waterfall** (Quality anchor → No active flags → = Health bars).
- The **"where your book's health comes from"** pillar bars (Foundation/Momentum/Market/Ownership).
- The **"active flags — the Signals ledger"** section.
- The Construction side: **"is this book safely held"** — Concentration / Effective breadth / Sector
  mix cards, "what we measured", and the **"deduction ledger"** with `C1/C2` codes.
- The **"how much of your book we can see"** coverage section — the scored/awaiting/untracked bar, the
  "held by design not scored" vs "awaiting-coverage" split.
- The **"your holdings"** table — weight / holding / condition / why-it's-here, the per-name pillar
  expand, the "we don't score this holding" rows.

For **each**: is it reading **v2 data** already, or **v1 fields** (`pillarProfile`, `lensProfile`,
anchor-waterfall)? State plainly per section. (The screenshots show a waterfall AND pillar bars AND a
deduction ledger all live — so some of this is clearly working against real data. I need to know which
sections are v2-native vs which are v1-shaped over v2 numbers.)

## 4. The gap — what's built vs what's NOT rendered

Given §3, report plainly:
- Which v2 fields are **served but rendered nowhere** (the recon earlier said: `story`,
  `constructionRead.exposures`, `referenceFindings`/PD family, `doesntMean`, `storyClause`). Reconfirm
  each against the CURRENT component tree — is it still unrendered, or did the current page already
  wire some?
- Is the **story** rendered at all in the current tab? If a section renders it, quote it. If nothing
  does, state "not present" plainly.
- The **PD family** (mandatory disclosures) — rendered anywhere in the current tab? Quote or "not
  present."
- **`doesntMean` / `storyClause`** — in the FE `PfFinding` type yet, or still dropped?

---

## Output format

1–4 in order. Verbatim movement type + one example per kind. The **whole live `story` value** of a
populated book. Component files + header strings + per-section v1/v2 verdict. No conclusion. End after
4.
