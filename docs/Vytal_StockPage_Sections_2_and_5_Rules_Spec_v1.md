# Vytal — Single-Stock Health Page · Sections 2 & 5 — Rules Spec

**Version:** 1.0 (final, code-ready)
**Scope:** The two *conditional* sections of the single-stock health page — **§2 Risk-shape** and **§5 Notable findings**. Sections 1 (Verdict), 3 (Anatomy), 4 (Trajectory) are deterministic renders of already-defined data and are out of scope here.
**Status:** Built against the locked model (Master Spec v5.5.1) and the program's test findings. Everything is enumerated. The only open items are three external data-readiness confirmations (see final box) — already handled in the UI as display states, so they do not block build.

---

## 0 · Shared foundations

**Locked scales (hardcodeable):**

- Composite bands: Fragile `<55` · Below par `55–62` · Steady `62–68` · Healthy `68–74` · Pristine `≥74`
- Native pillar zones (weak / strong marks): Foundation `60 / 72` · Momentum `54 / 75` · Market `50 / 74` · Ownership `60 / 72`
- Pillar weights: Foundation 0.35 · Momentum 0.25 · Market 0.20 · Ownership 0.20
- Pillar roles for rule logic: *Business/fundamentals* = Foundation + Momentum · *Price* = Market · *Flow/smart-money* = Ownership

**Two calibration knobs (derive from data, do not intuit):**

- **K1 — ride deviation (relative, §2).** See §2. Compares recent realised vol to the stock's *own* long-run vol. No absolute cutoffs.
- **K2 — divergence spread thresholds (§5).** Pillar-gap "notable" `≥15 pts` and "wide" `≥25 pts`. These are pillar-score gaps, not price — defaults stand unless tuned.

**Universal display law (applies to both sections):** state over numbers; no green→red colour-grading of verdict words (kills "greener = better = buy"); every directional, price-linked statement carries the pond-mask caveat when the PG is hot.

---

## §2 · Risk-shape — "How it rides"

Two stacked lines. **Line 1 is a fact** (the stock's own realised behaviour). **Line 2 is interpretation** (what its Foundation means given its class). Kept separate so we never say "Foundation X → you will be calm" (a prediction); we state what happened, then interpret the floor.

### Inputs
`realized_vol_recent` (~63 trading days), `realized_vol_baseline` (~2–3 yr), `worst_drawdown_in_view`, `foundation_score`, `sector_class`.

### Line 1 — the realised ride (computed, relative, descriptive)

**K1 — ride deviation formula:**
```
ride_ratio = realized_vol_recent / realized_vol_baseline
```
| ride_ratio | Label |
|---|---|
| `< 0.85` | Calmer than usual |
| `0.85 – 1.25` | Its normal ride |
| `1.25 – 1.75` | Wilder than usual |
| `> 1.75` | Sharply more volatile than its history |

Template: **`<Label> (<ride_ratio>× its baseline) — worst drawdown in view <−X%>.`**
A statement about the past, fully computed, zero prediction. (Rationale: absolute cutoffs punish a name for being itself — a metals stock *lives* at high vol. The honest question is whether it is wilder than its *own* normal. This makes §2 a deviation statement, consistent with the model's "diverged from its own history" spine.)

### Line 2 — Foundation interpretation (lookup: class-group × Foundation-zone)

Class-groups: **A** = Quality, Defensive · **B** = Commodity, Cyclical, PSU · **C** = Growth.
Foundation-zone on native 60/72: **Strong** `≥72` · **Mid** `60–72` · **Weak** `<60`.

| | Foundation Strong | Foundation Mid | Foundation Weak |
|---|---|---|---|
| **A** Quality / Defensive | Strong floor in a quality name — the structure that has historically meant a calmer ride and a shallower worst case. The floor supports the steadiness. | Decent floor in a quality name — some structural support for a contained ride, but not the full cushion a top-tier balance sheet gives. | Weak floor in a name whose class usually offers calm — the support isn't there right now; don't assume the quality-sector steadiness applies. |
| **B** Commodity / Cyclical / PSU | Strong floor — but in a cyclical name, read that as *solvent through the cycle*, not calm. The cycle owns the swings; the floor protects survival, not smoothness. | Adequate floor for a cyclical — enough to weather the cycle, but expect the cycle, not the balance sheet, to drive how violently it moves. | Weak floor in a cyclical — the most exposed combination: cyclical swings on thin structural protection. Survival itself is the question in a downturn. |
| **C** Growth | Strong floor for a growth name — unusual and reassuring, but growth rides on expectations; the floor limits structural risk, not the volatility the story brings. | Moderate floor in a growth name — workable structure, but expect expectation-driven swings to dominate the ride regardless. | Weak floor in a growth name — swings driven by the story and sentiment, with little cushion if the story breaks. |

### Display
A `background-secondary` strip, no chart. Line 1 prominent (label + stats), Line 2 muted, one size down. Only visual accent: a small activity/heartbeat icon. No colour-grading of the ride label.

### Edge case
Insufficient price history (recent IPO / `verified:false`): suppress Line 1's drawdown stat, show "Limited history — ride not yet established," keep Line 2 (Foundation interpretation still valid). Never fabricate a drawdown.

### Test grounding
Line 2's claims are the *exact* output of Test N + Test C: Foundation buys a calmer ride and shallower worst case **in Quality/Defensive classes only**; in cyclicals it means solvent-through-cycle, not calm. The class-switch is mandatory, not cosmetic.

---

## §5 · Notable findings

A conditional stack. Each finding is a model Signal given a fire-rule, verdict, display treatment, severity, and funnel. **The presence or absence of cards is itself the triage signal** (loud at the extremes, quiet in the middle). Visuals are assigned only where a chart explains better than a sentence.

### Shared card anatomy
- Full-height left accent bar (single-side border → `border-radius: 0`), colour = severity.
- Row: icon + plain-language title.
- Body: 1–2 sentences (what it is · the evidence with numbers/dates · regime caveat if price-linked).
- Optional **visual block** (only the three charts named below).
- Muted **"doesn't mean"** line (the interpretive boundary).
- Funnel **button (↗)** → the OS tool, pre-filtered.

**Severity → accent colour:** Critical (Watch With Care) `red` · High `amber` · Medium `neutral-strong` · Recovery `teal` (labelled "recovering," never green-as-buy) · Low / context `faint`.

**Three permitted visuals (and only these):**
1. **Spread-over-time chart** — relevant pillar lines over trailing snapshots, gap shaded, current gap + direction annotated. *(Divergence, Convergence.)*
2. **Trajectory sparkline** — the line over snapshots with zone bands behind, crossing point marked, leading pillar highlighted. *(Deterioration, Recovery, Band transition.)*
3. **Composition mini-bars** — 4 pillar bars (F/M/Mkt/Own) with a faint ghost outline behind = the band-typical profile or prior snapshot; deviations stand out. *(Composition.)*
Everything else is text. Pattern cards may carry a tiny inline sparkline of the single metric they concern, only when the pattern is about a trend.

---

### The findings (every card that can appear)

#### A · Critical Red Flags — *severity Critical · marker "Watch With Care" · always rendered top*

Hard failure indicators (building-code violations). Fire **regardless of composite** — a stock at 75 with an active flag still shows the banner and the "Watch With Care" marker. Not patterns, not dampened. Each fired flag is one row; the evidence is one damning number, so **no chart** (a chart would dilute urgency).

The six core flags (locked universal thresholds):

| ID | Name | Trigger | Data |
|---|---|---|---|
| **R1** | Pledging Crisis | Promoter pledging `>50%` of promoter holding, OR pledging rises `>10pp` in one quarter | ⚠️ Conditional — pledging column per PG (§11.5.1). Suppressed where column absent. |
| **R2** | Promoter Exit | Promoter holding drops `>5pp` in one quarter (ex-QIP/rights/fresh-issue) | ✅ Shareholding |
| **R3** | Earnings Quality Breakdown | `≥4` consecutive periods (annual or TTM) where Net Profit `>` OCF, ending most recent | ✅ Cash flow vs profit |
| **R4** | Debt Explosion | D/E exceeds `3×` for the first time in 5 years (non-financials) | ✅ Balance sheet |
| **R5** | Interest Coverage Collapse | Interest coverage `<1.5×` for `≥2` consecutive quarters TTM (non-financials) | ✅ Quarterly P&L |
| **R6** | Distribution Pattern | Same quarter: Promoter ↓ AND FII ↓ AND Retail ↑ (all three) | ✅ Shareholding |

- **Verdict copy:** names the flag + the single breaching stat (e.g., "Earnings quality breakdown — net profit has exceeded operating cash flow for 5 straight periods").
- **Doesn't mean:** "a hard risk/quality warning to investigate — not a prediction the stock will fall."
- **Funnel:** → metric decomposition for the breached input.
- **Sector additions:** peer groups may *add* sector R-flags (e.g., banks "Gross NPA >4%"); render identically. Core six can never be removed or weakened.

#### B · Deterioration from a high base — *severity High*

- **Fire:** composite crosses **down** out of Healthy/Pristine, OR any pillar crosses **down** below its strong mark, sustained `≥2` snapshots. **Special copy** when composite crosses **below 74 (out of Pristine)** — flagged negative in hot/stretched regimes by the tests.
- **Verdict:** "Sliding from a high base — an early risk-regime change, typically before price reacts."
- **Visual:** trajectory sparkline (falling line, zone bands, crossing marked).
- **Doesn't mean:** "review your thesis, not sell — an early risk read, not a price call."
- **Funnel:** → trajectory explorer. **Mask caveat applies.**

#### C · Divergence — *severity High if wide (K2), else Medium*

- **Fire:** any pillar gap `≥` notable (K2). Sub-types (name the dominant gap(s), max 2 in one card):
  - **C1 Price ahead of fundamentals:** `Market − mean(Foundation, Momentum) ≥ wide`.
  - **C2 Ownership against fundamentals:** *exit-under-strength* (`Foundation ≥ mid` and `Foundation − Ownership ≥ notable`) OR *build-under-weakness* (`Foundation < weak` and `Ownership − Foundation ≥ notable` — the regime-robust smart-money tell).
  - **C3 Floor–trajectory split:** `|Foundation − Momentum| ≥ wide`.
- **Verdict (example):** "Price (78) sits far above cooling fundamentals (F70 / M52), while owners step back beneath a holding floor — two gaps at once."
- **Visual:** spread-over-time chart (the section's signature visual).
- **Doesn't mean:** "you read the state, you can't time the resolution — divergences are sticky; the bill is due, never that it's due today."
- **Funnel:** → divergence explorer (→ ownership tool when C2 dominant), pre-filtered to the type. **Mask caveat applies to C1.**
- **Test grounding:** the value config (fundamentals-high / Market-low) and Ownership-build-under-weakness were the regime-robust divergence signals; price-ahead-of-fundamentals is the regime-masked caution. Copy must reflect this asymmetry.

#### D · Recovery from weakness — *severity Recovery (the one lean-in card)*

- **Fire:** composite crosses **up** out of Below-par/Fragile, OR any pillar crosses **up** out of its weak zone — strongest case **Momentum rising toward a stronger Foundation** (laggard catching up).
- **Verdict:** "Turning up out of weakness — <which pillar> leads the recovery."
- **Visual:** trajectory sparkline (rising line out of low band, crossing marked, leading pillar highlighted).
- **Doesn't mean:** "a coincident health inflection worth investigating — not a buy, not a guaranteed continuation; strongest read against a calm pond."
- **Funnel:** → recovery screen. **Mask caveat applies — and matters most here** (recovery in a hot pond is the most masked).
- **Test grounding:** recovery-from-weakness is the program's most durable, repeatedly-confirmed signal (Tests J, disclosure). This is the only card the product leans *into*.

#### E · Patterns — *severity per pattern · Green +5 / Amber −3 / Red −8*

Conditional cross-metric/cross-pillar relationships from the **closed 13-pattern catalog**. One compact card per firing pattern; if `>3` fire, group under "Patterns (N)" expandable. Use the spec's **locked display copy** verbatim where defined (P11/P12/P13). A pattern card carries a tiny inline metric sparkline only when it concerns a trend.

| ID | Name | Pillar(s) | Severity | Data state |
|---|---|---|---|---|
| **P1** | Clean Institutional Rotation | Ownership | Green +5 | ✅ Shareholding |
| **P2** | Distribution to Retail | Ownership | Red −8 | ✅ Shareholding |
| **P3** | Promoter Stress Signal | Ownership | Red −8 | ✅ Shareholding · pledging leg ⚠️ conditional |
| **P4** | Dual Institutional Exit | Ownership | Red −8 | ✅ Shareholding |
| **P5** | Insider-Confirmed Distress | Ownership | Red −8 | 🔶 **Pending data integration** (confirm) |
| **P6** | Insider Conviction | Ownership | Green +5 | 🔶 **Pending data integration** (confirm) |
| **P7** | Accruals Divergence | Foundation × Momentum | Red −8 | ✅ Cash flow vs profit |
| **P8** | Capital Tied in Receivables | Foundation | Amber −3 | ✅ Balance sheet |
| **P9** | Capex Cycle (Positive) | Foundation | Green +5 | 🔶 **Capex availability — confirm** (likely gap) |
| **P10** | Promoter Defense Buying | Ownership × Market | Green +5 | 🔶 **Pending data integration** (confirm) |
| **P11** | Quarterly Margin Compression | Momentum | Red −8 | ✅ Quarterly OPM |
| **P12** | Quarterly Margin Recovery | Momentum | Green +5 | ✅ Quarterly OPM |
| **P13** | TTM Revenue Inflection | Momentum | Red/Green ±5 | ✅ TTM revenue |

**Locked display copy (use verbatim):**
- P11: "Operating margin has been compressing for [N] quarters: [OPM₁] → [OPM₂] → … → [OPM latest]."
- P12: "Operating margin recovering from trough: [OPM trough] → [OPM next] → [OPM latest]."
- P13: "Revenue growth [accelerated / decelerated] from [prior TTM growth]% to [latest TTM growth]%."

**Three pattern display states (mandatory):**
1. **Active** — fired this snapshot; render normally with evidence.
2. **Pending data integration** — P5, P6, P10 until their feeds confirmed live: render a muted "Active — pending data integration" chip in the patterns area so the *capability* is visible but no false coverage is implied. Never show as "no signal."
3. **Dampened (sector-wide)** — when a pattern fires on `>80%` of the peer group simultaneously, magnitude is halved and the card is annotated "sector-wide condition — dampened." (Model-native; same spirit as the mask modifier.)

- **Doesn't mean:** "a condition to look at — not a trade signal."
- **Funnel:** → flags board, filtered to the pattern.

#### F · Composition — *severity Low / contextual*

- **Fire:** **F1 Atypical** — the 4-pillar profile deviates from the *typical profile for its composite band* beyond a set deviation. **F2 Shift** — the mix changed materially vs last snapshot though the composite held.
- **Verdict:** "A <score> that isn't a typical <score> — <strong floor / hot price> masking <weak trajectory / exiting owners>."
- **Visual:** composition mini-bars with ghost outline (band-typical for F1, prior snapshot for F2).
- **Doesn't mean:** "a place to investigate, not a re-rate signal."
- **Funnel:** → composition tool.

#### G · Convergence — *severity Low*

- **Fire:** a previously-notable gap narrows `≥` a set amount. Typed: *healthy resolution* (laggard rose) vs *deterioration convergence* (leader fell).
- **Verdict:** states which pillar moved and therefore which story it is.
- **Visual:** spread chart, narrowing, direction annotated.
- **Doesn't mean:** "the move isn't over, and which way it resolved depends on *which* pillar moved — not buy/sell."
- **Funnel:** → divergence explorer (converging filter).

#### H · Ownership events — *severity Low / event*

- **Fire:** significant block/bulk deal, or material pledge change, this snapshot. *(Block-deal feed: confirm live — see data box.)*
- **Verdict:** the event + magnitude.
- **Visual:** small marker on a thin ownership timeline, or none.
- **Doesn't mean:** "risk/flow context, not a verdict."
- **Funnel:** → ownership read.

#### I · Band transition — *severity Low*

- **Fire:** composite crosses into Healthy (up) or Below-par (down) — the average-band edges. **Suppress if already represented by B or D** (no double-cards).
- **Verdict:** "Crossed into <band>."
- **Visual:** marker on trajectory.
- **Funnel:** → transitions board.

---

### Ordering (strict, when multiple fire)

1. Red flags (A)
2. Deterioration (B)
3. Divergence — wide (C)
4. Recovery (D)
5. Divergence — notable (C)
6. Patterns (E)
7. Composition (F)
8. Convergence (G)
9. Ownership events (H)
10. Band transition (I)

Encodes the product spine: **risk before opportunity, signal before context.**

### Density states (this *is* the triage signal — build exactly)

- **Loud** — any of A–E fire → render all, ordered; show a count ("4 findings"). Page length itself signals "look hard."
- **Quiet-but-context** — only F–I fire → softer header "Quiet — only context, nothing pressing," then the low cards.
- **Empty** — nothing fires → the calm panel: *"Nothing notable. Steady, average-zone — sound but unremarkable. No divergence, no transition, no flag. You can move on."*

### Mask modifier (cross-cutting)

If the stock's PG pond is **hot/stressed** (PG-movement flag), append to every **price-linked** card (B, C1, D): *"The pond is hot — price-linked reads may be deferred; look for the catalyst."* Non-price cards (fundamental red flags, ownership, composition, convergence) are **unaffected** — their truth doesn't depend on the tape.

---

## Data-readiness confirmations (dev — three items)

These are real-world facts only the dev/pipeline knows. All three are already handled as UI display states above, so they **do not block build** — confirming them only flips a card from a "pending/unavailable" state to "active."

1. **Insider (NSE PIT) feed live + scoring?** Governs **P5, P6**. Master Spec says "pending data integration"; project infra suggests the pipeline is built. If live → activate; if not → the pending-state chip stands.
2. **Block-deal feed live + scoring?** Governs **P10** and card **H**. Same conflict to resolve.
3. **Capex ingested?** Governs **P9**. Our note: "capex not in Screener; FCF = OCF for now." If capex is unavailable, P9 cannot fire and renders unavailable — not silently absent.

Plus one standing per-PG condition (no confirmation needed, handled in code): **R1 / P3 pledging** is active where the pledging column exists and suppressed where it doesn't (§11.5.1).

---

## What's next
With §2 and §5 locked, the only remaining step is the **multi-state visual mockup** — rendering §5 in its loud / quiet / empty states side by side so the density-as-triage-signal can be verified on screen, plus §2's two-line strip. The mockup is a faithful render of this spec, not a new design pass.
