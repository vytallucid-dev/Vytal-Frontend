"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { formatINR } from "@/lib/format";
import { Icons, type Icon } from "@/lib/icons";
import { Input } from "@/components/ui/input";
import { parseApiError } from "@/lib/api/hooks/use-brokers";
import type { Account } from "@/types/portfolio";
import { accountKind, accountLiveness, timeAgo } from "@/components/portfolio/accounts/lib";

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT DETAIL · HEADER — the shared top of both page shapes. Same vocabulary as the
// Accounts tab (Verified / Stated), the broker label always resolved from the catalogue
// (never a raw enum), and — Verified only — the sync state read straight off `staleness`
// with the SAME honesty as the card (a stale book is real data, not an error).
//
// No health, no PHS, no score, no concentration — a single account is a container, not a
// book worth judging. Actions (link / unlink / pause / sync / transfer / delete) will live
// in this header region later; the space is left, nothing is rendered.
// ─────────────────────────────────────────────────────────────────────────────

const KIND = {
  verified: { label: "Verified", accent: "var(--p-found)", icon: Icons.shield, blurb: "From the broker’s feed" },
  stated: { label: "Stated", accent: "var(--ctx)", icon: Icons.edit, blurb: "Your own entries" },
} as const;

function tinted(accent: string, fill = 14): CSSProperties {
  return {
    background: `color-mix(in oklch, ${accent} ${fill}%, transparent)`,
    borderColor: `color-mix(in oklch, ${accent} 30%, transparent)`,
    color: accent,
  };
}

/** Verified-only liveness, read off `staleness` via the SHARED resolver — mirrors the card exactly.
 *  `null` for a Stated (manual) account: nothing syncs, so no line at all. A dead (token-expired)
 *  account reads "Needs reconnecting" in the broker blue — routine, not a red/amber fault. */
function syncState(account: Account): { icon: Icon; color: string; text: string } | null {
  const live = accountLiveness(account);
  switch (live.kind) {
    case "none":
      return null;
    case "paused": // PAUSE WINS — deliberate, not neglect. Never "stale", never a reconnect nudge.
      return { icon: Icons.pause, color: "var(--ink3)", text: live.lastSyncedAt ? `Paused · synced ${timeAgo(live.lastSyncedAt)}` : "Paused" };
    case "dead":
      return {
        icon: Icons.refresh,
        color: "var(--p-found)",
        text: live.lastSyncedAt ? `Needs reconnecting · synced ${timeAgo(live.lastSyncedAt)}` : "Needs reconnecting",
      };
    case "never":
      return { icon: Icons.clock, color: "var(--ink3)", text: "Never synced yet" };
    case "synced":
      return { icon: Icons.clock, color: "var(--ink2)", text: `Synced ${timeAgo(live.lastSyncedAt)}` };
  }
}

export function AccountHeader({
  account,
  label,
  value,
  holdingCount,
  onRename,
  actions,
}: {
  account: Account;
  /** Broker display label, already resolved from the catalogue / adapted set. Never the raw id. */
  label: string;
  /** OUR summed market value of this account's priced holdings; null ⇒ nothing priced. */
  value: number | null;
  holdingCount: number;
  /** When provided, the name becomes inline-editable (a cheap, reversible rename). Rejects with the
   *  backend message (e.g. a duplicate name), which is rendered on the field — never a toast. */
  onRename?: (name: string) => Promise<void>;
  /** The account's action controls (connect / retag / move / delete), rendered as a bar under the
   *  header. Absent ⇒ no bar (nothing stubbed) — e.g. a Verified account before Stage 3. */
  actions?: ReactNode;
}) {
  const kind = KIND[accountKind(account)];
  const Emblem = kind.icon;
  const sync = syncState(account);
  const ref = account.staleness?.brokerAccountRef;

  return (
    <div className="w-full">
      <Link
        href="/portfolio?tab=accounts"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink3 transition-colors hover:text-ink2"
      >
        <Icons.arrowLeft className="size-3.5" />
        Back to accounts
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {/* kind eyebrow — same language as the Accounts tab */}
          <div className="mb-2.5 flex items-center gap-2">
            <span className="grid size-6 shrink-0 place-items-center rounded-md border" style={tinted(kind.accent)}>
              <Emblem weight="fill" className="size-3.5" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: kind.accent }}>
              {kind.label}
            </span>
            <span className="truncate text-[11px] text-ink3">· {kind.blurb}</span>
          </div>

          {onRename ? (
            <EditableName name={account.name} onRename={onRename} />
          ) : (
            <h1 className="truncate font-display text-2xl font-semibold text-ink sm:text-[28px]">{account.name}</h1>
          )}

          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[13px] text-ink2">
            <Icons.building weight="duotone" className="size-4 shrink-0 text-ink3" />
            {label}
            {ref && <span className="num text-ink3">· {ref}</span>}
          </p>

          {sync && (
            <p className="mt-2 flex items-center gap-1.5 text-[12px]" style={{ color: sync.color }}>
              <sync.icon weight="duotone" className="size-3.5 shrink-0" />
              {sync.text}
            </p>
          )}
        </div>

        {/* value */}
        <div className="shrink-0 text-right">
          <span className="block text-[10px] uppercase tracking-[0.1em] text-ink3">Value</span>
          {value != null ? (
            <span className="num text-2xl font-semibold text-ink">{formatINR(value, { compact: true })}</span>
          ) : (
            <span className="text-[13px] text-ink3">{holdingCount === 0 ? "No holdings yet" : "Value unavailable"}</span>
          )}
        </div>
      </div>

      {actions && <div className="mt-5 border-t border-line pt-4">{actions}</div>}
    </div>
  );
}

// ── inline rename — the name IS the control. A pencil reveals an input in place; Enter (or the
//    check) saves, Escape (or the ✕) cancels. A rejected save (duplicate name) keeps you in edit
//    with the backend's message on the field — cheap and reversible, no dialog, no toast.
function EditableName({ name, onRename }: { name: string; onRename: (name: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-sync the draft whenever the account's real name changes (a successful save, or a switch to
  // another account reusing this component) and we are not mid-edit.
  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  function begin() {
    setDraft(name);
    setError(null);
    setEditing(true);
    // focus + select after the input mounts
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function cancel() {
    setEditing(false);
    setError(null);
    setDraft(name);
  }

  async function save() {
    const next = draft.trim();
    if (!next) return setError("Give this account a name.");
    if (next === name) return cancel(); // no change — nothing to persist
    setSaving(true);
    setError(null);
    try {
      await onRename(next);
      setSaving(false);
      setEditing(false);
    } catch (e) {
      setSaving(false);
      setError(parseApiError(e).message);
    }
  }

  if (!editing) {
    return (
      <div className="group/name flex items-center gap-2">
        <h1 className="truncate font-display text-2xl font-semibold text-ink sm:text-[28px]">{name}</h1>
        <button
          type="button"
          onClick={begin}
          aria-label="Rename account"
          className="shrink-0 rounded-md p-1.5 text-ink3 opacity-0 transition-all hover:bg-surface-2 hover:text-ink focus-visible:opacity-100 group-hover/name:opacity-100"
        >
          <Icons.edit className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          value={draft}
          maxLength={60}
          autoFocus
          disabled={saving}
          aria-invalid={!!error}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            else if (e.key === "Escape") cancel();
          }}
          className="h-10 font-display text-lg font-semibold"
        />
        <button
          type="button"
          onClick={save}
          disabled={saving}
          aria-label="Save name"
          className="shrink-0 rounded-md border border-line2 bg-surface-2 p-2 text-ink2 transition-colors hover:text-ink disabled:opacity-60"
        >
          {saving ? <Icons.spinner className="size-4 animate-spin" /> : <Icons.check className="size-4" />}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={saving}
          aria-label="Cancel rename"
          className="shrink-0 rounded-md border border-line2 bg-surface-2 p-2 text-ink3 transition-colors hover:text-ink disabled:opacity-60"
        >
          <Icons.close className="size-4" />
        </button>
      </div>
      {error && <p className="mt-1.5 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
