"use client";

// ─────────────────────────────────────────────────────────────
// RETENTION — the admin surface over retention_policy. Edits values that DELETE
// production data on the nightly 3 AM run, so the guardrails are the point:
//   · the floor is a UI FENCE (numeric inputs can't go below it) as well as the
//     engine's clamp (the wall),
//   · NO change saves silently — every edit goes edit → PREVIEW (real dry-run) →
//     confirm → save, and the save writes one retention_policy_audit row,
//   · armed is the per-table kill switch (armed = maintaining, disarmed =
//     counted-not-deleted).
// Mirrors the admin-panel convention (ingestion-errors): adminFetch + Bearer, the
// {success,data} envelope, the card/table shell.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Icons } from "@/lib/icons";
import { adminFetch } from "@/lib/api/admin-fetch";
import { toast } from "@/components/ui/toast";

const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`;

interface Policy {
  id: string; table: string; mode: string; keyCols: string[]; orderCol: string | null;
  keep: number | null; days: number | null; supersededDays: number | null;
  floor: number; floorReason: string; exceptWhere: string | null; tsColumn: string | null;
  enabled: boolean; armed: boolean;
}
interface AuditRow {
  id: string; policyTable: string; field: string; oldValue: string | null; newValue: string | null;
  changedBy: string; changedAt: string; projectedDelta: string | null;
}
interface PreviewData {
  currentDeletions: number; proposedDeletions: number; delta: number;
  clamped: boolean; effective: number | null; floor: number | null; floorReason: string;
}
type Pending = { table: string; field: "keep" | "days" | "supersededDays" | "armed" | "enabled"; value: number | boolean; label: string };

const MODE_LABEL: Record<string, string> = { depth_per_key: "depth", time: "time", supersede_chain: "supersede" };
function limitField(mode: string): "keep" | "days" | "supersededDays" {
  return mode === "depth_per_key" ? "keep" : mode === "time" ? "days" : "supersededDays";
}
function limitValue(p: Policy): number | null {
  return p.mode === "depth_per_key" ? p.keep : p.mode === "time" ? p.days : p.supersededDays;
}
function limitLabel(mode: string): string {
  return mode === "depth_per_key" ? "keep / key" : mode === "time" ? "older-than days" : "superseded days";
}

export default function RetentionPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, number>>({}); // table -> edited numeric value
  const [pending, setPending] = useState<Pending | null>(null);
  const [historyFor, setHistoryFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading"); setError(null);
    try {
      const [pRes, aRes] = await Promise.all([
        adminFetch(`${API_BASE}/admin/retention/policies`),
        adminFetch(`${API_BASE}/admin/retention/audit?limit=50`),
      ]);
      const pJson = await pRes.json(); const aJson = await aRes.json();
      if (!pJson.success) { setError(pJson.error ?? "Failed to load policies."); setStatus("error"); return; }
      setPolicies(pJson.data as Policy[]);
      setAudit((aJson.data ?? []) as AuditRow[]);
      setDrafts({});
      setStatus("idle");
    } catch { setError("Network error — could not reach the backend."); setStatus("error"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const saved = () => { load(); };

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link href="/admin" className="inline-flex w-fit items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Icons.arrowLeft className="size-3.5" /> Back to Data &amp; Settings
        </Link>
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20"><Icons.database className="size-5" weight="duotone" /></span>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Retention</h1>
            <p className="text-xs text-muted-foreground">The nightly pruner&apos;s limits. Every change is previewed against a real dry-run and audited — the floor is a fence you can&apos;t cross, and <span className="text-foreground">armed</span> is the per-table kill switch.</p>
          </div>
        </div>
      </div>

      {status === "error" && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {status === "loading" && <div className="rounded-xl border border-border/50 bg-surface-1 px-4 py-8 text-center text-sm text-muted-foreground">Loading policies…</div>}

      {/* Policy table */}
      {status === "idle" && (
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-surface-1">
          <table className="w-full min-w-215 text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">Table</th>
                <th className="px-3 py-2.5 font-medium">Mode</th>
                <th className="px-3 py-2.5 font-medium">Limit</th>
                <th className="px-3 py-2.5 font-medium">Floor</th>
                <th className="px-3 py-2.5 font-medium">Armed</th>
                <th className="px-3 py-2.5 font-medium">Enabled</th>
                <th className="px-3 py-2.5 font-medium text-right">History</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => {
                const lf = limitField(p.mode);
                const persisted = limitValue(p);
                const draft = drafts[p.table] ?? persisted ?? p.floor;
                const changed = persisted !== null && draft !== persisted;
                return (
                  <tr key={p.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="font-mono text-[13px] text-foreground">{p.table}</div>
                      <div className="text-[11px] text-muted-foreground">{p.mode === "depth_per_key" ? `key: ${p.keyCols.join(", ")}` : p.tsColumn ? `ts: ${p.tsColumn}` : ""}{p.exceptWhere ? ` · exempt: ${p.exceptWhere}` : ""}</div>
                    </td>
                    <td className="px-3 py-2.5"><span className="rounded-md border border-border/50 bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted-foreground">{MODE_LABEL[p.mode] ?? p.mode}</span></td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min={p.floor} value={draft}
                          onChange={(e) => {
                            const raw = Number(e.target.value);
                            // FENCE: the input cannot go below its floor.
                            const v = Number.isFinite(raw) ? Math.max(raw, p.floor) : p.floor;
                            setDrafts((d) => ({ ...d, [p.table]: v }));
                          }}
                          className="w-24 rounded-md border border-border/60 bg-surface-2 px-2 h-8 text-[13px] tabular-nums text-foreground focus:border-primary focus:outline-none"
                        />
                        {changed && (
                          <button onClick={() => setPending({ table: p.table, field: lf, value: draft, label: `${limitLabel(p.mode)} ${persisted} → ${draft}` })}
                            className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 h-8 text-[11px] font-medium text-primary hover:bg-primary/25">
                            <Icons.eye className="size-3" /> Review
                          </button>
                        )}
                      </div>
                      <div className="mt-0.5 text-[10px] text-muted-foreground">{limitLabel(p.mode)}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span title={p.floorReason} className="inline-flex cursor-help items-center gap-1 rounded-md border border-warning/25 bg-warning/10 px-1.5 py-0.5 text-[11px] font-medium text-warning">
                        <Icons.lock className="size-3" /> {p.floor}
                      </span>
                      <div className="mt-0.5 max-w-55 truncate text-[10px] text-muted-foreground" title={p.floorReason}>{p.floorReason}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => setPending({ table: p.table, field: "armed", value: !p.armed, label: p.armed ? "ARM → DISARM (stops pruning)" : "DISARM → ARM (resumes pruning)" })}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 h-7 text-[11px] font-medium transition-colors ${p.armed ? "bg-success/12 text-success ring-1 ring-success/25" : "bg-muted/40 text-muted-foreground ring-1 ring-border/50"}`}
                        title={p.armed ? "Armed — maintaining (deletes on the nightly run)" : "Disarmed — counted, not deleted"}
                      >
                        <span className={`size-1.5 rounded-full ${p.armed ? "bg-success" : "bg-muted-foreground/50"}`} />
                        {p.armed ? "Armed" : "Disarmed"}
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => setPending({ table: p.table, field: "enabled", value: !p.enabled, label: p.enabled ? "ENABLED → DISABLED (skip entirely)" : "DISABLED → ENABLED" })}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 h-7 text-[11px] font-medium ${p.enabled ? "bg-primary/10 text-primary ring-1 ring-primary/20" : "bg-muted/40 text-muted-foreground ring-1 ring-border/50"}`}
                      >
                        {p.enabled ? "On" : "Off"}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button onClick={() => setHistoryFor(p.table)} className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-surface-2 px-2 h-7 text-[11px] text-muted-foreground hover:text-foreground hover:border-border">
                        <Icons.clock className="size-3" /> History
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Global changelog */}
      {status === "idle" && (
        <div className="rounded-2xl border border-border/60 bg-surface-1">
          <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
            <Icons.clock className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Changelog</h2>
            <span className="text-[11px] text-muted-foreground">— who changed a delete-controlling limit, and what the system warned it would do</span>
          </div>
          {audit.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">No changes yet.</div>
          ) : (
            <ul className="divide-y divide-border/40">
              {audit.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2.5 text-[12px]">
                  <span className="font-mono text-foreground">{a.policyTable}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-foreground">{a.field}: <span className="tabular-nums">{a.oldValue ?? "—"}</span> → <span className="tabular-nums font-medium">{a.newValue ?? "—"}</span></span>
                  {a.projectedDelta && <span className="rounded-md bg-warning/10 px-1.5 py-0.5 text-[10px] text-warning">{a.projectedDelta}</span>}
                  <span className="ml-auto text-[11px] text-muted-foreground">{new Date(a.changedAt).toLocaleString()} · {a.changedBy}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {pending && <ConfirmModal pending={pending} onClose={() => setPending(null)} onSaved={() => { setPending(null); saved(); }} />}
      {historyFor && <HistoryModal table={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  );
}

// ── Preview → confirm → save modal (the guardrail) ────────────
function ConfirmModal({ pending, onClose, onSaved }: { pending: Pending; onClose: () => void; onSaved: () => void }) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch(`${API_BASE}/admin/retention/preview`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table: pending.table, field: pending.field, value: pending.value }),
        });
        const json = await res.json();
        if (!json.success) { setErr(json.error ?? "Preview failed."); return; }
        setPreview(json.data as PreviewData);
      } catch { setErr("Network error during preview."); } finally { setLoading(false); }
    })();
  }, [pending]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await adminFetch(`${API_BASE}/admin/retention/policies/${pending.table}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: pending.field, value: pending.value }),
      });
      const json = await res.json();
      if (!json.success) { toast.error("Change rejected", { description: json.error ?? "Server rejected the change." }); setSaving(false); return; }
      toast.success(`${pending.table} updated`, { description: json.data?.projectedDelta ?? "Saved." });
      onSaved();
    } catch { toast.error("Network error", { description: "Could not save the change." }); setSaving(false); }
  };

  const delta = preview?.delta ?? 0;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-surface-1 p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-semibold text-foreground">Confirm change — <span className="font-mono">{pending.table}</span></h2>
        <p className="mt-1 text-xs text-muted-foreground">{pending.label}</p>

        <div className="mt-4 rounded-xl border border-border/50 bg-surface-2 p-4">
          {loading && <div className="text-sm text-muted-foreground">Running the real dry-run…</div>}
          {err && <div className="text-sm text-destructive">{err}</div>}
          {preview && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Tonight now</span><span className="tabular-nums text-foreground">{preview.currentDeletions} rows</span></div>
              <div className="flex items-center justify-between"><span className="text-muted-foreground">Tonight after</span><span className="tabular-nums font-semibold text-foreground">{preview.proposedDeletions} rows</span></div>
              <div className={`flex items-center justify-between border-t border-border/50 pt-2 ${delta > 0 ? "text-warning" : delta < 0 ? "text-success" : "text-muted-foreground"}`}>
                <span className="font-medium">Change</span>
                <span className="tabular-nums font-semibold">{delta > 0 ? `+${delta}` : delta} rows</span>
              </div>
              {preview.clamped && (
                <div className="mt-1 flex items-start gap-1.5 rounded-md bg-warning/10 px-2 py-1.5 text-[11px] text-warning">
                  <Icons.lock className="mt-0.5 size-3 shrink-0" /> Floored at {preview.floor} — {preview.floorReason}. The engine clamps below-floor values.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-border/60 bg-surface-2 px-3 h-9 text-[13px] text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={save} disabled={loading || saving || !!err}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 h-9 text-[13px] font-medium text-primary-foreground disabled:opacity-50">
            {saving ? <Icons.spinner className="size-3.5 animate-spin" /> : <Icons.check className="size-3.5" />} Confirm &amp; save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Per-policy history ─────────────────────────────────────────
function HistoryModal({ table, onClose }: { table: string; onClose: () => void }) {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  useEffect(() => {
    (async () => {
      const res = await adminFetch(`${API_BASE}/admin/retention/audit/${table}`);
      const json = await res.json();
      setRows((json.data ?? []) as AuditRow[]);
    })();
  }, [table]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border/70 bg-surface-1 p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-semibold text-foreground">History — <span className="font-mono">{table}</span></h2>
        <div className="mt-3 max-h-[60svh] overflow-y-auto">
          {rows === null ? <div className="text-sm text-muted-foreground">Loading…</div>
            : rows.length === 0 ? <div className="text-sm text-muted-foreground">No changes recorded.</div>
            : (
              <ul className="divide-y divide-border/40">
                {rows.map((a) => (
                  <li key={a.id} className="py-2.5 text-[12px]">
                    <div className="text-foreground">{a.field}: <span className="tabular-nums">{a.oldValue ?? "—"}</span> → <span className="tabular-nums font-medium">{a.newValue ?? "—"}</span></div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{new Date(a.changedAt).toLocaleString()} · {a.changedBy}{a.projectedDelta ? ` · ${a.projectedDelta}` : ""}</div>
                  </li>
                ))}
              </ul>
            )}
        </div>
        <div className="mt-4 flex justify-end"><button onClick={onClose} className="rounded-md border border-border/60 bg-surface-2 px-3 h-9 text-[13px] text-muted-foreground hover:text-foreground">Close</button></div>
      </div>
    </div>
  );
}
