"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { HealthRing } from "@/components/ui/health-ring";
import { Sparkline } from "@/components/ui/sparkline";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { watchlist, type WatchItem } from "@/lib/demo-data";
import { changeColor, healthColorVar } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchItem[]>(watchlist);
  const [query, setQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [selected, setSelected] = useState<WatchItem | null>(null);

  const toggleFav = (symbol: string) =>
    setItems((prev) => prev.map((w) => (w.symbol === symbol ? { ...w, favorite: !w.favorite } : w)));

  const filtered = useMemo(
    () =>
      items
        .filter((w) => (favOnly ? w.favorite : true))
        .filter(
          (w) =>
            w.symbol.toLowerCase().includes(query.toLowerCase()) ||
            w.name.toLowerCase().includes(query.toLowerCase())
        ),
    [items, query, favOnly]
  );

  const topMover = [...items].sort((a, b) => b.d1 - a.d1)[0];
  const avgHealth = Math.round(items.reduce((a, w) => a + w.health, 0) / items.length);

  return (
    <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-strong relative overflow-hidden rounded-3xl border border-border/70 p-5 sm:p-6"
      >
        <div className="bg-aurora pointer-events-none absolute inset-0 -z-10 opacity-20" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Watchlist</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {items.length} stocks on your radar · avg health{" "}
              <span className="font-semibold" style={{ color: healthColorVar(avgHealth) }}>{avgHealth}</span>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border/70 bg-surface-1/40 p-3 text-center">
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Tracking</p>
              <p className="font-display text-xl font-extrabold">{items.length}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-surface-1/40 p-3 text-center">
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Top mover</p>
              <p className="font-display text-sm font-bold">{topMover.symbol}</p>
              <p className="font-mono text-xs text-success">+{topMover.d1}%</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-surface-1/40 p-3 text-center">
              <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Favorites</p>
              <p className="font-display text-xl font-extrabold">{items.filter((w) => w.favorite).length}</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Controls */}
      <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Icons.search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search watchlist…"
            className="h-10 w-full rounded-xl border border-border/70 bg-surface-1/40 pl-9 pr-3 text-sm outline-none focus:border-primary/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFavOnly((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
              favOnly ? "border-warning/40 bg-warning/10 text-warning" : "border-border/70 text-muted-foreground hover:text-foreground"
            )}
          >
            <Icons.star weight={favOnly ? "fill" : "regular"} className="size-4" />
            Favorites
          </button>
          <Button className="h-10">
            <Icons.plus weight="bold" className="size-4" /> Add stock
          </Button>
        </div>
      </Reveal>

      {/* Table (desktop) */}
      <Reveal className="glass hidden rounded-3xl border border-border/70 p-2 md:block">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/70 text-xs text-muted-foreground">
                <th className="px-3 py-2.5 text-left font-medium"></th>
                <th className="px-3 py-2.5 text-left font-medium">Stock</th>
                <th className="px-3 py-2.5 text-center font-medium">Health</th>
                <th className="px-3 py-2.5 text-right font-medium">Price</th>
                <th className="px-3 py-2.5 text-right font-medium">1D</th>
                <th className="px-3 py-2.5 text-right font-medium">7D</th>
                <th className="px-3 py-2.5 text-right font-medium">Target</th>
                <th className="px-3 py-2.5 text-center font-medium">7d trend</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <tr
                  key={w.symbol}
                  onClick={() => setSelected(w)}
                  className="cursor-pointer border-b border-border/40 transition-colors hover:bg-surface-2/40"
                >
                  <td className="px-3 py-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFav(w.symbol);
                      }}
                      aria-label="Toggle favorite"
                    >
                      <Icons.star
                        weight={w.favorite ? "fill" : "regular"}
                        className={cn("size-4", w.favorite ? "text-warning" : "text-muted-foreground/50 hover:text-muted-foreground")}
                      />
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-semibold">{w.symbol}</p>
                    <p className="text-xs text-muted-foreground">{w.name}</p>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className="inline-grid size-7 place-items-center rounded-lg text-xs font-bold"
                      style={{ color: healthColorVar(w.health), background: `color-mix(in oklch, ${healthColorVar(w.health)} 14%, transparent)` }}
                    >
                      {w.health}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">₹{w.price.toLocaleString("en-IN")}</td>
                  <td className={cn("px-3 py-2.5 text-right font-mono", changeColor(w.d1))}>{w.d1 >= 0 ? "+" : ""}{w.d1}%</td>
                  <td className={cn("px-3 py-2.5 text-right font-mono", changeColor(w.d7))}>{w.d7 >= 0 ? "+" : ""}{w.d7}%</td>
                  <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">₹{w.target.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-center">
                      <Sparkline data={w.spark} width={72} height={26} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      {/* Cards (mobile) */}
      <div className="space-y-2.5 md:hidden">
        {filtered.map((w) => (
          <Reveal key={w.symbol}>
            <button
              onClick={() => setSelected(w)}
              className="glass flex w-full items-center gap-3 rounded-2xl border border-border/70 p-3 text-left"
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold"
                style={{ color: healthColorVar(w.health), background: `color-mix(in oklch, ${healthColorVar(w.health)} 14%, transparent)` }}
              >
                {w.health}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{w.symbol}</p>
                <p className="truncate text-xs text-muted-foreground">{w.name}</p>
              </div>
              <Sparkline data={w.spark} width={50} height={22} />
              <div className="text-right">
                <p className="font-mono text-sm">₹{w.price.toLocaleString("en-IN")}</p>
                <p className={cn("font-mono text-xs", changeColor(w.d1))}>{w.d1 >= 0 ? "+" : ""}{w.d1}%</p>
              </div>
            </button>
          </Reveal>
        ))}
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 36 }}
              className="glass-strong fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border/70 p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold">{selected.symbol}</h2>
                  <p className="text-sm text-muted-foreground">{selected.name} · {selected.sector}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="grid size-9 place-items-center rounded-lg border border-border/70 text-muted-foreground hover:text-foreground"
                >
                  <Icons.close className="size-4" />
                </button>
              </div>

              <div className="mt-6 flex items-center gap-5">
                <HealthRing score={selected.health} size={104} strokeWidth={9} showLabel />
                <div>
                  <p className="font-mono text-3xl font-bold">₹{selected.price.toLocaleString("en-IN")}</p>
                  <p className={cn("flex items-center gap-1 font-mono text-sm", changeColor(selected.d1))}>
                    {selected.d1 >= 0 ? <Icons.arrowUpRight weight="bold" className="size-4" /> : <Icons.arrowDownRight weight="bold" className="size-4" />}
                    {selected.d1}% today
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Sparkline data={selected.spark} width={400} height={70} className="w-full" />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { l: "Market cap", v: selected.mcap },
                  { l: "7D change", v: `${selected.d7 >= 0 ? "+" : ""}${selected.d7}%` },
                  { l: "Target", v: `₹${selected.target.toLocaleString("en-IN")}` },
                  { l: "Upside", v: `${(((selected.target - selected.price) / selected.price) * 100).toFixed(1)}%` },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl border border-border/60 bg-surface-1/40 p-3">
                    <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{s.l}</p>
                    <p className="font-mono text-sm font-semibold">{s.v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex flex-col gap-2 pt-6">
                <Button asChild>
                  <Link href={`/research/stock-screener/${selected.symbol}`}>
                    Full analysis <Icons.arrowRight weight="bold" className="size-4" />
                  </Link>
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline">
                    <Icons.plus weight="bold" className="size-4" /> Portfolio
                  </Button>
                  <Button variant="outline">
                    <Icons.bell weight="duotone" className="size-4" /> Alert
                  </Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
