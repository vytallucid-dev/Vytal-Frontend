"use client";

import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Icons, type Icon } from "@/lib/icons";
import { useAlerts, useAlertEvents, useAlertMutations } from "@/lib/api/hooks/use-alerts";
import type { Alert, AlertEvent, AlertType } from "@/types/alerts";
import { eventPhrase, relativeTime, ALERT_TYPE_TINT } from "@/lib/alerts";
import { AlertManageRow } from "./alert-manage-row";
import { CreateAlertModal } from "./create-alert-modal";
import { useReminders, useReminderMutations } from "@/lib/api/hooks/use-reminders";
import type { EventReminder } from "@/types/reminders";
import { ReminderManageRow } from "@/components/reminders/reminder-manage-row";

// ─────────────────────────────────────────────────────────────────────────────
// ALERTS BELL — the navbar bell opens a right-side SHEET (not a page). Two stacked
// sections: the fired-events FEED on top (discrete crossings the backend recorded), the
// alert-rules MANAGEMENT list below (edit / pause / delete). READ-ONLY over the contract.
// The bell badge shows how many rules are currently ACTIVE (alerts + reminders combined) —
// a standing count, not an "unread since last open" indicator.
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<AlertType, Icon> = {
  price: Icons.coins,
  health_band: Icons.health,
  finding: Icons.bolt,
};
const TYPE_TINT = ALERT_TYPE_TINT;

// ── one fired-event row (a DISCRETE crossing) ────────────────────────────────────────
function FeedRow({ ev, alert }: { ev: AlertEvent; alert?: Alert }) {
  const { symbol, text } = eventPhrase(ev, alert);
  const type = alert?.type ?? "price";
  const TIcon = TYPE_ICON[type];
  return (
    <li className="flex items-start gap-3 px-4 py-2.5">
      <span
        className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg"
        style={{ color: TYPE_TINT[type], background: `color-mix(in oklch, ${TYPE_TINT[type]} 12%, transparent)` }}
      >
        <TIcon weight="fill" className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-ink">
          <span className="num font-semibold">{symbol}</span> <span className="text-ink2">{text}</span>
        </p>
        <p className="mt-0.5 text-[11px] text-ink3">{relativeTime(ev.firedAt)}</p>
      </div>
    </li>
  );
}

function SectionHead({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between px-4 pb-1.5 pt-4">
      <h3 className="eyebrow">{title}</h3>
      {count != null && count > 0 && <span className="num text-[11px] text-ink3">{count}</span>}
    </div>
  );
}

function EmptyFeed({ hasAlerts }: { hasAlerts: boolean }) {
  return (
    <div className="px-6 py-10 text-center">
      <span className="mx-auto mb-3 grid size-10 place-items-center rounded-full border border-line2 bg-surface-2">
        <Icons.bell weight="duotone" className="size-5 text-ink3" />
      </span>
      {hasAlerts ? (
        <>
          <p className="text-[13px] font-medium text-ink2">Watching — nothing&apos;s crossed yet</p>
          <p className="mx-auto mt-1 max-w-[16rem] text-[11.5px] leading-relaxed text-ink3">
            We check your alerts once daily at market close. You&apos;ll see a line here the moment one crosses.
          </p>
        </>
      ) : (
        <>
          <p className="text-[13px] font-medium text-ink2">Nothing to report</p>
          <p className="mx-auto mt-1 max-w-[16rem] text-[11.5px] leading-relaxed text-ink3">
            Set an alert to get notified when something changes — a price level, a health-band shift, or a new finding.
          </p>
        </>
      )}
    </div>
  );
}

function BellBody({ open, onEdit }: { open: boolean; onEdit: (a: Alert) => void }) {
  const events = useAlertEvents(50);
  const alerts = useAlerts({ enabled: open });
  const { update, remove } = useAlertMutations();
  const [busyId, setBusyId] = useState<string | null>(null);

  // Event reminders live in the SAME notifications surface (one sheet, two underlying types).
  const reminders = useReminders({ enabled: open });
  const { setActive: setReminderActive, remove: removeReminder } = useReminderMutations();
  const [busyReminderId, setBusyReminderId] = useState<string | null>(null);

  const alertById = useMemo(() => new Map((alerts.data ?? []).map((a) => [a.id, a])), [alerts.data]);

  const onToggle = (a: Alert) => {
    setBusyId(a.id);
    update.mutate({ id: a.id, body: { active: !a.active } }, { onSettled: () => setBusyId(null) });
  };
  const onDelete = (a: Alert) => {
    setBusyId(a.id);
    remove.mutate(a.id, { onSettled: () => setBusyId(null) });
  };

  const onToggleReminder = (r: EventReminder) => {
    setBusyReminderId(r.id);
    setReminderActive.mutate({ id: r.id, active: !r.active }, { onSettled: () => setBusyReminderId(null) });
  };
  const onDeleteReminder = (r: EventReminder) => {
    setBusyReminderId(r.id);
    removeReminder.mutate(r.id, { onSettled: () => setBusyReminderId(null) });
  };

  const evList = events.data ?? [];
  const alList = alerts.data ?? [];
  const remList = reminders.data ?? [];
  const feedLoading = events.isLoading || (alerts.isLoading && open);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line px-4 pb-3 pt-5">
        <SheetTitle className="font-display text-[17px] font-semibold text-ink">Alerts</SheetTitle>
        <SheetDescription className="text-[12px] text-ink3">
          What&apos;s crossed — and the rules you&apos;re watching with.
        </SheetDescription>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        {/* ── FEED — discrete fired crossings ── */}
        <SectionHead title="Recent" count={evList.length} />
        {feedLoading ? (
          <div className="space-y-2 px-4 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shimmer h-11 rounded-lg bg-surface-2" />
            ))}
          </div>
        ) : events.isError ? (
          <p className="px-4 py-6 text-center text-[12px] text-ink3">Couldn&apos;t load recent alerts.</p>
        ) : evList.length === 0 ? (
          <EmptyFeed hasAlerts={alList.length > 0} />
        ) : (
          <ul className="divide-y divide-line/60">
            {evList.map((ev) => (
              <FeedRow key={ev.id} ev={ev} alert={alertById.get(ev.alertId)} />
            ))}
          </ul>
        )}

        {/* ── MANAGEMENT — the rules (edit / pause / delete) ── */}
        <div className="mt-2 border-t border-line" />
        <SectionHead title="Your alerts" count={alList.length} />
        {alerts.isLoading && open ? (
          <div className="space-y-2 px-4 py-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="shimmer h-14 rounded-lg bg-surface-2" />
            ))}
          </div>
        ) : alerts.isError ? (
          <p className="px-4 py-6 text-center text-[12px] text-ink3">Couldn&apos;t load your alerts.</p>
        ) : alList.length === 0 ? (
          <p className="px-4 py-6 text-center text-[12px] text-ink3">
            No alerts yet — set one from a stock&apos;s page or the watchlist.
          </p>
        ) : (
          <ul className="divide-y divide-line/60 pb-4">
            {alList.map((a) => (
              <AlertManageRow
                key={a.id}
                alert={a}
                busy={busyId === a.id}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>
        )}

        {/* ── EVENT REMINDERS — date-triggered, same surface (pause / delete only) ── */}
        <div className="mt-2 border-t border-line" />
        <SectionHead title="Event reminders" count={remList.length} />
        {reminders.isLoading && open ? (
          <div className="space-y-2 px-4 py-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="shimmer h-14 rounded-lg bg-surface-2" />
            ))}
          </div>
        ) : reminders.isError ? (
          <p className="px-4 py-6 text-center text-[12px] text-ink3">Couldn&apos;t load your reminders.</p>
        ) : remList.length === 0 ? (
          <p className="px-4 py-6 text-center text-[12px] text-ink3">
            No reminders yet — set one from a date on the calendar.
          </p>
        ) : (
          <ul className="divide-y divide-line/60 pb-4">
            {remList.map((r) => (
              <ReminderManageRow
                key={r.id}
                reminder={r}
                busy={busyReminderId === r.id}
                onToggle={onToggleReminder}
                onDelete={onDeleteReminder}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// The alerts management SHEET on its own — the fired-events feed + the rules list
// (edit / pause / delete), plus the stacked edit modal. Controlled via open/onOpenChange
// so any surface (the navbar bell, the dashboard "Manage" button) can open the same sheet.
export function AlertsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [editing, setEditing] = useState<Alert | null>(null);
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full gap-0 border-line bg-surface-1 p-0 sm:max-w-sm">
          <BellBody open={open} onEdit={(a) => setEditing(a)} />
        </SheetContent>
      </Sheet>

      {/* edit modal — stacks over the sheet */}
      <CreateAlertModal
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        symbol={editing?.symbol ?? ""}
        name={editing?.name}
        editing={editing}
      />
    </>
  );
}

export function AlertsBell() {
  const [open, setOpen] = useState(false);

  // Fetched unconditionally (not gated by `open`) so the badge reflects the live active
  // count even before the sheet is ever opened. React Query dedupes by key, so BellBody's
  // own useAlerts/useReminders calls (enabled: open) share this same cache — no double fetch.
  const alerts = useAlerts();
  const reminders = useReminders();
  const activeCount =
    (alerts.data ?? []).filter((a) => a.active).length +
    (reminders.data ?? []).filter((r) => r.active).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative grid size-9 shrink-0 place-items-center rounded-lg border border-border/70 bg-surface-1/40 text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
        aria-label={activeCount > 0 ? `Alerts & reminders — ${activeCount} active` : "Alerts & reminders"}
      >
        <Icons.bell className="size-4" />
        {activeCount > 0 && (
          <span className="num absolute -right-1 -top-1 grid min-w-[1.05rem] place-items-center rounded-full bg-primary px-1 text-[9px] font-semibold leading-[1.05rem] text-primary-foreground ring-2 ring-background">
            {activeCount > 9 ? "9+" : activeCount}
          </span>
        )}
      </button>

      <AlertsSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
