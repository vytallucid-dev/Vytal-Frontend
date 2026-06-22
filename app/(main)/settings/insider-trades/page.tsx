"use client";

import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  ClockIcon,
  Database,
  History,
  Loader2,
  Play,
  RefreshCw,
  UserSearch,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface LogEntry {
  id: string;
  fetchDate: string;
  fetchType: string;
  status: "success" | "no_data" | "error" | string;
  totalFetched: number;
  totalInserted: number;
  totalSkipped: number;
  totalFiltered: number;
  durationMs: number;
  error: string | null;
  createdAt: string;
}

interface LogsResponse {
  success: boolean;
  data?: {
    logs: LogEntry[];
    pagination: { total: number; page: number; limit: number; pages: number };
  };
}

type Status = "idle" | "loading" | "success" | "error";
type JobStatus = "idle" | "submitting" | "polling" | "done" | "error";

// ── Job / backfill types ───────────────────────────────────────────────────
interface BackfillJobResponse {
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

const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;

const POLL_INTERVAL_MS = 2500;
const JOB_TERMINAL = new Set(["succeeded", "failed", "cancelled"]);

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

const STATUS_META: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  success: { label: "Success", color: "text-emerald-400", icon: CheckCircle2 },
  no_data: { label: "No Data", color: "text-amber-400", icon: ClockIcon },
  error: { label: "Error", color: "text-destructive", icon: XCircle },
};

const getStatusMeta = (status: string) =>
  STATUS_META[status] ?? {
    label: status,
    color: "text-muted-foreground",
    icon: ClockIcon,
  };

const InsiderTradesPage = () => {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ApiResponse | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsMeta, setLogsMeta] = useState<{
    total: number;
    pages: number;
  } | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsPage, setLogsPage] = useState(1);

  const fetchLogs = useCallback(async (page = 1) => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const res = await fetch(
        `${API_BASE}/insider-trades/insider-trade-logs?page=${page}&limit=10`,
      );
      const json: LogsResponse = await res.json();
      if (!json.success) {
        setLogsError("Failed to load logs.");
        return;
      }
      if (json.data) {
        setLogs(json.data.logs);
        setLogsMeta({
          total: json.data.pagination.total,
          pages: json.data.pagination.pages,
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

  const handleTrigger = async () => {
    setStatus("loading");
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/admin/insider-trades/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const json: ApiResponse = await res.json();
      setResult(json);
      setStatus(json.success ? "success" : "error");
      if (json.success) fetchLogs(1);
    } catch {
      setResult({
        success: false,
        error: "Network error — server unreachable.",
      });
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setResult(null);
  };

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
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <UserSearch className="w-5 h-5 text-cyan-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Insider Trades</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2 ml-[3.25rem]">
          Manually trigger the daily ingestion of insider trading activity from
          the exchange feed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left column — Trigger + Result */}
        <div className="flex flex-col gap-4">
          {/* Trigger Card */}
          <div className="border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-6 flex flex-col gap-6">
            <div>
              <h2 className="font-semibold text-base mb-1">
                Daily Ingest Trigger
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Calling this trigger will fetch today&apos;s insider trade
                disclosures, filter for tracked stocks, skip already-recorded
                trades, and insert any new transactions into the database.
              </p>
            </div>

            {/* Info pills */}
            <div className="flex flex-wrap gap-2">
              {[
                "Fetches latest insider trades",
                "Filters for tracked stocks",
                "Safe to run multiple times",
              ].map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Action */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleTrigger}
                disabled={status === "loading"}
                size="lg"
                className="gap-2.5 bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white font-semibold px-6 py-3 rounded-lg shadow-md shadow-cyan-900/30 hover:shadow-lg hover:shadow-cyan-900/40 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running Ingest…
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Trigger Insider Trades Ingest
                  </>
                )}
              </Button>

              {status !== "idle" && status !== "loading" && (
                <Button variant="ghost" size="sm" onClick={reset}>
                  Reset
                </Button>
              )}
            </div>

            {/* Endpoint hint */}
            <p className="text-[11px] text-muted-foreground/50 font-mono">
              POST {API_BASE}/admin/insider-trades/trigger
            </p>
          </div>

          {/* Ingest Result Card */}
          <div className="border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-6 flex flex-col gap-5 min-h-[160px]">
            <h2 className="font-semibold text-base">Ingest Result</h2>

            {status === "idle" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-6">
                <Database className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground/50">
                  No ingest run yet. Trigger one to see the output.
                </p>
              </div>
            )}

            {status === "loading" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6">
                <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Fetching and processing insider trades…
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center gap-2.5 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Ingest Failed
                  </p>
                  <p className="text-xs text-destructive/80 mt-0.5">
                    {result?.error ??
                      result?.message ??
                      "An unexpected error occurred."}
                  </p>
                </div>
              </div>
            )}

            {status === "success" && result && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">
                    {result.message ?? "Ingest completed successfully"}
                  </p>
                  <p className="text-xs text-emerald-400/70 mt-0.5">
                    Check the logs panel for detailed per-run stats.
                  </p>
                </div>
              </div>
            )}
          </div>
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
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
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
                disabled={logsPage <= 1 || logsLoading}
                onClick={() => fetchLogs(logsPage - 1)}
                className="h-8 px-3 text-xs"
              >
                ← Previous
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                Page {logsPage} of {logsMeta.pages} &nbsp;·&nbsp;{" "}
                {logsMeta.total.toLocaleString()} total
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={logsPage >= logsMeta.pages || logsLoading}
                onClick={() => fetchLogs(logsPage + 1)}
                className="h-8 px-3 text-xs"
              >
                Next →
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Backfill */}
      <BackfillSection />
    </div>
  );
};

// ── Backfill Section ────────────────────────────────────────────────────────
const jobMeta: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-400",
    icon: <ClockIcon className="w-4 h-4 text-amber-400" />,
  },
  running: {
    label: "Running",
    color: "text-blue-400",
    icon: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
  },
  succeeded: {
    label: "Succeeded",
    color: "text-emerald-400",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  },
  failed: {
    label: "Failed",
    color: "text-destructive",
    icon: <XCircle className="w-4 h-4 text-destructive" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-muted-foreground",
    icon: <Ban className="w-4 h-4 text-muted-foreground" />,
  },
};

const BackfillSection = () => {
  const [days, setDays] = useState("");
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollJob = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`${API_BASE}/admin/jobs/${id}`);
        const json: JobPollResponse = await res.json();
        if (!json.success || !json.data) return;
        setJobData(json.data);
        if (JOB_TERMINAL.has(json.data.status)) {
          stopPolling();
          setJobStatus("done");
        }
      } catch {
        /* keep polling on transient errors */
      }
    },
    [stopPolling],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJobStatus("submitting");
    setJobError(null);
    setJobId(null);
    setJobData(null);
    setCancelError(null);

    const body: Record<string, number> = {};
    const parsed = parseInt(days, 10);
    if (!isNaN(parsed) && parsed > 0) body.days = parsed;

    try {
      const res = await fetch(`${API_BASE}/admin/insider-trades/backfill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: BackfillJobResponse = await res.json();
      if (!json.success || !json.data) {
        setJobError(json.error ?? "Backfill request failed.");
        setJobStatus("error");
        return;
      }
      setJobId(json.data.jobId);
      setJobStatus("polling");
      startPolling(json.data.jobId);
    } catch {
      setJobError("Network error — server unreachable.");
      setJobStatus("error");
    }
  };

  const handleCancel = async () => {
    if (!jobId) return;
    setCancelLoading(true);
    setCancelError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/${jobId}/cancel`, {
        method: "POST",
      });
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
    setJobStatus("idle");
    setJobError(null);
    setJobId(null);
    setJobData(null);
    setCancelError(null);
    setDays("");
  };

  const isActive =
    jobStatus === "polling" && jobData && !JOB_TERMINAL.has(jobData.status);
  const canCancel = isActive && !jobData?.cancelRequested;
  const isRunning = jobStatus === "submitting" || jobStatus === "polling";

  return (
    <div className="w-full border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-6 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <History className="w-4 h-4 text-cyan-400" />
          <h2 className="font-semibold text-base">Historical Backfill</h2>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Job-based
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Fetch insider trade records for the past N days and upsert them into
          the database as a background job. Defaults to 12 months if no value is
          provided.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Months to backfill{" "}
              <span className="text-muted-foreground/50">
                (optional, default: 12)
              </span>
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="12"
              disabled={isRunning}
              className="w-32 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition disabled:opacity-50"
            />
          </div>

          <div className="flex items-center gap-2">
            {jobStatus === "done" || jobStatus === "error" ? (
              <Button type="button" variant="outline" onClick={reset}>
                Run another backfill
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isRunning}
                className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-60"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {jobStatus === "submitting" ? "Submitting…" : "Processing…"}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Backfill
                  </>
                )}
              </Button>
            )}

            {canCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={handleCancel}
                disabled={cancelLoading}
              >
                {cancelLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Ban className="w-3.5 h-3.5" />
                )}
                Cancel Job
              </Button>
            )}

            {jobData?.cancelRequested && !JOB_TERMINAL.has(jobData.status) && (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <ClockIcon className="w-3.5 h-3.5" /> Cancellation requested…
              </span>
            )}
          </div>
        </div>

        {jobError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">{jobError}</p>
          </div>
        )}

        {cancelError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">{cancelError}</p>
          </div>
        )}
      </form>

      {jobData && <BackfillJobPanel job={jobData} />}

      {jobId && !jobData && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Job <span className="font-mono text-foreground/70">{jobId}</span> —
          waiting for status…
        </div>
      )}
    </div>
  );
};

const BackfillJobPanel = ({ job }: { job: JobData }) => {
  const meta = jobMeta[job.status] ?? jobMeta.pending;
  const isTerminal = JOB_TERMINAL.has(job.status);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          {meta.icon}
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${meta.color}`}>
                {meta.label}
              </span>
              {job.status === "running" && (
                <span className="text-xs text-muted-foreground tabular-nums">
                  {job.progress}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              {job.id}
            </p>
          </div>
        </div>
        {job.durationMs != null && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDuration(job.durationMs)}
          </span>
        )}
      </div>

      {!isTerminal && (
        <div className="w-full h-1.5 rounded-full bg-border/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-cyan-500 transition-all duration-500"
            style={{ width: `${job.progress}%` }}
          />
        </div>
      )}

      {job.progressNote && (
        <p className="text-xs text-muted-foreground/80 font-mono bg-muted/30 rounded px-2.5 py-1.5">
          {job.progressNote}
        </p>
      )}

      {job.errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{job.errorMessage}</p>
        </div>
      )}

      {job.result &&
        (() => {
          const r = job.result as Record<string, number>;
          const stats: [string, number | undefined, boolean][] = [
            ["Fetched", r.totalFetched, false],
            ["Inserted", r.totalInserted, true],
            ["Filtered", r.totalFiltered, false],
            ["Skipped", r.totalSkipped, false],
          ];
          return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {stats
                .filter(([, v]) => v !== undefined)
                .map(([label, value, accent]) => (
                  <div
                    key={label}
                    className="flex flex-col gap-0.5 rounded-lg bg-background/60 border border-border/40 px-3 py-2"
                  >
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">
                      {label}
                    </span>
                    <span
                      className={`text-base font-bold tabular-nums ${
                        accent ? "text-emerald-400" : "text-foreground/80"
                      }`}
                    >
                      {(value as number).toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          );
        })()}

      {isTerminal && (
        <div className="flex flex-wrap gap-3 pt-2 border-t border-border/40">
          {job.startedAt && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground/60">
                Started:
              </span>
              <span className="text-[11px] text-foreground/70 tabular-nums">
                {formatDateTime(job.startedAt)}
              </span>
            </div>
          )}
          {job.finishedAt && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground/60">
                Finished:
              </span>
              <span className="text-[11px] text-foreground/70 tabular-nums">
                {formatDateTime(job.finishedAt)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground/60">
              Triggered by
            </span>
            <span className="text-[11px] font-medium text-foreground/70">
              {job.triggeredBy}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const LogRow = ({ log }: { log: LogEntry }) => {
  const meta = getStatusMeta(log.status);
  const StatusIcon = meta.icon;
  const isError = log.status === "error";

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors duration-150">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-4 h-4 shrink-0 ${meta.color}`} />
          <span className={`text-xs font-semibold ${meta.color}`}>
            {meta.label}
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
        <LogPill label="Date" value={log.fetchDate} />
        <LogPill label="Fetched" value={log.totalFetched.toLocaleString()} />
        <LogPill
          label="Inserted"
          value={log.totalInserted.toLocaleString()}
          accent
        />
        <LogPill label="Filtered" value={log.totalFiltered.toLocaleString()} />
        <LogPill label="Skipped" value={log.totalSkipped.toLocaleString()} />
        <LogPill label="Duration" value={formatDuration(log.durationMs)} />
      </div>

      {isError && log.error && (
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

export default InsiderTradesPage;
