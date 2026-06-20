"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";

interface QueryErrorProps extends React.ComponentProps<"div"> {
  message?: string;
  onRetry?: () => void;
}

/**
 * Error state for failed data fetches.
 * Uses --crit / --crit-bg / --crit-bd tokens via Tailwind utilities.
 */
export function QueryError({
  message = "Something went wrong loading this data.",
  onRetry,
  className,
  ...props
}: QueryErrorProps) {
  return (
    <div
      data-slot="query-error"
      className={cn(
        "flex flex-col items-center gap-4 rounded-xl border border-crit/40 bg-crit/10 px-6 py-10 text-center",
        className,
      )}
      {...props}
    >
      <div className="flex size-10 items-center justify-center rounded-full border border-crit/40 bg-crit/10">
        <Icons.warning weight="fill" className="size-5 text-danger" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">Failed to load</p>
        <p className="text-sm text-ink2">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <Icons.refresh className="size-4" />
          Try again
        </Button>
      )}
    </div>
  );
}
