import { cn } from "@/lib/utils";

interface QuerySkeletonProps extends React.ComponentProps<"div"> {
  /** Number of skeleton rows to render (default 3). */
  rows?: number;
  /** Height of each row (default "h-10"). */
  rowHeight?: string;
}

/**
 * Loading placeholder for data-fetching states.
 * Uses the `.shimmer` utility and surface tokens — no raw colors.
 */
export function QuerySkeleton({
  rows = 3,
  rowHeight = "h-10",
  className,
  ...props
}: QuerySkeletonProps) {
  return (
    <div
      data-slot="query-skeleton"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "shimmer rounded-lg bg-surface-2",
            rowHeight,
            i === 0 && "w-3/4",
            i === rows - 1 && rows > 1 && "w-1/2",
          )}
        />
      ))}
    </div>
  );
}

/** Single-line inline skeleton (for table cells, stat values, etc.). */
export function SkeletonLine({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="skeleton-line"
      className={cn("shimmer inline-block h-4 w-24 rounded bg-surface-2", className)}
      {...props}
    />
  );
}
