"use client";

import { Button } from "@/components/ui/button";
import {
    AlertCircle,
    ArrowLeft,
    Ban,
    CheckCircle2,
    ClockIcon,
    Cpu,
    Loader2,
    Newspaper,
    Play,
    RefreshCw,
    Rss,
    Search,
    XCircle,
    Zap
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Job types ───────────────────────────────────────────────────────────
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

interface LogEntry {
  id: string;
  fetchType: string;
  status: "success" | "error" | string;
  stocksProcessed: number;
  itemsInserted: number;
  itemsSkipped: number;
  itemsExtracted: number;
  extractionFailed: number;
  durationMs: number;
  error: string | null;
  createdAt: string;
}

interface LogsResponse {
  success: boolean;
  data?: LogEntry[];
  pagination?: { total: number; page: number; limit: number; pages: number };
}

type JobStatus = "idle" | "submitting" | "polling" | "done" | "error";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

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
  error: { label: "Error", color: "text-destructive", icon: XCircle },
};

const getStatusMeta = (status: string) =>
  STATUS_META[status] ?? {
    label: status,
    color: "text-muted-foreground",
    icon: ClockIcon,
  };

const FETCH_TYPE_LABEL: Record<string, string> = {
  nse_daily: "NSE Daily",
  google_news_daily: "Google News",
  extraction_worker: "Extractor",
};

const getFetchTypeLabel = (t: string) => FETCH_TYPE_LABEL[t] ?? t;

interface TriggerAction {
  id: string;
  label: string;
  description: string;
  endpoint: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  btnClass: string;
  progressColor: string;
}

const TRIGGER_ACTIONS: TriggerAction[] = [
  {
    id: "complete",
    label: "Complete News Ingest",
    description: "Runs both NSE announcements and Google News ingestion in one shot.",
    endpoint: "/admin/news/trigger",
    icon: Zap,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    btnClass:
      "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-indigo-900/30 hover:shadow-indigo-900/40",
    progressColor: "bg-indigo-500",
  },
  {
    id: "nse",
    label: "NSE Announcements",
    description: "Fetches and inserts the latest NSE corporate announcements.",
    endpoint: "/admin/news/trigger/nse",
    icon: Rss,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    btnClass:
      "bg-orange-600 hover:bg-orange-700 active:bg-orange-800 shadow-orange-900/30 hover:shadow-orange-900/40",
    progressColor: "bg-orange-500",
  },
  {
    id: "google",
    label: "Google News Ingest",
    description: "Fetches and inserts the latest news articles from Google News.",
    endpoint: "/admin/news/trigger/google",
    icon: Search,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    btnClass:
      "bg-sky-600 hover:bg-sky-700 active:bg-sky-800 shadow-sky-900/30 hover:shadow-sky-900/40",
    progressColor: "bg-sky-500",
  },
  {
    id: "extractor",
    label: "Content Extractor",
    description: "Runs the extraction worker to enrich pending articles with full content.",
    endpoint: "/admin/news/extract",
    icon: Cpu,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    btnClass:
      "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-900/30 hover:shadow-emerald-900/40",
    progressColor: "bg-emerald-500",
  },
];

const NewsAnnouncementsPage = () => {
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
        `${API_BASE}/news/news-logs?page=${page}&limit=10`,
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
          pages: json.pagination.pages,
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
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Newspaper className="w-5 h-5 text-indigo-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            News &amp; Announcements
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2 ml-[3.25rem]">
          Trigger ingestion of NSE announcements, Google News, or run the
          content extractor to enrich pending articles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left column — Trigger Cards */}
        <div className="flex flex-col gap-4">
          {TRIGGER_ACTIONS.map((action) => (
            <TriggerCard key={action.id} action={action} />
          ))}
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
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
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
    </div>
  );
};

// ── Job status metadata ─────────────────────────────────────────────────────
const jobMeta: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: "Pending",   color: "text-amber-400",        icon: <ClockIcon className="w-4 h-4 text-amber-400" /> },
  running:   { label: "Running",   color: "text-blue-400",         icon: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" /> },
  succeeded: { label: "Succeeded", color: "text-emerald-400",      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
  failed:    { label: "Failed",    color: "text-destructive",      icon: <XCircle className="w-4 h-4 text-destructive" /> },
  cancelled: { label: "Cancelled", color: "text-muted-foreground", icon: <Ban className="w-4 h-4 text-muted-foreground" /> },
};

const TriggerCard = ({ action }: { action: TriggerAction }) => {
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
      if (JOB_TERMINAL.has(json.data.status)) {
        stopPolling();
        setJobStatus("done");
      }
    } catch { /* keep polling on transient errors */ }
  }, [stopPolling]);

  const startPolling = useCallback((id: string) => {
    stopPolling();
    pollRef.current = setInterval(() => pollJob(id), POLL_INTERVAL_MS);
    pollJob(id);
  }, [pollJob, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleRun = async () => {
    setJobStatus("submitting");
    setJobError(null);
    setJobId(null);
    setJobData(null);
    setCancelError(null);
    try {
      const res = await fetch(`${API_BASE}${action.endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json: JobTriggerResponse = await res.json();
      if (!json.success || !json.data) {
        setJobError(json.error ?? "Request failed.");
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
    setJobStatus("idle");
    setJobError(null);
    setJobId(null);
    setJobData(null);
    setCancelError(null);
  };

  const Icon = action.icon;
  const isActive = jobStatus === "polling" && jobData && !JOB_TERMINAL.has(jobData.status);
  const canCancel = isActive && !jobData?.cancelRequested;
  const isRunning = jobStatus === "submitting" || jobStatus === "polling";

  return (
    <div className="border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${action.bg} border ${action.border} shrink-0`}>
          <Icon className={`w-4 h-4 ${action.color}`} />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-sm">{action.label}</h2>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {action.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {jobStatus === "done" || jobStatus === "error" ? (
          <Button variant="outline" size="sm" onClick={reset} className="text-xs h-8">
            Run again
          </Button>
        ) : (
          <Button
            onClick={handleRun}
            disabled={isRunning}
            size="sm"
            className={`gap-2 text-white font-semibold shadow-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${action.btnClass}`}
          >
            {isRunning ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />{jobStatus === "submitting" ? "Submitting…" : "Processing…"}</>
            ) : (
              <><Play className="w-3.5 h-3.5" />Run</>
            )}
          </Button>
        )}

        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleCancel}
            disabled={cancelLoading}
          >
            {cancelLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
            Cancel
          </Button>
        )}

        {jobData?.cancelRequested && !JOB_TERMINAL.has(jobData.status) && (
          <span className="text-xs text-amber-400 flex items-center gap-1">
            <ClockIcon className="w-3.5 h-3.5" /> Cancellation requested…
          </span>
        )}
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

      {jobData && <JobPanel job={jobData} progressColor={action.progressColor} />}

      {jobId && !jobData && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Job <span className="font-mono text-foreground/70">{jobId}</span> — waiting for status…
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/40 font-mono">
        POST {API_BASE}{action.endpoint}
      </p>
    </div>
  );
};

const JobPanel = ({ job, progressColor }: { job: JobData; progressColor: string }) => {
  const meta = jobMeta[job.status] ?? jobMeta.pending;
  const isTerminal = JOB_TERMINAL.has(job.status);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          {meta.icon}
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
              {job.status === "running" && (
                <span className="text-xs text-muted-foreground tabular-nums">{job.progress}%</span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{job.id}</p>
          </div>
        </div>
        {job.durationMs != null && (
          <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(job.durationMs)}</span>
        )}
      </div>

      {!isTerminal && (
        <div className="w-full h-1.5 rounded-full bg-border/50 overflow-hidden">
          <div
            className={`h-full rounded-full ${progressColor} transition-all duration-500`}
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
          <span className="text-xs text-muted-foreground">
            {getFetchTypeLabel(log.fetchType)}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground/60 shrink-0">
          {formatDateTime(log.createdAt)}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <LogPill label="Stocks" value={log.stocksProcessed.toLocaleString()} />
        <LogPill
          label="Inserted"
          value={log.itemsInserted.toLocaleString()}
          accent
        />
        <LogPill label="Skipped" value={log.itemsSkipped.toLocaleString()} />
        <LogPill
          label="Extracted"
          value={log.itemsExtracted.toLocaleString()}
        />
        {log.extractionFailed > 0 && (
          <LogPill
            label="Extract Failed"
            value={log.extractionFailed.toLocaleString()}
            error
          />
        )}
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
  error,
}: {
  label: string;
  value: string;
  accent?: boolean;
  error?: boolean;
}) => (
  <div className="flex items-center gap-1">
    <span className="text-[10px] text-muted-foreground/60">{label}:</span>
    <span
      className={`text-[11px] font-semibold tabular-nums ${
        error
          ? "text-destructive"
          : accent
            ? "text-emerald-400"
            : "text-foreground/80"
      }`}
    >
      {value}
    </span>
  </div>
);

export default NewsAnnouncementsPage;
