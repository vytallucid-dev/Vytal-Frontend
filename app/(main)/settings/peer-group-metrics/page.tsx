"use client";

import { Button } from "@/components/ui/button";
import {
    AlertCircle,
    ArrowLeft,
    Ban,
    BarChart3,
    Building2,
    CheckCircle2,
    ClockIcon,
    Globe,
    Hash,
    Loader2,
    Play,
    RefreshCw,
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
  runType: string;
  triggerType: string;
  fiscalYear: string;
  groupsComputed: number;
  groupsSkipped: number;
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
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

type TriggerStatus = "idle" | "loading" | "success" | "error";
type JobStatus = "idle" | "submitting" | "polling" | "done" | "error";

interface TriggerState {
  status: TriggerStatus;
  message: string | null;
}

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

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const ENDPOINT = `${API_BASE}/admin/peer-metrics/trigger`;

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

const RUN_TYPE_LABEL: Record<string, string> = {
  full: "Full",
  sector: "Sector",
  single: "Single",
};

const TRIGGER_TYPE_LABEL: Record<string, string> = {
  manual_api: "Manual API",
  scheduled: "Scheduled",
};

const PeerGroupMetricsPage = () => {
  // Job state for "Complete" card
  const [allJobStatus, setAllJobStatus] = useState<JobStatus>("idle");
  const [allJobError, setAllJobError] = useState<string | null>(null);
  const [allJobId, setAllJobId] = useState<string | null>(null);
  const [allJobData, setAllJobData] = useState<JobData | null>(null);
  const [allCancelLoading, setAllCancelLoading] = useState(false);
  const [allCancelError, setAllCancelError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [states, setStates] = useState<Record<string, TriggerState>>({
    sector: { status: "idle", message: null },
    single: { status: "idle", message: null },
  });
  const [sectorId, setSectorId] = useState("");
  const [peerGroupId, setPeerGroupId] = useState("");

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsMeta, setLogsMeta] = useState<{
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsPage, setLogsPage] = useState(1);

  const fetchLogs = useCallback(async (page = 1) => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const res = await fetch(
        `${API_BASE}/admin/peer-metrics/logs?page=${page}&limit=10`,
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
          hasNextPage: json.pagination.hasNextPage,
          hasPrevPage: json.pagination.hasPrevPage,
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

  // ── "All" job polling ────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const pollJob = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/${id}`);
      const json: JobPollResponse = await res.json();
      if (!json.success || !json.data) return;
      setAllJobData(json.data);
      if (JOB_TERMINAL.has(json.data.status)) {
        stopPolling();
        setAllJobStatus("done");
      }
    } catch { /* keep polling on transient errors */ }
  }, [stopPolling]);

  const startPolling = useCallback((id: string) => {
    stopPolling();
    pollRef.current = setInterval(() => pollJob(id), POLL_INTERVAL_MS);
    pollJob(id);
  }, [pollJob, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleRunAll = async () => {
    setAllJobStatus("submitting");
    setAllJobError(null);
    setAllJobId(null);
    setAllJobData(null);
    setAllCancelError(null);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "all" }),
      });
      const json: JobTriggerResponse = await res.json();
      if (!json.success || !json.data) {
        setAllJobError(json.error ?? "Request failed.");
        setAllJobStatus("error");
        return;
      }
      setAllJobId(json.data.jobId);
      setAllJobStatus("polling");
      startPolling(json.data.jobId);
    } catch {
      setAllJobError("Network error — server unreachable.");
      setAllJobStatus("error");
    }
  };

  const handleCancelAll = async () => {
    if (!allJobId) return;
    setAllCancelLoading(true);
    setAllCancelError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/${allJobId}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!json.success) setAllCancelError(json.error ?? "Failed to cancel job.");
    } catch {
      setAllCancelError("Network error — could not cancel job.");
    } finally {
      setAllCancelLoading(false);
    }
  };

  const resetAll = () => {
    stopPolling();
    setAllJobStatus("idle");
    setAllJobError(null);
    setAllJobId(null);
    setAllJobData(null);
    setAllCancelError(null);
  };

  const updateState = (key: string, update: Partial<TriggerState>) =>
    setStates((prev) => ({ ...prev, [key]: { ...prev[key], ...update } }));

  const triggerFetch = async (
    key: string,
    body: Record<string, string>,
  ) => {
    updateState(key, { status: "loading", message: null });
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json: ApiResponse = await res.json();
      updateState(key, {
        status: json.success ? "success" : "error",
        message: json.message ?? json.error ?? null,
      });
      if (json.success) fetchLogs(1);
    } catch {
      updateState(key, {
        status: "error",
        message: "Network error — server unreachable.",
      });
    }
  };

  const reset = (key: string) =>
    setStates((prev) => ({
      ...prev,
      [key]: { status: "idle", message: null },
    }));

  const isAllRunning = allJobStatus === "submitting" || allJobStatus === "polling";
  const isAllActive = allJobStatus === "polling" && allJobData && !JOB_TERMINAL.has(allJobData.status);
  const canCancelAll = isAllActive && !allJobData?.cancelRequested;

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
          <div className="p-2 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20">
            <BarChart3 className="w-5 h-5 text-fuchsia-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Peer Group Metrics</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2 ml-[3.25rem]">
          Compute and ingest peer group metrics for all groups, a specific
          sector, or a single peer group.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left column — Trigger Cards */}
        <div className="flex flex-col gap-4">
          {/* Card 1: Complete Ingest */}
          <div className="border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 shrink-0">
                <Globe className="w-4 h-4 text-fuchsia-400" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm">Complete Peer Group Ingest</h2>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Computes peer group metrics for all groups across every
                  sector. Safe to run multiple times.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {allJobStatus === "done" || allJobStatus === "error" ? (
                <Button variant="outline" size="sm" onClick={resetAll} className="text-xs h-8">
                  Run again
                </Button>
              ) : (
                <Button
                  onClick={handleRunAll}
                  disabled={isAllRunning}
                  size="sm"
                  className="gap-2 text-white font-semibold shadow-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed bg-fuchsia-600 hover:bg-fuchsia-700 active:bg-fuchsia-800 shadow-fuchsia-900/30 hover:shadow-fuchsia-900/40"
                >
                  {isAllRunning ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" />{allJobStatus === "submitting" ? "Submitting…" : "Processing…"}</>
                  ) : (
                    <><Play className="w-3.5 h-3.5" />Run Full Ingest</>
                  )}
                </Button>
              )}

              {canCancelAll && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={handleCancelAll}
                  disabled={allCancelLoading}
                >
                  {allCancelLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                  Cancel
                </Button>
              )}

              {allJobData?.cancelRequested && !JOB_TERMINAL.has(allJobData.status) && (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5" /> Cancellation requested…
                </span>
              )}
            </div>

            {allJobError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">{allJobError}</p>
              </div>
            )}

            {allCancelError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-xs text-destructive">{allCancelError}</p>
              </div>
            )}

            {allJobData && <JobPanel job={allJobData} />}

            {allJobId && !allJobData && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Job <span className="font-mono text-foreground/70">{allJobId}</span> — waiting for status…
              </div>
            )}

            <p className="text-[10px] text-muted-foreground/40 font-mono">
              {`POST ${ENDPOINT} · { "scope": "all" }`}
            </p>
          </div>

          {/* Card 2: Sector-Specific Ingest */}
          <div className="border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 shrink-0">
                <Building2 className="w-4 h-4 text-violet-400" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm">
                  Sector-Specific Ingest
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Compute peer metrics for all groups within a given sector.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Sector ID
              </label>
              <input
                type="text"
                value={sectorId}
                onChange={(e) => setSectorId(e.target.value)}
                placeholder="e.g. sector_abc123"
                className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background/60 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40 transition-all"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                onClick={() =>
                  triggerFetch("sector", {
                    scope: "sector",
                    sectorId: sectorId.trim(),
                  })
                }
                disabled={
                  states.sector.status === "loading" || !sectorId.trim()
                }
                size="sm"
                className="gap-2 text-white font-semibold shadow-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed bg-violet-600 hover:bg-violet-700 active:bg-violet-800 shadow-violet-900/30 hover:shadow-violet-900/40"
              >
                {states.sector.status === "loading" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Run Sector Ingest
                  </>
                )}
              </Button>
              {states.sector.status !== "idle" &&
                states.sector.status !== "loading" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reset("sector")}
                    className="text-xs h-8"
                  >
                    Reset
                  </Button>
                )}
              {states.sector.status === "success" && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {states.sector.message ?? "Started"}
                </span>
              )}
              {states.sector.status === "error" && (
                <span className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {states.sector.message ?? "Failed"}
                </span>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground/40 font-mono">
              {`POST ${ENDPOINT} · { "scope": "sector", "sectorId": "..." }`}
            </p>
          </div>

          {/* Card 3: Single Peer Group */}
          <div className="border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
                <Hash className="w-4 h-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm">
                  Single Peer Group Ingest
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Compute peer metrics for a specific peer group by its ID.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Peer Group ID
              </label>
              <input
                type="text"
                value={peerGroupId}
                onChange={(e) => setPeerGroupId(e.target.value)}
                placeholder="e.g. grp_xyz789"
                className="w-full h-9 px-3 rounded-lg border border-border/60 bg-background/60 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                onClick={() =>
                  triggerFetch("single", {
                    scope: "single",
                    peerGroupId: peerGroupId.trim(),
                  })
                }
                disabled={
                  states.single.status === "loading" || !peerGroupId.trim()
                }
                size="sm"
                className="gap-2 text-white font-semibold shadow-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-amber-900/30 hover:shadow-amber-900/40"
              >
                {states.single.status === "loading" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Run Single Ingest
                  </>
                )}
              </Button>
              {states.single.status !== "idle" &&
                states.single.status !== "loading" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reset("single")}
                    className="text-xs h-8"
                  >
                    Reset
                  </Button>
                )}
              {states.single.status === "success" && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {states.single.message ?? "Started"}
                </span>
              )}
              {states.single.status === "error" && (
                <span className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {states.single.message ?? "Failed"}
                </span>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground/40 font-mono">
              {`POST ${ENDPOINT} · { "scope": "single", "peerGroupId": "..." }`}
            </p>
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
              <Loader2 className="w-6 h-6 text-fuchsia-400 animate-spin" />
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
                disabled={!logsMeta.hasPrevPage || logsLoading}
                onClick={() => fetchLogs(logsPage - 1)}
                className="h-8 px-3 text-xs"
              >
                ← Previous
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                Page {logsPage} of {logsMeta.totalPages} &nbsp;·&nbsp;{" "}
                {logsMeta.total.toLocaleString()} total
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!logsMeta.hasNextPage || logsLoading}
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

// ── Job status panel ──────────────────────────────────────────────────────────
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
            className="h-full rounded-full bg-fuchsia-500 transition-all duration-500"
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
  const isSuccess = log.status === "success";
  const runLabel = RUN_TYPE_LABEL[log.runType] ?? log.runType;
  const triggerLabel = TRIGGER_TYPE_LABEL[log.triggerType] ?? log.triggerType;

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors duration-150">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-destructive shrink-0" />
          )}
          <span
            className={`text-xs font-semibold capitalize ${isSuccess ? "text-emerald-400" : "text-destructive"}`}
          >
            {log.status}
          </span>
          <span className="text-xs text-muted-foreground/50">·</span>
          <span className="text-xs text-muted-foreground">{runLabel}</span>
          <span className="text-xs text-muted-foreground/50">·</span>
          <span className="text-xs text-muted-foreground/70">
            {triggerLabel}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground/60 shrink-0">
          {formatDateTime(log.createdAt)}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <LogPill label="Fiscal Year" value={log.fiscalYear} />
        <LogPill
          label="Computed"
          value={log.groupsComputed.toLocaleString()}
          accent
        />
        <LogPill label="Skipped" value={log.groupsSkipped.toLocaleString()} />
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

export default PeerGroupMetricsPage;
