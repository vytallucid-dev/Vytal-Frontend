
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Settings2,
  Layers,
  TrendingUp,
  CalendarDays,
  PieChart,
  UserSearch,
  Newspaper,
  BarChart3,
  BarChart2,
  Briefcase,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Ban,
  Loader2,
  ScrollText,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const POLL_INTERVAL_MS = 3000;

// ─── Static data ─────────────────────────────────────────────────────────────

const uploadFlows = [
  {
    id: "block-deals",
    title: "Block Deals",
    description:
      "Trigger the daily ingestion of block deal data from the exchange. Fetches, deduplicates, and inserts bulk trade records.",
    icon: Layers,
    href: "/settings/block-deals",
    accent: "from-violet-500/20 to-purple-500/10",
    iconColor: "text-violet-400",
    borderHover: "hover:border-violet-500/40",
  },
  {
    id: "stock-prices",
    title: "Stock Prices",
    description:
      "Trigger the daily ingestion of NSE Bhavcopy stock price data. Fetches, deduplicates, and inserts end-of-day price records.",
    icon: TrendingUp,
    href: "/settings/stock-prices",
    accent: "from-sky-500/20 to-blue-500/10",
    iconColor: "text-sky-400",
    borderHover: "hover:border-sky-500/40",
  },
  {
    id: "corporate-events",
    title: "Corporate Events",
    description:
      "Trigger the ingestion of corporate events (dividends, splits, bonuses). Fetches from NSE and upserts upcoming event records.",
    icon: CalendarDays,
    href: "/settings/corporate-events",
    accent: "from-orange-500/20 to-amber-500/10",
    iconColor: "text-orange-400",
    borderHover: "hover:border-orange-500/40",
  },
  {
    id: "shareholding-patterns",
    title: "Shareholding Patterns",
    description:
      "Trigger the quarterly ingestion of shareholding pattern data. Fetches promoter, FII, DII and public holding data per stock.",
    icon: PieChart,
    href: "/settings/shareholding-patterns",
    accent: "from-rose-500/20 to-pink-500/10",
    iconColor: "text-rose-400",
    borderHover: "hover:border-rose-500/40",
  },
  {
    id: "insider-trades",
    title: "Insider Trades",
    description:
      "Trigger the daily ingestion of insider trading activity. Fetches, filters tracked stocks, and inserts new trade records.",
    icon: UserSearch,
    href: "/settings/insider-trades",
    accent: "from-cyan-500/20 to-teal-500/10",
    iconColor: "text-cyan-400",
    borderHover: "hover:border-cyan-500/40",
  },
  {
    id: "news-announcements",
    title: "News & Announcements",
    description:
      "Trigger ingestion of NSE announcements, Google News, and run the content extractor to enrich news articles.",
    icon: Newspaper,
    href: "/settings/news-announcements",
    accent: "from-indigo-500/20 to-blue-500/10",
    iconColor: "text-indigo-400",
    borderHover: "hover:border-indigo-500/40",
  },
  {
    id: "peer-group-metrics",
    title: "Peer Group Metrics",
    description:
      "Compute and ingest peer group metrics for all groups, a specific sector, or a single peer group.",
    icon: BarChart3,
    href: "/settings/peer-group-metrics",
    accent: "from-fuchsia-500/20 to-purple-500/10",
    iconColor: "text-fuchsia-400",
    borderHover: "hover:border-fuchsia-500/40",
  },
  {
    id: "quarterly-results",
    title: "Quarterly Results",
    description:
      "Trigger ingestion of quarterly financial results. Backfill for a specific stock, the entire universe, or scan for new filings.",
    icon: BarChart2,
    href: "/settings/quarterly-results",
    accent: "from-amber-500/20 to-yellow-500/10",
    iconColor: "text-amber-400",
    borderHover: "hover:border-amber-500/40",
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface Job {
  id: string;
  type: string;
  status: string;
  priority: number;
  result: unknown;
  errorMessage: string | null;
  errorStack: string | null;
  progress: number;
  progressNote: string;
  cancelRequested: boolean;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  triggeredBy: string;
  attempts: number;
  maxAttempts: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatJobType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    hour12: false,
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const statusConfig: Record<
  string,
  { color: string; Icon: React.ElementType; spin?: boolean }
> = {
  running: {
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    Icon: Loader2,
    spin: true,
  },
  pending: {
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    Icon: Clock,
  },
  completed: {
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Icon: CheckCircle2,
  },
  cancelled: {
    color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    Icon: Ban,
  },
  failed: {
    color: "text-red-400 bg-red-500/10 border-red-500/20",
    Icon: AlertCircle,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  const { Icon, color, spin } = cfg;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide ${color}`}
    >
      <Icon className={`w-3 h-3 ${spin ? "animate-spin" : ""}`} />
      {status}
    </span>
  );
}

// ─── Progress bar color ───────────────────────────────────────────────────────

function progressColor(status: string): string {
  if (status === "failed") return "bg-red-500";
  if (status === "cancelled") return "bg-orange-500";
  if (status === "completed") return "bg-emerald-500";
  return "bg-blue-500";
}

// ─── Job Card (active jobs) ───────────────────────────────────────────────────

function JobCard({
  job,
  onCancel,
  isCancelling,
}: {
  job: Job;
  onCancel: (id: string) => void;
  isCancelling: boolean;
}) {
  const canCancel = !job.cancelRequested && !isCancelling;

  return (
    <div className="border border-border/50 rounded-xl bg-background/50 backdrop-blur-sm p-4 flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-semibold text-sm">{formatJobType(job.type)}</span>
            <StatusBadge status={job.status} />
          </div>
          <p className="text-[10px] font-mono text-muted-foreground/60 truncate">
            {job.id}
          </p>
        </div>

        <button
          onClick={() => onCancel(job.id)}
          disabled={!canCancel}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors
            text-red-400 border-red-500/20 bg-red-500/5
            hover:bg-red-500/15 enabled:cursor-pointer
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isCancelling ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <X className="w-3 h-3" />
          )}
          {job.cancelRequested ? "Cancelling…" : "Cancel"}
        </button>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground truncate pr-2">
            {job.progressNote || "Processing…"}
          </span>
          <span className="text-xs font-semibold tabular-nums shrink-0">
            {job.progress}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor(job.status)}`}
            style={{ width: `${Math.min(job.progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground/70">
        <span>Started: {formatDate(job.startedAt)}</span>
        <span>
          Attempt {job.attempts}/{job.maxAttempts}
        </span>
        {job.triggeredBy && <span>By: {job.triggeredBy}</span>}
      </div>

      {/* Error */}
      {job.errorMessage && (
        <p className="text-xs text-red-400/80 bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2">
          {job.errorMessage}
        </p>
      )}
    </div>
  );
}

// ─── Active Jobs panel ────────────────────────────────────────────────────────

function ActiveJobsPanel() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<Set<string>>(new Set());

  const fetchActive = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/jobs/active`);
      const data = await res.json();
      if (data.success) setJobs(data.data);
    } catch {
      // silently ignore network errors
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll active jobs
  useEffect(() => {
    fetchActive();
    const interval = setInterval(fetchActive, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchActive]);

  const cancelJob = async (id: string) => {
    setCancelling((prev) => new Set(prev).add(id));
    try {
      await fetch(`${API_BASE}/admin/jobs/${id}/cancel`, { method: "POST" });
    } catch {
      // silently ignore
    } finally {
      setCancelling((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 min-w-0">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Active Jobs
          </span>
          {jobs.length > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {jobs.length}
            </span>
          )}
        </div>
        <button
          onClick={fetchActive}
          title="Refresh"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center border border-border/40 rounded-xl bg-background/20">
          <CheckCircle2 className="w-8 h-8 text-muted-foreground/25 mb-3" />
          <p className="text-sm text-muted-foreground">No active jobs</p>
          <p className="text-xs text-muted-foreground/50 mt-0.5">
            All jobs have completed
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onCancel={cancelJob}
              isCancelling={cancelling.has(job.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Log entry ────────────────────────────────────────────────────────────────

function LogEntry({ log }: { log: Job }) {
  return (
    <div className="px-3 py-2.5 hover:bg-muted/20 transition-colors border-b border-border/20 last:border-b-0">
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className="text-xs font-medium truncate">{formatJobType(log.type)}</span>
        <StatusBadge status={log.status} />
      </div>
      <div className="flex items-center gap-3 mt-0.5">
        <span className="font-mono text-[10px] text-muted-foreground/50">
          {log.id.slice(0, 8)}…
        </span>
        <span className="text-[11px] text-muted-foreground">
          {formatDate(log.createdAt)}
        </span>
      </div>
      {log.progressNote && (
        <p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">
          {log.progressNote}
        </p>
      )}
      {log.errorMessage && (
        <p className="text-[11px] text-red-400/70 mt-0.5 truncate">
          {log.errorMessage}
        </p>
      )}
    </div>
  );
}

// ─── History Logs panel ───────────────────────────────────────────────────────

function HistoryLogsPanel() {
  const [logs, setLogs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const fetchLogs = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/admin/jobs?page=${page}&limit=10`
      );
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setPagination(data.pagination);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            History Logs
          </span>
          {pagination.total > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border/40">
              {pagination.total}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchLogs(pagination.page)}
          title="Refresh"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Log list */}
      <div className="flex flex-col flex-1 border border-border/40 rounded-xl bg-background/30 overflow-hidden">
        <div className="flex-1 overflow-y-auto hidden-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              No logs found
            </div>
          ) : (
            logs.map((log) => <LogEntry key={log.id} log={log} />)
          )}
        </div>

        {/* Pagination footer */}
        <div className="border-t border-border/30 px-3 py-2 flex items-center justify-between bg-background/20 shrink-0">
          <span className="text-[11px] text-muted-foreground">
            {pagination.total} entries · p{pagination.page}/{pagination.totalPages}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="p-1 rounded hover:bg-muted/50 transition-colors text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="p-1 rounded hover:bg-muted/50 transition-colors text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Manage Jobs tab ──────────────────────────────────────────────────────────

function ManageJobsTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-6 items-start">
      <ActiveJobsPanel />
      <HistoryLogsPanel />
    </div>
  );
}

// ─── Data Upload Flows tab ────────────────────────────────────────────────────

function DataUploadFlowsTab() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {uploadFlows.map((flow) => {
        const Icon = flow.icon;
        return (
          <Link href={flow.href} key={flow.id} className="group">
            <div
              className={`relative flex flex-col gap-4 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm p-6 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:shadow-ring/10 ${flow.borderHover} hover:-translate-y-0.5`}
            >
              {/* Background gradient accent */}
              <div
                className={`absolute inset-0 rounded-xl bg-gradient-to-br ${flow.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
              />
              <div className="relative flex items-start justify-between">
                <div
                  className={`p-3 rounded-lg bg-background/80 border border-border/50 ${flow.iconColor}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all duration-200 mt-1" />
              </div>
              <div className="relative">
                <h3 className="font-semibold text-base mb-1.5">{flow.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {flow.description}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "upload" | "jobs";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "upload", label: "Data Upload Flows", icon: Upload },
  { id: "jobs", label: "Manage Jobs", icon: Briefcase },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>("upload");

  return (
    <div className="flex flex-col gap-5 pb-4 overflow-y-auto hidden-scrollbar">
      {/* Compact header */}
      <div className="flex items-center gap-3 px-1 pt-1">
        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Settings2 className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-bold leading-tight">Admin Settings</h1>
          <p className="text-xs text-muted-foreground">
            Manage data ingestion pipelines and backend upload flows.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-col gap-5">
        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-border/50">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px
                  ${
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "upload" && <DataUploadFlowsTab />}
        {activeTab === "jobs" && <ManageJobsTab />}
      </div>
    </div>
  );
}

