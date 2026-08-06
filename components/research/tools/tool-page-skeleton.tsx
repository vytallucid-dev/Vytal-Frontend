/**
 * THE ROUTE-LEVEL SUSPENSE SKELETON — shared by all three tool routes' `<Suspense fallback>`.
 *
 * A tool route reads `?symbol=` via `useSearchParams`, which forces it behind a Suspense
 * boundary so the route can still render statically. `fallback={null}` rendered NOTHING on a
 * cold or slow load — a white area a reader reads as "my click didn't land", not as "this is
 * coming". This skeleton is the frame's own outer structure (strip region + one content block)
 * so the route visibly arrived.
 *
 * ⚠ NOT THE SAME LOADING STATE AS <ToolFrame>'s SingleView `isLoading` branch. This one covers
 *   the Suspense boundary itself — before the client tree has even mounted, so it cannot know
 *   the ticker, whether `?symbol=` is set, or anything else route state would carry. That one
 *   (tool-frame.tsx) covers a React Query fetch inside an already-mounted client tree, where the
 *   symbol IS known. Different phase, different knowledge, correctly two different shapes.
 *
 * Server-safe by construction — no hooks, no client APIs, no "use client" — so every route stays
 * a server component. Reuses the app's one loading primitive verbatim
 * (`animate-pulse rounded-xl border border-line bg-surface-1`); no second skeleton style, no
 * spinner (the frame never spins for a first paint).
 *
 * ★ ONE CONTENT BLOCK, NOT TWO SHAPES. This renders before `?symbol=` is read, so it cannot know
 *   whether the landing scan or the single view is coming — committing to either shape would
 *   guarantee a wrong-shaped skeleton on whichever path didn't happen.
 */
export function ToolPageSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col" aria-busy="true">
      {/* strip region — mirrors ToolFrame's top strip (tool name · search · back) */}
      <div className="mb-4 flex items-center justify-between gap-4 border-b border-line pb-3 pt-1">
        <div className="h-8 w-36 animate-pulse rounded-xl border border-line bg-surface-1" />
        <div className="h-8 w-28 animate-pulse rounded-xl border border-line bg-surface-1" />
      </div>
      <div className="h-[420px] animate-pulse rounded-xl border border-line bg-surface-1" />
    </div>
  );
}
