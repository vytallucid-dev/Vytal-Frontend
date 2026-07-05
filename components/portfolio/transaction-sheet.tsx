"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useUniverseStocks } from "@/lib/api/hooks/use-stocks";
import { useTransactionMutations } from "@/lib/api/hooks/use-transactions";
import type { Transaction, TransactionInput, TransactionType } from "@/types/portfolio";
import {
  TXN_TYPES,
  TXN_TYPE_META,
  type TxnField,
  parseTxnError,
  ratioValid,
} from "./transactions/lib";

// The GLOBAL add/edit side-sheet — the one writing surface. Slides from the right with
// the portfolio visible behind it (context kept). One form, defaults to BUY. On save it
// POSTs (or PATCHes) → the backend runs the FIFO replay → holdings/PHS/NAV recompute →
// the mutation invalidates the portfolio tree so the view re-reads the fresh truth. No
// derived number is ever faked client-side.

function todayISO(): string {
  // client-only component — real "today" for the default trade date
  return new Date().toISOString().slice(0, 10);
}

// ── searchable universe picker (compact combobox) ────────────────────────────────
function StockPicker({
  value,
  label,
  onSelect,
  error,
  disabled,
}: {
  value: string;
  label: string;
  onSelect: (symbol: string, label: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const { data: universe, isLoading } = useUniverseStocks();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !universe) return [];
    return universe
      .filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, universe]);

  if (disabled) {
    // edit mode — symbol isn't editable server-side
    return (
      <div>
        <div className="flex h-9 items-center rounded-md border border-line2 bg-surface-2 px-3 text-[13px] text-ink2">
          <span className="num font-medium text-ink">{value}</span>
          {label && label !== value && <span className="ml-2 truncate text-ink3">{label.replace(`${value} — `, "")}</span>}
        </div>
        <p className="mt-1 text-[10.5px] text-ink3">Symbol isn&apos;t editable — delete &amp; re-add to move a trade to another stock.</p>
      </div>
    );
  }

  return (
    <div className="relative" ref={boxRef}>
      {value ? (
        <div className="flex h-9 items-center justify-between rounded-md border border-line2 bg-surface-1 px-3 text-[13px]">
          <span className="min-w-0 truncate">
            <span className="num font-medium text-ink">{value}</span>
            {label && label !== value && <span className="ml-2 text-ink3">{label.replace(`${value} — `, "")}</span>}
          </span>
          <button
            type="button"
            onClick={() => {
              onSelect("", "");
              setQuery("");
              setOpen(true);
            }}
            className="ml-2 shrink-0 text-ink3 transition-colors hover:text-ink"
            aria-label="Change stock"
          >
            <Icons.close className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Icons.search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink3" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search ticker or company…"
            aria-invalid={!!error}
            className="h-9 pl-8 text-[13px]"
          />
        </div>
      )}

      {open && !value && query.trim() && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-line2 bg-surface-1 shadow-lg">
          {isLoading ? (
            <p className="px-3 py-3 text-[12px] text-ink3">Loading the universe…</p>
          ) : matches.length === 0 ? (
            <p className="px-3 py-3 text-[12px] text-ink3">
              No tracked stock matches “{query.trim()}”. Only names in the universe can be added.
            </p>
          ) : (
            <ul className="max-h-56 overflow-y-auto py-1">
              {matches.map((s) => (
                <li key={s.symbol}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(s.symbol, `${s.symbol} — ${s.name}`);
                      setQuery("");
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-surface-2"
                  >
                    <span className="num text-[12.5px] font-semibold text-ink">{s.symbol}</span>
                    <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink3">{s.name}</span>
                    {!s.scored && <span className="shrink-0 text-[9.5px] uppercase tracking-wide text-ink3">unscored</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── a labelled field wrapper ─────────────────────────────────────────────────────
function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 flex items-baseline justify-between text-[11px] font-medium text-ink2">
        <span>{label}</span>
        {hint && <span className="text-[10px] font-normal text-ink3">{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[11px] text-danger">{error}</p>}
    </div>
  );
}

export function TransactionSheet({
  open,
  onOpenChange,
  editing,
  initialSymbol,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Transaction | null;
  /** ADD-mode only: pre-select this symbol (e.g. opened from the watchlist quick-look).
   *  Ignored in edit mode (the edit target's symbol wins). */
  initialSymbol?: string;
}) {
  const isEdit = !!editing;
  const { add, update } = useTransactionMutations();

  const [type, setType] = useState<TransactionType>("buy");
  const [symbol, setSymbol] = useState("");
  const [stockLabel, setStockLabel] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [fees, setFees] = useState(""); // optional ₹ charge on buy/sell (blank = 0)
  const [amount, setAmount] = useState(""); // dividend ₹ (maps to the price slot)
  const [ratio, setRatio] = useState("");
  const [tradeDate, setTradeDate] = useState(todayISO());
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Partial<Record<TxnField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  // (re)initialise whenever the sheet opens or the edit target changes
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormError(null);
    setFlash(null);
    if (editing) {
      setType(editing.type);
      setSymbol(editing.symbol);
      setStockLabel(editing.symbol);
      setQty(editing.quantity != null ? String(editing.quantity) : "");
      setPrice(editing.type === "dividend" ? "" : editing.price != null ? String(editing.price) : "");
      setFees(editing.fees != null && editing.fees > 0 ? String(editing.fees) : "");
      setAmount(editing.type === "dividend" && editing.price != null ? String(editing.price) : "");
      setRatio(editing.ratio ?? "");
      setTradeDate(editing.tradeDate);
      setNotes(editing.notes ?? "");
    } else {
      setType("buy");
      setSymbol(initialSymbol ?? "");
      setStockLabel(initialSymbol ?? "");
      setQty("");
      setPrice("");
      setFees("");
      setAmount("");
      setRatio("");
      setTradeDate(todayISO());
      setNotes("");
    }
  }, [open, editing, initialSymbol]);

  const saving = add.isPending || update.isPending;
  const isTrade = type === "buy" || type === "sell";
  const isAction = type === "split" || type === "bonus";

  function validate(): Partial<Record<TxnField, string>> {
    const e: Partial<Record<TxnField, string>> = {};
    if (!symbol) e.symbol = "Pick a stock from the universe.";
    if (!tradeDate) e.tradeDate = "A trade date is required.";
    if (isTrade) {
      if (!(Number(qty) > 0)) e.quantity = "Enter a quantity greater than 0.";
      if (!(Number(price) > 0)) e.price = "Enter a price greater than 0.";
      if (fees.trim() !== "" && !(Number(fees) >= 0)) e.fees = "Fees can't be negative.";
    } else if (type === "dividend") {
      if (!(Number(amount) > 0)) e.price = "Enter an amount greater than 0.";
    } else if (isAction) {
      if (!ratioValid(ratio.trim())) e.ratio = 'Enter a ratio like "1:1" (a additional shares per b held).';
    }
    if (notes.length > 500) e.notes = "Keep notes under 500 characters.";
    return e;
  }

  function buildBody(): TransactionInput {
    const base = { symbol, type, tradeDate, notes: notes.trim() || undefined };
    if (isTrade) {
      // blank fee = 0 → omit the field (backend defaults it); a real charge is sent through
      const feeNum = fees.trim() === "" ? undefined : Number(fees);
      return { ...base, quantity: Number(qty), price: Number(price), fees: feeNum };
    }
    if (type === "dividend") return { ...base, price: Number(amount) };
    return { ...base, ratio: ratio.trim() }; // split / bonus
  }

  async function save(addAnother: boolean) {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      setFormError(null);
      setFlash(null);
      return;
    }
    setErrors({});
    setFormError(null);
    const body = buildBody();
    try {
      if (isEdit && editing) {
        const { symbol: _drop, ...patch } = body; // symbol isn't editable
        void _drop;
        await update.mutateAsync({ id: editing.id, body: patch });
        onOpenChange(false);
      } else if (addAnother) {
        await add.mutateAsync(body);
        // keep type + date for a fast run of entries; clear the per-trade fields
        const savedSym = symbol;
        setSymbol("");
        setStockLabel("");
        setQty("");
        setPrice("");
        setFees("");
        setAmount("");
        setRatio("");
        setNotes("");
        setFlash(`Saved ${savedSym} — your book updated. Add another.`);
      } else {
        await add.mutateAsync(body);
        onOpenChange(false);
      }
    } catch (err) {
      const p = parseTxnError(err);
      setErrors(p.fields);
      setFormError(p.formError ?? null);
      setFlash(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-line bg-background p-0 sm:max-w-md"
      >
        {/* header */}
        <div className="border-b border-line px-5 pb-4 pt-5">
          <SheetTitle className="font-display text-[18px] font-semibold text-ink">
            {isEdit ? "Edit transaction" : "Add transaction"}
          </SheetTitle>
          <SheetDescription className="mt-1 text-[12px] leading-relaxed text-ink3">
            {isEdit
              ? "Corrections replay your whole ledger — holdings, health and value recompute."
              : "Recorded to your ledger, then replayed into holdings, health and value."}
          </SheetDescription>
        </div>

        {/* body (scrolls) */}
        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-4">
          {/* type selector — defaults to buy; other types one tap away */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[11px] font-medium text-ink2">Type</label>
            <div className="grid grid-cols-5 gap-1 rounded-lg border border-line2 bg-surface-2 p-1">
              {TXN_TYPES.map((t) => {
                const meta = TXN_TYPE_META[t];
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      setErrors({});
                      setFormError(null);
                    }}
                    className={cn(
                      "rounded-md py-1.5 text-[11.5px] font-medium transition-colors",
                      active ? "text-ink" : "text-ink3 hover:text-ink2",
                    )}
                    style={active ? { background: "var(--surface-3)", boxShadow: `inset 0 0 0 1px ${meta.color}66` } : undefined}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* stock */}
            <Field label="Stock" error={errors.symbol}>
              <StockPicker
                value={symbol}
                label={stockLabel}
                onSelect={(s, l) => {
                  setSymbol(s);
                  setStockLabel(l);
                  setErrors((e) => ({ ...e, symbol: undefined }));
                }}
                error={errors.symbol}
                disabled={isEdit}
              />
            </Field>

            {/* type-aware numeric fields */}
            {isTrade && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Quantity" error={errors.quantity}>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      aria-invalid={!!errors.quantity}
                      className="num h-9 text-[13px]"
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Price" hint="₹ / share" error={errors.price}>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      aria-invalid={!!errors.price}
                      className="num h-9 text-[13px]"
                      placeholder="0.00"
                    />
                  </Field>
                </div>
                <Field label="Fees" hint="₹ · optional" error={errors.fees}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={fees}
                    onChange={(e) => setFees(e.target.value)}
                    aria-invalid={!!errors.fees}
                    className="num h-9 text-[13px]"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-[10px] leading-relaxed text-ink3">
                    Brokerage, STT &amp; other charges. Folds into cost basis on a buy, proceeds on a sell — blank means none.
                  </p>
                </Field>
              </>
            )}

            {type === "dividend" && (
              <Field label="Amount received" hint="₹ total" error={errors.price}>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-invalid={!!errors.price}
                  className="num h-9 text-[13px]"
                  placeholder="0.00"
                />
              </Field>
            )}

            {isAction && (
              <Field label="Ratio" hint="a : b — a extra per b held" error={errors.ratio}>
                <Input
                  value={ratio}
                  onChange={(e) => setRatio(e.target.value)}
                  aria-invalid={!!errors.ratio}
                  className="num h-9 text-[13px]"
                  placeholder="1:1"
                />
              </Field>
            )}

            {/* date */}
            <Field label="Trade date" error={errors.tradeDate}>
              <Input
                type="date"
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
                aria-invalid={!!errors.tradeDate}
                className="num h-9 text-[13px]"
              />
            </Field>

            {/* note */}
            <Field label="Note" hint="optional" error={errors.notes}>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Anything worth remembering about this entry…"
                className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-ink3 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </Field>

          </div>

          {/* form-level error / re-auth (input is never dropped on a recoverable error) */}
          {formError && (
            <div
              className="mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-[12px]"
              style={{ color: "var(--crit)", borderColor: "var(--crit-bd)", background: "var(--crit-bg)" }}
            >
              <Icons.warning weight="fill" className="mt-0.5 size-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          {flash && (
            <div
              className="mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-[12px]"
              style={{ color: "var(--rec)", borderColor: "var(--rec-bd)", background: "var(--rec-bg)" }}
            >
              <Icons.check weight="bold" className="mt-0.5 size-4 shrink-0" />
              <span>{flash}</span>
            </div>
          )}
        </div>

        {/* footer actions */}
        <div className="flex flex-col gap-2 border-t border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => save(false)}
              disabled={saving}
              className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-[13px] font-medium text-primary-foreground transition-[filter] hover:brightness-110 disabled:opacity-60"
            >
              {saving && <Icons.spinner className="size-3.5 animate-spin" />}
              {isEdit ? "Save changes" : "Save"}
            </button>
            {!isEdit && (
              <button
                type="button"
                onClick={() => save(true)}
                disabled={saving}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line2 bg-surface-1 px-3 text-[12.5px] font-medium text-ink2 transition-colors hover:border-line3 hover:text-ink disabled:opacity-60"
              >
                <Icons.plus className="size-3.5" />
                Save &amp; add another
              </button>
            )}
          </div>
          <p className="text-center text-[10.5px] text-ink3">
            {isEdit ? "Saving recomputes holdings, health &amp; value." : "Saving replays your ledger — holdings, health &amp; value update."}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
