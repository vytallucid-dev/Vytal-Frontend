"use client";

import { Icons, type Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { Alert, AlertType } from "@/types/alerts";
import { conditionPredicate, relativeTime, REPEAT_COPY, ALERT_TYPE_TINT } from "@/lib/alerts";

// ─────────────────────────────────────────────────────────────────────────────
// ALERT MANAGE ROW — one alert rule with its lifecycle controls: EDIT (opens the modal
// in edit mode) · PAUSE/RESUME (PATCH active) · DELETE. Shared by the bell sheet
// (showSymbol) and the watchlist quick-look Alerts section (stock is fixed → no symbol).
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<AlertType, Icon> = {
  price: Icons.coins,
  health_band: Icons.health,
  finding: Icons.bolt,
};
const TYPE_TINT = ALERT_TYPE_TINT;
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export function AlertManageRow({
  alert,
  busy,
  showSymbol = true,
  className,
  onToggle,
  onEdit,
  onDelete,
}: {
  alert: Alert;
  busy: boolean;
  showSymbol?: boolean;
  className?: string;
  onToggle: (a: Alert) => void;
  onEdit: (a: Alert) => void;
  onDelete: (a: Alert) => void;
}) {
  const TIcon = TYPE_ICON[alert.type];
  return (
    <li className={cn("flex items-center gap-3 py-3", className ?? "px-4")}>
      <span
        className="grid size-7 shrink-0 place-items-center rounded-lg"
        style={{ color: TYPE_TINT[alert.type], background: `color-mix(in oklch, ${TYPE_TINT[alert.type]} 12%, transparent)` }}
      >
        <TIcon weight="duotone" className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {showSymbol && <span className="num text-[12.5px] font-semibold text-ink">{alert.symbol ?? "—"}</span>}
          <span
            className={cn("rounded-[4px] px-1.5 py-px text-[9px] uppercase tracking-wider", alert.active ? "text-rec" : "text-ink3")}
            style={
              alert.active
                ? { background: "color-mix(in oklch, var(--rec) 14%, transparent)" }
                : { background: "var(--surface-3)" }
            }
          >
            {alert.active ? "Active" : "Paused"}
          </span>
        </div>
        <p className="truncate text-[11.5px] text-ink2">{cap(conditionPredicate(alert))}</p>
        <p className="text-[10.5px] text-ink3">
          {alert.lastTriggeredAt ? `last fired ${relativeTime(alert.lastTriggeredAt)}` : "not fired yet"} ·{" "}
          {REPEAT_COPY[alert.repeatMode].label.toLowerCase()}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => onEdit(alert)}
          aria-label="Edit alert"
          className="inline-grid size-7 place-items-center rounded-lg text-ink3 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-50"
        >
          <Icons.edit className="size-4" />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onToggle(alert)}
          aria-label={alert.active ? "Pause alert" : "Resume alert"}
          className="inline-grid size-7 place-items-center rounded-lg text-ink3 transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-50"
        >
          {busy ? (
            <Icons.spinner className="size-3.5 animate-spin" />
          ) : alert.active ? (
            <Icons.pause weight="fill" className="size-4" />
          ) : (
            <Icons.play weight="fill" className="size-4" />
          )}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onDelete(alert)}
          aria-label="Delete alert"
          className="inline-grid size-7 place-items-center rounded-lg text-ink3 transition-colors hover:bg-crit/10 hover:text-danger disabled:opacity-50"
        >
          <Icons.close className="size-3.5" />
        </button>
      </div>
    </li>
  );
}
