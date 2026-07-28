"use client";

// ─────────────────────────────────────────────────────────────
// SETTINGS — the all-users preferences + account surface. Visible to every
// signed-in user (NOT gated). The admin-only ingestion Control Hub now lives
// at /admin (the Admin Panel). Built on the platform's FLAT editorial theme
// (solid surface-1/2 cards, hairline line borders, ink text scale, primary as
// the single accent) — the same language as the stock pages. No frosted glass,
// no aurora wash, no gradient text/avatars.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { AiExplanationStyle } from "@/components/settings/ai-explanation-style";
import { ClearActivityData } from "@/components/settings/clear-activity";
import { useAuth } from "@/components/providers/auth-provider";
import { Icons, type Icon } from "@/lib/icons";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";

/* ─── Account name helpers (mirror app-sidebar-user) ─────────────────────── */

function fullNameFromUser(
  meta: Record<string, unknown> | undefined,
  email: string | undefined,
): string {
  const fromMeta =
    (typeof meta?.display_name === "string" && meta.display_name) ||
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    "";
  if (fromMeta.trim()) return fromMeta.trim();
  if (email) {
    const local = email.split("@")[0];
    if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return "Your account";
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "U";
}

/* ─── Preference toggles ─────────────────────────────────────────────────── */

interface Preference {
  key: string;
  icon: Icon;
  label: string;
  description: string;
  defaultOn: boolean;
}

const preferenceDefs: Preference[] = [
  {
    key: "priceAlerts",
    icon: Icons.bell,
    label: "Price alerts",
    description: "Ping me when a watched stock crosses my target or breaks a support level.",
    defaultOn: true,
  },
  {
    key: "healthAlerts",
    icon: Icons.health,
    label: "Health-score change alerts",
    description: "Notify me when a holding's health score moves between bands.",
    defaultOn: true,
  },
  {
    key: "weeklyDigest",
    icon: Icons.news,
    label: "Weekly digest email",
    description: "A Monday-morning recap of your portfolio, the market and key signals.",
    defaultOn: false,
  },
  {
    key: "earningsReminders",
    icon: Icons.calendar,
    label: "Earnings reminders",
    description: "A heads-up the day before any holding reports quarterly results.",
    defaultOn: true,
  },
];

/* ─── Toggle switch ──────────────────────────────────────────────────────── */

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-300",
        on ? "border-primary/40 bg-primary/80" : "border-line2 bg-surface-3"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 520, damping: 34 }}
        className={cn(
          "absolute size-4 rounded-full bg-ink shadow-sm",
          on ? "right-1" : "left-1"
        )}
      />
    </button>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(preferenceDefs.map((p) => [p.key, p.defaultOn]))
  );

  const togglePref = (pref: Preference) =>
    setPrefs((prev) => {
      const next = !prev[pref.key];
      toast.success(`${pref.label} ${next ? "on" : "off"}`, {
        description: next
          ? "You'll be notified about this."
          : "You won't be notified about this anymore.",
      });
      return { ...prev, [pref.key]: next };
    });

  const name = useMemo(
    () => fullNameFromUser(user?.user_metadata, user?.email),
    [user]
  );
  const email = user?.email ?? "";
  const initials = initialsOf(name);

  return (
    <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-line bg-surface-1 p-5 sm:p-7"
      >
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Icons.settings weight="duotone" className="size-3.5" />
            Preferences
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Your <span className="text-primary">Settings</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink2">
            Tune how Vytal works for you — choose what the terminal nudges you
            about and manage your account.
          </p>
        </div>
      </motion.section>

      {/* ── AI explanation style — a REAL, persisting preference (closes the onboarding promise). Its
             own card, above the notification toggles, so it never reads as one of the fake ones. ── */}
      <Reveal>
        <AiExplanationStyle />
      </Reveal>

      {/* ── Clear activity data — a real, destructive privacy control (clears behaviour tracking only;
             never holdings/watchlist/alerts/transactions). Its own card, beside the AI style control. ── */}
      <Reveal>
        <ClearActivityData />
      </Reveal>

      {/* ── Preferences + Account ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Preferences */}
        <Reveal className="lg:col-span-2">
          <div className="h-full rounded-2xl border border-line bg-surface-1 p-5 sm:p-6">
            <SectionHeading
              eyebrow="Preferences"
              icon={Icons.bell}
              title="Notifications & alerts"
              subtitle="Choose what the terminal nudges you about."
            />

            <div className="mt-5 space-y-2.5">
              {preferenceDefs.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3.5 sm:gap-4"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <p.icon weight="duotone" className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{p.label}</p>
                    <p className="text-xs text-ink3">{p.description}</p>
                  </div>
                  <Toggle on={prefs[p.key]} onToggle={() => togglePref(p)} label={p.label} />
                </div>
              ))}
            </div>

            {/* Appearance / theme row */}
            <div className="mt-5">
              <SectionHeading eyebrow="Appearance" icon={Icons.spark} title="Theme" />
              <div className="mt-3 flex flex-col gap-3 rounded-xl border border-line bg-surface-2 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Icons.crown weight="duotone" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">Midnight Aurora</p>
                    <p className="text-xs text-ink3">
                      Accent currently set to brand primary.
                    </p>
                  </div>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-line2 bg-surface-3 px-3 py-1.5 text-xs font-medium text-ink2">
                  <Icons.shield weight="duotone" className="size-3.5 text-primary" />
                  Dark theme only
                </span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 px-1 text-xs text-ink3">
                <Icons.info weight="duotone" className="size-3.5 shrink-0 text-info" />
                Vytal is crafted as a dark-only terminal — a light mode isn&apos;t available yet.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Account */}
        <Reveal delay={0.05}>
          <div className="h-full rounded-2xl border border-line bg-surface-1 p-5 sm:p-6">
            <SectionHeading eyebrow="Account" icon={Icons.user} title="Your profile" />

            <div className="mt-5 flex flex-col items-center text-center">
              <div className="grid size-20 place-items-center rounded-full border border-primary/20 bg-primary/12 font-display text-2xl font-extrabold text-primary">
                {initials}
              </div>
              <p className="mt-3 font-display text-xl font-bold text-ink">{name}</p>
              {email && <p className="text-sm text-ink3">{email}</p>}
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Icons.crown weight="fill" className="size-3.5" />
                Vytal Pro
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line bg-surface-2 p-3 text-center">
                <p className="text-[0.65rem] uppercase tracking-wider text-ink3">
                  Member since
                </p>
                <p className="num text-base font-bold text-ink">2023</p>
              </div>
              <div className="rounded-xl border border-line bg-surface-2 p-3 text-center">
                <p className="text-[0.65rem] uppercase tracking-wider text-ink3">
                  Plan value
                </p>
                <p className="num text-base font-bold text-ink">
                  {formatINR(2499, { compact: true })}/yr
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button
                variant="default"
                className="w-full"
                onClick={() =>
                  toast.info("Plan management is coming soon", {
                    description: "You're on Vytal Pro — billing controls arrive shortly.",
                  })
                }
              >
                <Icons.crown weight="fill" className="size-4" />
                Manage plan
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() =>
                  toast.info("Account settings are coming soon", {
                    description: "Profile & security controls arrive shortly.",
                  })
                }
              >
                <Icons.settings weight="duotone" className="size-4" />
                Account settings
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
