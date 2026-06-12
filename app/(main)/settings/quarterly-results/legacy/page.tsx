"use client";

import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClockIcon,
  Database,
  History,
  Loader2,
  Play,
  RefreshCw,
  Search,
  TrendingUp,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface BackfillJobResponse {
  success: boolean;
  data?: { jobId: string; statusUrl: string; message: string };
  error?: string;
}

interface ResultsLogEntry {
  id: string;
  symbol: string;
  quarter: number | null;
  fiscalYear: string | null;
  status: "success" | "failed" | "skipped" | "refreshed" | "upgraded" | string;
  source: string;
  resultType: string | null;
  xbrlUrl: string | null;
  filingDate: string | null;
  durationMs: number | null;
  error: string | null;
  fetchedAt: string;
}

interface LogsResponse {
  success: boolean;
  data?: {
    logs: ResultsLogEntry[];
    pagination: { total: number; page: number; limit: number; pages: number };
  };
}

type JobStatus = "idle" | "submitting" | "polling" | "done" | "error";

// ── Constants ─────────────────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const POLL_INTERVAL_MS = 2500;
const JOB_TERMINAL = new Set(["succeeded", "failed", "cancelled"]);

// Industries where LI and GI are flagged as unsupported for legacy
const ALL_INDUSTRIES = [
  { value: "banking", label: "Banking", legacyDisabled: false },
  { value: "nbfc", label: "NBFC", legacyDisabled: false },
  {
    value: "life_insurance",
    label: "Life Insurance",
    legacyDisabled: true,
  },
  {
    value: "general_insurance",
    label: "General Insurance",
    legacyDisabled: true,
  },
  { value: "non_financial", label: "Non-Financial", legacyDisabled: false },
];

const LEGACY_SOURCE_OPTIONS = [
  { value: "nse_xbrl_quarterly_legacy", label: "Quarterly Legacy" },
  { value: "nse_xbrl_annual_legacy", label: "Annual Legacy" },
];

const LOG_STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "skipped", label: "Skipped" },
  { value: "refreshed", label: "Refreshed" },
  { value: "upgraded", label: "Upgraded" },
];

const TODAY = new Date().toISOString().split("T")[0];
const DEFAULT_FROM = "2020-04-01";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

const quarterLabel = (quarter: number | null, fiscalYear: string | null) => {
  if (!quarter || !fiscalYear) return null;
  const fy =
    fiscalYear.length === 4 ? `FY${fiscalYear.slice(2)}` : fiscalYear;
  return `Q${quarter} ${fy}`;
};

const isLegacySource = (source: string) => source.includes("legacy");

// ── jobMeta ───────────────────────────────────────────────────────────────────

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

// ── Log status meta ───────────────────────────────────────────────────────────

const LOG_STATUS_META: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  success: { label: "Success", color: "text-emerald-400", icon: CheckCircle2 },
  failed: { label: "Failed", color: "text-destructive", icon: XCircle },
  skipped: { label: "Skipped", color: "text-amber-400", icon: ClockIcon },
  refreshed: { label: "Refreshed", color: "text-blue-400", icon: RefreshCw },
  upgraded: { label: "Upgraded", color: "text-cyan-400", icon: CheckCircle2 },
};

const getLogStatusMeta = (status: string) =>
  LOG_STATUS_META[status] ?? {
    label: status,
    color: "text-muted-foreground",
    icon: ClockIcon,
  };

// ── Primitive shared components ───────────────────────────────────────────────

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
      className={`text-[11px] font-semibold tabular-nums ${
        accent ? "text-emerald-400" : "text-foreground/80"
      }`}
    >
      {value}
    </span>
  </div>
);

const SourceBadge = ({ source }: { source: string }) => (
  <span
    className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
      isLegacySource(source)
        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
        : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
    }`}
  >
    {isLegacySource(source) ? "legacy" : "v3"}
  </span>
);

// ── ResultsLogRow ─────────────────────────────────────────────────────────────

const ResultsLogRow = ({ log }: { log: ResultsLogEntry }) => {
  const meta = getLogStatusMeta(log.status);
  const StatusIcon = meta.icon;
  const ql = quarterLabel(log.quarter, log.fiscalYear);

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors duration-150">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-4 h-4 shrink-0 ${meta.color}`} />
          <span className="text-xs font-semibold text-foreground/90">
            {log.symbol}
          </span>
          <span className="text-xs text-muted-foreground/50">·</span>
          <span className={`text-xs font-medium ${meta.color}`}>
            {meta.label}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground/60 shrink-0">
          {formatDateTime(log.fetchedAt)}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {ql && <LogPill label="Quarter" value={ql} />}
        <SourceBadge source={log.source} />
        {log.resultType && <LogPill label="Type" value={log.resultType} />}
        {log.durationMs != null && (
          <LogPill label="Duration" value={formatDuration(log.durationMs)} />
        )}
      </div>

      {log.error && (
        <p className="text-[11px] text-destructive/80 bg-destructive/5 rounded px-2 py-1 font-mono">
          {log.error}
        </p>
      )}
    </div>
  );
};

// ── BackfillJobPanel ──────────────────────────────────────────────────────────

const BackfillJobPanel = ({ job }: { job: JobData }) => {
  const meta = jobMeta[job.status] ?? jobMeta.pending;
  const isTerminal = JOB_TERMINAL.has(job.status);
  const [showFailures, setShowFailures] = useState(false);

  const r = job.result as Record<string, unknown> | null;

  const stats: [string, number | undefined, boolean][] = r
    ? [
        ["Filings", r.totalFilings as number | undefined, false],
        ["Ingested", r.ingested as number | undefined, true],
        ["Upgraded", r.upgraded as number | undefined, false],
        ["Refreshed", r.refreshed as number | undefined, false],
        ["Skipped", r.skipped as number | undefined, false],
        ["Failed", r.failed as number | undefined, false],
      ]
    : [];

  const failedCount = r ? ((r.failed as number) ?? 0) : 0;
  const failedDetails = r
    ? ((r.failedDetails ?? r.errors) as
        | Array<{ symbol: string; filing: string; error: string }>
        | undefined)
    : undefined;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-muted/20 p-4">
      {/* Status row */}
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

      {/* Progress bar */}
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

      {r && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                      label === "Failed" && failedCount > 0
                        ? "text-destructive"
                        : accent
                          ? "text-emerald-400"
                          : "text-foreground/80"
                    }`}
                  >
                    {(value as number).toLocaleString()}
                  </span>
                </div>
              ))}
          </div>

          {failedCount > 0 && failedDetails && (
            <div>
              <button
                type="button"
                onClick={() => setShowFailures((p) => !p)}
                className="flex items-center gap-1.5 text-xs text-destructive/80 hover:text-destructive transition-colors"
              >
                {showFailures ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                {showFailures ? "Hide failures" : "View failures"}
              </button>
              {showFailures && (
                <div className="mt-2 flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                  {failedDetails.map((f, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-0.5 rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-destructive/80">
                          {f.symbol}
                        </span>
                        {f.filing && (
                          <span className="text-[10px] text-muted-foreground/60">
                            {f.filing}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-destructive/70 font-mono">
                        {f.error}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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

// ── LegacyFetchLogCard ────────────────────────────────────────────────────────

const LegacyFetchLogCard = () => {
  const [logs, setLogs] = useState<ResultsLogEntry[]>([]);
  const [logsMeta, setLogsMeta] = useState<{
    total: number;
    pages: number;
  } | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logsPage, setLogsPage] = useState(1);
  const [symbolFilter, setSymbolFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState(
    "nse_xbrl_quarterly_legacy",
  );

  const fetchLogs = useCallback(
    async (page = 1) => {
      setLogsLoading(true);
      setLogsError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "10",
          source: sourceFilter,
        });
        if (symbolFilter.trim())
          params.set("symbol", symbolFilter.trim().toUpperCase());
        if (statusFilter) params.set("status", statusFilter);
        const res = await fetch(
          `${API_BASE}/admin/results-scan/logs?${params}`,
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
    },
    [symbolFilter, statusFilter, sourceFilter],
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  return (
    <div className="border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-base">Legacy Fetch Log</h2>
          {logsMeta && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {logsMeta.total.toLocaleString()} records
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

      {/* Filter bar */}
      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
          <input
            value={symbolFilter}
            onChange={(e) => setSymbolFilter(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLogs(1)}
            placeholder="Filter by symbol…"
            className="w-full rounded-lg border border-border/60 bg-background/80 pl-8 pr-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition"
          >
            {LOG_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="flex-1 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition"
          >
            {LEGACY_SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
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
          <Database className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground/50">
            No legacy fetch logs found.
          </p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {logs.map((log) => (
            <ResultsLogRow key={log.id} log={log} />
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
            ← Prev
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {logsPage} / {logsMeta.pages}
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
  );
};

// ── Job polling hook (inline per component) ───────────────────────────────────

function useJobPoller() {
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

  const reset = useCallback(
    (clearFn?: () => void) => {
      stopPolling();
      setJobStatus("idle");
      setJobError(null);
      setJobId(null);
      setJobData(null);
      setCancelError(null);
      clearFn?.();
    },
    [stopPolling],
  );

  const submitJob = useCallback(
    async (url: string, body: Record<string, unknown>) => {
      setJobStatus("submitting");
      setJobError(null);
      setJobId(null);
      setJobData(null);
      setCancelError(null);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json: BackfillJobResponse = await res.json();
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
    },
    [startPolling],
  );

  const isRunning = jobStatus === "submitting" || jobStatus === "polling";
  const isActive =
    jobStatus === "polling" && jobData && !JOB_TERMINAL.has(jobData.status);
  const canCancel = isActive && !jobData?.cancelRequested;

  return {
    jobStatus,
    jobError,
    jobId,
    jobData,
    cancelLoading,
    cancelError,
    isRunning,
    canCancel,
    submitJob,
    handleCancel,
    reset,
  };
}

// ── SymbolLegacyBackfillSection ───────────────────────────────────────────────

const SymbolLegacyBackfillSection = () => {
  const [symbol, setSymbol] = useState("");
  const [fromDate, setFromDate] = useState(DEFAULT_FROM);
  const [toDate, setToDate] = useState(TODAY);
  const poller = useJobPoller();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) return;
    const body: Record<string, unknown> = {
      symbol: symbol.trim().toUpperCase(),
    };
    if (fromDate) body.fromDate = fromDate;
    if (toDate) body.toDate = toDate;
    await poller.submitJob(`${API_BASE}/admin/legacy-backfill/symbol`, body);
  };

  const reset = () =>
    poller.reset(() => {
      setSymbol("");
      setFromDate(DEFAULT_FROM);
      setToDate(TODAY);
    });

  return (
    <div className="border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-6 flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-4 h-4 text-amber-400" />
          <h2 className="font-semibold text-base">Symbol Legacy Backfill</h2>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Job-based
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Backfill historical quarterly results for a single symbol using the v2
          NSE legacy XBRL endpoint.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Symbol
            </label>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. TCS"
              disabled={poller.isRunning}
              className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition disabled:opacity-50 uppercase"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              From Date{" "}
              <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              disabled={poller.isRunning}
              className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              To Date{" "}
              <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              disabled={poller.isRunning}
              className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition disabled:opacity-50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {poller.jobStatus === "done" || poller.jobStatus === "error" ? (
            <Button type="button" variant="outline" onClick={reset}>
              Run another backfill
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={poller.isRunning || !symbol.trim()}
              className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-60"
            >
              {poller.isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {poller.jobStatus === "submitting"
                    ? "Submitting…"
                    : "Processing…"}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Backfill
                </>
              )}
            </Button>
          )}

          {poller.canCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={poller.handleCancel}
              disabled={poller.cancelLoading}
            >
              {poller.cancelLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Ban className="w-3.5 h-3.5" />
              )}
              Cancel Job
            </Button>
          )}

          {poller.jobData?.cancelRequested &&
            !JOB_TERMINAL.has(poller.jobData.status) && (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <ClockIcon className="w-3.5 h-3.5" /> Cancellation requested…
              </span>
            )}
        </div>

        {poller.jobError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">{poller.jobError}</p>
          </div>
        )}

        {poller.cancelError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">{poller.cancelError}</p>
          </div>
        )}
      </form>

      {poller.jobId && !poller.jobData && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Job{" "}
          <span className="font-mono text-foreground/70">{poller.jobId}</span>{" "}
          — waiting for status…
        </div>
      )}

      {poller.jobData && <BackfillJobPanel job={poller.jobData} />}
    </div>
  );
};

// ── UniverseLegacyBackfillSection ─────────────────────────────────────────────

const UniverseLegacyBackfillSection = () => {
  const [fromDate, setFromDate] = useState(DEFAULT_FROM);
  const [toDate, setToDate] = useState(TODAY);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [limit, setLimit] = useState("");
  const poller = useJobPoller();

  // Warn if LI or GI selected (they're disabled, but double-check via state)
  const hasInsuranceSelected = selectedIndustries.some((i) =>
    ["life_insurance", "general_insurance"].includes(i),
  );

  const toggleIndustry = (v: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(v) ? prev.filter((i) => i !== v) : [...prev, v],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {};
    if (fromDate) body.fromDate = fromDate;
    if (toDate) body.toDate = toDate;
    if (selectedIndustries.length > 0) {
      body.industries = selectedIndustries;
    }
    const parsedLimit = parseInt(limit, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      body.limit = parsedLimit;
    }
    await poller.submitJob(
      `${API_BASE}/admin/legacy-backfill/universe`,
      body,
    );
  };

  const reset = () =>
    poller.reset(() => {
      setFromDate(DEFAULT_FROM);
      setToDate(TODAY);
      setSelectedIndustries([]);
      setLimit("");
    });

  return (
    <div className="border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm shadow-sm p-6 flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <History className="w-4 h-4 text-amber-400" />
          <h2 className="font-semibold text-base">
            Universe Legacy Backfill
          </h2>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Job-based
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Backfill historical quarterly results for all tracked symbols using
          the v2 NSE legacy XBRL endpoint. Defaults to 2020-04-01 → today if
          no dates are provided.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Date range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              From Date{" "}
              <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              disabled={poller.isRunning}
              className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition disabled:opacity-50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              To Date{" "}
              <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              disabled={poller.isRunning}
              className="rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition disabled:opacity-50"
            />
          </div>
        </div>

        {/* Industries multi-select — LI/GI disabled */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Industries{" "}
            <span className="text-muted-foreground/50">
              (optional — all non-insurance if empty)
            </span>
          </span>
          <div className="flex flex-wrap gap-2">
            {ALL_INDUSTRIES.map((ind) => {
              const isSelected = selectedIndustries.includes(ind.value);
              const isDisabled = ind.legacyDisabled || poller.isRunning;
              return (
                <div key={ind.value} className="relative group">
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() =>
                      !ind.legacyDisabled && toggleIndustry(ind.value)
                    }
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors duration-150 ${
                      ind.legacyDisabled
                        ? "opacity-40 cursor-not-allowed bg-background/60 border-border/40 text-muted-foreground/60"
                        : isSelected
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400"
                          : "bg-background/80 border-border/60 text-muted-foreground hover:border-cyan-500/30 hover:text-foreground disabled:opacity-50"
                    }`}
                  >
                    {ind.label}
                  </button>
                  {ind.legacyDisabled && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex pointer-events-none z-10">
                      <div className="bg-background border border-border/60 rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap">
                        <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[180px] whitespace-normal">
                          NSE legacy endpoint doesn&apos;t carry insurance
                          data — returns zero filings
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {hasInsuranceSelected && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Life Insurance and General Insurance return zero filings from the
              NSE legacy endpoint.
            </div>
          )}
        </div>

        {/* Limit */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Limit{" "}
            <span className="text-muted-foreground/50">(optional)</span>
          </label>
          <input
            type="number"
            min={1}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="e.g. 50"
            disabled={poller.isRunning}
            className="w-32 rounded-lg border border-border/60 bg-background/80 px-3 py-2 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition disabled:opacity-50"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {poller.jobStatus === "done" || poller.jobStatus === "error" ? (
            <Button type="button" variant="outline" onClick={reset}>
              Run another backfill
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={poller.isRunning}
              className="gap-2 bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-60"
            >
              {poller.isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {poller.jobStatus === "submitting"
                    ? "Submitting…"
                    : "Processing…"}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Universe Backfill
                </>
              )}
            </Button>
          )}

          {poller.canCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={poller.handleCancel}
              disabled={poller.cancelLoading}
            >
              {poller.cancelLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Ban className="w-3.5 h-3.5" />
              )}
              Cancel Job
            </Button>
          )}

          {poller.jobData?.cancelRequested &&
            !JOB_TERMINAL.has(poller.jobData.status) && (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <ClockIcon className="w-3.5 h-3.5" /> Cancellation requested…
              </span>
            )}
        </div>

        {poller.jobError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">{poller.jobError}</p>
          </div>
        )}

        {poller.cancelError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive">{poller.cancelError}</p>
          </div>
        )}
      </form>

      {poller.jobId && !poller.jobData && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Job{" "}
          <span className="font-mono text-foreground/70">{poller.jobId}</span>{" "}
          — waiting for status…
        </div>
      )}

      {poller.jobData && <BackfillJobPanel job={poller.jobData} />}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const LegacyBackfillPage = () => {
  return (
    <div className="flex flex-col gap-8 pb-4 overflow-y-auto hidden-scrollbar">
      {/* Header */}
      <div className="w-full border rounded-xl border-border/50 bg-background/50 backdrop-blur-sm py-8 px-6 shadow-lg shadow-ring/10">
        <Link
          href="/settings/quarterly-results"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Quarterly Results
        </Link>

        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Legacy (v2) Backfill
          </h1>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Historical
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-2 ml-[3.25rem]">
          Backfill historical quarterly results using the v2 NSE legacy XBRL
          endpoint. Use this to populate data prior to the v3 pipeline
          rollout.
        </p>
      </div>

      {/* Main layout: left (2 sections) + right (log) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Left — two backfill sections */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <SymbolLegacyBackfillSection />
          <UniverseLegacyBackfillSection />
        </div>

        {/* Right — Legacy fetch log */}
        <LegacyFetchLogCard />
      </div>
    </div>
  );
};

export default LegacyBackfillPage;
