"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Icons, type Icon } from "@/lib/icons";
import { formatINR } from "@/lib/format";
import type { Account, BrokerCatalogEntry, BrokerMeta } from "@/types/portfolio";
import {
  accountKind,
  accountLiveness,
  brokerLabel,
  countLabel,
  linkAffordanceFor,
  timeAgo,
  type AccountStats,
  type LinkAffordance,
} from "./lib";

// ─────────────────────────────────────────────────────────────────────────────
// One account = one card. The card must make you FEEL which kind it is before you read
// a word: a Verified card is backed by an external authority (broker feed) — tinted,
// accent-barred, shield; a Stated card is the user's own ledger — plain, neutral, pencil.
// No health, no PHS, no score anywhere. Tapping the card opens the (stubbed) detail route.
//
// The card navigates via a STRETCHED overlay link (absolute inset-0, above the static content),
// not an anchor wrapping everything — so the one real action that belongs here (Connect, on an
// adapted Stated book) can be a genuine <button> lifted above the overlay (relative z-10),
// without nesting interactive content inside an anchor.
// ─────────────────────────────────────────────────────────────────────────────

const VERIFIED_ACCENT = "var(--p-found)"; // blue — reads as trust / external authority
const STATED_ACCENT = "var(--ctx)"; //        slate — a quiet, self-authored identity

const KIND_META = {
  verified: { label: "Verified", accent: VERIFIED_ACCENT, icon: Icons.shield, blurb: "From the broker's feed" },
  stated: { label: "Stated", accent: STATED_ACCENT, icon: Icons.edit, blurb: "Your own entries" },
} as const;

function tinted(accent: string, fill: number): CSSProperties {
  return { background: `color-mix(in oklch, ${accent} ${fill}%, transparent)`, borderColor: `color-mix(in oklch, ${accent} 30%, transparent)`, color: accent };
}

/** A small labelled line (icon + text) used for liveness and the two inert affordance states.
 *  `reconnect` is the token-expired tone: the broker blue (p-found), NOT amber/red — a daily
 *  credential that lapsed on schedule is routine, not a fault. */
function MetaLine({ icon: Glyph, tone, children }: { icon: Icon; tone: "ok" | "muted" | "attention" | "reconnect"; children: ReactNode }) {
  const color =
    tone === "attention" ? "var(--high)" : tone === "reconnect" ? "var(--p-found)" : tone === "ok" ? "var(--ink2)" : "var(--ink3)";
  return (
    <p className="flex items-center gap-1.5 text-[11.5px] leading-relaxed" style={{ color }}>
      <Glyph weight="duotone" className="size-3.5 shrink-0" />
      <span className="min-w-0 truncate">{children}</span>
    </p>
  );
}

/** Liveness — VERIFIED cards only. A Stated card renders no line at all (nothing syncs). Resolved
 *  through the shared `accountLiveness` so the card, the detail header and the action bar agree.
 *  A dead (token-expired) account shows it needs reconnecting AND its last real sync — both true. */
function Liveness({ account, onReconnect }: { account: Account; onReconnect?: () => void }) {
  const live = accountLiveness(account);
  switch (live.kind) {
    case "none":
      return null;
    case "paused":
      // PAUSE WINS. The user severed it deliberately — no "reconnect" nudge, no "N days old".
      return (
        <MetaLine icon={Icons.pause} tone="muted">
          Paused{live.lastSyncedAt ? ` · synced ${timeAgo(live.lastSyncedAt)}` : ""}
        </MetaLine>
      );
    case "dead":
      // Routine: the daily token expired. Say it needs reconnecting, keep showing the real last sync,
      // and offer the action — calm blue, not an alarm.
      return (
        <div className="flex flex-col gap-1.5">
          <MetaLine icon={Icons.refresh} tone="reconnect">
            Needs reconnecting{live.lastSyncedAt ? ` · synced ${timeAgo(live.lastSyncedAt)}` : ""}
          </MetaLine>
          {onReconnect && account.brokerConnectionId && (
            <button
              type="button"
              onClick={(e) => {
                // Lifted above the card's stretched overlay link (relative z-10) — a real action, not
                // navigation. Reconnect is non-destructive (nothing is at risk on a Verified book).
                e.preventDefault();
                e.stopPropagation();
                onReconnect();
              }}
              className="relative z-10 inline-flex items-center gap-1.5 self-start rounded-lg border px-2.5 py-1 text-[11.5px] font-medium transition-[filter] hover:brightness-125"
              style={{ color: "var(--p-found)", borderColor: "color-mix(in oklch, var(--p-found) 34%, transparent)", background: "color-mix(in oklch, var(--p-found) 10%, transparent)" }}
            >
              <Icons.refresh className="size-3.5" />
              Reconnect
            </button>
          )}
        </div>
      );
    case "never":
      return <MetaLine icon={Icons.clock} tone="muted">Never synced yet</MetaLine>;
    case "synced":
      return <MetaLine icon={Icons.clock} tone="ok">Synced {timeAgo(live.lastSyncedAt)}</MetaLine>;
  }
}

/** The link affordance — STATED cards only. THREE different promises, never one grey button:
 *   • connect  → a REAL (secondary, inert-this-build) button. The one constructive action here.
 *   • not_yet  → a plain status line. NEVER a button — a disabled button would invite a tap that
 *                can never succeed.
 *   • never    → a plain status line. NEVER a button — "disabled" would imply "not yet", a lie for
 *                the not-at-a-broker account.
 *  All three derive from the catalogue's `linkable` flag (no broker id in a conditional). */
function LinkAffordanceView({ affordance, onConnect }: { affordance: LinkAffordance; onConnect: () => void }) {
  if (affordance.kind === "connect") {
    return (
      <button
        type="button"
        onClick={(e) => {
          // Lifted above the card's stretched overlay link (relative z-10), so this is a real action,
          // not navigation. preventDefault stops the overlay from also firing. The connect flow itself
          // (warning for a non-empty book, silent for an empty one) lives in LinkAccountDialog.
          e.preventDefault();
          e.stopPropagation();
          onConnect();
        }}
        className="relative z-10 mt-0.5 inline-flex items-center gap-1.5 self-start rounded-lg border px-2.5 py-1 text-[11.5px] font-medium transition-[filter] hover:brightness-125"
        style={{ color: "var(--p-found)", borderColor: "color-mix(in oklch, var(--p-found) 34%, transparent)", background: "color-mix(in oklch, var(--p-found) 10%, transparent)" }}
      >
        <Icons.shield weight="fill" className="size-3.5" />
        Connect {affordance.broker} to verify
      </button>
    );
  }
  if (affordance.kind === "not_yet") {
    return <MetaLine icon={Icons.timer} tone="muted">Connecting {affordance.broker} isn&apos;t available yet</MetaLine>;
  }
  return <MetaLine icon={Icons.prohibit} tone="muted">Not held at a broker</MetaLine>;
}

export function AccountCard({
  account,
  catalogue,
  adapted,
  stats,
  onConnect,
  onReconnect,
}: {
  account: Account;
  catalogue: BrokerCatalogEntry[] | undefined;
  /** The adapted set (`available` from /me/brokers) — carries `mock`'s label, which the pickable
   *  catalogue omits. Needed so a broker id is NEVER rendered raw. */
  adapted: BrokerMeta[] | undefined;
  /** Current holdings on this account (count + OUR summed value), from the /me/holdings union.
   *  Undefined ⇔ the account has no open positions. */
  stats: AccountStats | undefined;
  /** Open the connect flow for this (Stated) account. */
  onConnect: () => void;
  /** Re-authenticate this (Verified) account when its daily token has expired. */
  onReconnect?: () => void;
}) {
  const kind = accountKind(account);
  const meta = KIND_META[kind];
  const Emblem = meta.icon;
  const label = brokerLabel(account.broker, catalogue, adapted);
  const count = stats?.count ?? 0;
  const value = stats?.value ?? null;

  return (
    <div
      className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface-1 p-5 transition-colors hover:border-line3"
      style={kind === "verified" ? { background: `color-mix(in oklch, ${meta.accent} 5%, var(--surface-1))` } : undefined}
    >
      {/* the structural authority cue — a solid accent bar on Verified, a faint one on Stated */}
      <span
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[3px]"
        style={{ background: kind === "verified" ? meta.accent : `color-mix(in oklch, ${meta.accent} 45%, transparent)` }}
      />

      {/* the whole card navigates to detail — a stretched overlay (above content) so a real action
          button can sit above it (relative z-10) without an anchor wrapping interactive content */}
      <Link href={`/portfolio/accounts/${account.id}`} aria-label={`Open ${account.name}`} className="absolute inset-0 z-0" />

      {/* eyebrow: kind emblem + label + source blurb */}
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-6 shrink-0 place-items-center rounded-md border" style={tinted(meta.accent, 14)}>
          <Emblem weight="fill" className="size-3.5" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: meta.accent }}>
          {meta.label}
        </span>
        <span className="truncate text-[11px] text-ink3">· {meta.blurb}</span>
        <Icons.caretRight className="ml-auto size-4 shrink-0 text-ink3 transition-colors group-hover:text-ink2" />
      </div>

      {/* name + broker */}
      <p className="truncate font-display text-[17px] font-semibold text-ink">{account.name}</p>
      <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12.5px] text-ink2">
        <Icons.building weight="duotone" className="size-3.5 shrink-0 text-ink3" />
        {label}
        {account.staleness?.brokerAccountRef && <span className="num text-ink3">· {account.staleness.brokerAccountRef}</span>}
      </p>

      {/* liveness (Verified) or link affordance (Stated) */}
      <div className="mt-3 flex min-h-0 flex-col">
        <Liveness account={account} onReconnect={onReconnect} />
        {kind === "stated" && <LinkAffordanceView affordance={linkAffordanceFor(account, catalogue, adapted)} onConnect={onConnect} />}
      </div>

      {/* footer: value (when we can price it) + counts */}
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-3">
        <div className="min-w-0">
          {value != null ? (
            <>
              <span className="block text-[10px] uppercase tracking-wide text-ink3">Value</span>
              <span className="num text-[15px] font-semibold text-ink">{formatINR(value, { compact: true })}</span>
            </>
          ) : (
            <span className="text-[11.5px] text-ink3">{count === 0 ? "No holdings yet" : "Value unavailable"}</span>
          )}
        </div>
        <p className="shrink-0 text-right text-[11.5px] text-ink3">
          {countLabel(count, "holding")}
          {/* transaction count is a Stated-only fact — a Verified book has no ledger by design */}
          {kind === "stated" && <span className="num"> · {countLabel(account.transactionCount, "transaction")}</span>}
        </p>
      </div>
    </div>
  );
}
