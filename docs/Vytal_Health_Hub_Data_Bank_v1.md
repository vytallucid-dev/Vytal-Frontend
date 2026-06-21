# Vytal — Health Hub · Data Bank

**Version:** 1.0 — data & logic specification for the Health hub (all three tabs)
**Covers:** Briefing · Flags & Patterns · Screen — as locked in `vytal_health_hub_full.html`
**Companion artifacts:** the **Findings Map** (concept bank — the four faces of every health concept), the **Sections 2 & 5 Rules Spec** (the fire-rules + the wired R1–R6 / P1–P13 catalog), and the **hub mockup** (the look and section rhythm). This document is the data brief that sits between them and the build.

---

## 0 · The one realization that shapes this whole document

**The hub stores almost nothing new. It is a read-and-aggregate layer over data that already exists.** Every surface across all three tabs is built from three inputs:

1. the **per-stock health snapshots** (the atomic store — the same records the single-stock page reads, the same the model writes);
2. the user's **scope membership** (which stocks are in their portfolio / watchlist — data that exists already); and
3. the user's **last-viewed timestamp** (one new, trivial field).

That's it. The hub computes distributions, averages, deltas, rankings, and filters *over* the atomic store at read time. It does **not** introduce a parallel health calculation, and it must never recompute a score — it reads the score the model produced and aggregates it. This keeps the hub honest (every number traces to the atomic store and its versioned bars, CN-6) and cheap (aggregates are computed/cached, never authored). Hold this while building: **if a hub surface seems to need a "new" number, it's almost always an aggregation or a delta of an existing one.**

---

## 1 · The spine — the Scope Engine

Every surface on every tab obeys one persistent control: **scope.** This is the architectural backbone of the hub — "your portfolio's health" and "the market screener" are *the same instrument re-scoped*, not separate pages.

**Scopes:**
| Scope | Membership source |
|---|---|
| My Portfolio | user's holdings (existing) |
| Watchlist | user's watchlist(s) (existing) |
| Scored Universe | all scored stocks (~83–95 of the Nifty 200 coverage) |
| Peer Group | one PG's members |
| Custom *(future)* | a user-saved set |

**The contract:** every aggregate, count, distribution, delta, table, and board on every tab is computed over **the current scope's membership only.** Switching scope re-runs all of them. No surface is hard-wired to a fixed universe.

**Membership × scoring states (must be handled):** a stock in a user's scope may be *scored*, *covered-but-not-scored*, or *off-platform*. Aggregates count and display only **scored** members; non-scored holdings are surfaced separately ("3 of your holdings aren't scored yet") so the picture is honest and the user isn't misled into thinking their whole book is covered.

---

## 2 · The pulse — the Delta Engine ("since you last looked")

This is what makes the Briefing *alive* without AI and without pretending the market moved overnight. The framing is **"since you last looked,"** not "today" — honest about fundamental cadence (quarters) while still feeling dynamic.

**Inputs:** the user's `last_viewed_at` for this scope, the current snapshot, and the snapshot(s) in force at `last_viewed_at`.

**Computes (the DeltaSet):**
- per-stock **composite delta** (now − then) and the magnitude ranking (→ Movers);
- **band crossings** since last look (who moved band, direction);
- **newly-fired signals** — flags/patterns/divergences/recoveries whose first-fire date is *after* `last_viewed_at` (→ the Briefing attention list);
- **distribution drift** — how the scope's band-distribution shifted (→ the hero deltas + drift sentence);
- the human label ("12 days ago," "this quarter").

**The crucial distinction this engine creates — Briefing vs Flags draw from the same pool, filtered differently:**
- **Briefing attention = the *delta*** — only what is *newly* fired/crossed/turned since last look, curated and capped by severity. A time-filtered subset.
- **Flags = the *standing set*** — *everything* currently firing across scope, exhaustive, grouped, regardless of when it fired.

Same fired-signal pool; Briefing applies "new since last look + cap," Flags shows the complete standing list. Build them off one query with two filters, not two pipelines.

**Refresh tiers (why parts feel live):** fundamentals/pillars/patterns refresh at **quarterly** snapshot cadence; price-linked elements — Market pillar, ride-ratio, price-driven divergence, pond-mask — refresh **daily**. So the hub breathes daily on its price-linked parts and steps quarterly on its fundamental parts; the delta framing absorbs both honestly.

---

## 3 · The shared primitives (defined once; every surface draws from these)

Rather than redefine data per card, here are the objects the whole hub consumes. Each surface below references these.

### 3.1 · StockHealthSnapshot — the atom (per stock, per snapshot)
The record the hub reads (same one the stock page reads):
- identity: `ticker, name, sector, sector_class` (Quality/Defensive/Commodity/Cyclical/Growth/PSU), `peer_group`, `snapshot_date, is_live`
- **composite** (0–100) + **band** (Fragile/Below par/Steady/Healthy/Pristine)
- **pillars**: for each of Foundation/Momentum/Market/Ownership — `score`, `native_zone` (weak/mid/strong against that pillar's own marks)
- **trajectory_marker**: improving / stable / deteriorating
- **divergence**: `flag` (aligned/widening/wide), `gaps` {price_vs_fund, ownership_vs_found, found_vs_mom}, `dominant_type` (price-ahead / fund-ahead / ownership-against / floor-trajectory-split), `spread_value`
- **recovery_state**: `is_recovering`, `leading_pillar`, crossing detail
- **deterioration_state**: `is_deteriorating`, `from_band`, crossing detail
- **fired_red_flags**: list of {id R1–R6, name, breaching_stat}
- **fired_patterns**: list of {id P1–P13, name, concern, polarity (green +5 / amber −3 / red −8), magnitude, evidence_copy, state (active / pending-data / dampened)}
- **composition**: `mix_type`, `deviation_from_band_typical`
- **ride**: `ratio` (recent vol ÷ baseline vol), `label` (calmer/normal/wilder/sharply-wilder), `worst_drawdown_in_view`
- **band_transition**: `crossed_this_snapshot`, from, to
- **mask** (inherited from PGState): is the pond hot

### 3.2 · ScopeAggregate — computed over the scope's scored members
- `count` (+ `unscored_count`)
- **band_distribution** [n_fragile … n_pristine] and **band_distribution_prev** (for drift)
- **avg_pillars** {F, M, Mkt, Own} and the **weakest pillar**
- `avg_composite`, `avg_band`
- **counts**: red_flags, recovering, diverging (wide), deteriorating, worth_a_look (= red-flags + deteriorating + wide-divergence + recovering, the "needs eyes" union)
- **book_trajectory** (aggregate: improving / softening / mixed — derived from members' trajectory markers)
- **pg_exposure**: [{pg, weight_pct, mask_heat}]

### 3.3 · PGState — per peer group
- `pg`, `health_band`, `trajectory`, `dispersion`, **mask_heat** (hot / warm / calm), `trailing_move` (the pure-price arithmetic behind the mask)

### 3.4 · ThresholdProximity — computed per stock (the forward-looking primitive)
For the threshold watch: each stock's **nearest approaching edge** — `kind` (band boundary / pillar native mark / divergence-notable threshold), `label`, `distance`, `direction`. This is *not* a fired signal; it's a "how close to becoming one" calculation. Genuinely net-new computation, but trivial (distance to known thresholds).

---

## 4 · Tab 1 — Briefing (the morning round)

*Identity: a living, scope-aware glance that tells the user where to point attention. Curated, narrative, delta-driven. Distinct from Flags (exhaustive) and Screen (interactive).*

| # | Surface | Consumes | Constant / Dynamic | Governing bank |
|---|---|---|---|---|
| 1 | **Hero — shape of your ward** | ScopeAggregate.band_distribution (+prev for drift deltas), avg_band, the characterization + drift sentences (assembled from drift) | Constant structure; content per scope | Findings Map #1 (band) |
| 2 | **KPI rail** | ScopeAggregate.{avg_composite+band, worth_a_look, red_flags, recovering, diverging, book_trajectory} | Constant | derived counts |
| 3 | **Your book's dimensions** | ScopeAggregate.avg_pillars + weakest_pillar | Constant | Findings Map #3–6 |
| 4 | **Biggest health movers** | DeltaSet composite deltas, ranked firming/slipping; per-stock sparkline series + resulting band | Dynamic (the delta) | #12 trajectory |
| 5 | **Where you're exposed** | ScopeAggregate.pg_exposure + PGState.mask_heat | Constant | #16 mask, #17 PG |
| 6 | **Attention list** | DeltaSet.newly_fired_signals, severity-ordered + capped; each → its stock's snapshot detail | Dynamic | Rules Spec §5 ordering + the R/P catalog |
| 7 | **Recovery spotlight** | the top recovery_state member + its trajectory series | Dynamic (renders when ≥1 recovering; else the slot holds another featured signal or collapses) | #8 recovery (the hero signal) |
| 8 | **Flags & patterns mini** | counts of fired_red_flags + fired_patterns across scope, grouped | Dynamic | #13 flags |
| 9 | **Threshold watch** | ThresholdProximity per stock, nearest-edge, ranked by closeness | Constant structure; content dynamic | #9 transitions, #10 divergence |
| — | **Pond weather** (folded into #5) | PGState.mask_heat per exposed PG | Constant | #16 mask |

**Attention list — the ordering and the cap.** Severity spine, identical to the stock page: red flags → deterioration-from-high → wide divergence → recovery (featured) → band transitions → notable patterns. Capped (a briefing, not a list) — overflow rolls into a "+N more" that links to Flags. Each card carries the **mask caveat** on its price-linked items.

**Recovery is featured, by rule.** It is the strongest, most durable signal in the program (Tests J + disclosure); it gets a dedicated spotlight surface, not just a row. If nothing is recovering in scope, the spotlight either features the next-most-significant constructive signal or collapses — it never shows an empty frame.

**Movers vs attention — different data, don't conflate.** Movers = *magnitude of composite change* (a ranking). Attention = *newly-fired qualitative signals* (an event set). A stock can move a lot without firing a signal, and vice-versa. Both are delta-driven; they answer different questions ("what moved most" vs "what changed in kind").

---

## 5 · Tab 2 — Flags & Patterns (the warnings console)

*Identity: the exhaustive, standing warnings board — triage a pile fast. Organized by severity and by concern, not a flat list.*

| Surface | Consumes | Constant / Dynamic |
|---|---|---|
| **Filters** (All / Red flags / Ownership / Fundamentals / Momentum / Recovery only) | client-side facets over the fired set | Constant |
| **Red-flag cards** | all fired_red_flags across scope (R1–R6 + any sector-added flags), each with breaching_stat | Dynamic; always rendered top |
| **Pattern tiers (by concern)** | all fired_patterns across scope, grouped by concern | Dynamic |
| **Dormant patterns** | the pending-data / unavailable patterns | Constant (a standing capability display) |
| **Side — by severity** | counts: critical/red, amber, constructive | Dynamic |
| **Side — by concern** | counts: momentum / ownership / fundamentals | Dynamic |
| **Side — sector-wide check** | dampening status (any pattern firing >80% of a PG) | Dynamic |

**The concern grouping (hub-specific — formalize it):** patterns tier into three concerns, plus the red-flag tier:
- **Red flags (critical tier):** R1 Pledging Crisis · R2 Promoter Exit · R3 Earnings Quality Breakdown · R4 Debt Explosion · R5 Interest Coverage Collapse · R6 Distribution Pattern.
- **Ownership patterns:** P1 Clean Institutional Rotation · P2 Distribution to Retail · P3 Promoter Stress · P4 Dual Institutional Exit · P5 Insider-Confirmed Distress · P6 Insider Conviction · P10 Promoter Defense Buying.
- **Fundamentals patterns:** P7 Accruals Divergence · P8 Capital Tied in Receivables · P9 Capex Cycle.
- **Momentum patterns:** P11 Quarterly Margin Compression · P12 Quarterly Margin Recovery · P13 TTM Revenue Inflection.

**Three pattern display states (mandatory, from the Rules Spec):**
1. **Active** — fired this snapshot; render with evidence + names.
2. **Pending data integration** — P5, P6, P10 (insider / block-deal feeds) and P9 (capex) render as **dormant dashed cards** — the capability is visible, no false coverage implied. Flip to active when the dev confirms the feed.
3. **Dampened (sector-wide)** — a pattern firing across >80% of a peer group is annotated "sector-wide" and its magnitude halved.

**Standing, not delta.** Unlike the Briefing, Flags shows *everything currently firing*, regardless of when it fired. It is the complete picture the Briefing curates from.

---

## 6 · Tab 3 — Screen (the workbench)

*Identity: the interactive, transforming table — discovery by health axis. The table re-shapes by mode; it is not a static spreadsheet.*

| Surface | Consumes | Constant / Dynamic |
|---|---|---|
| **Visual census** | ScopeAggregate.band_distribution; click a band → filter | Constant |
| **Mode switcher** | client state (Overview / Divergence / Recovery / Risk-ride / Composition) | Constant |
| **The transforming table** | one row per scored member = its StockHealthSnapshot; **columns, sort, and inline visual change per mode** | Constant rows; dynamic shape |

**The five modes and the columns each summons** (same rows, different instrument):
| Mode | Columns | Sort | Inline visual | Bank |
|---|---|---|---|---|
| **Overview** | Stock · Health (band+score) · Trend · Pillars · Flags | composite desc | pillar-mini bars; flag chips | #1, #3–6, #13 |
| **Divergence** | Stock · Type · Gap · Market · Fund(F·M) | gap desc | gap bar; type chip (price-ahead/fund-ahead) | #10 |
| **Recovery** | Stock · Status · Leading pillar · Trend · Health | recovering first | up-sparkline | #8 |
| **Risk / ride** | Stock · Ride(contained→wild) · Foundation · Worst DD · Class | ride desc | contained→wild marker | #3 Foundation, ride |
| **Composition** | Stock · Mix · Pillars · Health | composite desc | pillar-mini bars | #2 composition |

**Risk/ride and Recovery are first-class modes, by rule** — the two most-proven signals (the floor and recovery) must not be buried; they are dedicated modes, not afterthoughts.

**Census ↔ table coupling:** the census isn't decorative — clicking a band filters the table to that band. The census is the population view; the table is the drill-down. They are one surface.

**Cut-modes are filters/columns over the same row set, never new pages.** This is the de-junk-drawer principle at the data layer: divergence/recovery/ride/composition are *views of the snapshot*, summoned in place. The deep, dedicated tools (Trajectory, Divergence/Convergence, Ownership) are where a row *funnels to*, specced separately.

---

## 7 · Cross-cutting rules (apply across all three tabs)

- **Severity ordering** (everywhere a set of signals is ranked): red flags → deterioration-from-high → wide divergence → recovery → notable divergence → patterns → composition → convergence → ownership events → band transition. Risk before opportunity, signal before context.
- **The mask modifier:** when a stock's PG pond is hot/stressed, every **price-linked** surface element (deterioration, price-ahead divergence, recovery, ride) appends "the pond is hot — price-linked reads may be deferred; look for the catalyst." Non-price elements (fundamental red flags, ownership, composition, convergence) are unaffected. The mask is a PGState property inherited by every member.
- **States over numbers:** bands, trajectory markers, and divergence/recovery states are the headline everywhere; raw numbers are present (mono) but never the hero. The condition scale is colored but **never green=good→buy** (Pristine is cool blue, not "best green").
- **Empty / quiet states:** every aggregate must render an honest empty state — a scope with no red flags shows "no red flags," not a blank; the Briefing attention list can be near-empty and that *is* the result. Density carries meaning; never pad it.
- **Pending-data honesty:** insider (P5/P6), block-deal (P10/ownership events), and capex (P9) elements render as dormant where the feed is unconfirmed — across Briefing mini, Flags console, and any ownership column — never as "no signal."

---

## 8 · Data dependencies — the supply checklist

What the data layer must provide for the hub to render honestly. Almost all of it is *aggregation/delta over the atomic store*; the genuinely new items are flagged ★.

| Need | Source |
|---|---|
| Per-stock health snapshots (§3.1, all fields) | the atomic health store (model output) — already exists |
| Scope membership (portfolio, watchlist) | user data — already exists |
| ★ `last_viewed_at` per user per scope | **new — one timestamp**, drives the entire delta engine |
| Snapshot history (for movers sparklines, trajectory deltas, drift) | the atomic store's snapshot series — exists |
| ScopeAggregate (§3.2) | computed/cached over scope membership at read |
| PGState incl. mask_heat (§3.3) | computed (PG health + pure-price trailing move) |
| ThresholdProximity (§3.4) | ★ computed — trivial distance-to-threshold over snapshots |
| Fired R1–R6 / P1–P13 with state (active/pending/dampened) | the model's flag/pattern output (Rules Spec) — exists; pending states gated on feed confirmation |

**Three feed confirmations the dev still owns** (already handled as dormant display states, so they don't block build): insider/NSE-PIT live (P5/P6 + ownership events), block-deal live (P10), capex ingested (P9). The pledging column (R1/P3) is active per-PG where the column exists.

---

## 9 · What the hub is NOT (boundaries)

- **Not a portfolio P&L / returns dashboard.** The hub shows *health*, not gains, allocation value, or market tickers — that is the portfolio tracker's job. The Briefing's "shape of your ward" is a health distribution, never a returns chart.
- **No buy/sell, no price targets, no predictions, no valuation/DCF, no technicals** — same boundaries as the stock page. Movers rank *health* change, never price change as a signal. Divergence/recovery are states to investigate, never timing calls.
- **No ranking of stocks as "better buys."** Screen sorts by health attributes for *triage and discovery*; it never implies the top of a sort will outperform.
- **No new health math.** The hub aggregates and filters the model's output; it never recomputes a score.

---

## 10 · Status & next

Health hub is **structurally and data-complete at the spec level** across all three tabs. Build proceeds against: this data bank (data + logic), the **hub mockup** (look + section rhythm), the **Findings Map** (concepts), and the **Rules Spec** (fire-rules + R/P catalog).

Next: the **standalone tools data bank** — Trajectory, Divergence & Convergence, Ownership — the three deep instruments every hub surface funnels into. They share the trajectory / spread / flow primitives, so they get one combined bank, written the same way.
