"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CHAT SESSION LIST — the left rail. Conversations grouped by recency, the active row carrying the
// blue→violet AI accent, a subject chip (the symbol) marking card-originated conversations, inline
// rename, and honest loading / error / empty states. No delete affordance — there's no backend DELETE.
//
// THE SUBJECT CHIP IS THE ORIGIN SIGNAL. A discuss conversation carries a subjectSymbol; a blank one does
// not. Rather than a second, redundant "origin" badge, the symbol chip IS the tell.
//
// EMPTY STATE is deliberately minimal — the conversation canvas's welcome carries the invitation, so the
// rail stays a quiet line rather than a competing call to action.
//
// ★ SHARED WITH THE SIDEKICK PANEL'S CONVERSATION MANAGER. The manager is the same list in a different
// frame, so it reuses this component rather than growing a second copy of grouping/rename/delete. The
// four OPTIONAL props below (`title`, `toolbar`, `onClose`, `empty`) are what that frame needs — a
// renamed heading, a search field under the header, a dismiss, and a query-aware empty state. Omitted,
// they render exactly what /chat rendered before they existed.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import type { ReactNode } from "react";
import { isThisWeek, isToday, isYesterday } from "date-fns";
import { QueryError } from "@/components/ui/query-error";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/types/chat";

const GROUPS = ["Today", "Yesterday", "This week", "Older"] as const;
type GroupLabel = (typeof GROUPS)[number];

function bucketOf(iso: string): GroupLabel {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  if (isThisWeek(d, { weekStartsOn: 1 })) return "This week";
  return "Older";
}

/** Compact relative time for a dense list ("just now", "5m ago", "3h ago", "2d ago", then the date). */
function compactAgo(iso: string): string {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  const m = Math.floor(secs / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function SessionRow({
  session,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  session: ChatSession;
  active: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full flex-col gap-1 rounded-lg py-2.5 pl-3 pr-16 text-left transition-colors duration-150",
          active ? "bg-surface-2" : "hover:bg-surface-2/60",
        )}
      >
        {/* the AI accent on the active conversation — a blue→violet rail */}
        {active && (
          <span
            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-linear-to-b from-ai-from to-ai-to"
            aria-hidden
          />
        )}
        <span className={cn("min-w-0 truncate text-[13px]", active ? "font-semibold text-ink" : "font-medium text-ink2")}>
          {session.title}
        </span>
        <span className="flex items-center gap-2 text-[11px] text-ink3">
          {session.subjectSymbol && (
            <span className="num inline-flex items-center rounded border border-line2 bg-surface-2 px-1.5 py-0.5 text-[10px] leading-none text-ink2">
              {session.subjectSymbol}
            </span>
          )}
          <span>{compactAgo(session.lastMessageAt)}</span>
        </span>
      </button>
      {/* row actions — revealed only while the row is hovered (or keyboard-focused) */}
      <div className="absolute right-1 top-1.5 flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRename();
          }}
          aria-label="Rename conversation"
          className="grid size-7 place-items-center rounded-md text-ink3 transition-colors hover:bg-surface-3 hover:text-ink"
        >
          <Icons.edit className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete conversation"
          className="grid size-7 place-items-center rounded-md text-ink3 transition-colors hover:bg-crit/10 hover:text-danger"
        >
          <Icons.trash className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg px-3 py-2.5">
          <div className="shimmer h-3 w-3/4 rounded" />
          <div className="shimmer h-2.5 w-1/3 rounded" />
        </div>
      ))}
    </div>
  );
}

export function ChatSessionList({
  sessions,
  activeId,
  isLoading,
  isError,
  onRetry,
  onSelect,
  onNew,
  onRename,
  onDelete,
  title = "Chats",
  toolbar,
  onClose,
  empty,
}: {
  sessions: ChatSession[];
  activeId: string | null;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (session: ChatSession) => void;
  onDelete: (session: ChatSession) => void;
  /** Heading text. The panel's manager calls this surface "Conversations". */
  title?: string;
  /** Rendered directly under the header — the manager's search field. */
  toolbar?: ReactNode;
  /** When given, a dismiss button joins the header (the manager overlays; the /chat rail does not). */
  onClose?: () => void;
  /** Replaces the built-in empty state — the manager needs a query-aware "nothing matches". */
  empty?: ReactNode;
}) {
  const grouped = GROUPS.map((label) => ({
    label,
    items: sessions.filter((s) => bucketOf(s.lastMessageAt) === label),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* header */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="ai-badge" aria-hidden>
            <Icons.spark weight="fill" className="h-3 w-3" />
          </span>
          <h1 className="font-display text-[15px] font-semibold text-ink">{title}</h1>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onNew}
            className="inline-flex select-none items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-ink3 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <Icons.plus className="size-4" />
            <span>New</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close conversations"
              className="grid size-7 place-items-center rounded-lg text-ink3 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <Icons.close className="size-4" />
            </button>
          )}
        </div>
      </div>

      {toolbar && <div className="shrink-0 border-b border-line px-3 py-2.5">{toolbar}</div>}

      {/* body */}
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <div className="p-4">
            <QueryError message="We couldn't load your conversations." onRetry={onRetry} />
          </div>
        ) : sessions.length === 0 ? (
          (empty ?? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="text-[13px] font-medium text-ink2">No conversations yet</p>
              <p className="mt-1 text-[12px] text-ink3">
                Tap <span className="text-ink2">New</span> to start one.
              </p>
            </div>
          ))
        ) : (
          <div className="flex flex-col gap-3 p-2">
            {grouped.map((group) => (
              <div key={group.label} className="flex flex-col gap-0.5">
                <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink3">
                  {group.label}
                </p>
                {group.items.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    active={s.id === activeId}
                    onSelect={() => onSelect(s.id)}
                    onRename={() => onRename(s)}
                    onDelete={() => onDelete(s)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
