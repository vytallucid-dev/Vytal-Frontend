import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface QueryEmptyProps extends React.ComponentProps<"div"> {
  title?: string;
  description?: string;
  /** Optional action slot (e.g. a Button to add data). */
  action?: ReactNode;
}

/**
 * Empty state for queries that return no data.
 * Muted surface with ink2/ink3 text — no raw colors.
 */
export function QueryEmpty({
  title = "Nothing here yet",
  description,
  action,
  className,
  ...props
}: QueryEmptyProps) {
  return (
    <div
      data-slot="query-empty"
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-line bg-surface-1 px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-surface-3">
        <span className="text-xl text-ink3">—</span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-ink2">{title}</p>
        {description && (
          <p className="text-xs text-ink3">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
