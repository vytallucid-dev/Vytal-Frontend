"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icons, type Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useUniverseStocks } from "@/lib/api/hooks/use-stocks";
import { useStockPrice } from "@/lib/api/hooks/use-stock-price";
import { useAlertMutations } from "@/lib/api/hooks/use-alerts";
import type { Alert, AlertOperator, AlertRepeatMode, AlertType, CreateAlertInput, UpdateAlertInput } from "@/types/alerts";
import type { LabelBand } from "@/types/health";
import {
  BAND_ORDER,
  BAND_LABEL,
  BAND_CVAR,
  ALERT_TYPE_TINT,
  DEFAULT_REPEAT,
  REPEAT_COPY,
  draftPreview,
  fmtInr,
} from "@/lib/alerts";
import { useFindingOptions } from "@/lib/api/hooks/use-finding-options";

// ─────────────────────────────────────────────────────────────────────────────
// ALERT MODAL — create OR edit (type → condition → repeat). Symbol-driven: it resolves
// stockId / scored / band from the universe list and the live EOD price from the price
// view (one source each), so callers pass only a symbol (+ the alert when editing).
// READ-ONLY over the contract — POST/PATCH a rule; the backend evaluates + records.
//
// EOD honesty lives AT the price input (bordered line, not fine print) and the current
// price is shown right there. The target can be an absolute ₹ OR a % from current (the %
// is a client convenience — the backend always stores the resolved absolute price).
// Health & finding alerts are DISABLED on an unscored stock; price still works. Editing
// locks the type (a type change = a new alert, per the backend).
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_META: Record<AlertType, { label: string; icon: Icon }> = {
  price: { label: "Price", icon: Icons.coins },
  health_band: { label: "Health band", icon: Icons.health },
  finding: { label: "Finding", icon: Icons.bolt },
};
// Each alert type carries its own subtle accent (shared ALERT_TYPE_TINT — three distinct
// hues) — the modal tints its header chip, the active type button, and the preview by the
// SELECTED type, so the surface has colour without shouting (low-opacity color-mix fills;
// text stays neutral for legibility).
const TYPE_TINT = ALERT_TYPE_TINT;
const mix = (c: string, pct: number) => `color-mix(in oklch, ${c} ${pct}%, transparent)`;

function parseErr(e: unknown): string {
  const ae = (e as { apiError?: { message?: string; status?: number } })?.apiError;
  if (ae?.message) return ae.message;
  return "Couldn’t save the alert. Please try again.";
}

// ── a 2-way segmented control ────────────────────────────────────────────────────────
function Toggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg border border-line2 bg-surface-2 p-1">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-md py-1.5 text-[12.5px] font-medium transition-colors",
              active ? "bg-surface-3 text-ink shadow-[inset_0_0_0_1px_var(--line3)]" : "text-ink3 hover:text-ink2",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[11px] font-medium text-ink2">{children}</label>;
}

export function CreateAlertModal({
  open,
  onOpenChange,
  symbol,
  name,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  name?: string | null;
  /** edit an existing rule (PATCH). Omit/null to create (POST). */
  editing?: Alert | null;
}) {
  const isEdit = !!editing;
  // ⚠ GATED ON `open`. This modal is MOUNTED, not conditionally rendered — the stock page keeps
  // `<CreateAlertModal open={alertOpen} …/>` in the tree at all times and Radix renders nothing until
  // `open`. So an ungated fetch here meant every stock-detail load downloaded the 504-row universe
  // (104 KB raw / 22.1 KB gzip) for a dialog that had not been opened. Everything read from it —
  // stockId, `scored`, the display name — is only rendered inside the dialog, and line 307 already
  // shows `uniLoading` while it arrives.
  const { data: universe, isLoading: uniLoading } = useUniverseStocks(open);
  const stock = useMemo(() => universe?.find((s) => s.symbol === symbol) ?? null, [universe, symbol]);
  const scored = stock?.scored ?? false;
  const stockId = stock?.id ?? null;
  const displayName = name ?? stock?.name ?? "";

  const priceQ = useStockPrice(symbol);
  const currentPrice = priceQ.data?.current.price ?? null;

  const { create, update } = useAlertMutations();

  const [type, setType] = useState<AlertType>("price");
  const [priceOp, setPriceOp] = useState<AlertOperator>("above");
  const [priceMode, setPriceMode] = useState<"value" | "percent">("value");
  const [priceVal, setPriceVal] = useState("");
  const [pctVal, setPctVal] = useState("");
  const [bandOp, setBandOp] = useState<AlertOperator>("below");
  const [band, setBand] = useState<LabelBand>("steady");
  const [findingMode, setFindingMode] = useState<"any" | "specific">("any");
  const [findingKey, setFindingKey] = useState("");
  // 1d — the picker's own 1.9 KB name projection, not the 54 KB catalogue. Never empty: it falls back
  // to the bundled list while loading and on failure, so an alert can always be set.
  const { options: findingOptions, isLoading: findingsLoading } = useFindingOptions();
  const [repeat, setRepeat] = useState<AlertRepeatMode>(DEFAULT_REPEAT.price);
  const [active, setActive] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // (re)initialise whenever the modal opens (or the edit target changes)
  useEffect(() => {
    if (!open) return;
    setErr(null);
    setDone(false);
    setPriceMode("value");
    setPctVal("");
    if (editing) {
      setType(editing.type);
      setPriceOp(editing.type === "price" ? editing.operator : "above");
      setPriceVal(editing.thresholdPrice != null ? String(editing.thresholdPrice) : "");
      setBandOp(editing.type === "health_band" ? editing.operator : "below");
      setBand(editing.thresholdBand ?? "steady");
      setFindingMode(editing.findingKey ? "specific" : "any");
      setFindingKey(editing.findingKey ?? "");
      setRepeat(editing.repeatMode);
      setActive(editing.active);
    } else {
      setType("price");
      setPriceOp("above");
      setPriceVal("");
      setBandOp("below");
      setBand("steady");
      setFindingMode("any");
      setFindingKey("");
      setRepeat(DEFAULT_REPEAT.price);
      setActive(true);
    }
  }, [open, editing]);

  // unscored guard (create only — an existing band/finding alert lives on a scored stock)
  useEffect(() => {
    if (open && !isEdit && !scored && type !== "price") setType("price");
  }, [open, isEdit, scored, type]);

  const chooseType = (t: AlertType) => {
    if (isEdit || (!scored && t !== "price")) return;
    setType(t);
    setRepeat(DEFAULT_REPEAT[t]);
    setErr(null);
  };

  // resolve the price target (absolute ₹) from whichever input mode is active
  const effPrice = useMemo<number | null>(() => {
    if (priceMode === "value") {
      const n = Number(priceVal);
      return n > 0 ? n : null;
    }
    const p = Number(pctVal);
    if (!(p > 0) || currentPrice == null) return null;
    const t = priceOp === "above" ? currentPrice * (1 + p / 100) : currentPrice * (1 - p / 100);
    return t > 0 ? t : null; // a ≥100% "below" would go non-positive — reject
  }, [priceMode, priceVal, pctVal, priceOp, currentPrice]);

  const valueDeltaPct =
    currentPrice != null && currentPrice > 0 && Number(priceVal) > 0
      ? ((Number(priceVal) - currentPrice) / currentPrice) * 100
      : null;

  const draft = useMemo(() => {
    if (type === "price")
      return { type, operator: priceOp, thresholdPrice: effPrice, thresholdBand: null, findingKey: null };
    if (type === "health_band")
      return { type, operator: bandOp, thresholdPrice: null, thresholdBand: band, findingKey: null };
    return {
      type,
      operator: "fires" as AlertOperator,
      thresholdPrice: null,
      thresholdBand: null,
      findingKey: findingMode === "specific" ? findingKey || null : null,
    };
  }, [type, priceOp, effPrice, bandOp, band, findingMode, findingKey]);

  const saving = create.isPending || update.isPending;

  function submit() {
    if (!stockId) {
      setErr("This stock isn’t in the tracked universe.");
      return;
    }
    if (type === "price" && effPrice == null) {
      setErr(priceMode === "value" ? "Enter a target price greater than 0." : "Enter a percent greater than 0.");
      return;
    }
    if (type === "finding" && findingMode === "specific" && !findingKey) {
      setErr("Pick a finding, or choose “Any new finding”.");
      return;
    }
    setErr(null);

    // resolve the target the backend stores (always an absolute ₹ / band / key)
    const target =
      type === "price"
        ? { threshold: Number(effPrice!.toFixed(2)) }
        : type === "health_band"
          ? { threshold: band }
          : { findingKey: findingMode === "specific" ? findingKey : null };

    if (isEdit && editing) {
      const body: UpdateAlertInput = { ...target, repeatMode: repeat, active };
      update.mutate(
        { id: editing.id, body },
        {
          onSuccess: () => {
            setDone(true);
            setTimeout(() => onOpenChange(false), 900);
          },
          onError: (e) => setErr(parseErr(e)),
        },
      );
      return;
    }

    const body: CreateAlertInput = {
      stockId,
      type,
      operator: type === "finding" ? "fires" : type === "price" ? priceOp : bandOp,
      repeatMode: repeat,
      ...target,
    };
    create.mutate(body, {
      onSuccess: () => {
        setDone(true);
        setTimeout(() => onOpenChange(false), 1000);
      },
      onError: (e) => setErr(parseErr(e)),
    });
  }

  const TypeIcon = TYPE_META[type].icon;
  const accent = TYPE_TINT[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 border-line bg-surface-1 p-0">
        {/* header — a type-tinted icon chip anchors the modal in the selected type's colour */}
        <div
          className="flex items-start gap-3 border-b border-line px-5 pb-4 pt-5"
          style={{ background: `linear-gradient(to bottom, ${mix(accent, 6)}, transparent)` }}
        >
          <span
            className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl transition-colors"
            style={{ color: accent, background: mix(accent, 13), boxShadow: `inset 0 0 0 1px ${mix(accent, 28)}` }}
          >
            <TypeIcon weight="duotone" className="size-[1.15rem]" />
          </span>
          <div className="min-w-0">
            <DialogTitle className="font-display text-[18px] font-semibold text-ink">
              {isEdit ? "Edit alert" : "Set an alert"}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-[12.5px] text-ink3">
              <span className="num font-medium text-ink2">{symbol}</span>
              {displayName ? ` · ${displayName}` : ""} — we watch, and record when it crosses.
            </DialogDescription>
          </div>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <span className="grid size-11 place-items-center rounded-full bg-rec/12" style={{ color: "var(--rec)" }}>
              <Icons.check weight="bold" className="size-5" />
            </span>
            <p className="text-[14px] font-medium text-ink">{isEdit ? "Alert updated" : `Alert set for ${symbol}`}</p>
            <p className="max-w-[15rem] text-[12px] leading-relaxed text-ink3">{draftPreview(draft, symbol)}</p>
          </div>
        ) : uniLoading && !stock ? (
          <div className="px-5 py-12 text-center text-[13px] text-ink3">Loading…</div>
        ) : !stock ? (
          <div className="px-5 py-12 text-center text-[13px] text-ink3">
            “{symbol}” isn’t part of the tracked universe.
          </div>
        ) : (
          <>
            <div className="custom-scrollbar max-h-[62vh] overflow-y-auto px-5 py-4">
              {/* 1 · type — a 3-way picker on create; locked on edit */}
              {isEdit ? (
                <div className="mb-4">
                  <FieldLabel>Alert type</FieldLabel>
                  <div
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2"
                    style={{ borderColor: mix(accent, 32), background: mix(accent, 8) }}
                  >
                    <TypeIcon weight="duotone" className="size-4" style={{ color: accent }} />
                    <span className="text-[12.5px] font-medium text-ink">{TYPE_META[type].label}</span>
                    <span className="text-[10.5px] text-ink3">· type can’t change</span>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <FieldLabel>Alert me on</FieldLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(TYPE_META) as AlertType[]).map((t) => {
                      const meta = TYPE_META[t];
                      const TIcon = meta.icon;
                      const tint = TYPE_TINT[t];
                      const disabled = !scored && t !== "price";
                      const activeT = type === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={disabled}
                          onClick={() => chooseType(t)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-colors",
                            activeT ? "text-ink" : "border-line2 text-ink3 hover:border-line3 hover:text-ink2",
                            disabled && "cursor-not-allowed opacity-40 hover:border-line2 hover:text-ink3",
                          )}
                          style={
                            activeT
                              ? { borderColor: mix(tint, 50), background: mix(tint, 10) }
                              : undefined
                          }
                        >
                          {/* icon stays in its type colour even when idle → the picker reads as colourful */}
                          <TIcon
                            weight={activeT ? "fill" : "duotone"}
                            className="size-5"
                            style={{ color: tint, opacity: disabled ? 0.7 : activeT ? 1 : 0.85 }}
                          />
                          <span className="text-[12px] font-medium">{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {!scored && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-md border border-line2 bg-surface-2/60 px-2.5 py-1.5">
                      <Icons.info className="mt-0.5 size-3.5 shrink-0 text-ink3" />
                      <p className="text-[11px] leading-snug text-ink2">
                        {symbol} isn’t scored yet — health &amp; finding alerts need a Vytal score. Price alerts work.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 2 · condition (type-aware) */}
              {type === "price" && (
                <div className="mb-4 flex flex-col gap-2.5">
                  <div>
                    <FieldLabel>Condition</FieldLabel>
                    <Toggle
                      value={priceOp}
                      onChange={(v) => setPriceOp(v)}
                      options={[
                        { value: "above", label: "Rises above" },
                        { value: "below", label: "Drops below" },
                      ]}
                    />
                  </div>

                  {/* current price — shown right where the target is entered */}
                  <div className="flex items-center justify-between rounded-md border border-line2 bg-surface-2/50 px-2.5 py-1.5">
                    <span className="text-[11px] text-ink3">Current price {priceQ.isLoading ? "" : "(EOD)"}</span>
                    <span className="num text-[12.5px] font-medium text-ink">
                      {priceQ.isLoading ? "…" : currentPrice != null ? fmtInr(currentPrice) : "—"}
                    </span>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-ink2">
                        {priceMode === "value" ? "Target price" : "Target — % from current"}
                      </span>
                      {/* ₹ / % mode toggle */}
                      <div className="inline-flex rounded-md border border-line2 bg-surface-2 p-0.5">
                        {(["value", "percent"] as const).map((m) => {
                          const on = priceMode === m;
                          const dis = m === "percent" && currentPrice == null;
                          return (
                            <button
                              key={m}
                              type="button"
                              disabled={dis}
                              onClick={() => setPriceMode(m)}
                              className={cn(
                                "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                                on ? "bg-surface-3 text-ink" : "text-ink3 hover:text-ink2",
                                dis && "cursor-not-allowed opacity-40",
                              )}
                            >
                              {m === "value" ? "₹" : "%"}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {priceMode === "value" ? (
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-ink3">₹</span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="any"
                          value={priceVal}
                          onChange={(e) => setPriceVal(e.target.value)}
                          placeholder="0.00"
                          className="num h-9 pl-7 text-[13px]"
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="any"
                          value={pctVal}
                          onChange={(e) => setPctVal(e.target.value)}
                          placeholder="0"
                          className="num h-9 pr-7 text-[13px]"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-ink3">%</span>
                      </div>
                    )}

                    {/* the resolved absolute / delta hint */}
                    {priceMode === "percent" && effPrice != null && (
                      <p className="mt-1 text-[11px] text-ink3">
                        Target ≈ <span className="num font-medium text-ink2">{fmtInr(Number(effPrice.toFixed(2)))}</span>{" "}
                        ({priceOp === "above" ? "+" : "−"}
                        {pctVal}% from current)
                      </p>
                    )}
                    {priceMode === "value" && valueDeltaPct != null && (
                      <p className="mt-1 text-[11px] text-ink3">
                        <span className="num">{valueDeltaPct > 0 ? "+" : ""}{valueDeltaPct.toFixed(1)}%</span> from current
                      </p>
                    )}

                    {/* EOD honesty — AT the input, not fine print */}
                    <div className="mt-1.5 flex items-start gap-1.5 rounded-md border border-line2 bg-surface-2/60 px-2.5 py-1.5">
                      <Icons.clock className="mt-0.5 size-3.5 shrink-0 text-ink3" />
                      <p className="text-[11px] leading-snug text-ink2">
                        Checked once daily at <span className="font-medium text-ink">market close</span> — not a live intraday ping.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {type === "health_band" && (
                <div className="mb-4 flex flex-col gap-2.5">
                  <div>
                    <FieldLabel>Condition</FieldLabel>
                    <Toggle
                      value={bandOp}
                      onChange={(v) => setBandOp(v)}
                      options={[
                        { value: "below", label: "Drops below" },
                        { value: "above", label: "Rises above" },
                      ]}
                    />
                  </div>
                  <div>
                    <FieldLabel>Health band</FieldLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {BAND_ORDER.map((b) => {
                        const on = band === b;
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setBand(b)}
                            className={cn(
                              "rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                              !on && "border-line2 text-ink3 hover:text-ink2",
                            )}
                            style={
                              on
                                ? {
                                    color: BAND_CVAR[b],
                                    borderColor: `color-mix(in oklch, ${BAND_CVAR[b]} 45%, transparent)`,
                                    background: `color-mix(in oklch, ${BAND_CVAR[b]} 12%, transparent)`,
                                  }
                                : undefined
                            }
                          >
                            {BAND_LABEL[b]}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1.5 text-[11px] leading-snug text-ink3">
                      e.g. alert when health drops below <span className="font-medium text-ink2">Steady</span>.
                    </p>
                  </div>
                </div>
              )}

              {type === "finding" && (
                <div className="mb-4 flex flex-col gap-2.5">
                  <div>
                    <FieldLabel>Which finding</FieldLabel>
                    <Toggle
                      value={findingMode}
                      onChange={(v) => setFindingMode(v)}
                      options={[
                        { value: "any", label: "Any new finding" },
                        { value: "specific", label: "A specific one" },
                      ]}
                    />
                  </div>
                  {findingMode === "specific" && (
                    <div>
                      <FieldLabel>Finding</FieldLabel>
                      <Select value={findingKey} onValueChange={setFindingKey}>
                        <SelectTrigger className="h-9 text-[13px]">
                          <SelectValue placeholder={findingsLoading ? "Loading findings…" : "Choose a finding…"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {findingOptions.map((o) => (
                            <SelectItem key={o.key} value={o.key} className="text-[12.5px]">
                              {o.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <p className="text-[11px] leading-snug text-ink3">
                    Fires once when the finding newly appears — not every day it stays present.
                  </p>
                </div>
              )}

              {/* 3 · repeat mode */}
              <div>
                <FieldLabel>Repeat</FieldLabel>
                <Toggle
                  value={repeat}
                  onChange={(v) => setRepeat(v)}
                  options={[
                    { value: "one_shot", label: REPEAT_COPY.one_shot.label },
                    { value: "repeating", label: REPEAT_COPY.repeating.label },
                  ]}
                />
                <p className="mt-1.5 text-[11px] leading-snug text-ink3">{REPEAT_COPY[repeat].blurb}</p>
              </div>

              {/* 4 · status (edit only) */}
              {isEdit && (
                <div className="mt-4">
                  <FieldLabel>Status</FieldLabel>
                  <Toggle
                    value={active ? "active" : "paused"}
                    onChange={(v) => setActive(v === "active")}
                    options={[
                      { value: "active", label: "Active" },
                      { value: "paused", label: "Paused" },
                    ]}
                  />
                </div>
              )}

              {/* live preview — subtly tinted by the selected type's accent */}
              <div
                className="mt-4 flex items-start gap-2 rounded-lg border px-3 py-2.5"
                style={{ borderColor: mix(accent, 28), background: mix(accent, 7) }}
              >
                <TypeIcon weight="fill" className="mt-0.5 size-3.5 shrink-0" style={{ color: accent }} />
                <p className="text-[12px] leading-relaxed text-ink2">{draftPreview(draft, symbol)}</p>
              </div>

              {err && (
                <div
                  className="mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[12px]"
                  style={{ color: "var(--crit)", borderColor: "var(--crit-bd)", background: "var(--crit-bg)" }}
                >
                  <Icons.warning weight="fill" className="mt-0.5 size-4 shrink-0" />
                  <span>{err}</span>
                </div>
              )}
            </div>

            {/* footer */}
            <div className="flex items-center gap-2 border-t border-line px-5 py-4">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-line2 bg-surface-1 px-3.5 text-[12.5px] font-medium text-ink2 transition-colors hover:border-line3 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-[13px] font-medium text-primary-foreground transition-[filter] hover:brightness-110 disabled:opacity-60"
              >
                {saving && <Icons.spinner className="size-3.5 animate-spin" />}
                {isEdit ? "Save changes" : "Set alert"}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
