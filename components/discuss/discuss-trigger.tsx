"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE "DISCUSS THIS" TRIGGER — a shared, reusable affordance that any card across the platform can drop
// in with one line: <DiscussTrigger context={...} />. It carries a typed DiscussContext (not just a
// label) so the conversation receives the full context of whatever the user was looking at.
//
// It is SUBTLE by design: an affordance on a card, not a CTA. It wears the intelligent-layer language
// (the `.ai-chip` tokens — the interactive sibling of `.ai-badge`) so every instance reads as part of
// the same AI system, whichever surface it sits on.
//
// ★ IT NO LONGER OWNS A CONVERSATION. It used to hold open state and render its own sheet; that is what
// made the conversation die with the card and forced it to be modal. Now it hands the context to the
// sidekick panel, which lives at the shell and outlives every page. One consequence worth naming: the
// trigger does not decide whether this starts a NEW conversation or joins the running one — the panel
// does, because only it knows whether one is already open. See sidekick-provider §THE DISCUSS FLOW.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useSidekickActions } from "@/components/sidekick/sidekick-provider";
import type { DiscussContext } from "./discuss-context";

export function DiscussTrigger({
  context,
  className,
}: {
  context: DiscussContext;
  /** Optional positioning hook for the host card — the button styling itself stays fixed (one language). */
  className?: string;
}) {
  const { discuss } = useSidekickActions();

  return (
    <button
      type="button"
      onClick={() => discuss(context)}
      className={cn(
        "ai-chip inline-flex select-none items-center gap-1.5 rounded-full px-3 py-1.25 text-[11.5px] font-medium",
        className,
      )}
    >
      <Icons.chat weight="fill" className="h-3.5 w-3.5" />
      <span>{context.label}</span>
    </button>
  );
}
