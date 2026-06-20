import { Icons } from "@/lib/icons";

/** Shared calm "not built yet" state for the stubbed pond tabs (Overview,
 *  Fundamentals, Shareholding, News). Muted by design — these are not yet peers
 *  to the live Health tab. */
export function ComingSoonPanel({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-xl border border-line bg-card py-16 text-center">
      <Icons.clock weight="duotone" className="size-9 text-ink3" />
      <p className="text-sm font-medium text-ink2">{label} is coming</p>
      <p className="max-w-sm text-[12px] text-ink3">
        This view isn&apos;t built yet. The Health tab is live — start there.
      </p>
    </div>
  );
}
