"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SETTINGS · AI EXPLANATION STYLE — closes onboarding's "change it anytime in Settings" promise.
//
// The SAME three choices as onboarding, with the SAME copy (imported from onboarding-config, not
// re-typed), so a user reads them identically in both places. Rendered in the Settings FLAT editorial
// idiom (border-line / surface-2 cards, primary accent) — NOT onboarding's glass — because that is this
// page's established language.
//
// ⚠ THIS ONE PERSISTS. It is deliberately its OWN card, visually separated from the notification toggles
// that silently don't — and its selection is DERIVED FROM THE SERVER (useAiLevel), never local state, so
// it cannot accidentally become another fake toggle by copying a neighbour.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { SectionHeading } from "@/components/ui/section-heading";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { aboutConfig, DEFAULT_AI_LEVEL } from "@/components/onboarding/onboarding-config";
import type { AiLevel } from "@/components/onboarding/onboarding-types";
import { useAiLevel, useUpdateAiLevel } from "@/lib/api/hooks/use-ai-level";

const CARDS = aboutConfig.aiLevel.cards; // reuse onboarding's labels + taglines verbatim

const NAME: Record<AiLevel, string> = { plain: "Plain", balanced: "Balanced", technical: "Technical" };

export function AiExplanationStyle() {
  const { data, isLoading } = useAiLevel();
  const update = useUpdateAiLevel();
  // null while the first read is in flight → no highlight (avoids flashing a wrong default), the resolved
  // value after. Falls back to the platform default only once we know the read has returned nothing.
  const selected: AiLevel | null = isLoading ? null : (data ?? DEFAULT_AI_LEVEL);
  const busy = isLoading || update.isPending;

  return (
    <div className="rounded-2xl border border-line bg-surface-1 p-5 sm:p-6">
      <SectionHeading
        eyebrow="AI"
        icon={Icons.spark}
        title="Explanation style"
        subtitle={aboutConfig.aiLevel.label}
      />

      <div
        role="radiogroup"
        aria-label={aboutConfig.aiLevel.label}
        className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3"
      >
        {CARDS.map((card) => {
          const Icon = Icons[card.icon];
          const sel = selected === card.id;
          const pending = update.isPending && update.variables === card.id;
          return (
            <button
              key={card.id}
              type="button"
              role="radio"
              aria-checked={sel}
              disabled={busy}
              onClick={() => {
                // Skip a no-op re-select: no wasted PATCH, and no tone churn on the AI cache key.
                if (card.id !== selected) update.mutate(card.id);
              }}
              className={cn(
                "group flex flex-col gap-2 rounded-xl border p-3.5 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                "disabled:cursor-not-allowed",
                sel
                  ? "border-primary/50 bg-primary/10"
                  : "border-line bg-surface-2 hover:border-line3 hover:bg-surface-3",
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg border transition-colors",
                    sel
                      ? "border-primary/30 bg-primary/12 text-primary"
                      : "border-line2 bg-surface-3 text-ink2 group-hover:text-ink",
                  )}
                >
                  <Icon weight="duotone" className="size-4" />
                </span>
                <span className="font-display text-sm font-semibold text-ink">{card.name}</span>
                {pending ? (
                  <Icons.spinner className="ml-auto size-3.5 animate-spin text-primary" />
                ) : sel ? (
                  <Icons.check weight="bold" className="ml-auto size-3.5 text-primary" />
                ) : null}
              </span>
              <span className="text-xs leading-snug text-ink3">{card.tagline}</span>
            </button>
          );
        })}
      </div>

      {/* Current-value + persistence affordance — explicitly states the live setting, and "saved to your
          account" marks it as a REAL preference, unlike the notification toggles above it. */}
      <p className="mt-4 flex items-start gap-2 text-xs text-ink3">
        <Icons.info weight="duotone" className="mt-0.5 size-3.5 shrink-0 text-info" />
        <span>
          Shapes how Vytal explains things across the app — including the read on each stock&apos;s health.
          {selected ? (
            <>
              {" "}
              Currently set to <span className="font-medium text-ink2">{NAME[selected]}</span> and saved to
              your account.
            </>
          ) : null}
        </span>
      </p>
    </div>
  );
}
