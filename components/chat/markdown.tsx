"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// CHAT MARKDOWN — the model emits markdown (bold, headings, lists, and, for comparisons, tables). This
// renders it natively (app type scale + surface tones, NOT default markdown CSS) WITHOUT losing the
// progressive "typing" reveal.
//
// WHY PARSE-THEN-REVEAL (not reveal-then-parse). The backend returns the WHOLE message — there is no
// streaming transport, deliberately, because the guardrail must see the complete text first. So we have
// the full markdown up front and parse it BEFORE revealing. Revealing a growing prefix of raw markdown
// would flicker ("**Strong" shows literal asterisks until the closing "**" arrives); parsing first means
// every character types out ALREADY-FORMATTED.
//
// THE REVEAL MODEL — one counter over abstract "units", walked in document order:
//   · a typed-text block (paragraph / heading / blockquote / list item text) spends one unit PER GRAPHEME
//     — it types out at the same cps as before, already bold/italic/linked.
//   · a structured block (table / fenced code / horizontal rule) is ATOMIC: it appears as a whole with a
//     short fade, and the counter spends a fixed short "beat" crossing it (STRUCTURED_BLOCK_UNITS) so the
//     next block doesn't jump in on the same frame. A comparison table is something you scan, not watch
//     assemble cell by cell.
//   · lists TYPE THROUGH continuously — each item's text types in order (a bullet appears as its text
//     begins). This reads like a streaming assistant; item-at-a-time popping felt more mechanical.
// A block renders only once the counter has entered it, so structure lands in sequence.
//
// SANITIZATION (model output is untrusted). We never build an HTML string and never use
// dangerouslySetInnerHTML — the mdast tree is rendered to a FIXED whitelist of React elements, so raw
// HTML in the source is inert (html nodes are dropped entirely). Links are constrained to safe schemes
// (http/https/mailto + in-app relative/anchor); anything else (javascript:, data:, …) renders as plain
// text with no href. Images are not loaded (their alt text is shown) — no external fetch surface.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { Fragment, useMemo, type ReactNode } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Nodes, Root, Table } from "mdast";
import { cn } from "@/lib/utils";
import { STRUCTURED_BLOCK_UNITS, toGraphemes } from "./use-progressive-reveal";

// Parser only — remark-parse + remark-gfm (tables, strikethrough, task lists, autolinks). We consume the
// mdast tree and do our own rendering, so no HTML is ever produced by the library.
const processor = unified().use(remarkParse).use(remarkGfm);

// ── parse + measure ────────────────────────────────────────────────────────────────────────────────

export interface ParsedMarkdown {
  tree: Root;
  /** Total reveal units (graphemes of typed text + a beat per structured block). */
  total: number;
  /** node → its start offset in reveal units (document order). */
  starts: WeakMap<Nodes, number>;
  /** node → cached grapheme clusters (text/inlineCode/image), so the reveal never re-segments per frame. */
  graphemes: WeakMap<Nodes, string[]>;
}

function isStructured(type: string): boolean {
  return type === "table" || type === "code" || type === "thematicBreak";
}

/** One document-order pass: assign each node a start offset and (for leaves) cache its graphemes. */
function measure(
  node: Nodes,
  ctx: { cursor: number; starts: WeakMap<Nodes, number>; graphemes: WeakMap<Nodes, string[]> },
): void {
  ctx.starts.set(node, ctx.cursor);
  switch (node.type) {
    case "text":
    case "inlineCode": {
      const gs = toGraphemes(node.value);
      ctx.graphemes.set(node, gs);
      ctx.cursor += gs.length;
      return;
    }
    case "image": {
      const gs = toGraphemes(node.alt ?? "");
      ctx.graphemes.set(node, gs);
      ctx.cursor += gs.length;
      return;
    }
    case "html": // raw HTML is dropped — costs nothing, shows nothing
    case "break":
      return;
    case "table":
    case "code":
    case "thematicBreak":
      ctx.cursor += STRUCTURED_BLOCK_UNITS; // atomic beat; children are not revealed one at a time
      return;
    default: {
      if ("children" in node) for (const child of node.children as Nodes[]) measure(child, ctx);
      return;
    }
  }
}

function parseMarkdown(src: string): ParsedMarkdown {
  const tree = processor.parse(src) as Root;
  const ctx = {
    cursor: 0,
    starts: new WeakMap<Nodes, number>(),
    graphemes: new WeakMap<Nodes, string[]>(),
  };
  measure(tree, ctx);
  return { tree, total: ctx.cursor, starts: ctx.starts, graphemes: ctx.graphemes };
}

/** Parse + measure once per message content (stable — the reveal is client-side over settled text). */
export function useMarkdown(src: string): ParsedMarkdown {
  return useMemo(() => parseMarkdown(src), [src]);
}

// ── sanitized helpers ────────────────────────────────────────────────────────────────────────────────

/** A link URL is rendered only if it is unambiguously safe; otherwise the caller shows plain text. */
function safeHref(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Strip control chars (defeats "java\nscript:" style splits) before testing the scheme.
  const url = [...raw].filter((ch) => { const c = ch.codePointAt(0); return c !== undefined && c > 31 && c !== 127; }).join("").trim();
  if (!url) return null;
  if (url.startsWith("/") || url.startsWith("#") || url.startsWith("./") || url.startsWith("../")) return url; // in-app
  if (/^(https?:|mailto:)/i.test(url)) return url;
  return null; // javascript:, data:, vbscript:, file:, … → not a link
}

const isExternal = (url: string): boolean => /^https?:/i.test(url);

const CODE_INLINE_CLS = "rounded border border-line2/70 bg-surface-2 px-1 py-0.5 font-mono text-[0.85em] text-ink";
const LINK_CLS =
  "text-ai-from underline decoration-ai-from/40 underline-offset-2 transition-colors hover:decoration-ai-from";

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

/** The blue→violet gradient caret trailing the character currently being typed. */
function Caret() {
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-[0.95em] w-0.5 -translate-y-px rounded-full bg-linear-to-b from-ai-from to-ai-to align-middle motion-safe:animate-pulse"
    />
  );
}

/** Wraps a structured block so it fades in as a unit when it first mounts (only while actively revealing;
 *  history / reduced-motion / a finalized skip render it plainly, with no animation). */
function StructuredBlock({
  children,
  animate,
  className,
}: {
  children: ReactNode;
  animate: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        animate &&
          "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-300",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── table (atomic — rendered whole) ──────────────────────────────────────────────────────────────────

function plainText(node: Nodes): string {
  if (node.type === "text" || node.type === "inlineCode") return node.value;
  if (node.type === "image") return node.alt ?? "";
  if ("children" in node) return (node.children as Nodes[]).map(plainText).join("");
  return "";
}

/** A financial-table cell is numeric if, stripped of currency / commas / % / common unit suffixes, it's a
 *  finite number — so we can right-align it and give it the `.num` mono treatment even when the model
 *  didn't write an explicit `---:` alignment row. */
function cellIsNumeric(text: string): boolean {
  const t = text.trim();
  if (!t || t === "-" || t === "—") return false;
  const cleaned = t
    .replace(/[₹$€£,%\s]/g, "")
    .replace(/(cr|crore|bn|mn|lakh|k|x|bps|pts?)$/i, "")
    .replace(/^[+\-–]/, "");
  return cleaned !== "" && Number.isFinite(Number(cleaned));
}

function renderTable(node: Table, keyBase: string, dense: boolean): ReactNode {
  const rows = node.children;
  if (rows.length === 0) return null;
  const [header, ...body] = rows;
  const cols = header.children.length;
  const explicit = node.align ?? [];
  const numericCol: boolean[] = Array.from({ length: cols }, (_, c) => {
    const cells = body.map((r) => r.children[c]).filter(Boolean);
    if (cells.length === 0) return false;
    const nums = cells.filter((cell) => cellIsNumeric(plainText(cell))).length;
    return nums >= Math.ceil(cells.length / 2);
  });
  const alignOf = (c: number): "left" | "right" | "center" => explicit[c] ?? (numericCol[c] ? "right" : "left");
  const alignCls = (a: string) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

  return (
    // The block scrolls WITHIN itself on a narrow surface (the panel ≈ 416px) — the page never scrolls sideways.
    <div className="custom-scrollbar overflow-x-auto rounded-lg border border-line2">
      <table className={cn("w-full border-collapse", dense ? "text-[12px]" : "text-[12.5px]")}>
        <thead>
          <tr>
            {header.children.map((cell, c) => (
              <th
                key={c}
                className={cn(
                  "whitespace-nowrap border-b border-line2 bg-surface-2 py-2 font-semibold text-ink2",
                  dense ? "px-2.5" : "px-3",
                  alignCls(alignOf(c)),
                )}
              >
                {renderFull(cell, `${keyBase}.h${c}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, r) => (
            <tr key={r} className="[&:last-child>td]:border-0">
              {row.children.map((cell, c) => {
                const num = cellIsNumeric(plainText(cell));
                return (
                  <td
                    key={c}
                    className={cn(
                      "border-b border-line/70 py-1.5 align-top text-ink",
                      dense ? "px-2.5" : "px-3",
                      alignCls(alignOf(c)), // column-consistent alignment
                      numericCol[c] && "whitespace-nowrap", // numeric columns never wrap
                      num && "num", // mono only on genuinely numeric cells (mixed columns stay readable)
                    )}
                  >
                    {renderFull(cell, `${keyBase}.r${r}c${c}`)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── FULL (non-reveal) inline renderer — used inside atomic blocks (table cells), which show all at once ──

function childrenFull(node: Nodes, keyBase: string): ReactNode {
  if (!("children" in node)) return null;
  return (node.children as Nodes[]).map((c, i) => (
    <Fragment key={`${keyBase}.${i}`}>{renderFull(c, `${keyBase}.${i}`)}</Fragment>
  ));
}

function renderFull(node: Nodes, keyBase: string): ReactNode {
  switch (node.type) {
    case "text":
      return node.value;
    case "inlineCode":
      return <code className={CODE_INLINE_CLS}>{node.value}</code>;
    case "strong":
      return <strong className="font-semibold text-ink">{childrenFull(node, keyBase)}</strong>;
    case "emphasis":
      return <em className="italic">{childrenFull(node, keyBase)}</em>;
    case "delete":
      return <del className="text-ink3 line-through">{childrenFull(node, keyBase)}</del>;
    case "break":
      return <br />;
    case "image":
      return node.alt ?? "";
    case "html":
      return null;
    case "link": {
      const href = safeHref(node.url);
      const kids = childrenFull(node, keyBase);
      if (!href) return <>{kids}</>;
      return (
        <a
          href={href}
          className={LINK_CLS}
          {...(isExternal(href) ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
        >
          {kids}
        </a>
      );
    }
    default:
      return "children" in node ? <>{childrenFull(node, keyBase)}</> : null;
  }
}

// ── REVEAL renderer — text types out; blocks appear in order; structured blocks fade in whole ──────────

interface RevealCtx {
  starts: WeakMap<Nodes, number>;
  graphemes: WeakMap<Nodes, string[]>;
  revealed: number;
  total: number;
  showCaret: boolean;
  animate: boolean;
  /** The narrow-rail type scale — every size in this file has a page value and a panel value. */
  dense: boolean;
}

function childrenReveal(node: Nodes, ctx: RevealCtx, keyBase: string): ReactNode {
  if (!("children" in node)) return null;
  return (node.children as Nodes[]).map((c, i) => (
    <Fragment key={`${keyBase}.${i}`}>{renderReveal(c, ctx, `${keyBase}.${i}`)}</Fragment>
  ));
}

function headingEl(depth: number, kids: ReactNode, dense: boolean): ReactNode {
  switch (depth) {
    case 1:
      return (
        <h1 className={cn("mt-4 font-display font-semibold wrap-break-word text-ink", dense ? "text-[15px]" : "text-[16px]")}>
          {kids}
        </h1>
      );
    case 2:
      return (
        <h2 className={cn("mt-4 font-display font-semibold wrap-break-word text-ink", dense ? "text-[14.5px]" : "text-[15.5px]")}>
          {kids}
        </h2>
      );
    case 3:
      return (
        <h3 className={cn("mt-3.5 font-semibold wrap-break-word text-ink", dense ? "text-[14px]" : "text-[14.5px]")}>
          {kids}
        </h3>
      );
    default:
      return (
        <h4 className={cn("mt-3 font-semibold wrap-break-word text-ink2", dense ? "text-[13px]" : "text-[14px]")}>
          {kids}
        </h4>
      );
  }
}

function renderReveal(node: Nodes, ctx: RevealCtx, keyBase: string): ReactNode {
  const start = ctx.starts.get(node) ?? 0;

  switch (node.type) {
    case "root":
      return childrenReveal(node, ctx, keyBase);

    // ---- typed inline leaves ----
    case "text": {
      const gs = ctx.graphemes.get(node) ?? [];
      const shown = clamp(ctx.revealed - start, 0, gs.length);
      const str = gs.slice(0, shown).join("");
      // The caret sits on the leaf straddling the reveal frontier (and not once everything is done).
      const active = ctx.showCaret && ctx.revealed > start && ctx.revealed <= start + gs.length && ctx.revealed < ctx.total;
      return (
        <>
          {str}
          {active && <Caret />}
        </>
      );
    }
    case "inlineCode": {
      const gs = ctx.graphemes.get(node) ?? [];
      const shown = clamp(ctx.revealed - start, 0, gs.length);
      if (shown <= 0) return null;
      return <code className={CODE_INLINE_CLS}>{gs.slice(0, shown).join("")}</code>;
    }
    case "image": {
      const gs = ctx.graphemes.get(node) ?? [];
      return gs.slice(0, clamp(ctx.revealed - start, 0, gs.length)).join("");
    }

    // ---- inline wrappers (already-formatted while their text types; empty is invisible) ----
    case "strong":
      return <strong className="font-semibold text-ink">{childrenReveal(node, ctx, keyBase)}</strong>;
    case "emphasis":
      return <em className="italic">{childrenReveal(node, ctx, keyBase)}</em>;
    case "delete":
      return <del className="text-ink3 line-through">{childrenReveal(node, ctx, keyBase)}</del>;
    case "break":
      return <br />;
    case "link": {
      const href = safeHref(node.url);
      const kids = childrenReveal(node, ctx, keyBase);
      if (!href) return <>{kids}</>;
      return (
        <a
          href={href}
          className={LINK_CLS}
          {...(isExternal(href) ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
        >
          {kids}
        </a>
      );
    }

    // ---- text blocks (appear as their first character types) ----
    case "paragraph":
      if (ctx.revealed <= start) return null;
      return <p className="mt-2.5 wrap-break-word">{childrenReveal(node, ctx, keyBase)}</p>;
    case "heading":
      if (ctx.revealed <= start) return null;
      return headingEl(node.depth, childrenReveal(node, ctx, keyBase), ctx.dense);
    case "blockquote":
      if (ctx.revealed <= start) return null;
      return (
        <blockquote className="mt-2.5 border-l-2 border-line2 pl-3 text-ink2 [&>*:first-child]:mt-0">
          {childrenReveal(node, ctx, keyBase)}
        </blockquote>
      );
    case "list": {
      if (ctx.revealed <= start) return null;
      const cls = "mt-2.5 space-y-1 pl-5 marker:text-ink3 [&_li>ol]:mt-1 [&_li>ul]:mt-1";
      return node.ordered ? (
        <ol start={node.start ?? 1} className={cn("list-decimal", cls)}>
          {childrenReveal(node, ctx, keyBase)}
        </ol>
      ) : (
        <ul className={cn("list-disc", cls)}>{childrenReveal(node, ctx, keyBase)}</ul>
      );
    }
    case "listItem": {
      if (ctx.revealed <= start) return null;
      if (typeof node.checked === "boolean") {
        // GFM task-list item — a small checkbox instead of a bullet.
        return (
          <li className="-ml-5 flex list-none gap-2">
            <span
              aria-hidden
              className={cn(
                "mt-[0.28em] grid size-3.5 shrink-0 place-items-center rounded border text-[9px] font-bold leading-none",
                node.checked ? "border-ai-from bg-ai-from/15 text-ai-from" : "border-line2 text-transparent",
              )}
            >
              ✓
            </span>
            <div className="min-w-0 flex-1 [&>*:first-child]:mt-0">{childrenReveal(node, ctx, keyBase)}</div>
          </li>
        );
      }
      return <li className="[&>*:first-child]:mt-0">{childrenReveal(node, ctx, keyBase)}</li>;
    }

    // ---- structured blocks (atomic; fade in whole) ----
    case "code":
      if (ctx.revealed <= start) return null;
      return (
        <StructuredBlock animate={ctx.animate} className="mt-2.5">
          <pre
            className={cn(
              "custom-scrollbar overflow-x-auto rounded-lg border border-line2 bg-surface-2 leading-relaxed",
              ctx.dense ? "p-2.5 text-[11.5px]" : "p-3 text-[12px]",
            )}
          >
            <code className="font-mono text-ink2">{node.value}</code>
          </pre>
        </StructuredBlock>
      );
    case "table":
      if (ctx.revealed <= start) return null;
      return (
        <StructuredBlock animate={ctx.animate} className="mt-2.5">
          {renderTable(node, keyBase, ctx.dense)}
        </StructuredBlock>
      );
    case "thematicBreak":
      if (ctx.revealed <= start) return null;
      return (
        <StructuredBlock animate={ctx.animate}>
          <hr className="my-4 border-0 border-t border-line2" />
        </StructuredBlock>
      );

    case "html":
      return null; // raw HTML disallowed entirely

    default:
      return "children" in node ? <>{childrenReveal(node, ctx, keyBase)}</> : null;
  }
}

/**
 * Render parsed markdown, revealed up to `revealed` units. `showCaret` draws the typing caret at the
 * frontier; `animate` fades structured blocks in as they mount (both true only while actively typing —
 * loaded history, reduced motion, and a finalized skip pass revealed=total with both false → the whole
 * message renders at once, fully formatted, no animation).
 */
export function MarkdownView({
  parsed,
  revealed,
  showCaret,
  animate,
  dense = false,
}: {
  parsed: ParsedMarkdown;
  revealed: number;
  showCaret: boolean;
  animate: boolean;
  /** The sidekick rail's narrower column takes the whole scale down a step (see chat-transcript §DENSE). */
  dense?: boolean;
}) {
  const ctx: RevealCtx = {
    starts: parsed.starts,
    graphemes: parsed.graphemes,
    revealed,
    total: parsed.total,
    showCaret,
    animate,
    dense,
  };
  return (
    <div className={cn("leading-relaxed text-ink [&>*:first-child]:mt-0", dense ? "text-[14px]" : "text-[15.5px]")}>
      {renderReveal(parsed.tree, ctx, "n")}
    </div>
  );
}
