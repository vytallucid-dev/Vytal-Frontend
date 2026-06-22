"use client";

import { Button } from "@/components/ui/button";
import {
    AlertCircle,
    ArrowLeft,
    Ban,
    CheckCircle2,
    ClockIcon,
    Database,
    Loader2,
    PieChart,
    Play,
    RefreshCw,
    XCircle,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface LogEntry {
  id: string;
  stockSymbol: string;
  stockId: string;
  fetchType: string;
  quartersFound: number;
  quartersInserted: number;
  quartersSkipped: number;
  status: "success" | "error" | string;
  error: string | null;
  durationMs: number;
  createdAt: string;
}

interface LogsResponse {
  success: boolean;
  data?: LogEntry[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

type JobStatus = "idle" | "submitting" | "polling" | "done" | "error";

interface JobTriggerResponse {
  success: boolean;
  data?: { jobId: string; statusUrl: string; message: string };
  error?: string;
}

interface JobData {
  id: string;
  type: string;
  status: "pending" | "running" | "succeeded" | "failed" | "cancelled";
  priority: number;
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

interface JobPollResponse {
  success: boolean;
  data?: JobData;
  error?: string;
}

const POLL_INTERVAL_MS = 2500;
const JOB_TERMINAL = new Set(["succeeded", "failed", "cancelled"]);

const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

const ShareholdingPatternsPage = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsMeta, setLogsMeta] = useState<{
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsPage, setLogsPage] = useState(1);

  const fetchLogs = useCallback(async (page = 1) => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const res = await fetch(
        `${API_BASE}/shareholding/shareholding-logs?page=${page}&limit=10`,
      );
      const json: LogsResponse = await res.json();
      if (!json.success) {
        setLogsError("Failed to load logs.");
        return;
      }
      if (json.data && json.pagination) {
        setLogs(json.data);
        setLogsMeta({
          total: json.pagination.total,
          totalPages: json.pagination.totalPages,
          hasNext: json.pagination.hasNext,
          hasPrev: json.pagination.hasPrev,
        });
        setLogsPage(page);
      }
    } catch {
      setLogsError("Network error — could not fetch logs.");
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  return (
    <div className="flex flex-col gap-8 pb-4 overflow-y-auto hidden-scrollbar">
      {/* Header */}
      <div className="w-full border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm py-8 px-6 shadow-lg shadow-ring/10">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Settings
        </Link>

        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <PieChart className="w-5 h-5 text-rose-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Shareholding Patterns</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2 ml-[3.25rem]">
          Manually trigger the quarterly ingestion of shareholding pattern data —
          promoter, FII, DII, and public holdings — for all tracked stocks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left column — Trigger + Backfill */}
        <div className="flex flex-col gap-4">
          <TriggerCard />
          <SmartRefreshCard />
          <BackfillCard />
        </div>

        {/* Right column — Ingest Logs */}
        <div className="border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-base">Ingest Logs</h2>
              {logsMeta && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {logsMeta.total.toLocaleString()} total records
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchLogs(logsPage)}
              disabled={logsLoading}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${logsLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {logsLoading && logs.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading logs…</p>
            </div>
          )}

          {logsError && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">{logsError}</p>
            </div>
          )}

          {!logsLoading && !logsError && logs.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 text-center py-12">
              <ClockIcon className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground/50">
                No ingest logs found.
              </p>
            </div>
          )}

          {logs.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {logs.map((log) => (
                <LogRow key={log.id} log={log} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {logsMeta && (
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/50 mt-auto">
              <Button
                variant="outline"
                size="sm"
                disabled={!logsMeta.hasPrev || logsLoading}
                onClick={() => fetchLogs(logsPage - 1)}
                className="h-8 px-3 text-xs"
              >
                ← Previous
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                Page {logsPage} of {logsMeta.totalPages} &nbsp;·&nbsp; {logsMeta.total.toLocaleString()} total
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!logsMeta.hasNext || logsLoading}
                onClick={() => fetchLogs(logsPage + 1)}
                className="h-8 px-3 text-xs"
              >
                Next →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LogRow = ({ log }: { log: LogEntry }) => {
  const isSuccess = log.status === "success";
  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors duration-150">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-destructive shrink-0" />
          )}
          <span
            className={`text-xs font-bold uppercase tracking-wide ${isSuccess ? "text-emerald-400" : "text-destructive"}`}
          >
            {log.stockSymbol}
          </span>
          <span className="text-xs text-muted-foreground/50">·</span>
          <span className="text-xs text-muted-foreground capitalize">
            {log.fetchType}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground/60 shrink-0">
          {formatDateTime(log.createdAt)}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <LogPill label="Found" value={log.quartersFound.toLocaleString()} />
        <LogPill
          label="Inserted"
          value={log.quartersInserted.toLocaleString()}
          accent
        />
        <LogPill
          label="Skipped"
          value={log.quartersSkipped.toLocaleString()}
        />
        <LogPill label="Duration" value={formatDuration(log.durationMs)} />
      </div>

      {!isSuccess && log.error && (
        <p className="text-[11px] text-destructive/80 bg-destructive/5 rounded px-2 py-1 font-mono">
          {log.error}
        </p>
      )}
    </div>
  );
};

const LogPill = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <div className="flex items-center gap-1">
    <span className="text-[10px] text-muted-foreground/60">{label}:</span>
    <span
      className={`text-[11px] font-semibold tabular-nums ${accent ? "text-emerald-400" : "text-foreground/80"}`}
    >
      {value}
    </span>
  </div>
);

// ─── Job infrastructure ───────────────────────────────────────────────────────

const jobMeta: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: "Pending",   color: "text-amber-400",        icon: <ClockIcon className="w-4 h-4 text-amber-400" /> },
  running:   { label: "Running",   color: "text-blue-400",         icon: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" /> },
  succeeded: { label: "Succeeded", color: "text-emerald-400",      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  failed:    { label: "Failed",    color: "text-destructive",      icon: <XCircle className="w-4 h-4 text-destructive" /> },
  cancelled: { label: "Cancelled", color: "text-muted-foreground", icon: <Ban className="w-4 h-4 text-muted-foreground" /> },
};

const JobPanel = ({ job }: { job: JobData }) => {
  const meta = jobMeta[job.status] ?? jobMeta.pending;
  const isTerminal = JOB_TERMINAL.has(job.status);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          {meta.icon}
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
              {!isTerminal && (
                <span className="text-[10px] text-muted-foreground/60 tabular-nums">{job.progress}%</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground/60 font-mono">{job.id}</p>
          </div>
        </div>
        {job.durationMs != null && (
          <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(job.durationMs)}</span>
        )}
      </div>
      {!isTerminal && (
        <div className="w-full h-1.5 rounded-full bg-border/50 overflow-hidden">
          <div className="h-full rounded-full bg-rose-500 transition-all duration-500" style={{ width: `${job.progress}%` }} />
        </div>
      )}
      {job.progressNote && (
        <p className="text-xs text-muted-foreground/80 font-mono bg-muted/30 rounded px-2.5 py-1.5">{job.progressNote}</p>
      )}
      {job.errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{job.errorMessage}</p>
        </div>
      )}
      {isTerminal && (
        <div className="flex flex-wrap gap-3 pt-2 border-t border-border/40">
          {job.startedAt && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground/60">Started:</span>
              <span className="text-[11px] text-foreground/70 tabular-nums">{formatDateTime(job.startedAt)}</span>
            </div>
          )}
          {job.finishedAt && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground/60">Finished:</span>
              <span className="text-[11px] text-foreground/70 tabular-nums">{formatDateTime(job.finishedAt)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground/60">Triggered by</span>
            <span className="text-[11px] font-medium text-foreground/70">{job.triggeredBy}</span>
          </div>
        </div>
      )}
    </div>
  );
};

function useJobPolling() {
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const pollJob = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/${id}`);
      const json: JobPollResponse = await res.json();
      if (!json.success || !json.data) return;
      setJobData(json.data);
      if (JOB_TERMINAL.has(json.data.status)) { stopPolling(); setJobStatus("done"); }
    } catch { /* keep polling on transient errors */ }
  }, [stopPolling]);

  const startPolling = useCallback((id: string) => {
    stopPolling();
    pollRef.current = setInterval(() => pollJob(id), POLL_INTERVAL_MS);
    pollJob(id);
  }, [pollJob, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleCancel = async () => {
    if (!jobId) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/${jobId}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!json.success) setCancelError(json.error ?? "Failed to cancel job.");
    } catch {
      setCancelError("Network error — could not cancel job.");
    } finally {
      setCancelLoading(false);
    }
  };

  const reset = () => {
    stopPolling();
    setJobStatus("idle"); setJobError(null); setJobId(null); setJobData(null); setCancelError(null);
  };

  const submit = async (url: string, body: object) => {
    setJobStatus("submitting"); setJobError(null); setJobId(null); setJobData(null); setCancelError(null);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json: JobTriggerResponse = await res.json();
      if (!json.success || !json.data) { setJobError(json.error ?? "Request failed."); setJobStatus("error"); return; }
      setJobId(json.data.jobId); setJobStatus("polling"); startPolling(json.data.jobId);
    } catch {
      setJobError("Network error — server unreachable."); setJobStatus("error");
    }
  };

  return { jobStatus, jobError, jobId, jobData, cancelLoading, cancelError, handleCancel, reset, submit };
}

const JobCardActions = ({ hook, label }: { hook: ReturnType<typeof useJobPolling>; label: string }) => {
  const { jobStatus, jobData, cancelLoading, handleCancel, reset } = hook;
  const isRunning = jobStatus === "submitting" || jobStatus === "polling";
  const isActive = jobStatus === "polling" && jobData && !JOB_TERMINAL.has(jobData.status);
  const canCancel = isActive && !jobData?.cancelRequested;
  return (
    <>
      <div className="flex items-center gap-2.5 flex-wrap">
        <Button
          type="submit"
          disabled={isRunning}
          size="sm"
          className="gap-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md shadow-rose-900/30 hover:shadow-lg hover:shadow-rose-900/40 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Running…</>
          ) : (
            <><Play className="w-4 h-4" />{label}</>
          )}
        </Button>
        {canCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={cancelLoading}
            className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <Ban className="w-3.5 h-3.5" />
            {cancelLoading ? "Cancelling…" : "Cancel"}
          </Button>
        )}
        {isActive && jobData?.cancelRequested && (
          <span className="text-xs text-muted-foreground italic">Cancellation requested…</span>
        )}
        {(jobStatus === "done" || jobStatus === "error") && (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>Reset</Button>
        )}
      </div>
      {hook.jobError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{hook.jobError}</p>
        </div>
      )}
      {hook.cancelError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{hook.cancelError}</p>
        </div>
      )}
      {hook.jobData && <JobPanel job={hook.jobData} />}
      {hook.jobId && !hook.jobData && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Job {hook.jobId} — waiting for status…
        </div>
      )}
    </>
  );
};

const TriggerCard = () => {
  const job = useJobPolling();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    job.submit(`${API_BASE}/admin/shareholding/trigger`, {});
  };
  return (
    <form onSubmit={handleSubmit} className="border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-6 flex flex-col gap-5">
      <div>
        <h2 className="font-semibold text-base mb-1">Quarterly Ingest Trigger</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Calling this trigger will fetch the latest quarterly shareholding data for
          all tracked stocks, skip already-existing quarters, and insert any new
          records into the database.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Fetches quarterly holding data", "Skips existing quarters", "Safe to run multiple times"].map((label) => (
          <span key={label} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {label}
          </span>
        ))}
      </div>
      <JobCardActions hook={job} label="Trigger Shareholding Ingest" />
      <p className="text-[11px] text-muted-foreground/50 font-mono">
        POST {API_BASE}/admin/shareholding/trigger
      </p>
    </form>
  );
};

const SmartRefreshCard = () => {
  const job = useJobPolling();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    job.submit(`${API_BASE}/admin/shareholding/smart-refresh`, {});
  };
  return (
    <form onSubmit={handleSubmit} className="border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-6 flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 shrink-0">
          <Zap className="w-4 h-4 text-rose-400" />
        </div>
        <div>
          <h2 className="font-semibold text-base mb-1">Smart Shareholding Refresh</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Intelligently refreshes shareholding pattern data by detecting and updating
            only the records that have changed or are missing. Optimized for efficiency.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Smart detection", "Updates changed records", "Optimized performance"].map((label) => (
          <span key={label} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {label}
          </span>
        ))}
      </div>
      <JobCardActions hook={job} label="Run Smart Refresh" />
      <p className="text-[11px] text-muted-foreground/50 font-mono">
        POST {API_BASE}/admin/shareholding/smart-refresh
      </p>
    </form>
  );
};

const BackfillCard = () => {
  const job = useJobPolling();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    job.submit(`${API_BASE}/admin/shareholding/backfill`, {});
  };
  return (
    <form onSubmit={handleSubmit} className="border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-6 flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 shrink-0">
          <Database className="w-4 h-4 text-rose-400" />
        </div>
        <div>
          <h2 className="font-semibold text-base mb-1">Historical Backfill</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Backfill shareholding pattern data for all tracked stocks from historical
            records. Skips quarters that already exist in the database.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {["Backfills missing quarters", "Skips existing records", "Safe to re-run"].map((label) => (
          <span key={label} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {label}
          </span>
        ))}
      </div>
      <JobCardActions hook={job} label="Run Historical Backfill" />
      <p className="text-[11px] text-muted-foreground/50 font-mono">
        POST {API_BASE}/admin/shareholding/backfill
      </p>
    </form>
  );
};

export default ShareholdingPatternsPage;
