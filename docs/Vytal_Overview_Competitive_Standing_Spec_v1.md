# Vytal — Stock Overview · "Competitive Standing" Block — Rules Spec

**Version:** 1.0 (build-ready)
**Scope:** The Competitive Advantage / standing block on the **stock Overview tab** (the calm, top-of-page "where does this company stand" read). This is a **lighter projection of already-derived data** — it computes nothing new. It consumes the same signals the Health page §5 and the Findings Map already produce.
**Status:** Built against locked sources — Findings Map v1.0 and Sections 2 & 5 Rules Spec v1.0. Where those define copy, severity, or constraints, this doc **inherits, never overrides**. Lighter ≠ different rules.

---

## 0 · The one idea

The Health page §5 is a **diagnostic** — risk-first, conditional, "go look hard." The Overview block is a **standing read** — "why does this company stand out in its field." Same underlying signals, opposite center of gravity: §5 leads with what's wrong; Overview leads with where the company is strong *within its peer group*. Both stay honest; neither predicts price.

**Hard rule inherited from Findings Map #14:** every standing statement is *within-peer-group position*, never a return ranking and never "the top one is the better buy." Strength = standing, not recommendation.

---

## 1 · What it reuses (zero re-derivation)

Every input already exists. This block selects and rephrases — it never recomputes.

| Input | Source (already derived) |
|---|---|
| Peer-relative rank, above/below PG average | Findings Map #14 (Peer-relative position) |
| Which metrics sit top-quartile vs peers | Findings Map #7 (three-lens decomposition — Peer lens) |
| Pillar standings + native zones | §0 of Rules Spec (locked scales); Findings #3–6 |
| Sector-class (switches what Foundation may claim) | Findings #15 |
| Any live Critical Red Flag (R1–R6) | Rules Spec §5·A |
| The single dominant §5 finding (if any fired) | Rules Spec §5 ordering |
| PG-movement mask (hot pond) | Findings #16 |

**No new thresholds. No new computation.** If a value isn't already derived for the Health page, it does not appear here.

---

## 2 · The two states

The block has exactly two render states. The branch is decided by **one check**: is a Critical Red Flag (R1–R6) live?

### State CAUTION — a Critical Red Flag is live
Per your decision: **risk dominates the overview.** The strength block is *replaced*, not appended to.

- Render a single **"Watch With Care"** strip, severity `red`, inheriting the §5·A verdict copy **verbatim** (the flag name + the one breaching stat).
- No strength chips. No synthesis line. The standing read is suppressed until no R-flag is live.
- One muted line below: *"This company has strengths — see the full health breakdown — but a critical flag takes priority here."* with a funnel (↗) into the Health page §5.
- **Doesn't-mean** (inherited verbatim from §5·A): *"a hard risk/quality warning to investigate — not a prediction the stock will fall."*

Rationale: surfacing glossy "competitive advantages" above an active pledging crisis or earnings-quality breakdown would be dishonest and legally reckless. The flag is load-bearing; it wins the block.

### State STANDING — no Critical Red Flag live
The normal, calm read. **Synthesis line first, then 2–3 supporting strength chips.**

```
┌─ Competitive Standing ──────────────────────────────┐
│                                                      │
│  <One-line plain-language synthesis>                 │   ← lead
│                                                      │
│  [chip: strength 1]  [chip: strength 2]  [chip 3]    │   ← support
│                                                      │
│  <muted doesn't-mean line>          [↗ full health]  │
└──────────────────────────────────────────────────────┘
```

---

## 3 · The synthesis line (deterministic assembly — NOT AI-generated)

One sentence, assembled by rule from already-derived signals. **No model text generation** — pure template selection, so it is consistent, legally clean, and matches "AI explains, never advises."

### Assembly: pick the lead clause by priority (first that qualifies wins)

| Priority | Condition (already derived) | Template |
|---|---|---|
| 1 | Recovery-from-weakness firing (§5·D) | "Turning up out of a weak patch, and <rank clause>." |
| 2 | PG rank top-3 AND ≥1 pillar Strong | "One of the stronger names in its peer group — <rank clause>." |
| 3 | PG rank above average | "Sits above its peer-group average — <rank clause>." |
| 4 | PG rank below average BUT Foundation ≥ mid | "Below its peer-group average, but structurally sound — <floor clause>." |
| 5 | PG rank below average AND Foundation < mid | "Among the weaker names in its peer group on current health." |
| 6 | Steady / average-zone, nothing notable | "Sits mid-pack in its peer group — sound but unremarkable." (mirrors §5 empty-state tone) |

`<rank clause>` = "ranks #<n> of <N> on <leading pillar in plain words>" — e.g., "ranks #2 of 7 on capital efficiency."
`<floor clause>` = "its balance-sheet floor holds up better than its rank suggests."

**Plain-word pillar map** (display only; never expose pillar jargon on Overview):
Foundation → "financial strength" / "capital efficiency" (use the specific top metric's plain name where one dominates) · Momentum → "improving fundamentals" · Ownership → "institutional backing."
*Market is never featured as a standing strength* (Findings #5 constraint: "never exposed as technicals"; "the part most likely to mislead in isolation").

### Mask caveat
If the PG pond is **hot** (#16) AND the lead clause is price-linked (only Priority-1 recovery can be), append inherited caveat: *"— the pond is hot, so price-linked reads may be deferred."* Non-price standing clauses are unaffected (their truth doesn't depend on the tape).

---

## 4 · The strength chips (2–3, selected by rule)

Small, calm chips under the synthesis. Each names **one real, peer-relative strength** drawn from the three-lens Peer decomposition (#7). Selection = the top 2–3 metrics where the stock sits **top-quartile within its PG**, ordered by pillar weight (Foundation → Momentum → Ownership).

- Chip text: plain metric name + standing, e.g., **"Top-quartile ROCE in peer group"**, **"Lowest leverage of 7 peers"**, **"Strongest institutional inflow in group."**
- **No numbers-as-grade colouring.** Chips are neutral-toned (faint accent only). No green = good.
- If fewer than 2 top-quartile strengths exist, show what's there; if **zero**, drop the chip row and let the synthesis line carry the block (likely Priority 4–6 cases).
- Market-pillar metrics are **never** chips (same #5 constraint).

### Sector-class switch (mandatory, inherited from §2 / Findings #15)
A Foundation-based chip must read correctly for the class. For **Commodity / Cyclical / PSU**, a strong-floor chip says **"solvent through the cycle,"** never "calm/safe." For **Quality / Defensive**, "structural strength" is allowed. The class changes the chip's words — same rule §2 Line 2 enforces. Never a uniform "strong = safe."

---

## 5 · The doesn't-mean line (always present in STANDING state)

One muted line, inherited in spirit from #14's constraint:

> *"Standing within its peer group — a selection and quality read, not a signal it will outperform."*

Non-negotiable. It is the legal and intellectual boundary that lets the block show strength without implying a buy.

---

## 6 · Display rules (inherited universal display law)

- **State over numbers** — the synthesis word leads; the rank number supports, never dominates.
- **No green→red grading** of any verdict word or chip (kills "greener = better = buy").
- **Within-PG only** — every comparison is to the peer group; never cross-sector, never "best stock."
- **Calm, not loud** — this is the Overview's quiet top-of-page read. Density-as-triage (the §5 loud/quiet/empty mechanic) does **not** apply here; that variance lives on the Health page by design. Overview standing block is fixed-height, calm, one synthesis + up to three chips.
- **Funnel** — a single (↗) into the full Health page §5 for the user who wants the diagnostic depth.

---

## 7 · Data-gating (per-stock honesty)

- **Unscored stock** (no health snapshot yet): suppress the whole block; show "Health standing not yet available for this stock" — never fabricate a rank. (Consistent with the platform-wide honest-empty rule and the hasScoredPeriod decoupling.)
- **Scored but thin peer data:** if PG `n < 4` for a metric, that metric cannot produce a chip (inherits the model's n≥4 floor — no rank claim on an unfair base).
- **Pending-data patterns (P5/P6/P9/P10):** never surface here in any pending state; the Overview block only uses *active, confirmed* signals. Pending capability is a Health-page concern, not an Overview one.

---

## 8 · What this block deliberately does NOT do

- Does not re-derive any score, rank, bar, or threshold.
- Does not show the §5 conditional stack, density states, or the full findings catalog (that's the Health page).
- Does not feature Market/price signals as strengths.
- Does not generate free-text via AI (template assembly only).
- Does not rank across sectors or imply return.
- Does not suppress a live Critical Red Flag.

---

## 9 · Build summary (one paragraph for the dev)

On the stock Overview tab, render a **Competitive Standing** block that is a pure projection of already-derived health signals. **First check for a live Critical Red Flag (R1–R6)**; if present, render the CAUTION state (the §5·A "Watch With Care" strip verbatim, strengths suppressed, funnel to Health page) and stop. Otherwise render the STANDING state: a **deterministically assembled** one-line synthesis (priority table §3, plain-word pillar map, no AI text), then **2–3 strength chips** selected as the stock's top-quartile-within-PG metrics ordered by pillar weight (§4), with the sector-class switch applied to any Foundation chip, never featuring Market. Always append the §5-doesn't-mean line. Inherit the universal display law (state over numbers, no green/red grading, within-PG only, mask caveat where price-linked). Gate on scoring status and the n≥4 peer floor; never fabricate. The block is fixed-height and calm — the loud/quiet/empty density mechanic stays on the Health page.
