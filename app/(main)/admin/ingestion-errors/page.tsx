"use client";

// ─────────────────────────────────────────────────────────────
// RESOLUTION UI — triage + resolve ingestion-detection errors.
// Mirrors /settings/casa (inline alerts + toasts) + reuses the stock-prices
// job-poll for live fill/re-fetch status. Severity drives prominence; LOW is
// muted FYI; admin_fill rows fill (citation-mandatory) → async re-derive +
// rescore with a live job chip; prices rows also offer "re-fetch the feed";
// source_code rows are labelled "needs a code fix".
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Icons } from "@/lib/icons";
import { adminFetch } from "@/lib/api/admin-fetch";
import { toast } from "@/components/ui/toast";

const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;
const POLL_INTERVAL_MS = 2500;
const JOB_TERMINAL = new Set(["succeeded", "failed", "cancelled"]);
const EDITED_BY = "user:admin";

type Notice = { kind: "success" | "error"; title: string; body: string } | null;

interface FillMeta { type: "number"; unit: string; bounds: { min?: number; max?: number } | null }
interface FillInfo { fillable: boolean; table: string; fields: string[]; flaggedField: string | null; meta: FillMeta; expectedHint: string }
interface ErrorRow {
  id: string; severity: "critical" | "high" | "medium" | "low" | "info"; severityRank: number;
  status: "open" | "resolved" | "ignored"; cron: string; source: string; guardType: string;
  targetTable: string; targetField: string | null; targetEntity: string | null;
  resolutionPath: "source_code" | "admin_fill" | "rescore"; expected: string; observed: string; detail: string | null;
  occurrences: number; lastSeenAt: string; createdAt: string; runRef: string | null;
  fill: FillInfo | null; reFetchAvailable: boolean;
  /** STEP 17 — this row is an AUDIT event (a broker seeded a catalogue instrument), NOT a fault.
   *  Nothing is wrong and there is nothing to fix. The backend tags it so the UI never has to know
   *  the guardType list to render it correctly. */
  isAudit?: boolean;
  /** PART B — this row is a THROWN PHS-compute failure (its own "Score Compute" tab). The FE gates
   *  its Recompute action on this flag, not on the guardType string. */
  isScoreCompute?: boolean;
  /** Human-readable rendering of targetEntity — a stock symbol / fund scheme name / user
   *  name+email — resolved server-side. The raw id is still on `targetEntity`. */
  targetLabel?: string | null;
  // scoring-error class (source="scoring") — present only on scoring rows
  pgId?: string | null; periodKey?: string | null; failureType?: string | null;
}
/** The three counts, kept SEPARATE at every layer. They are never added together — an auto-admit is
 *  not a smaller problem (it is not a problem), and a score-compute crash has its own surface. */
interface FeedCounts { openFaults: number; audit: number; scoreCompute: number }
interface JobData {
  id: string; status: "pending" | "running" | "succeeded" | "failed" | "cancelled";
  progress: number; progressNote: string | null; errorMessage: string | null;
  durationMs: number | null; attempts: number; maxAttempts: number;
}

const SEV: Record<string, { label: string; cls: string; dot: string; muted?: boolean }> = {
  critical: { label: "Critical", cls: "bg-destructive/10 border-destructive/30 text-destructive", dot: "bg-destructive" },
  high: { label: "High", cls: "bg-warning/10 border-warning/25 text-warning", dot: "bg-warning" },
  medium: { label: "Medium", cls: "bg-primary/10 border-primary/20 text-primary", dot: "bg-primary" },
  low: { label: "Low", cls: "bg-muted/40 border-border/40 text-muted-foreground", dot: "bg-muted-foreground/50", muted: true },
  // NOT A SEVERITY — the absence of one. Deliberately styled as a NEUTRAL/positive note, never as a
  // quieter alarm: the whole point is that an operator reading this row learns something happened,
  // not that something is wrong.
  info: { label: "Admitted", cls: "bg-success/10 border-success/25 text-success", dot: "bg-success", muted: true },
};
const JOB_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending: { label: "Queued", cls: "text-warning", icon: <Icons.clock className="size-4 text-warning" /> },
  running: { label: "Running", cls: "text-primary", icon: <Icons.spinner className="size-4 text-primary animate-spin" /> },
  succeeded: { label: "Done", cls: "text-success", icon: <Icons.success className="size-4 text-success" /> },
  failed: { label: "Failed", cls: "text-destructive", icon: <Icons.xCircle className="size-4 text-destructive" /> },
  cancelled: { label: "Cancelled", cls: "text-muted-foreground", icon: <Icons.prohibit className="size-4 text-muted-foreground" /> },
};

export default function IngestionErrorsPage() {
  const [rows, setRows] = useState<ErrorRow[]>([]);
  const [counts, setCounts] = useState<FeedCounts>({ openFaults: 0, audit: 0, scoreCompute: 0 });
  const [tableStatus, setTableStatus] = useState<"loading" | "idle" | "error">("loading");
  const [tableError, setTableError] = useState<string | null>(null);
  /** THE FEED SPLIT. `faults` is the default and is what the word "errors" has always meant here.
   *  `audit` is the broker-seeded feed — informational, never counted as a fault (Step 17).
   *  `score_compute` is thrown PHS-compute failures (Part B) — its own triage tab. */
  const [feed, setFeed] = useState<"faults" | "audit" | "score_compute">("faults");
  const [filters, setFilters] = useState({ status: "open", severity: "", resolutionPath: "", cron: "" });

  // modal state
  const [modal, setModal] = useState<{ row: ErrorRow; mode: "fill" | "refetch" | "rescore" | "recompute" } | null>(null);

  const loadRows = useCallback(async () => {
    setTableStatus("loading"); setTableError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("feed", feed);
      // The audit feed is a HISTORY, not a queue: an admission has no meaningful "open" state, so
      // the status filter would silently hide most of it. Ask for all of it.
      qs.set("status", feed === "audit" ? "all" : (filters.status || "open"));
      if (feed === "faults") {
        if (filters.severity) qs.set("severity", filters.severity);
        if (filters.resolutionPath) qs.set("resolutionPath", filters.resolutionPath);
        if (filters.cron) qs.set("cron", filters.cron);
      }
      const res = await adminFetch(`${API_BASE}/admin/ingestion-errors?${qs.toString()}`);
      const json = await res.json();
      if (!json.success) { setTableError(json.error ?? "Failed to load."); setTableStatus("error"); return; }
      setRows(json.data as ErrorRow[]);
      if (json.counts) setCounts(json.counts as FeedCounts);
      setTableStatus("idle");
    } catch { setTableError("Network error — could not reach the backend."); setTableStatus("error"); }
  }, [filters, feed]);

  useEffect(() => { loadRows(); }, [loadRows]);

  const crons = Array.from(new Set(rows.map((r) => r.cron))).sort();

  // quick PATCH (resolve / ignore)
  const patchStatus = async (row: ErrorRow, status: "resolved" | "ignored") => {
    await adminFetch(`${API_BASE}/admin/ingestion-errors/${row.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, resolvedBy: EDITED_BY }),
    });
    await loadRows();
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link href="/admin" className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Icons.arrowLeft className="size-3.5" /> Back to Data &amp; Settings
        </Link>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20"><Icons.shieldWarning className="size-5" weight="duotone" /></span>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Ingestion</h1>
              <p className="text-xs text-muted-foreground">Detection-layer violations, and the instruments brokers have auto-admitted to the catalogue.</p>
            </div>
          </div>
          <button onClick={loadRows} className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-surface-1 px-3 h-9 text-sm text-foreground hover:border-border transition-colors">
            <Icons.refresh className={`size-3.5 ${tableStatus === "loading" ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* ── THE FAULT / AUDIT SPLIT ──────────────────────────────────────────────────────────────
          Two feeds, two counts, NEVER summed. A fault is something that is WRONG and wants an
          operator. An auto-admit is something that HAPPENED and wants thirty seconds of attention.
          Putting them in one number would tell an operator they have 20 problems when they have 16
          — and would quietly dissolve the fault-vs-honest-empty line the whole codebase rests on. */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          ["faults", "Faults", counts.openFaults, "needing attention"],
          ["score_compute", "Score Compute", counts.scoreCompute, "needing attention"],
          ["audit", "Auto-admitted", counts.audit, "informational"],
        ] as const).map(([key, label, n, hint]) => {
          // Faults AND Score Compute are triage queues (fault-style badge: red when open, green
          // when clean). Auto-admitted is informational (neutral badge) — never a smaller problem.
          const isQueue = key === "faults" || key === "score_compute";
          return (
          <button
            key={key}
            onClick={() => setFeed(key)}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 h-9 text-sm transition-colors ${
              feed === key
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border/60 bg-surface-1 text-muted-foreground hover:border-border"
            }`}
          >
            <span className="font-medium">{label}</span>
            <span className={`tabular-nums rounded-md px-1.5 py-0.5 text-[11px] ${
              isQueue
                ? n > 0 ? "bg-destructive/12 text-destructive" : "bg-success/12 text-success"
                : "bg-muted/50 text-muted-foreground"
            }`}>{n}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">{hint}</span>
          </button>
          );
        })}
        <span className="text-xs text-muted-foreground ml-auto">{rows.length} row{rows.length === 1 ? "" : "s"}</span>
      </div>

      {feed === "score_compute" && (
        <div className="flex items-start gap-2.5 rounded-lg border border-warning/25 bg-warning/5 px-3 py-2.5">
          <Icons.shieldWarning className="size-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-foreground font-medium">The Portfolio Health Score failed to compute.</span>{" "}
            Each row is a book whose PHS compute <span className="text-foreground">threw</span> — the user&apos;s
            core score is stale or blank until it recomputes. <span className="text-foreground">Recompute</span> re-attempts
            now; either way the row <span className="text-foreground">self-resolves</span> on the next successful compute
            (the EOD rescore or a book change) — it is never marked resolved by the button alone.
            <span className="block mt-1 text-muted-foreground/80">
              A correct empty score (no scored holdings) or a low-coverage book is <span className="text-foreground">not</span> a
              failure and never appears here — only genuine crashes do.
            </span>
          </p>
        </div>
      )}

      {feed === "audit" && (
        <div className="flex items-start gap-2.5 rounded-lg border border-success/20 bg-success/5 px-3 py-2.5">
          <Icons.success className="size-4 text-success shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-foreground font-medium">These are not errors.</span>{" "}
            A broker surfaced a holding whose ISIN no ingest had ever shown us, so it was admitted to the shared
            catalogue on the ISIN spine — classified by the ISIN itself, never guessed. Nothing is broken and there is
            nothing to fix. Each instrument appears exactly once, at the moment its catalogue row was created.
            <span className="block mt-1 text-muted-foreground/80">
              Read this as a demand signal: a pile of admitted <span className="text-foreground">stocks</span> means the
              curated universe misses what people hold; a pile of admitted{" "}
              <span className="text-foreground">bonds</span> is the case for ingesting BSE/OTC debt.
            </span>
          </p>
        </div>
      )}

      {/* Filters — faults only. The audit feed is a flat history and has nothing to triage. */}
      {feed === "faults" && (
        <div className="flex flex-wrap items-center gap-2">
          {([
            ["status", ["open", "resolved", "ignored", "all"], "Status"],
            ["severity", ["", "critical", "high", "medium", "low"], "Severity"],
            ["resolutionPath", ["", "admin_fill", "source_code"], "Path"],
            ["cron", ["", ...crons], "Cron"],
          ] as const).map(([key, opts, label]) => (
            <label key={key} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="uppercase tracking-wide text-[10px]">{label}</span>
              <select
                value={(filters as Record<string, string>)[key]}
                onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                className="h-8 rounded-md border border-border/60 bg-background/80 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              >
                {opts.map((o) => <option key={o} value={o}>{o === "" ? "all" : o}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="border rounded-xl border-border/70 bg-surface-1/40 backdrop-blur-sm shadow-sm overflow-hidden">
        {tableStatus === "error" && (
          <div className="flex items-center gap-2.5 p-4 m-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <Icons.warning className="size-5 text-destructive shrink-0" /><p className="text-sm text-destructive">{tableError}</p>
          </div>
        )}
        {tableStatus !== "error" && rows.length === 0 && (
          <div className="flex items-center gap-2.5 p-8 justify-center text-muted-foreground">
            <Icons.success className="size-5 text-success" />
            <p className="text-sm">
              {feed === "audit"
                ? "No broker has auto-admitted an instrument yet."
                : feed === "score_compute"
                ? "No Portfolio Health Score has failed to compute. Clean."
                : `No ${filters.status === "all" ? "" : filters.status} ingestion errors. Clean.`}
            </p>
          </div>
        )}
        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-[11px] uppercase tracking-wide text-muted-foreground/70">
                  <th className="font-medium py-2 px-3">Severity</th>
                  <th className="font-medium py-2 px-3">Guard / Target</th>
                  <th className="font-medium py-2 px-3">Expected → Observed</th>
                  <th className="font-medium py-2 px-3">Resolution</th>
                  <th className="font-medium py-2 px-3 text-right">Seen</th>
                  <th className="font-medium py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const sev = SEV[r.severity];
                  const isFill = r.resolutionPath === "admin_fill";
                  const isRescore = r.resolutionPath === "rescore";
                  return (
                    <tr key={r.id} className={`border-b border-border/30 align-top ${sev.muted ? "opacity-60" : ""} hover:bg-surface-2/40`}>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${sev.cls}`}>
                          <span className={`size-1.5 rounded-full ${sev.dot}`} />{sev.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 min-w-0">
                        <div className="text-xs text-foreground font-medium">{r.guardType} · {r.targetTable}{r.targetField ? `.${r.targetField}` : ""}</div>
                        <div className="text-[11px] truncate max-w-75" title={r.targetEntity ?? undefined}>
                          <span className="text-foreground/85">{r.targetLabel ?? r.targetEntity ?? "batch-level"}</span>
                          <span className="text-muted-foreground"> · {r.cron}</span>
                        </div>
                        {/* Keep the raw id visible (dim) when the label resolved to something friendlier. */}
                        {r.targetLabel && r.targetEntity && r.targetLabel !== r.targetEntity && (
                          <div className="text-[10px] text-muted-foreground/60 font-mono truncate max-w-75">{r.targetEntity}</div>
                        )}
                        {r.detail && <div className="text-[11px] text-muted-foreground/80 mt-0.5 max-w-[320px]">{r.detail}</div>}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-[11px] text-muted-foreground">exp: <span className="text-foreground/80">{r.expected}</span></div>
                        <div className="text-[11px] text-muted-foreground">obs: <span className="text-warning/90">{r.observed}</span></div>
                      </td>
                      <td className="py-2.5 px-3">
                        {isFill ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-success"><Icons.check className="size-3" /> Fully resolves by filling</span>
                        ) : r.isScoreCompute ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-primary"><Icons.refresh className="size-3" /> Self-resolves on next compute</span>
                        ) : isRescore ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-primary"><Icons.refresh className="size-3" /> Resolve by re-scoring</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-warning/90"><Icons.wrench className="size-3" /> Stopgap — needs a code fix</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="text-[11px] text-foreground tabular-nums">×{r.occurrences}</div>
                        <div className="text-[10px] text-muted-foreground tabular-nums">{r.lastSeenAt.slice(0, 10)}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {r.fill?.fillable && (
                            <button onClick={() => setModal({ row: r, mode: "fill" })} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 h-7 text-[11px] text-primary hover:bg-primary/20">
                              <Icons.edit className="size-3" /> Fill
                            </button>
                          )}
                          {r.reFetchAvailable && (
                            <button onClick={() => setModal({ row: r, mode: "refetch" })} className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-surface-1 px-2 h-7 text-[11px] text-foreground hover:border-border">
                              <Icons.downloadCloud className="size-3" /> Re-fetch
                            </button>
                          )}
                          {isRescore && !r.isScoreCompute && r.status === "open" && (
                            <button onClick={() => setModal({ row: r, mode: "rescore" })} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 h-7 text-[11px] text-primary hover:bg-primary/20">
                              <Icons.refresh className="size-3" /> Re-score
                            </button>
                          )}
                          {r.isScoreCompute && r.status === "open" && (
                            <button onClick={() => setModal({ row: r, mode: "recompute" })} className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 h-7 text-[11px] text-primary hover:bg-primary/20">
                              <Icons.refresh className="size-3" /> Recompute
                            </button>
                          )}
                          {r.status === "open" && (
                            <>
                              <button onClick={() => patchStatus(r, "resolved")} className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2 h-7 text-[11px] text-success hover:bg-success/20" title="Mark resolved (filled or code-fixed)">
                                <Icons.check className="size-3" /> Resolve
                              </button>
                              <button onClick={() => patchStatus(r, "ignored")} className="inline-flex items-center gap-1 rounded-md border border-border/50 px-2 h-7 text-[11px] text-muted-foreground hover:text-foreground" title="Acknowledge & dismiss">
                                <Icons.eyeSlash className="size-3" /> Ignore
                              </button>
                            </>
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

      {modal && <ActionModal row={modal.row} mode={modal.mode} onClose={() => setModal(null)} onDone={loadRows} />}
    </div>
  );
}

// ── Fill / Re-fetch modal with live job-status polling ────────
function ActionModal({ row, mode, onClose, onDone }: { row: ErrorRow; mode: "fill" | "refetch" | "rescore" | "recompute"; onClose: () => void; onDone: () => void }) {
  const [field, setField] = useState(row.fill?.flaggedField && row.fill.fields.includes(row.fill.flaggedField) ? row.fill.flaggedField : row.fill?.fields[0] ?? "");
  const [value, setValue] = useState("");
  const [citation, setCitation] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  // Mirror every inline notice to a theme-matched toast so the admin gets feedback
  // even when scrolled away from this row's panel.
  const notify = (n: Exclude<Notice, null>) => {
    setNotice(n);
    (n.kind === "success" ? toast.success : toast.error)(n.title, { description: n.body });
  };
  const [job, setJob] = useState<JobData | null>(null);
  const [jobDone, setJobDone] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const meta = row.fill?.meta;
  const valueNum = value.trim() === "" ? NaN : Number(value);
  const canSubmitFill = field !== "" && Number.isFinite(valueNum) && citation.trim().length >= 4;

  const stopPolling = useCallback(() => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }, []);
  useEffect(() => () => stopPolling(), [stopPolling]);

  const pollJob = useCallback(async (id: string) => {
    try {
      const res = await adminFetch(`${API_BASE}/admin/jobs/${id}`);
      const json = await res.json();
      if (!json.success || !json.data) return;
      setJob(json.data as JobData);
      if (JOB_TERMINAL.has(json.data.status)) {
        stopPolling(); setJobDone(true);
        if (json.data.status === "succeeded") { notify({ kind: "success", title: "Rescore complete — the score has moved.", body: "Dependent values were recomputed from current data; the triage row resolves on success." }); onDone(); }
        else if (json.data.status === "failed") notify({ kind: "error", title: "Rescore job failed", body: json.data.errorMessage ?? "The job failed — the row stays open. You can retry." });
      }
    } catch { /* keep polling on transient errors */ }
  }, [stopPolling, onDone]);
  const startPolling = useCallback((id: string) => { stopPolling(); setJobDone(false); pollRef.current = setInterval(() => pollJob(id), POLL_INTERVAL_MS); pollJob(id); }, [pollJob, stopPolling]);

  const submitFill = async () => {
    if (!canSubmitFill) return;
    setSubmitting(true); setNotice(null); setJob(null);
    try {
      const res = await adminFetch(`${API_BASE}/admin/ingestion-errors/${row.id}/fill`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value: valueNum, citation: citation.trim(), note: note.trim() || undefined, editedBy: EDITED_BY }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { notify({ kind: "error", title: "Fill rejected", body: json.error ?? "Server rejected the fill." }); return; }
      const changed = Object.keys(json.data.reDerivedChanged ?? {});
      if (json.data.done || !json.data.jobId) {
        setJobDone(true);
        notify({ kind: "success", title: "Filled — value corrected.", body: `${changed.length ? `Re-derived: ${changed.join(", ")}. ` : ""}No rescore needed (display-only).` });
        onDone();
      } else {
        notify({ kind: "success", title: `Filled — ${json.data.cascade} rescore queued`, body: `Re-derived ${changed.length} ratio(s). Tracking the rescore below…` });
        startPolling(json.data.jobId);
      }
    } catch { notify({ kind: "error", title: "Network error", body: "Could not reach the backend — nothing was saved." }); }
    finally { setSubmitting(false); }
  };

  const submitRefetch = async () => {
    setSubmitting(true); setNotice(null); setJob(null);
    try {
      const res = await adminFetch(`${API_BASE}/admin/ingestion-errors/${row.id}/refetch`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const json = await res.json();
      if (!res.ok || !json.success) { notify({ kind: "error", title: "Re-fetch rejected", body: json.error ?? "Server rejected the re-fetch." }); return; }
      notify({ kind: "success", title: `Re-fetching the feed for ${json.data.dateIso}`, body: "Tracking the re-fetch below…" });
      startPolling(json.data.jobId);
    } catch { notify({ kind: "error", title: "Network error", body: "Could not reach the backend." }); }
    finally { setSubmitting(false); }
  };

  const submitRescore = async () => {
    setSubmitting(true); setNotice(null); setJob(null);
    try {
      const res = await adminFetch(`${API_BASE}/admin/ingestion-errors/${row.id}/rescore`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const json = await res.json();
      if (!res.ok || !json.success) { notify({ kind: "error", title: "Re-score rejected", body: json.error ?? "Server rejected the re-score." }); return; }
      const pgs = (json.data.pgIds ?? []).join(", ");
      notify({
        kind: "success",
        title: json.data.coalesced ? "Re-score already in flight — tracking it" : `Re-scoring ${pgs}`,
        body: "The row resolves automatically when the rescore succeeds. Tracking below…",
      });
      startPolling(json.data.jobId);
    } catch { notify({ kind: "error", title: "Network error", body: "Could not reach the backend." }); }
    finally { setSubmitting(false); }
  };

  // Recompute (Part B) — SYNCHRONOUS, no job to poll. It TRIGGERS a per-user PHS recompute;
  // the row self-resolves through the backend heal path on a successful compute (the button
  // never marks it resolved). On success we reload; on a re-throw the row stays open.
  const submitRecompute = async () => {
    setSubmitting(true); setNotice(null); setJob(null);
    try {
      const res = await adminFetch(`${API_BASE}/admin/ingestion-errors/${row.id}/recompute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const json = await res.json();
      if (!res.ok || !json.success) { notify({ kind: "error", title: "Recompute rejected", body: json.error ?? "Server rejected the recompute." }); return; }
      setJobDone(true);
      if (json.data.recomputed) {
        notify({ kind: "success", title: "Recompute succeeded — the score is current.", body: "The row self-resolved via the next successful compute (the button never marks it resolved)." });
      } else {
        notify({ kind: "error", title: "Recompute failed again — the row stays open.", body: json.data.message ?? "The compute threw again; the row remains for retry." });
      }
      onDone();
    } catch { notify({ kind: "error", title: "Network error", body: "Could not reach the backend." }); }
    finally { setSubmitting(false); }
  };

  const jm = job ? JOB_META[job.status] ?? JOB_META.pending : null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-border/60 bg-background shadow-xl flex flex-col gap-4 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">{mode === "fill" ? "Fill raw value" : mode === "refetch" ? "Re-fetch the feed" : mode === "recompute" ? "Recompute the Portfolio Health Score" : "Re-score the Health Score"} — {row.targetTable}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><Icons.xCircle className="size-4" /></button>
        </div>
        <div className="text-[11px] text-muted-foreground">{row.targetLabel ?? row.targetEntity ?? "batch-level"} · {row.expected}</div>

        {notice && (
          <div className={`flex items-start gap-2.5 p-3 rounded-lg border ${notice.kind === "success" ? "bg-success/10 border-success/20" : "bg-destructive/10 border-destructive/20"}`}>
            {notice.kind === "success" ? <Icons.success className="size-4 text-success shrink-0 mt-0.5" /> : <Icons.warning className="size-4 text-destructive shrink-0 mt-0.5" />}
            <div className="min-w-0"><p className={`text-xs font-medium ${notice.kind === "success" ? "text-success" : "text-destructive"}`}>{notice.title}</p><p className={`text-[11px] mt-0.5 ${notice.kind === "success" ? "text-success/80" : "text-destructive/80"}`}>{notice.body}</p></div>
          </div>
        )}

        {/* job status chip + progress (live) */}
        {job && jm && (
          <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/20 p-3">
            <div className="flex items-center gap-2">{jm.icon}<span className={`text-xs font-semibold ${jm.cls}`}>{jm.label}</span>{job.status === "running" && <span className="text-[11px] text-muted-foreground tabular-nums ml-auto">{job.progress}%</span>}</div>
            {job.status === "running" && <div className="w-full h-1.5 rounded-full bg-border/50 overflow-hidden"><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${job.progress}%` }} /></div>}
            {job.progressNote && <p className="text-[11px] text-muted-foreground font-mono truncate">{job.progressNote}</p>}
            {job.status === "failed" && job.errorMessage && <p className="text-[11px] text-destructive">{job.errorMessage} (attempt {job.attempts}/{job.maxAttempts})</p>}
          </div>
        )}

        {/* fill form (hidden once the job is being tracked) */}
        {mode === "fill" && !job && !jobDone && (
          <div className="flex flex-col gap-3">
            {row.fill && row.fill.fields.length > 1 && (
              <label className="flex flex-col gap-1"><span className="text-[11px] text-muted-foreground">Field</span>
                <select value={field} onChange={(e) => setField(e.target.value)} className="h-9 rounded-md border border-border/60 bg-background/80 px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40">
                  {row.fill.fields.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1"><span className="text-[11px] text-muted-foreground">New value{meta ? ` (${meta.unit})` : ""}{meta?.bounds ? ` — ${meta.bounds.min != null ? `min ${meta.bounds.min}` : ""}${meta.bounds.max != null ? ` max ${meta.bounds.max}` : ""}` : ""}</span>
              <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" className="h-9 rounded-md border border-border/60 bg-background/80 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </label>
            <label className="flex flex-col gap-1"><span className="text-[11px] text-muted-foreground">Source citation <span className="text-destructive">*</span> (CN-4 — mandatory)</span>
              <input value={citation} onChange={(e) => setCitation(e.target.value)} placeholder="e.g. FY24 Annual Report p.142, audited" className="h-9 rounded-md border border-border/60 bg-background/80 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </label>
            <label className="flex flex-col gap-1"><span className="text-[11px] text-muted-foreground">Note (optional)</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} className="h-9 rounded-md border border-border/60 bg-background/80 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
            </label>
            <p className="text-[11px] text-muted-foreground">Filling re-derives all dependent ratios from current data — stale values get corrected. Derived columns aren’t editable directly.</p>
            <button onClick={submitFill} disabled={!canSubmitFill || submitting} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground h-9 px-4 text-sm font-medium disabled:opacity-50 hover:brightness-110">
              {submitting ? <><Icons.spinner className="size-4 animate-spin" /> Submitting…</> : <>Fill &amp; recompute</>}
            </button>
            {!canSubmitFill && <p className="text-[11px] text-muted-foreground/70">Enter a numeric value and a source citation (≥4 chars) to enable.</p>}
          </div>
        )}

        {mode === "refetch" && !job && !jobDone && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">Re-fetch the entire EOD bhavcopy for this date (use for a <span className="text-foreground">feed break</span> — a whole-day bad/missing fetch). For one bad value, prefer a manual fill. Both end with the same live job status.</p>
            <button onClick={submitRefetch} disabled={submitting} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border/60 bg-surface-1 text-foreground h-9 px-4 text-sm font-medium disabled:opacity-50 hover:border-border">
              {submitting ? <><Icons.spinner className="size-4 animate-spin" /> Enqueuing…</> : <><Icons.downloadCloud className="size-4" /> Re-fetch this date</>}
            </button>
          </div>
        )}

        {mode === "rescore" && !job && !jobDone && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">Re-run the Health Score for <span className="text-foreground font-mono">{row.pgId ?? row.targetLabel ?? row.targetEntity}</span> from current data — use when a scoring job <span className="text-foreground">failed</span> and the score may be stale or missing. The row resolves <span className="text-foreground">automatically</span> when the rescore succeeds. If it fails again, the row stays open for retry (a re-failure points to a deeper issue worth escalating).</p>
            <button onClick={submitRescore} disabled={submitting} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground h-9 px-4 text-sm font-medium disabled:opacity-50 hover:brightness-110">
              {submitting ? <><Icons.spinner className="size-4 animate-spin" /> Enqueuing…</> : <><Icons.refresh className="size-4" /> Re-score now</>}
            </button>
          </div>
        )}

        {mode === "recompute" && !jobDone && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">Re-attempt the Portfolio Health Score compute for user <span className="text-foreground font-mono">{row.targetLabel ?? row.targetEntity?.slice(0, 8)}</span> — use when the compute <span className="text-foreground">threw</span> and the book&apos;s score is stale or blank. This <span className="text-foreground">triggers</span> a recompute; the row is <span className="text-foreground">not</span> marked resolved by the button — it self-resolves through the heal path on the next <span className="text-foreground">successful</span> compute. If it throws again, the row stays open for retry.</p>
            <button onClick={submitRecompute} disabled={submitting} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground h-9 px-4 text-sm font-medium disabled:opacity-50 hover:brightness-110">
              {submitting ? <><Icons.spinner className="size-4 animate-spin" /> Recomputing…</> : <><Icons.refresh className="size-4" /> Recompute now</>}
            </button>
          </div>
        )}

        {jobDone && (
          <button onClick={onClose} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border/60 bg-surface-1 text-foreground h-9 px-4 text-sm">Close</button>
        )}
      </div>
    </div>
  );
}
