"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Icons } from "@/lib/icons";

const footerCols = [
  { title: "Product", links: ["Dashboard", "Health Score", "Screener", "Sector Analysis", "Comparison"] },
  { title: "Company", links: ["About", "Methodology", "Careers", "Press"] },
  { title: "Resources", links: ["Help center", "Learn investing", "API", "Changelog"] },
  { title: "Legal", links: ["Privacy", "Terms", "Disclosures", "Risk policy"] },
];

export function CtaFooter() {
  return (
    <footer className="relative">
      {/* CTA */}
      <div className="mx-auto max-w-6xl px-5 pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-primary/25 px-6 py-16 text-center sm:px-12">
            <div className="bg-aurora pointer-events-none absolute inset-0 -z-10 opacity-50" />
            <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
              Stop guessing. <span className="text-gradient">Start knowing.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground sm:text-lg">
              Join investors who replaced spreadsheets and hot takes with one clear,
              trustworthy score. Your terminal is ready.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="group">
                <Link href="/dashboard">
                  Launch the Terminal
                  <Icons.arrowRight weight="bold" className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#pricing">View pricing</a>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Footer */}
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 ring-1 ring-primary/30">
                  <Icons.spark weight="fill" className="size-4 text-primary" />
                </span>
                <span className="font-display text-lg font-extrabold tracking-tight">
                  Invest<span className="text-gradient">IQ</span>
                </span>
              </Link>
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                A premium analysis terminal for Indian markets. Clarity over noise —
                powered by the InvestIQ Health Score.
              </p>
            </div>
            {footerCols.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold text-foreground">{col.title}</p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} InvestIQ. For educational purposes — not investment advice.
            </p>
            <p className="text-xs text-muted-foreground">
              Made for investors who value clarity.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
