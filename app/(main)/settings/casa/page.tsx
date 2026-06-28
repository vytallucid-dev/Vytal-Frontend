"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Scale,
  Database,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Backend contract (already built) ────────────────────────────────────────
// GET  /api/v1/admin/bank-supplementary/casa/status   → the 12-bank checklist
// POST /api/v1/admin/bank-supplementary/casa          → submit one quarterly CASA
const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;
const ENTERED_BY = "admin:casa-card";

// The 12 scored banks (PG5 private + PG6 PSU) with display names.
const BANKS: { symbol: string; name: string }[] = [
  { symbol: "HDFCBANK", name: "HDFC Bank" },
  { symbol: "ICICIBANK", name: "ICICI Bank" },
  { symbol: "AXISBANK", name: "Axis Bank" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank" },
  { symbol: "INDUSINDBK", name: "IndusInd Bank" },
  { symbol: "FEDERALBNK", name: "Federal Bank" },
  { symbol: "SBIN", name: "State Bank of India" },
  { symbol: "BANKBARODA", name: "Bank of Baroda" },
  { symbol: "PNB", name: "Punjab National Bank" },
  { symbol: "CANBK", name: "Canara Bank" },
  { symbol: "UNIONBANK", name: "Union Bank of India" },
  { symbol: "INDIANB", name: "Indian Bank" },
];
const BANK_NAME: Record<string, string> = Object.fromEntries(BANKS.map((b) => [b.symbol, b.name]));

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;
const FISCAL_YEARS = ["FY24", "FY25", "FY26", "FY27", "FY28", "FY29", "FY30"] as const;
const CONFIDENCES = ["A", "B", "C"] as const;

// ── Status response types ───────────────────────────────────────────────────
type CasaSource = "quarter" | "legacy_live" | "none";
interface StatusRow {
  symbol: string;
  currentExpectedQuarter: string; // "FY27/Q1"
  hasCurrentQuarter: boolean;
  latestQuarterOnFile: string | null; // "FY26/Q4" | null
  latestValue: number | null;
  source: CasaSource;
  lastUpdatedAt: string | null; // ISO
}
interface CasaSummary {
  total: number;
  onCurrentQuarter: number;
  onLegacyLive: number;
  onNeutral: number;
}
interface StatusResponse {
  success: boolean;
  data?: {
    currentExpectedQuarter: string;
    summary: CasaSummary;
    banks: StatusRow[];
  };
  error?: string;
}

// ── POST response types ─────────────────────────────────────────────────────
interface InjectResponse {
  success: boolean;
  data?: {
    action?: "inserted" | "superseded" | "unchanged";
    symbol?: string;
    fiscalYear?: string;
    quarter?: string;
    value?: number;
    version?: number;
    note?: string;
    warnings?: string[];
    errors?: string[]; // present on reject
  };
  error?: string;
}

// ── helpers ─────────────────────────────────────────────────────────────────
const formatDateTime = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** "FY27/Q1" → 27*4 + 0 = 108. Higher = more recent. */
const periodOrdinal = (fy: string, q: string) =>
  Number(fy.replace(/\D/g, "")) * 4 + (Number(q.replace(/\D/g, "")) - 1);

type StaleMeta = { label: string; cls: string; detail?: string };
function staleMeta(row: StatusRow): StaleMeta {
  if (row.hasCurrentQuarter) {
    return { label: "Current", cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" };
  }
  if (row.source === "quarter") {
    return {
      label: "Stale",
      cls: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      detail: `${row.currentExpectedQuarter} not entered`,
    };
  }
  if (row.source === "legacy_live") {
    return {
      label: "On legacy value",
      cls: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      detail: `${row.currentExpectedQuarter} not entered`,
    };
  }
  return {
    label: "No data",
    cls: "bg-destructive/10 border-destructive/20 text-destructive",
    detail: "on neutral-60 fallback",
  };
}

type Notice = { kind: "success" | "error"; title: string; body: string } | null;

export default function CasaAdminPage() {
  // ── status table state ──
  const [rows, setRows] = useState<StatusRow[]>([]);
  const [expectedQuarter, setExpectedQuarter] = useState<string | null>(null);
  const [summary, setSummary] = useState<CasaSummary | null>(null);
  const [tableStatus, setTableStatus] = useState<"idle" | "loading" | "error">("loading");
  const [tableError, setTableError] = useState<string | null>(null);

  // ── form state ──
  const [quarter, setQuarter] = useState<string>("Q1");
  const [fiscalYear, setFiscalYear] = useState<string>("FY27");
  const [symbol, setSymbol] = useState<string>(BANKS[0].symbol);
  const [value, setValue] = useState<string>("");
  const [sourceCitation, setSourceCitation] = useState<string>("");
  const [confidence, setConfidence] = useState<string>("A");
  const [periodEnd, setPeriodEnd] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const loadStatus = useCallback(async () => {
    setTableStatus("loading");
    setTableError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/bank-supplementary/casa/status`);
      const json: StatusResponse = await res.json();
      if (!json.success || !json.data) {
        setTableError(json.error ?? "Failed to load CASA status.");
        setTableStatus("error");
        return;
      }
      // keep the 12 banks in our canonical order
      const bySymbol = new Map(json.data.banks.map((b) => [b.symbol, b]));
      const ordered = BANKS.map((b) => bySymbol.get(b.symbol)).filter(Boolean) as StatusRow[];
      setRows(ordered);
      setExpectedQuarter(json.data.currentExpectedQuarter);
      setSummary(json.data.summary);
      setTableStatus("idle");
    } catch {
      setTableError("Network error — could not reach the backend.");
      setTableStatus("error");
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Reactive past/current/future check vs the current expected quarter.
  const selectedOrd = periodOrdinal(fiscalYear, quarter);
  const expectedOrd = expectedQuarter
    ? periodOrdinal(expectedQuarter.split("/")[0], expectedQuarter.split("/")[1])
    : null;
  const isPast = expectedOrd !== null && selectedOrd < expectedOrd;
  const isFuture = expectedOrd !== null && selectedOrd > expectedOrd;
  const isCurrent = expectedOrd !== null && selectedOrd === expectedOrd;

  const valueNum = Number(value);
  const canSubmit =
    !submitting && value.trim() !== "" && !Number.isNaN(valueNum) && sourceCitation.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setNotice(null);
    try {
      const body = {
        enteredBy: ENTERED_BY,
        symbol,
        fiscalYear,
        quarter,
        value: valueNum,
        sourceCitation: sourceCitation.trim(),
        confidence,
        ...(periodEnd ? { periodEnd } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };
      const res = await fetch(`${API_BASE}/admin/bank-supplementary/casa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: InjectResponse = await res.json();

      if (!res.ok || !json.success) {
        const reason =
          json.data?.errors?.join(" · ") ?? json.error ?? "Submission rejected by the server.";
        setNotice({ kind: "error", title: `CASA rejected for ${symbol} ${fiscalYear}/${quarter}`, body: reason });
        return;
      }

      const action = json.data?.action ?? "saved";
      const warn = json.data?.warnings?.length ? ` (${json.data.warnings.join("; ")})` : "";
      setNotice({
        kind: "success",
        title: `CASA ${action} — ${symbol} ${fiscalYear}/${quarter} = ${valueNum}%`,
        body: (json.data?.note ?? "The value now drives this bank's F7 CASA score.") + warn,
      });
      setValue("");
      setSourceCitation("");
      setNotes("");
      await loadStatus(); // refresh the table so the new value + timestamp + cleared flag appear
    } catch {
      setNotice({ kind: "error", title: "Network error", body: "Could not reach the backend — nothing was saved." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <Link
          href="/settings"
          className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Data &amp; Settings
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
              <Scale className="size-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">CASA Ratios</h1>
              <p className="text-sm text-muted-foreground">
                Quarterly CASA for the 12 scored banks — feeds the banking F7 metric.
                {expectedQuarter && (
                  <>
                    {" "}Current expected quarter:{" "}
                    <span className="font-semibold text-foreground">{expectedQuarter}</span>.
                  </>
                )}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadStatus} disabled={tableStatus === "loading"} className="gap-2 shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 ${tableStatus === "loading" ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── PART 1 — Status table ──────────────────────────────────────── */}
      <div className="border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-base mb-1">Per-bank CASA status</h2>
            <p className="text-xs text-muted-foreground">
              Latest ingested quarter, the value driving the score, and which banks still need the current quarter.
            </p>
          </div>
          {summary && (
            <div className="hidden sm:flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {summary.onCurrentQuarter} current
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                {summary.onLegacyLive} legacy
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive">
                {summary.onNeutral} no data
              </span>
            </div>
          )}
        </div>

        {tableStatus === "loading" && rows.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading CASA status…</p>
          </div>
        )}

        {tableStatus === "error" && (
          <div className="flex items-center gap-2.5 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{tableError}</p>
          </div>
        )}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground/70">
                  <th className="font-medium py-1.5 pr-4">Bank</th>
                  <th className="font-medium py-1.5 pr-4">Latest qtr</th>
                  <th className="font-medium py-1.5 pr-4 text-right">CASA</th>
                  <th className="font-medium py-1.5 pr-4">Last updated</th>
                  <th className="font-medium py-1.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const meta = staleMeta(row);
                  return (
                    <tr key={row.symbol} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-1.5 pr-4 whitespace-nowrap">
                        <span className="font-semibold text-foreground/90">{row.symbol}</span>
                        <span className="ml-2 hidden text-xs text-muted-foreground/70 md:inline">{BANK_NAME[row.symbol] ?? ""}</span>
                      </td>
                      <td className="py-1.5 pr-4">
                        {row.source === "quarter" && row.latestQuarterOnFile ? (
                          <span className="font-mono text-xs text-foreground/90">{row.latestQuarterOnFile}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">
                            {row.source === "legacy_live" ? "legacy LIVE" : "no quarter"}
                          </span>
                        )}
                      </td>
                      <td className="py-1.5 pr-4 text-right tabular-nums">
                        {row.latestValue != null ? (
                          <span className="font-semibold">{row.latestValue}%</span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="py-1.5 pr-4 text-xs text-muted-foreground/80 whitespace-nowrap">
                        {formatDateTime(row.lastUpdatedAt)}
                      </td>
                      <td className="py-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-none ${meta.cls}`}>
                            {meta.label}
                          </span>
                          {meta.detail && (
                            <span className="hidden text-[10px] text-muted-foreground/55 lg:inline">{meta.detail}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PART 2 — Ingest form ───────────────────────────────────────── */}
      <div className="border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-6 flex flex-col gap-5">
        <div>
          <h2 className="font-semibold text-base mb-1">Ingest a quarterly CASA value</h2>
          <p className="text-xs text-muted-foreground">
            Submit one bank&apos;s CASA for a fiscal quarter. Re-submitting the same quarter supersedes the prior value.
          </p>
        </div>

        {/* Submit notice (the codebase uses inline alerts — no toast library) */}
        {notice && (
          <div
            className={`flex items-start gap-2.5 p-3.5 rounded-lg border ${
              notice.kind === "success"
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-destructive/10 border-destructive/20"
            }`}
          >
            {notice.kind === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <p className={`text-sm font-medium ${notice.kind === "success" ? "text-emerald-400" : "text-destructive"}`}>
                {notice.title}
              </p>
              <p className={`text-xs mt-0.5 ${notice.kind === "success" ? "text-emerald-400/80" : "text-destructive/80"}`}>
                {notice.body}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* The four sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. QUARTER */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Quarter</label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUARTERS.map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. YEAR */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Fiscal year</label>
              <Select value={fiscalYear} onValueChange={setFiscalYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FISCAL_YEARS.map((fy) => (
                    <SelectItem key={fy} value={fy}>{fy}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. BANK */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Bank</label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((b) => (
                    <SelectItem key={b.symbol} value={b.symbol}>
                      {b.symbol} — {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 4. VALUE (with % unit) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">CASA value</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g. 34.50"
                  className="w-full rounded-lg border border-border/60 bg-background/80 pl-3 pr-8 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40 transition tabular-nums"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
              <span className="text-[11px] text-muted-foreground/60">Percent, e.g. 34.5 (server validates 15–60).</span>
            </div>
          </div>

          {/* Past-quarter warning (reactive, non-blocking) */}
          {isPast && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-400">
                  You&apos;re entering a PAST quarter ({fiscalYear}/{quarter})
                </p>
                <p className="text-xs text-amber-400/80 mt-0.5">
                  This updates historical data, not the current quarter ({expectedQuarter}). Proceed carefully —
                  submitting won&apos;t advance the bank off its staleness flag.
                </p>
              </div>
            </div>
          )}
          {isFuture && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-info/10 border border-info/20">
              <AlertCircle className="w-4 h-4 text-info shrink-0 mt-0.5" />
              <p className="text-xs text-info/90">
                {fiscalYear}/{quarter} is ahead of the current expected quarter ({expectedQuarter}) — entering a future period.
              </p>
            </div>
          )}
          {isCurrent && (
            <p className="text-[11px] text-muted-foreground/70 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/70" />
              {fiscalYear}/{quarter} is the current expected quarter.
            </p>
          )}

          {/* Source citation (REQUIRED — CN-4 gate) + optional fields */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">
                Source citation <span className="text-destructive">*</span>
              </label>
              <input
                value={sourceCitation}
                onChange={(e) => setSourceCitation(e.target.value)}
                placeholder="e.g. HDFC Bank Q1-FY27 results (Jul 2026) — CASA ratio 34.5%"
                className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40 transition"
              />
              <span className="text-[11px] text-muted-foreground/60">Required — a found value must be attributed (rejected without it).</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Confidence</label>
              <Select value={confidence} onValueChange={setConfidence}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONFIDENCES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c} — {c === "A" ? "primary disclosure" : c === "B" ? "derived/secondary" : "estimated (verify)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Period end <span className="text-muted-foreground/50">(optional)</span></label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition"
              />
            </div>
            <div className="flex flex-col gap-1.5 lg:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Notes <span className="text-muted-foreground/50">(optional)</span></label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any annotation for this entry"
                className="w-full rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/40 transition"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              type="submit"
              disabled={!canSubmit}
              size="lg"
              className="gap-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Ingest CASA
                </>
              )}
            </Button>
            {!canSubmit && !submitting && (
              <span className="text-xs text-muted-foreground/70">
                {value.trim() === "" || Number.isNaN(valueNum)
                  ? "Enter a CASA value"
                  : sourceCitation.trim() === ""
                    ? "Source citation is required"
                    : ""}
              </span>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground/50 font-mono flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            POST {API_BASE}/admin/bank-supplementary/casa
          </p>
        </form>
      </div>
    </div>
  );
}
