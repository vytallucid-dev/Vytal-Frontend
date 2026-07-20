"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/lib/icons";
import { toast } from "@/components/ui/toast";
import type { Account, BrokerCatalogEntry, BrokerMeta, Transaction } from "@/types/portfolio";
import { parseApiError, transferAllToAccount } from "@/lib/api/hooks/use-brokers";
import { brokerLabel, countLabel, earliestTradeMonth, hasHistoryToLose, isEmptyStated } from "./lib";
import { CreateAccountForm } from "./create-account-form";
import { useLinkFlow } from "./use-link-flow";

// ─────────────────────────────────────────────────────────────────────────────
// LINK ACCOUNT — the one surface for connecting a Stated book to its broker feed.
//
// TWO ENTRIES, ONE COMPONENT:
//   • EMPTY account  → no ceremony: it starts connecting the moment it opens. Nothing to lose,
//     nothing to warn about (Stage 1).
//   • NON-EMPTY account → the WARNING first (Stage 2): the real cost, in the account's own numbers,
//     and three equally-reachable ways forward — move the history to safety, link a different empty
//     book, or link anyway (and lose it). Every path funnels into the SAME connect→link→sync flow.
//
// Linking permanently deletes a Stated book's transactions — a broker feed is a snapshot of now,
// with no past. That is honest and sometimes wanted; the numbers do the persuading, not red paint.
// ─────────────────────────────────────────────────────────────────────────────

type Stage = "warn" | "transfer";

export function LinkAccountDialog({
  account,
  open,
  onOpenChange,
  accounts,
  transactions,
  catalogue,
  adapted,
}: {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  transactions: Transaction[] | undefined;
  catalogue: BrokerCatalogEntry[] | undefined;
  adapted: BrokerMeta[] | undefined;
}) {
  const qc = useQueryClient();
  const flow = useLinkFlow();
  const phase = flow.state.phase;

  const [stage, setStage] = useState<Stage>("warn");
  const [destMode, setDestMode] = useState<"pick" | "create">("pick");
  const [destId, setDestId] = useState<string>("");
  const [transferPending, setTransferPending] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [moved, setMoved] = useState<{ count: number; destName: string } | null>(null);

  // The account actually being bound (the source, or a different empty book via route 2) + its label.
  const targetRef = useRef<Account | null>(null);
  const brokerNameRef = useRef<string>("");
  // Guard the empty-account auto-start against StrictMode's double effect (a double run = two connections).
  const autoStartedRef = useRef<string | null>(null);

  const brokerName = account ? brokerLabel(account.broker, catalogue, adapted) : "";

  function startConnect(target: Account, confirm: boolean) {
    targetRef.current = target;
    brokerNameRef.current = brokerLabel(target.broker, catalogue, adapted);
    void flow.run({ broker: target.broker, accountId: target.id, confirm });
  }

  // ── (re)initialise whenever the dialog opens on an account ──
  useEffect(() => {
    if (!open || !account) {
      autoStartedRef.current = null;
      return;
    }
    setStage("warn");
    setDestMode("pick");
    setDestId("");
    setTransferPending(false);
    setTransferError(null);
    setMoved(null);
    flow.reset();
    // Empty book → connect immediately (no warning, no confirm). Guarded so it fires once.
    if (isEmptyStated(account) && autoStartedRef.current !== account.id) {
      autoStartedRef.current = account.id;
      startConnect(account, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, account?.id]);

  // ── close on success (name the account that was actually linked) ──
  useEffect(() => {
    if (phase !== "done" && phase !== "linked_unsynced") return;
    const name = targetRef.current?.name ?? account?.name ?? "your account";
    const bn = brokerNameRef.current || brokerName;
    toast.success(`Connected ${name} to ${bn}`, {
      description:
        phase === "done"
          ? "Its holdings now come straight from the broker’s feed."
          : "Linked — the first sync didn’t land yet; it’ll refresh on the next sync.",
    });
    onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!account) return null;

  const txnCount = account.transactionCount;
  const earliest = earliestTradeMonth(account, transactions);
  // Route 1 destinations: ANY other Stated (manual) account, any broker (transfer-all has no gate).
  const transferTargets = accounts.filter((a) => a.state === "manual" && a.id !== account.id);
  // Route 2 candidates: other EMPTY Stated accounts on the SAME broker — retarget the link to one.
  const sameBrokerEmpty = accounts.filter(
    (a) => a.state === "manual" && a.broker === account.broker && a.id !== account.id && isEmptyStated(a),
  );

  async function doTransfer(dest: { id: string; name: string }) {
    if (!account) return;
    setTransferError(null);
    setTransferPending(true);
    try {
      const result = await transferAllToAccount(account.id, dest.id);
      // the source survives (deleteSource:false) and is now empty; reflect the move immediately
      qc.invalidateQueries({ queryKey: ["me", "accounts"] });
      qc.invalidateQueries({ queryKey: ["me", "portfolio"] });
      setMoved({ count: result.destination.length, destName: dest.name });
      setTransferPending(false);
      // continue into the link flow in the same motion — the source is empty now, no confirm needed
      startConnect(account, false);
    } catch (e) {
      setTransferPending(false);
      setTransferError(parseApiError(e).message); // nothing linked, nothing lost — stay put and say so
    }
  }

  // What to render: pre-flow stages only while idle; once the flow runs, it owns the surface.
  const render: "warn" | "transfer" | "progress" | "error" =
    phase === "error"
      ? "error"
      : phase !== "idle"
        ? "progress"
        : hasHistoryToLose(account)
          ? stage
          : "progress"; // empty account: about to auto-start

  const title =
    render === "error" || render === "progress"
      ? `Connect ${brokerName}`
      : render === "transfer"
        ? "Move this history somewhere safe"
        : `Connect ${account.name} to ${brokerName}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-line rounded-lg bg-surface-1 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-ink">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {render === "warn"
              ? "Connecting this account to its broker permanently deletes its transaction history."
              : "Connect this account to its broker feed."}
          </DialogDescription>
        </DialogHeader>

        {render === "warn" && (
          <WarnBody
            account={account}
            brokerName={brokerName}
            txnCount={txnCount}
            earliest={earliest}
            sameBrokerEmpty={sameBrokerEmpty}
            onMoveFirst={() => setStage("transfer")}
            onSwitch={(a) => startConnect(a, false)}
            onLinkAnyway={() => startConnect(account, true)}
            brokerLabelOf={(id) => brokerLabel(id, catalogue, adapted)}
          />
        )}

        {render === "transfer" && (
          <TransferBody
            account={account}
            destMode={destMode}
            setDestMode={setDestMode}
            destId={destId}
            setDestId={setDestId}
            targets={transferTargets}
            pending={transferPending}
            error={transferError}
            onBack={() => setStage("warn")}
            onMove={doTransfer}
          />
        )}

        {render === "progress" && (
          <ProgressBody phase={phase} brokerName={brokerNameRef.current || brokerName} moved={moved} />
        )}

        {render === "error" && (
          <ErrorBody
            message={flow.state.error?.message ?? "Something went wrong."}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── the warning + the three ways out ──────────────────────────────────────────
function WarnBody({
  account,
  brokerName,
  txnCount,
  earliest,
  sameBrokerEmpty,
  onMoveFirst,
  onSwitch,
  onLinkAnyway,
  brokerLabelOf,
}: {
  account: Account;
  brokerName: string;
  txnCount: number;
  earliest: string | null;
  sameBrokerEmpty: Account[];
  onMoveFirst: () => void;
  onSwitch: (a: Account) => void;
  onLinkAnyway: () => void;
  brokerLabelOf: (id: string) => string;
}) {
  const [switchId, setSwitchId] = useState<string>("");
  const chosen = sameBrokerEmpty.find((a) => a.id === switchId);

  return (
    <div className="flex flex-col gap-4">
      {/* the cost, in this account's own numbers — factual, not alarmist */}
      <p className="text-[13px] leading-relaxed text-ink2">
        <span className="font-semibold text-ink">{account.name}</span> has{" "}
        <span className="font-semibold text-ink">{countLabel(txnCount, "transaction")}</span>
        {earliest ? (
          <>
            , going back to <span className="font-semibold text-ink">{earliest}</span>
          </>
        ) : null}
        . A broker feed is a snapshot of what you hold now — it carries no transaction history. Connecting{" "}
        <span className="font-semibold text-ink">permanently deletes those {countLabel(txnCount, "transaction")}</span>{" "}
        and hands the book to {brokerName}: it keeps your current positions, but loses the past behind them — no cost
        basis from your own entries, no realised P&amp;L, no return history.
      </p>

      <div className="flex flex-col gap-2.5">
        {/* 1 — move the history to safety (the default; most prominent). Always reachable: even with
              no other account, you can create the destination inside the next step. */}
        <RouteCard
          icon={Icons.arrowsOutSimple}
          accent="var(--p-found)"
          title="Move this history somewhere safe first"
          body="Transfer everything to another Stated account — keeping every transaction, cost basis and realised P&L — then connect this one."
          action={
            <Button className="w-full" onClick={onMoveFirst}>
              Move history, then connect
            </Button>
          }
          primary
        />

        {/* 2 — link a DIFFERENT empty account instead (only when one exists) */}
        {sameBrokerEmpty.length > 0 && (
          <RouteCard
            icon={Icons.stack}
            accent="var(--ctx)"
            title={`Connect a different ${brokerName} account instead`}
            body="Leave this book untouched and connect one of your empty accounts on the same broker."
            action={
              <div className="flex items-center gap-2">
                <Select value={switchId} onValueChange={setSwitchId}>
                  <SelectTrigger className="h-9 flex-1 text-[13px]">
                    <SelectValue placeholder="Choose an empty account…" />
                  </SelectTrigger>
                  <SelectContent>
                    {sameBrokerEmpty.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="text-[13px]">
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => chosen && onSwitch(chosen)} disabled={!chosen}>
                  Use it
                </Button>
              </div>
            }
          />
        )}

        {/* 3 — link anyway, and lose the history. Plain, available, NOT dressed as danger; the button
              restates the cost so the last thing tapped names what it does. */}
        <RouteCard
          icon={Icons.shield}
          accent="var(--ctx)"
          title={`Connect ${brokerName} anyway`}
          body={`${brokerLabelOf(account.broker)} takes over the book. Your ${countLabel(txnCount, "transaction")} won’t be recoverable.`}
          action={
            <Button variant="outline" className="w-full" onClick={onLinkAnyway}>
              Delete {countLabel(txnCount, "transaction")} &amp; connect {brokerName}
            </Button>
          }
        />
      </div>
    </div>
  );
}

function RouteCard({
  icon: Glyph,
  accent,
  title,
  body,
  action,
  disabled,
  disabledNote,
  primary,
}: {
  icon: typeof Icons.shield;
  accent: string;
  title: string;
  body: string;
  action: React.ReactNode;
  disabled?: boolean;
  disabledNote?: string;
  primary?: boolean;
}) {
  return (
    <div
      className="rounded-xl border p-3.5"
      style={{
        borderColor: primary ? `color-mix(in oklch, ${accent} 34%, transparent)` : "var(--line)",
        background: primary ? `color-mix(in oklch, ${accent} 6%, transparent)` : "transparent",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div className="mb-1 flex items-center gap-2">
        <Glyph weight="duotone" className="size-4 shrink-0" style={{ color: accent }} />
        <p className="text-[13px] font-semibold text-ink">{title}</p>
      </div>
      <p className="mb-3 text-[12px] leading-relaxed text-ink3">{body}</p>
      {disabledNote ? <p className="mb-3 text-[11.5px] text-ink3">{disabledNote}</p> : null}
      {action}
    </div>
  );
}

// ── route 1: pick or create a destination, then move + continue ────────────────
function TransferBody({
  account,
  destMode,
  setDestMode,
  destId,
  setDestId,
  targets,
  pending,
  error,
  onBack,
  onMove,
}: {
  account: Account;
  destMode: "pick" | "create";
  setDestMode: (m: "pick" | "create") => void;
  destId: string;
  setDestId: (id: string) => void;
  targets: Account[];
  pending: boolean;
  error: string | null;
  onBack: () => void;
  onMove: (dest: { id: string; name: string }) => void;
}) {
  const chosen = targets.find((a) => a.id === destId);
  const n = countLabel(account.transactionCount, "transaction");
  // With no other Stated account to pick, the only way to move is to CREATE the destination.
  const noTargets = targets.length === 0;
  const mode = noTargets ? "create" : destMode;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] leading-relaxed text-ink2">
        Move everything from <span className="font-semibold text-ink">{account.name}</span> — all {n} and its holdings —
        into another Stated account. Nothing is lost; then <span className="text-ink">{account.name}</span> connects to
        its broker.
      </p>

      {mode === "pick" ? (
        <>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-ink2">Move it into</label>
            <Select value={destId} onValueChange={setDestId} disabled={pending}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Choose a Stated account…" />
              </SelectTrigger>
              <SelectContent>
                {targets.map((a) => (
                  <SelectItem key={a.id} value={a.id} className="text-[13px]">
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={() => setDestMode("create")}
            className="self-start text-[12px] font-medium text-primary transition-[filter] hover:brightness-110"
            disabled={pending}
          >
            + Create a new account for it
          </button>

          {error && <ErrorNote message={error} />}

          <div className="mt-1 flex items-center justify-end gap-2">
            <Button variant="outline" className="flex-1" onClick={onBack} disabled={pending}>
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={() => chosen && onMove({ id: chosen.id, name: chosen.name })}
              disabled={!chosen || pending}
            >
              {pending && <Icons.spinner className="size-3.5 animate-spin" />}
              Move &amp; connect
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[12px] text-ink3">Create the account to move everything into:</p>
          {/* reuse the create form; on create, move into it and continue in the same motion */}
          <CreateAccountForm
            submitLabel="Create, move & connect"
            cancelLabel="Back"
            onCancel={() => (noTargets ? onBack() : setDestMode("pick"))}
            onCreated={(a) => onMove({ id: a.id, name: a.name })}
          />
          {error && <ErrorNote message={error} />}
        </div>
      )}
    </div>
  );
}

// ── progress: connecting / redirecting / linking / syncing ─────────────────────
function ProgressBody({
  phase,
  brokerName,
  moved,
}: {
  phase: string;
  brokerName: string;
  moved: { count: number; destName: string } | null;
}) {
  const label =
    phase === "redirecting"
      ? `Taking you to ${brokerName}…`
      : phase === "linking"
        ? "Linking your account…"
        : phase === "syncing"
          ? "Fetching your holdings…"
          : `Connecting to ${brokerName}…`;
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Icons.spinner className="size-7 animate-spin text-primary" />
      {moved && (
        <p className="text-[12px] text-ink3">
          Moved {countLabel(moved.count, "position")} to {moved.destName}.
        </p>
      )}
      <p className="text-[13px] text-ink2">{label}</p>
      <p className="max-w-xs text-[11.5px] leading-relaxed text-ink3">
        Vytal only ever reads your holdings — it can never place a trade.
      </p>
    </div>
  );
}

function ErrorBody({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <ErrorNote message={message} />
      <p className="text-[12px] text-ink3">Your account is unchanged.</p>
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-lg border px-3 py-2 text-[12px]"
      style={{ color: "var(--crit)", borderColor: "var(--crit-bd)", background: "var(--crit-bg)" }}
    >
      <Icons.warning weight="fill" className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
