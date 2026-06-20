"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Reveal } from "@/components/ui/reveal";

const stats = [
  { value: 1842, suffix: "", label: "Stocks continuously scored" },
  { value: 40, suffix: "+", label: "Metrics behind every score" },
  { value: 15, suffix: "", label: "Sectors mapped end-to-end" },
  { value: 99.9, suffix: "%", label: "Data-sync uptime", decimals: 1 },
];

export function StatsBand() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (inView) setShown(true);
  }, [inView]);

  return (
    <section className="relative py-16">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <div
            ref={ref}
            className="glass-strong grid grid-cols-2 gap-6 rounded-3xl border border-border/70 px-6 py-10 sm:grid-cols-4 sm:px-10"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  <AnimatedNumber
                    value={shown ? s.value : 0}
                    decimals={s.decimals ?? 0}
                    suffix={s.suffix}
                  />
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
