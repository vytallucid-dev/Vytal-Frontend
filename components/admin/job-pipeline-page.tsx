"use client";

// ─────────────────────────────────────────────────────────────
// THE JOB-PIPELINE ADMIN PAGE — one component, the house's ONE job-and-poll mechanism.
//
// WHY THIS EXISTS. Four pipelines (mutual-funds, reits, govt-securities, corporate-bonds) shipped
// CRON-ONLY: registered in the backend's pipeline registry, but with no admin card, no manual
// trigger and no way to watch a run. An operator could not run one, could not reproduce a failure,
// and could not tell whether last night's cron had even fired. That is a mystery cron.
//
// WHY IT IS SHARED RATHER THAN COPIED. The existing pages (block-deals, stock-prices, …) each
// re-implement the same trigger → 202 → poll loop. Copying it a fifth, sixth, seventh and eighth
// time would guarantee the copies drift — and the ONE thing that must NOT drift is the mechanism
// itself. So the machinery lives here, once:
//
//     POST <endpoint>                       → 202 { jobId, statusUrl }
//     GET  /admin/jobs/<jobId>  every 2.5s  → until status is terminal
//     GET  /admin/jobs?type=<t>             → the real run history, from background_jobs
//
// That is byte-for-byte the contract block-deals' backfill uses. Same endpoints, same interval, same
// terminal set, same cancel path. A page built on this is not a lookalike of the others; it is the
// same thing.
//
// RUN HISTORY COMES FROM `background_jobs`, not a parallel log table. These lanes have no
// XxxFetchLog of their own, and inventing one would create a second source of truth that could
// disagree with the jobs table about whether a run happened. The jobs table already knows.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/api/admin-fetch";
import { toast } from "@/components/ui/toast";

const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;
const POLL_INTERVAL_MS = 2500;
const JOB_TERMINAL = new Set(["succeeded", "failed", "cancelled"]);

export interface JobData {
  id: string;
  type: string;
  status: "pending" | "running" | "succeeded" | "failed" | "cancelled";
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  progress: number;
  progressNote: string | null;
  cancelRequested: boolean;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  triggeredBy: string;
  attempts: number;
  maxAttempts: number;
}

/** One triggerable job on this pipeline's card. */
export interface PipelineJob {
  /** The backend job type — also the filter for this job's run history. */
  jobType: string;
  /** Button label, e.g. "Run bond ingest". */
  label: string;
  /** POST path, relative to /api/v1 — e.g. "/admin/corporate-bonds/trigger". */
  endpoint: string;
  /** What this job actually does. Shown under the button. Be concrete. */
  description: string;
  /** Short factual pills — what it reads, what it writes, whether it is safe to re-run. */
  pills?: string[];
}

export interface JobPipelinePageProps {
  title: string;
  subtitle: string;
  icon: Icon;
  jobs: PipelineJob[];
  /** Optional prose under the header — the honest caveats an operator should know before running. */
  notes?: React.ReactNode;
}

const JOB_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending: { label: "Queued", cls: "text-warning", icon: <Icons.clock className="size-4 text-warning" /> },
  running: { label: "Running", cls: "text-primary", icon: <Icons.spinner className="size-4 text-primary animate-spin" /> },
  succeeded: { label: "Succeeded", cls: "text-success", icon: <Icons.success className="size-4 text-success" /> },
  failed: { label: "Failed", cls: "text-destructive", icon: <Icons.xCircle className="size-4 text-destructive" /> },
  cancelled: { label: "Cancelled", cls: "text-muted-foreground", icon: <Icons.prohibit className="size-4 text-muted-foreground" /> },
};

const fmtDuration = (ms: number) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`);
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
  });

export function JobPipelinePage({ title, subtitle, icon: HeaderIcon, jobs, notes }: JobPipelinePageProps) {
  return (
    <div className="flex flex-col gap-8 pb-4 overflow-y-auto hidden-scrollbar">
      {/* Header */}
      <div className="w-full border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm py-8 px-6 shadow-lg shadow-ring/10">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <Icons.arrowLeft className="size-3.5" />
          Back to Settings
        </Link>

        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <HeaderIcon className="size-5 text-primary" weight="duotone" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2 ml-[3.25rem]">{subtitle}</p>
        {notes && <div className="text-xs text-muted-foreground/80 mt-4 ml-[3.25rem] leading-relaxed">{notes}</div>}
      </div>

      {jobs.map((job) => (
        <JobCard key={job.jobType} job={job} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function JobCard({ job }: { job: PipelineJob }) {
  const [phase, setPhase] = useState<"idle" | "submitting" | "polling" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [live, setLive] = useState<JobData | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const [history, setHistory] = useState<JobData[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await adminFetch(`${API_BASE}/admin/jobs?type=${job.jobType}&limit=8`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setHistory(json.data as JobData[]);
    } catch {
      /* history is a nicety — a network blip must not break the trigger */
    } finally {
      setHistoryLoading(false);
    }
  }, [job.jobType]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const pollJob = useCallback(
    async (id: string) => {
      try {
        const res = await adminFetch(`${API_BASE}/admin/jobs/${id}`);
        const json = await res.json();
        if (!json.success || !json.data) return;
        const d = json.data as JobData;
        setLive(d);
        if (JOB_TERMINAL.has(d.status)) {
          stopPolling();
          setPhase("done");
          loadHistory(); // the run just landed — reflect it
          if (d.status === "succeeded") toast.success(`${job.label} finished`, { description: d.progressNote ?? "Completed." });
          else if (d.status === "failed") toast.error(`${job.label} failed`, { description: d.errorMessage ?? "The job failed." });
        }
      } catch {
        /* keep polling through transient errors — a dropped packet is not a failed job */
      }
    },
    [stopPolling, loadHistory, job.label],
  );

  const startPolling = useCallback(
    (id: string) => {
      stopPolling();
      pollRef.current = setInterval(() => pollJob(id), POLL_INTERVAL_MS);
      pollJob(id);
    },
    [pollJob, stopPolling],
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleTrigger = async () => {
    setPhase("submitting");
    setError(null);
    setJobId(null);
    setLive(null);

    try {
      const res = await adminFetch(`${API_BASE}${job.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!json.success || !json.data?.jobId) {
        setError(json.error ?? json.message ?? "The server rejected the request.");
        setPhase("error");
        toast.error(`${job.label} could not be started`, { description: json.error ?? "The server rejected the request." });
        return;
      }
      setJobId(json.data.jobId);
      setPhase("polling");
      startPolling(json.data.jobId);
      toast.success(`${job.label} enqueued`, { description: "Tracking its progress below." });
    } catch {
      setError("Network error — server unreachable. Nothing was enqueued.");
      setPhase("error");
      toast.error("Network error", { description: "Server unreachable — nothing was enqueued." });
    }
  };

  const handleCancel = async () => {
    if (!jobId) return;
    setCancelling(true);
    try {
      const res = await adminFetch(`${API_BASE}/admin/jobs/${jobId}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!json.success) toast.error("Couldn't cancel", { description: json.error ?? "The server rejected the request." });
      else toast.success("Cancellation requested", { description: "The job is being stopped." });
    } catch {
      toast.error("Network error", { description: "Couldn't reach the backend to cancel." });
    } finally {
      setCancelling(false);
    }
  };

  const reset = () => {
    stopPolling();
    setPhase("idle");
    setError(null);
    setJobId(null);
    setLive(null);
  };

  const isRunning = phase === "submitting" || phase === "polling";
  const canCancel = phase === "polling" && live && !JOB_TERMINAL.has(live.status) && !live.cancelRequested;

  return (
    <div className="w-full border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-6 flex flex-col gap-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icons.play className="size-4 text-primary" weight="duotone" />
          <h2 className="font-semibold text-base">{job.label}</h2>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Job-based
          </span>
          <span className="text-[10px] font-mono text-muted-foreground/50">{job.jobType}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{job.description}</p>
      </div>

      {/* Pills */}
      {job.pills && job.pills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {job.pills.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Action */}
      <div className="flex items-center gap-3 flex-wrap">
        {phase === "done" || phase === "error" ? (
          <Button variant="outline" onClick={reset}>
            Run again
          </Button>
        ) : (
          <Button
            onClick={handleTrigger}
            disabled={isRunning}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-60"
          >
            {isRunning ? (
              <>
                <Icons.spinner className="size-4 animate-spin" />
                {phase === "submitting" ? "Enqueueing…" : "Running…"}
              </>
            ) : (
              <>
                <Icons.play className="size-4" />
                {job.label}
              </>
            )}
          </Button>
        )}

        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? <Icons.spinner className="size-3.5 animate-spin" /> : <Icons.prohibit className="size-3.5" />}
            Cancel
          </Button>
        )}

        {live?.cancelRequested && !JOB_TERMINAL.has(live.status) && (
          <span className="text-xs text-warning flex items-center gap-1">
            <Icons.clock className="size-3.5" /> Cancellation requested…
          </span>
        )}

        <span className="text-[11px] text-muted-foreground/50 font-mono ml-auto">POST {job.endpoint}</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <Icons.warning className="size-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {jobId && !live && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icons.spinner className="size-3.5 animate-spin" />
          Job <span className="font-mono text-foreground/70">{jobId}</span> — waiting for status…
        </div>
      )}

      {live && <LiveJobPanel job={live} />}

      {/* Run history — the REAL one, straight from background_jobs. */}
      <div className="flex flex-col gap-2.5 pt-2 border-t border-border/40">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent runs</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadHistory}
            disabled={historyLoading}
            className="gap-1.5 h-7 text-muted-foreground hover:text-foreground"
          >
            <Icons.refresh className={`size-3 ${historyLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {history.length === 0 && !historyLoading && (
          <p className="text-xs text-muted-foreground/50 py-3">
            This job has never run. If its cron is registered, it will run on schedule — or trigger it above.
          </p>
        )}

        {history.map((h) => (
          <HistoryRow key={h.id} job={h} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function LiveJobPanel({ job }: { job: JobData }) {
  const meta = JOB_META[job.status] ?? JOB_META.pending!;
  const terminal = JOB_TERMINAL.has(job.status);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          {meta.icon}
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${meta.cls}`}>{meta.label}</span>
              {job.status === "running" && (
                <span className="text-xs text-muted-foreground tabular-nums">{job.progress}%</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{job.id}</p>
          </div>
        </div>
        {job.durationMs != null && (
          <span className="text-xs text-muted-foreground tabular-nums">{fmtDuration(job.durationMs)}</span>
        )}
      </div>

      {!terminal && (
        <div className="w-full h-1.5 rounded-full bg-border/50 overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${job.progress}%` }} />
        </div>
      )}

      {/* The progress note is where each ingest reports what it ACTUALLY did — counts, faults,
          refusals. It is the most informative line on this page; render it verbatim. */}
      {job.progressNote && (
        <p className="text-xs text-muted-foreground/80 font-mono bg-muted/30 rounded px-2.5 py-1.5 whitespace-pre-wrap break-words">
          {job.progressNote}
        </p>
      )}

      {job.errorMessage && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <Icons.warning className="size-4 text-destructive shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-destructive break-words">{job.errorMessage}</p>
            <p className="text-[11px] text-destructive/70 mt-1">
              A REJECTED ingest wrote nothing — it did not half-load. The guard that stopped it has filed an
              entry in{" "}
              <Link href="/admin/ingestion-errors" className="underline hover:text-destructive">
                Ingestion Errors
              </Link>
              , with what it expected and what it saw.
            </p>
          </div>
        </div>
      )}

      {terminal && (
        <div className="flex flex-wrap gap-3 pt-2 border-t border-border/40">
          {job.startedAt && (
            <Meta label="Started" value={fmtDateTime(job.startedAt)} />
          )}
          {job.finishedAt && <Meta label="Finished" value={fmtDateTime(job.finishedAt)} />}
          <Meta label="Triggered by" value={job.triggeredBy} />
          <Meta label="Attempts" value={`${job.attempts}/${job.maxAttempts}`} />
        </div>
      )}
    </div>
  );
}

const Meta = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center gap-1.5">
    <span className="text-[10px] text-muted-foreground/60">{label}:</span>
    <span className="text-[11px] text-foreground/70 tabular-nums">{value}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────
function HistoryRow({ job }: { job: JobData }) {
  const meta = JOB_META[job.status] ?? JOB_META.pending!;
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-border/50 bg-muted/20">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          {meta.icon}
          <span className={`text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
          <span className="text-xs text-muted-foreground/50">·</span>
          <span className="text-[11px] text-muted-foreground">{job.triggeredBy}</span>
          {job.durationMs != null && (
            <>
              <span className="text-xs text-muted-foreground/50">·</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">{fmtDuration(job.durationMs)}</span>
            </>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground/60 shrink-0">
          {job.finishedAt ? fmtDateTime(job.finishedAt) : fmtDateTime(job.createdAt)}
        </span>
      </div>

      {job.progressNote && (
        <p className="text-[11px] text-muted-foreground/70 font-mono break-words">{job.progressNote}</p>
      )}
      {job.errorMessage && (
        <p className="text-[11px] text-destructive/80 bg-destructive/5 rounded px-2 py-1 font-mono break-words">
          {job.errorMessage}
        </p>
      )}
    </div>
  );
}
