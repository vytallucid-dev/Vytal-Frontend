"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useAccounts } from "@/lib/api/hooks/use-accounts";
import { useInstrumentSearch, INSTRUMENT_SEARCH_MIN_Q } from "@/lib/api/hooks/use-instruments";
import { useTransactionMutations } from "@/lib/api/hooks/use-transactions";
import type { Transaction, TransactionInput, TransactionType } from "@/types/portfolio";
import { isCouponBearing } from "@/lib/asset-class";
import { AssetClassChip } from "./asset-class-chip";
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

/** An instrument the user has settled on. `submitId` is what the POST sends in its `symbol` field —
 *  an ISIN when chosen through the picker (unambiguous, dodges the 409), or a bare ticker when it
 *  arrives via `initialSymbol` / an edit target (a stock ticker never collides, so it resolves cleanly).
 *  `assetClass` drives the class chip and the coupon-bearing (bond/gsec/sgb) disclosure. */
interface PickedInstrument {
  submitId: string;
  symbol: string | null;
  name: string;
  assetClass: string | null;
  isActive: boolean;
}

// ── universe-wide instrument picker (server search over the WHOLE catalogue, not just equities) ─────
function InstrumentPicker({
  value,
  onSelect,
  onClear,
  error,
  disabled,
}: {
  value: PickedInstrument | null;
  onSelect: (p: PickedInstrument) => void;
  onClear: () => void;
  error?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounce — every distinct term is a network round-trip against a ~19k-row catalogue, so we don't
  // fire on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const trimmed = query.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < INSTRUMENT_SEARCH_MIN_Q;
  const { data, isLoading, isFetching } = useInstrumentSearch(debounced);
  const results = data?.results ?? [];
  const searching = trimmed.length >= INSTRUMENT_SEARCH_MIN_Q;

  if (disabled) {
    // edit mode — the INSTRUMENT is fixed at create (PATCH can't re-parent between FIFO queues).
    return (
      <div>
        <div className="flex h-9 items-center gap-2 rounded-md border border-line2 bg-surface-2 px-3 text-[13px]">
          {value?.assetClass && <AssetClassChip assetClass={value.assetClass} />}
          <span className="min-w-0 truncate font-medium text-ink">{value?.name ?? "—"}</span>
          {value?.symbol && value.symbol !== value.name && (
            <span className="num ml-auto shrink-0 text-ink3">{value.symbol}</span>
          )}
        </div>
        <p className="mt-1 text-[10.5px] text-ink3">
          The instrument is fixed — delete &amp; re-add to record a trade against a different one.
        </p>
      </div>
    );
  }

  if (value) {
    // a settled selection — show what was picked (class + name + ticker/ISIN), with a change affordance
    return (
      <div className="flex h-9 items-center gap-2 rounded-md border border-line2 bg-surface-1 px-3 text-[13px]">
        {value.assetClass && <AssetClassChip assetClass={value.assetClass} />}
        <span className="min-w-0 flex-1 truncate">
          <span className="font-medium text-ink">{value.name}</span>
          {value.symbol && value.symbol !== value.name && (
            <span className="num ml-2 text-ink3">{value.symbol}</span>
          )}
        </span>
        {!value.isActive && (
          <span className="shrink-0 text-[9.5px] uppercase tracking-wide" style={{ color: "var(--high)" }}>
            inactive
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            onClear();
            setQuery("");
            setDebounced("");
            setOpen(true);
          }}
          className="shrink-0 text-ink3 transition-colors hover:text-ink"
          aria-label="Change instrument"
        >
          <Icons.close className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
        <Icons.search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink3" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search any stock, fund, ETF, bond, REIT…"
          aria-invalid={!!error}
          className="h-9 pl-8 text-[13px]"
        />
        {isFetching && searching && (
          <Icons.spinner className="absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-ink3" />
        )}
      </div>

      {open && trimmed && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-line2 bg-surface-1 shadow-lg">
          {tooShort ? (
            // amendment #1 — never fire below the min length; say WHY rather than sit silently empty
            <p className="px-3 py-3 text-[12px] text-ink3">
              Type at least {INSTRUMENT_SEARCH_MIN_Q} characters to search the universe.
            </p>
          ) : isLoading ? (
            <p className="px-3 py-3 text-[12px] text-ink3">Searching the universe…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-[12px] text-ink3">
              Nothing in the universe matches “{trimmed}”. Only instruments we track can be added — a broker sync is
              the only way to admit a new one.
            </p>
          ) : (
            <>
              <ul className="max-h-64 overflow-y-auto py-1">
                {results.map((r) => (
                  <li key={r.isin}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect({
                          submitId: r.isin, // ISIN — the unambiguous key; never a bare symbol
                          symbol: r.symbol,
                          name: r.name,
                          assetClass: r.assetClass,
                          isActive: r.isActive,
                        });
                        setQuery("");
                        setDebounced("");
                        setOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-surface-2"
                    >
                      <AssetClassChip assetClass={r.assetClass} />
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{r.name}</span>
                      {!r.isActive && (
                        <span
                          className="shrink-0 text-[9.5px] uppercase tracking-wide"
                          style={{ color: "var(--high)" }}
                        >
                          inactive
                        </span>
                      )}
                      <span className="num shrink-0 text-[11px] text-ink3">{r.symbol ?? r.isin}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {data?.hasMore && (
                // amendment #2 — a capped list that looks complete is a lie; say it's capped
                <div className="border-t border-line2 px-3 py-1.5 text-[10.5px] text-ink3">
                  Showing the first {results.length} of many — keep typing to narrow to the one you hold.
                </div>
              )}
            </>
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
  /** ADD-mode only: pre-select this instrument by ticker (e.g. opened from the watchlist quick-look).
   *  Ignored in edit mode (the edit target's instrument wins). A stock ticker resolves unambiguously. */
  initialSymbol?: string;
}) {
  const isEdit = !!editing;
  const { add, update } = useTransactionMutations();

  // The books this transaction could land in. STATED (manual) accounts only: a Verified book is
  // broker-attested, and a hand-made row must never enter it. We don't even list a disabled Verified
  // row (it only invites "why not") — the set of entry targets is exactly what the backend accepts
  // (manualEntryAllowed === state === "manual"). Reuses the app-wide accounts read; adds no call.
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const statedAccounts = useMemo(() => (accounts ?? []).filter((a) => a.manualEntryAllowed), [accounts]);

  const [type, setType] = useState<TransactionType>("buy");
  const [instrument, setInstrument] = useState<PickedInstrument | null>(null);
  const [accountId, setAccountId] = useState(""); // which book (Stated only); always SENT on add
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
  // A 409 ambiguous_symbol carries candidates the backend refused to pick between — rendered as a
  // picker (never auto-resolved). Because the picker submits an ISIN, this is a defensive backstop.
  const [disambig, setDisambig] = useState<{ isin: string; name: string; assetClass: string }[] | null>(null);
  // edit mode asks for a confirmation before it replays the ledger (mirrors delete)
  const [confirmEdit, setConfirmEdit] = useState(false);

  // (re)initialise whenever the sheet opens or the edit target changes
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormError(null);
    setFlash(null);
    setDisambig(null);
    setConfirmEdit(false);
    if (editing) {
      setType(editing.type);
      // The instrument is read-only in edit; `editing.symbol` is the ledger's display label (a ticker,
      // or the ISIN for a ticker-less fund). Carry the class so the chip + bond disclosure still show.
      setInstrument({
        submitId: editing.symbol,
        symbol: editing.symbol,
        name: editing.symbol,
        assetClass: editing.assetClass ?? null,
        isActive: true,
      });
      setAccountId(editing.accountId ?? ""); // read-only in edit; kept only to name the account
      setQty(editing.quantity != null ? String(editing.quantity) : "");
      setPrice(editing.type === "dividend" ? "" : editing.price != null ? String(editing.price) : "");
      setFees(editing.fees != null && editing.fees > 0 ? String(editing.fees) : "");
      setAmount(editing.type === "dividend" && editing.price != null ? String(editing.price) : "");
      setRatio(editing.ratio ?? "");
      setTradeDate(editing.tradeDate);
      setNotes(editing.notes ?? "");
    } else {
      setType("buy");
      // ADD from a quick-look pre-selects a ticker (no class known yet — it's an equity source, so no
      // disclosure applies). Otherwise the picker starts empty.
      setInstrument(
        initialSymbol
          ? { submitId: initialSymbol, symbol: initialSymbol, name: initialSymbol, assetClass: null, isActive: true }
          : null,
      );
      setAccountId(""); // add mode: the preselect effect fills the lone Stated account once accounts load
      setQty("");
      setPrice("");
      setFees("");
      setAmount("");
      setRatio("");
      setTradeDate(todayISO());
      setNotes("");
    }
  }, [open, editing, initialSymbol]);

  // One Stated account → preselect it, and still SEND accountId (the backend does NOT infer it; that
  // missing inference is exactly what broke). Runs once the accounts read resolves; ADD mode only,
  // and never overrides an existing pick — so a 2+-account user is left to choose (no default guess).
  useEffect(() => {
    if (!open || isEdit) return;
    if (!accountId && statedAccounts.length === 1) setAccountId(statedAccounts[0].id);
  }, [open, isEdit, accountId, statedAccounts]);

  const saving = add.isPending || update.isPending;
  const isTrade = type === "buy" || type === "sell";
  const isAction = type === "split" || type === "bonus";
  const couponBearing = isCouponBearing(instrument?.assetClass);

  // ADD mode with no Stated account (zero accounts, or every account Verified) → the sheet cannot do
  // its job. We say so and point at creating one, rather than render a form that will 400. Gated on
  // !accountsLoading so it never flashes before the accounts read resolves.
  const noWritableAccount = !isEdit && !accountsLoading && statedAccounts.length === 0;
  // Don't let a save fire before we know there's a writable target (add mode).
  const blockSave = !isEdit && (accountsLoading || noWritableAccount);
  // Edit mode shows which book the row lives in, read-only — resolve its display name from the list.
  const editAccountName =
    (accounts ?? []).find((a) => a.id === editing?.accountId)?.name ??
    (accountsLoading ? "Loading…" : editing?.accountId ? "This account" : "—");

  // Price is per SHARE for a stock, per UNIT for a fund/ETF, and DIRTY (accrued-interest-inclusive)
  // for coupon-bearing debt — the one instruction that makes a bond's cost basis exact without any
  // accrued-interest math on our side.
  const priceHint = couponBearing
    ? "₹ · incl. accrued interest"
    : instrument?.assetClass && instrument.assetClass !== "stock"
      ? "₹ / unit"
      : "₹ / share";

  function validate(): Partial<Record<TxnField, string>> {
    const e: Partial<Record<TxnField, string>> = {};
    // The account is fixed in edit mode; on add it's required (preselected when there's exactly one,
    // so this only ever bites a multi-account user who hasn't chosen yet).
    if (!isEdit && !accountId) e.account = "Choose the account this transaction belongs to.";
    if (!instrument) e.symbol = "Pick an instrument from the universe.";
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
    // `symbol` carries the submit identifier (an ISIN from the picker, a ticker via initialSymbol/edit);
    // the backend resolves it to exactly one instrument — the SPINE — or refuses. accountId is carried
    // on every build and stripped by the edit path (the account is fixed at create — PATCH refuses it).
    const base = {
      symbol: instrument?.submitId ?? "",
      type,
      tradeDate,
      notes: notes.trim() || undefined,
      accountId: accountId || undefined,
    };
    if (isTrade) {
      // blank fee = 0 → omit the field (backend defaults it); a real charge is sent through
      const feeNum = fees.trim() === "" ? undefined : Number(fees);
      return { ...base, quantity: Number(qty), price: Number(price), fees: feeNum };
    }
    if (type === "dividend") return { ...base, price: Number(amount) };
    return { ...base, ratio: ratio.trim() }; // split / bonus
  }

  async function save(addAnother: boolean): Promise<boolean> {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      setFormError(null);
      setFlash(null);
      return false;
    }
    setErrors({});
    setFormError(null);
    setDisambig(null);
    const body = buildBody();
    try {
      if (isEdit && editing) {
        const { symbol: _drop, accountId: _dropAcct, ...patch } = body; // symbol + account aren't editable
        void _drop;
        void _dropAcct;
        await update.mutateAsync({ id: editing.id, body: patch });
        onOpenChange(false);
      } else if (addAnother) {
        await add.mutateAsync(body);
        // keep type + account + date for a fast run of entries; clear the per-trade fields
        const savedSym = instrument?.symbol ?? instrument?.name ?? "instrument";
        setInstrument(null);
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
      return true;
    } catch (err) {
      const p = parseTxnError(err);
      setErrors(p.fields);
      setFormError(p.formError ?? null);
      setDisambig(p.disambiguation && p.disambiguation.length > 0 ? p.disambiguation : null);
      setFlash(null);
      return false;
    }
  }

  // The primary save action. An EDIT replays the whole ledger, so it routes through a
  // confirmation step first (validate up front so the dialog never opens over a bad form);
  // an ADD saves straight away.
  function requestSave() {
    if (isEdit) {
      const errs = validate();
      if (Object.keys(errs).length) {
        setErrors(errs);
        setFormError(null);
        setFlash(null);
        return;
      }
      setErrors({});
      setFormError(null);
      setConfirmEdit(true);
    } else {
      void save(false);
    }
  }

  async function confirmSave() {
    await save(false); // on success the sheet closes; on error the in-sheet error shows
    setConfirmEdit(false);
  }

  // a concise read-back of the edit for the confirmation dialog
  const editSummary = isTrade
    ? `${qty || "—"} × ₹${price || "—"}`
    : type === "dividend"
      ? `₹${amount || "—"}`
      : ratio || "—";
  const confirmLabel = instrument?.symbol ?? instrument?.name ?? "—";

  return (
    <>
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
          {noWritableAccount ? (
            // No Stated account exists (zero accounts, or every one is Verified) → the sheet can't do
            // its job. Say so plainly and point at creating an account; never render a form that 400s.
            <div className="rounded-xl border border-dashed border-line2 px-5 py-10 text-center">
              <Icons.portfolio weight="duotone" className="mx-auto mb-3 size-7 text-ink3 opacity-70" />
              <h3 className="font-display text-[15px] font-semibold text-ink2">
                {accounts && accounts.length > 0 ? "No account can take a manual entry" : "You don’t have an account yet"}
              </h3>
              <p className="mx-auto mt-1.5 max-w-xs text-[12px] leading-relaxed text-ink3">
                {accounts && accounts.length > 0
                  ? "Every account you have is broker-managed (Verified) — its holdings come from the broker’s feed, so hand-entered transactions can’t go there. Create a Stated account you own to add trades by hand."
                  : "Transactions live inside an account. Create one — and pick its broker — then add trades to it here."}
              </p>
              <Link
                href="/portfolio?tab=accounts"
                onClick={() => onOpenChange(false)}
                className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[12.5px] font-medium text-primary-foreground transition-[filter] hover:brightness-110"
              >
                <Icons.plus className="size-3.5" />
                {accounts && accounts.length > 0 ? "Create a Stated account" : "Create your first account"}
              </Link>
            </div>
          ) : (
          <>
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
                      setDisambig(null);
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
            {/* account — which book this transaction lands in. STATED accounts only; a lone one is
                preselected, 2+ makes the user choose, and it's read-only once a row exists. */}
            <Field
              label="Account"
              hint={isEdit ? "fixed" : statedAccounts.length > 1 ? "which book" : undefined}
              error={errors.account}
            >
              {isEdit || (!accountsLoading && statedAccounts.length === 1) ? (
                <div className="flex h-9 items-center rounded-md border border-line2 bg-surface-2 px-3 text-[13px]">
                  <Icons.portfolio className="mr-2 size-3.5 shrink-0 text-ink3" />
                  <span className="truncate font-medium text-ink">
                    {isEdit ? editAccountName : statedAccounts[0].name}
                  </span>
                </div>
              ) : accountsLoading ? (
                <div className="flex h-9 items-center gap-2 rounded-md border border-line2 bg-surface-2 px-3 text-[13px] text-ink3">
                  <Icons.spinner className="size-3.5 animate-spin" />
                  Loading your accounts…
                </div>
              ) : (
                <Select
                  value={accountId}
                  onValueChange={(v) => {
                    setAccountId(v);
                    setErrors((e) => ({ ...e, account: undefined }));
                  }}
                >
                  <SelectTrigger
                    aria-invalid={!!errors.account}
                    className="h-9 border-line2 bg-surface-1 text-[13px] text-ink data-placeholder:text-ink3"
                  >
                    <SelectValue placeholder="Choose an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {statedAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="text-[13px]">
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {isEdit ? (
                <p className="mt-1 text-[10.5px] text-ink3">
                  The account is fixed — delete &amp; re-add to move a trade to another book.
                </p>
              ) : statedAccounts.length > 1 ? (
                <p className="mt-1 text-[10px] leading-relaxed text-ink3">
                  Only your own (Stated) accounts take hand-entered transactions — broker-managed books are filled by their feed.
                </p>
              ) : null}
            </Field>

            {/* instrument — the WHOLE universe, not just the 504 equities. Class shown per result. */}
            <Field label="Instrument" error={errors.symbol}>
              <InstrumentPicker
                value={instrument}
                onSelect={(p) => {
                  setInstrument(p);
                  setErrors((e) => ({ ...e, symbol: undefined }));
                  setDisambig(null);
                }}
                onClear={() => {
                  setInstrument(null);
                  setDisambig(null);
                }}
                error={errors.symbol}
                disabled={isEdit}
              />
            </Field>

            {/* 409 disambiguation — the backend refused to guess between same-symbol instruments; the
                user picks the exact one (never auto-resolved). A backstop: the picker submits an ISIN. */}
            {disambig && disambig.length > 0 && (
              <div className="rounded-lg border border-line2 bg-surface-1 p-2">
                <p className="mb-1 px-1 text-[11px] text-ink2">
                  That identifier names {disambig.length} instruments — choose the one you hold:
                </p>
                <ul className="flex flex-col">
                  {disambig.map((c) => (
                    <li key={c.isin}>
                      <button
                        type="button"
                        onClick={() => {
                          setInstrument({ submitId: c.isin, symbol: null, name: c.name, assetClass: c.assetClass || null, isActive: true });
                          setDisambig(null);
                          setErrors((e) => ({ ...e, symbol: undefined }));
                        }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-surface-2"
                      >
                        {c.assetClass && <AssetClassChip assetClass={c.assetClass} />}
                        <span className="min-w-0 flex-1 truncate text-[12px] text-ink">{c.name}</span>
                        <span className="num shrink-0 text-[10.5px] text-ink3">{c.isin}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* coupon-bearing (bond / G-sec / SGB) disclosure — rendered AT ENTRY, where the user forms
                the expectation, not later in a footnote. The gap is made legible, never papered over. */}
            {couponBearing && (
              <div
                className="rounded-lg border px-3 py-2 text-[11px] leading-relaxed"
                style={{ color: "var(--high)", borderColor: "var(--high-bd)", background: "var(--high-bg)" }}
              >
                <span className="font-semibold">Coupon income isn’t tracked.</span> The return shown will be
                price-only — the interest this pays out isn’t counted.
                {isTrade && " Enter the total you paid, accrued interest included, so your cost basis stays exact."}
              </div>
            )}

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
                  <Field label="Price" hint={priceHint} error={errors.price}>
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
          </>
          )}

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

        {/* footer actions — suppressed entirely when there's no writable account (the body carries
            the create-an-account CTA instead of a form that would 400). */}
        {!noWritableAccount && (
        <div className="flex flex-col gap-2 border-t border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={requestSave}
              disabled={saving || blockSave}
              className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-[13px] font-medium text-primary-foreground transition-[filter] hover:brightness-110 disabled:opacity-60"
            >
              {saving && <Icons.spinner className="size-3.5 animate-spin" />}
              {isEdit ? "Save changes" : "Save"}
            </button>
            {!isEdit && (
              <button
                type="button"
                onClick={() => save(true)}
                disabled={saving || blockSave}
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
        )}
      </SheetContent>
    </Sheet>

    {/* edit confirmation — an edit replays the whole ledger, so confirm before it runs
        (mirrors the delete confirm in the ledger table) */}
    <Dialog open={confirmEdit} onOpenChange={(o) => { if (!o) setConfirmEdit(false); }}>
      <DialogContent className="border-line rounded-lg bg-surface-1 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-ink">Save these changes?</DialogTitle>
          <DialogDescription className="text-ink3">
            Editing this transaction replays your whole ledger — holdings, health and value recompute from scratch. This
            can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-[12px]">
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 font-medium"
            style={{
              color: TXN_TYPE_META[type].color,
              borderColor: `color-mix(in oklch, ${TXN_TYPE_META[type].color} 34%, transparent)`,
              background: `color-mix(in oklch, ${TXN_TYPE_META[type].color} 12%, transparent)`,
            }}
          >
            <span className="size-1.5 rounded-full" style={{ background: TXN_TYPE_META[type].color }} />
            {TXN_TYPE_META[type].label}
          </span>
          <span className="truncate font-semibold text-ink">{confirmLabel}</span>
          <span className="num ml-auto shrink-0 text-ink2">{editSummary}</span>
          <span className="num shrink-0 text-ink3">{tradeDate}</span>
        </div>
        <DialogFooter className="mt-6 flex items-center justify-end gap-2 w-full">
          <Button variant="outline" className="flex-1 w-full" onClick={() => setConfirmEdit(false)} disabled={saving}>
            Keep editing
          </Button>
          <Button className="flex-1 w-full" onClick={confirmSave} disabled={saving}>
            {saving && <Icons.spinner className="size-3.5 animate-spin" />}
            Save &amp; replay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
