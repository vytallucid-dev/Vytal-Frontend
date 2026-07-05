"use client";

import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** In-page funnel to another tab / route — "Open X →". Descriptive, never a CTA.
 *  Styled to the app's small-link idiom (hairline surface, brighten on hover). */
export function Funnel({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-line2 bg-surface-1 px-3 py-1.5 text-[12px] text-ink2 transition-colors hover:border-line3 hover:text-ink",
        className,
      )}
    >
      {children}
      <Icons.arrowUpRight className="size-3" />
    </button>
  );
}

/** Small uppercase kicker inside a card (design-system .kicker token). */
export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("kicker", className)}>{children}</div>;
}

/** The pending benchmark affordance — labeled-soon, never wired/faked (no index feed). */
export function NiftySoon() {
  return (
    <span
      className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-line2 bg-surface-2 px-2.5 py-1 text-[11px] text-ink3 opacity-70"
      title="Benchmark overlay arrives with an index feed"
    >
      <span className="size-1.5 rounded-full bg-ink3" />
      Nifty · soon
    </span>
  );
}
