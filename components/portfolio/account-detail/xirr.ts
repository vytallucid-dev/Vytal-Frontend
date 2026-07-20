// ─────────────────────────────────────────────────────────────────────────────
// PER-ACCOUNT XIRR — client-side money-weighted return, over ONE account's ledger.
//
// The whole-book XIRR is a server read (GET /me/portfolio/xirr, userId-scoped only — no
// account filter exists). The account page needs the SAME number for one book, and every
// input is already on the wire: the scoped ledger (GET /me/transactions?accountId) carries
// the cashflows, and Σ marketValue over the account's priced holdings is the terminal value.
//
// So we run the SAME pure solver here, client-side. This is a verbatim port of the backend
// solver (Vytal-Backend/src/portfolio/xirr.ts) — Newton–Raphson with a bisection fallback,
// annual by construction (the 365-day exponent), honest-null on every non-solvable state.
// It is pure (Date.parse over fixed "YYYY-MM-DD" strings; no wall-clock, no fetch), so it is
// SSR-safe and deterministic. The sign convention matches the backend controller exactly:
// buys −(qty·price+fees), sells qty·price−fees, dividends price−fees, terminal value +today.
// ─────────────────────────────────────────────────────────────────────────────
import type { Transaction } from "@/types/portfolio";
import type { XirrState } from "@/types/portfolio";

/** One dated cashflow. `date` is "YYYY-MM-DD"; `amount` is signed ₹ (buy −, sell/div +). */
export interface XirrCashflow {
  date: string;
  amount: number;
}

export interface XirrResult {
  xirrPct: number | null; // annualized money-weighted return %, null on any non-"ok" state
  state: XirrState;
  method: "newton" | "bisection" | null;
  flowCount: number; // dated cashflows considered (incl. the terminal value flow)
  firstDate: string | null;
  lastDate: string | null;
  days: number; // span first → last cashflow
}

const DAY_MS = 86_400_000;
/** Whole calendar days a → b (b later ⇒ positive). Dates are UTC-parsed "YYYY-MM-DD". */
function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / DAY_MS);
}

// A window shorter than this can't be annualized honestly — a +3% month becomes a
// meaningless triple-digit "annual" rate. Mirrors the TWR annualization floor (~30d).
const MIN_SPAN_DAYS = 30;

/** NPV of the flows at annual rate `r`, discounting each by (days/365). NaN when 1+r ≤ 0. */
function xnpv(r: number, flows: XirrCashflow[], t0: string): number {
  const base = 1 + r;
  if (base <= 0) return NaN;
  let sum = 0;
  for (const cf of flows) {
    const yrs = dayDiff(t0, cf.date) / 365;
    sum += cf.amount / Math.pow(base, yrs);
  }
  return sum;
}

/** d(NPV)/dr — the analytic derivative, for Newton's step. */
function dxnpv(r: number, flows: XirrCashflow[], t0: string): number {
  const base = 1 + r;
  if (base <= 0) return NaN;
  let sum = 0;
  for (const cf of flows) {
    const yrs = dayDiff(t0, cf.date) / 365;
    sum += (-yrs * cf.amount) / Math.pow(base, yrs + 1);
  }
  return sum;
}

/** Newton–Raphson from a 10% seed. Returns the converged rate, or null to fall back. */
function solveNewton(flows: XirrCashflow[], t0: string): number | null {
  let r = 0.1;
  for (let i = 0; i < 100; i++) {
    const f = xnpv(r, flows, t0);
    const df = dxnpv(r, flows, t0);
    if (!Number.isFinite(f) || !Number.isFinite(df) || Math.abs(df) < 1e-10) return null;
    const next = r - f / df;
    if (!Number.isFinite(next) || next <= -0.9999) return null; // escaped the domain → bisection
    if (Math.abs(next - r) < 1e-8) return next;
    r = next;
  }
  return null; // didn't settle in the iteration budget
}

/** Bracketing bisection — robust where Newton stalls. */
function solveBisection(flows: XirrCashflow[], t0: string): number | null {
  let lo = -0.9999;
  let hi = 1.0;
  let flo = xnpv(lo, flows, t0);
  let fhi = xnpv(hi, flows, t0);
  let expand = 0;
  while (Number.isFinite(flo) && Number.isFinite(fhi) && flo * fhi > 0 && hi < 1e7 && expand++ < 200) {
    hi *= 2;
    fhi = xnpv(hi, flows, t0);
  }
  if (!Number.isFinite(flo) || !Number.isFinite(fhi) || flo * fhi > 0) return null; // no bracket

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fm = xnpv(mid, flows, t0);
    if (!Number.isFinite(fm)) return null;
    if (Math.abs(fm) < 1e-7 || (hi - lo) / 2 < 1e-9) return mid;
    if (flo * fm < 0) {
      hi = mid;
      fhi = fm;
    } else {
      lo = mid;
      flo = fm;
    }
  }
  return (lo + hi) / 2;
}

/**
 * Solve XIRR over the given cashflows. Pure + deterministic. The caller supplies the sign
 * convention (buys −, sells/dividends +, current value + at the terminal date).
 */
export function computeXirr(cashflows: XirrCashflow[]): XirrResult {
  const flowCount = cashflows.length;
  const base = (state: XirrState): XirrResult => ({
    xirrPct: null,
    state,
    method: null,
    flowCount,
    firstDate: null,
    lastDate: null,
    days: 0,
  });

  if (flowCount === 0) return base("empty");
  if (flowCount < 2) return base("single_cashflow");

  const sorted = [...cashflows].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const t0 = sorted[0].date;
  const tN = sorted[sorted.length - 1].date;
  const days = dayDiff(t0, tN);

  if (days < MIN_SPAN_DAYS) return { ...base("insufficient_history"), firstDate: t0, lastDate: tN, days };

  const hasPos = sorted.some((c) => c.amount > 0);
  const hasNeg = sorted.some((c) => c.amount < 0);
  if (!hasPos || !hasNeg) return { ...base("no_sign_change"), firstDate: t0, lastDate: tN, days };

  const newton = solveNewton(sorted, t0);
  const rate = newton != null ? newton : solveBisection(sorted, t0);
  if (rate == null || !Number.isFinite(rate) || rate <= -1) {
    return { ...base("non_convergent"), firstDate: t0, lastDate: tN, days };
  }

  return {
    xirrPct: rate * 100,
    state: "ok",
    method: newton != null ? "newton" : "bisection",
    flowCount,
    firstDate: t0,
    lastDate: tN,
    days,
  };
}

/**
 * Build the dated cashflow list for ONE account from its scoped ledger + terminal value — the
 * exact construction the backend XIRR controller uses (buy −(qty·price+fees), sell qty·price−fees,
 * dividend price−fees), plus the account's current value as a final positive flow at `terminalDate`.
 * Non-cash transaction types (splits, bonuses — no price movement of money) carry no flow and are
 * skipped, exactly as the backend does.
 */
export function cashflowsFromLedger(
  txns: Transaction[],
  terminalValue: number | null,
  terminalDate: string | null,
): XirrCashflow[] {
  const flows: XirrCashflow[] = [];
  for (const t of txns) {
    const date = t.tradeDate;
    const qty = t.quantity ?? 0;
    const price = t.price ?? 0;
    const fees = t.fees ?? 0;
    if (t.type === "buy") {
      flows.push({ date, amount: -(qty * price + fees) }); // capital out
    } else if (t.type === "sell") {
      flows.push({ date, amount: qty * price - fees }); // capital in
    } else if (t.type === "dividend") {
      const amt = price - fees;
      if (amt !== 0) flows.push({ date, amount: amt }); // cash in
    }
  }
  if (terminalValue != null && terminalValue > 0 && terminalDate) {
    flows.push({ date: terminalDate, amount: terminalValue });
  }
  return flows;
}
