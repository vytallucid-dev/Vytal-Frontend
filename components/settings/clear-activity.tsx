"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// SETTINGS · CLEAR ACTIVITY DATA — a destructive control, no data viewer.
//
// Clears what Vytal has NOTICED about how you use the app (the stocks you open, the tabs you read) — the
// behaviour rollup + its raw events. It deliberately does NOT touch holdings, watchlist, alerts or
// transactions, and the copy says so explicitly so a user never fears this deletes their portfolio.
//
// Matches the house destructive pattern (see components/portfolio/account-detail/verified-actions.tsx):
// a plain Dialog + Button variant="destructive" + mutateAsync + toast.success. There is no AlertDialog
// primitive and we do not add one. Rendered in Settings' flat editorial idiom (border-line / surface
// cards, primary accent) — the same language as AiExplanationStyle beside it.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
import { useState } from "react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Icons } from "@/lib/icons";
import { toast } from "@/components/ui/toast";
import { isApiError } from "@/lib/api/client";
import { useClearActivity } from "@/lib/api/hooks/use-activity";

export function ClearActivityData() {
  const [open, setOpen] = useState(false);
  const clear = useClearActivity();
  const pending = clear.isPending;

  async function confirm() {
    try {
      await clear.mutateAsync();
      toast.success("Activity data cleared", {
        description: "Vytal's record of how you browse — and what the assistant had picked up — has been reset.",
      });
      setOpen(false);
    } catch (e) {
      const msg = isApiError((e as { apiError?: unknown })?.apiError)
        ? ((e as { apiError: { message: string } }).apiError.message)
        : "Please try again.";
      toast.error("Couldn't clear your activity", { description: msg });
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface-1 p-5 sm:p-6">
      <SectionHeading
        eyebrow="Privacy"
        icon={Icons.history}
        title="Activity data"
        subtitle="What Vytal has noticed about how you use the app."
      />

      <div className="mt-5 flex flex-col gap-4 rounded-xl border border-line bg-surface-2 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Clear activity data</p>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-ink3">
            As you move around Vytal — the stocks you open, the tabs you spend time on — we keep a light,
            private record so a stock&apos;s read can feel like yours. This also covers what the assistant
            has picked up from your conversations, like the language you write in. Clearing it does{" "}
            <span className="font-medium text-ink2">not</span> touch your holdings, watchlist, alerts,
            transactions or your saved chats — only what we&apos;ve noticed about you.
          </p>
        </div>
        <Button
          variant="outline"
          className="shrink-0 border-danger/30 text-danger hover:border-danger/50 hover:bg-danger/10 hover:text-danger"
          onClick={() => setOpen(true)}
        >
          <Icons.history weight="duotone" className="size-4" />
          Clear activity
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(o) => { if (!pending) setOpen(o); }}>
        <DialogContent className="border-line bg-surface-1 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-ink">Clear your activity data?</DialogTitle>
            <DialogDescription className="text-ink3">
              This erases what Vytal has noticed about you — the stocks you&apos;ve opened, the tabs
              you&apos;ve read, and what the assistant has picked up from your conversations. It does{" "}
              <span className="font-medium text-ink2">not </span> touch your holdings, watchlist, alerts,
              transactions or your saved chats. This can&apos;t be undone, and we start noticing again from
              here.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Keep it
            </Button>
            <Button variant="destructive" onClick={confirm} disabled={pending}>
              {pending && <Icons.spinner className="size-3.5 animate-spin" />}
              Clear it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
