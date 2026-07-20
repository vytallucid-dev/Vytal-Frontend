"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { formatINR } from "@/lib/format";
import type { Account, BrokerCatalogEntry, BrokerMeta, PositionDelta, Transaction } from "@/types/portfolio";
import { useDeleteAccount, useMoveAllHoldings, usePatchAccount } from "@/lib/api/hooks/use-accounts";
import { parseApiError } from "@/lib/api/hooks/use-brokers";
import { brokerLabel, countLabel, linkAffordanceFor } from "@/components/portfolio/accounts/lib";
import { CreateAccountForm } from "@/components/portfolio/accounts/create-account-form";
import { LinkAccountDialog } from "@/components/portfolio/accounts/link-account-dialog";

// ─────────────────────────────────────────────────────────────────────────────
// STATED ACCOUNT ACTIONS — the controls for a manual book, in the header's action bar.
//
//   • CONNECT   — reuses LinkAccountDialog VERBATIM (useLinkFlow + its warning/escape). Shown only
//                 when the broker is adapted; the other two link states stay as inert text, exactly
//                 as on the card — "not available yet" (temporal) and "not held at a broker"
//                 (permanent) are never collapsed into one.
//   • RETAG     — change which broker the book belongs to. Offered ONLY under the backend guard
//                 (manual + unbound); a bound account would 409, so the control isn't rendered.
//   • MOVE ALL  — transfer-all into another Stated account (any broker — the backend has no gate),
//                 or a new one created inline; deleteSource is the user's plain choice here.
//   • DELETE    — removes the account AND its ledger. The confirm names the transaction count.
//
// No score, band, health or coverage. No fabricated dates/prices/values. No broker id hardcoded in
// any conditional — "adapted" and "not-at-a-broker" both derive from the catalogue/adapted set.
// ─────────────────────────────────────────────────────────────────────────────

export function StatedActions({
  account,
  accounts,
  transactions,
  catalogue,
  adapted,
}: {
  account: Account;
  /** All the user's accounts — transfer destinations + the last-account guard. */
  accounts: Account[];
  /** User-wide ledger (NOT the account-scoped read) — LinkAccountDialog's warning states the
   *  earliest trade month, which is only attributable when the whole user's ledger is this account's. */
  transactions: Transaction[] | undefined;
  catalogue: BrokerCatalogEntry[] | undefined;
  adapted: BrokerMeta[] | undefined;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [retagOpen, setRetagOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const affordance = linkAffordanceFor(account, catalogue, adapted);
  // The retag guard, mirrored EXACTLY from the backend: manual + no binding. All Stated accounts are
  // manual, so this reduces to "never bound to a connection" — a control that would 409 is not shown.
  const canRetag = account.state === "manual" && account.brokerConnectionId === null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* connect affordance — button when adapted, inert text otherwise (never a disabled button) */}
      {affordance.kind === "connect" ? (
        <Button
          onClick={() => setLinkOpen(true)}
          className="gap-1.5"
          style={{ background: "var(--p-found)", color: "white" }}
        >
          <Icons.shield weight="fill" className="size-4" />
          Connect {affordance.broker} to verify
        </Button>
      ) : affordance.kind === "not_yet" ? (
        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink3">
          <Icons.timer weight="duotone" className="size-4 shrink-0" />
          Connecting {affordance.broker} isn&apos;t available yet
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink3">
          <Icons.prohibit weight="duotone" className="size-4 shrink-0" />
          Not held at a broker
        </span>
      )}

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-1.5">
              Manage
              <Icons.caretDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-line bg-surface-1">
            <DropdownMenuItem onSelect={() => setMoveOpen(true)} className="gap-2 text-ink2">
              <Icons.arrowsOutSimple className="size-4" />
              Move everything to another account
            </DropdownMenuItem>
            {canRetag && (
              <DropdownMenuItem onSelect={() => setRetagOpen(true)} className="gap-2 text-ink2">
                <Icons.building className="size-4" />
                Retag broker
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-line" />
            <DropdownMenuItem
              onSelect={() => setDeleteOpen(true)}
              className="gap-2 text-danger focus:text-accent-foreground"
            >
              <Trash2 className="size-4" />
              Delete account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* connect — the SAME dialog the accounts card opens (warning + inline escape live inside it) */}
      <LinkAccountDialog
        account={linkOpen ? account : null}
        open={linkOpen}
        onOpenChange={setLinkOpen}
        accounts={accounts}
        transactions={transactions}
        catalogue={catalogue}
        adapted={adapted}
      />

      {retagOpen && (
        <RetagDialog account={account} catalogue={catalogue} adapted={adapted} open={retagOpen} onOpenChange={setRetagOpen} />
      )}
      {moveOpen && (
        <MoveAllDialog account={account} accounts={accounts} open={moveOpen} onOpenChange={setMoveOpen} />
      )}
      {deleteOpen && (
        <DeleteAccountDialog account={account} totalAccounts={accounts.length} open={deleteOpen} onOpenChange={setDeleteOpen} />
      )}
    </div>
  );
}

// ── RETAG — change the book's broker (manual + unbound only) ────────────────────────────────────
function RetagDialog({
  account,
  catalogue,
  adapted,
  open,
  onOpenChange,
}: {
  account: Account;
  catalogue: BrokerCatalogEntry[] | undefined;
  adapted: BrokerMeta[] | undefined;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const patch = usePatchAccount();
  const [broker, setBroker] = useState("");
  const [error, setError] = useState<string | null>(null);
  const currentLabel = brokerLabel(account.broker, catalogue, adapted);
  // Every catalogue broker EXCEPT the one it already is (re-tagging to the same is a no-op).
  const options = (catalogue ?? []).filter((b) => b.id !== account.broker);

  async function submit() {
    if (!broker) return;
    setError(null);
    try {
      await patch.mutateAsync({ id: account.id, body: { broker } });
      toast.success("Broker retagged", { description: `${account.name} now belongs to ${brokerLabel(broker, catalogue, adapted)}.` });
      onOpenChange(false);
    } catch (e) {
      setError(parseApiError(e).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-line bg-surface-1 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-ink">Retag broker</DialogTitle>
          <DialogDescription className="text-ink3">
            Change which broker <span className="text-ink2">{account.name}</span> belongs to. This is only a label — it
            moves nothing and keeps your ledger. It&apos;s possible because this book has never been linked; once it&apos;s
            connected, the broker becomes a fact about the feed and can&apos;t be changed.
          </DialogDescription>
        </DialogHeader>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-ink2">Currently {currentLabel} — change to</label>
          <Select value={broker} onValueChange={(v) => { setBroker(v); setError(null); }} disabled={patch.isPending}>
            <SelectTrigger className="h-9 text-[13px]">
              <SelectValue placeholder="Choose a broker…" />
            </SelectTrigger>
            <SelectContent>
              {options.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-[13px]">
                  {b.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="mt-1.5 text-[12px] text-danger">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={patch.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!broker || patch.isPending}>
            {patch.isPending && <Icons.spinner className="size-3.5 animate-spin" />}
            Retag broker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── MOVE EVERYTHING — transfer-all into another Stated account (any broker), keep or delete source ─
function MoveAllDialog({
  account,
  accounts,
  open,
  onOpenChange,
}: {
  account: Account;
  accounts: Account[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const move = useMoveAllHoldings();
  // Destinations: any OTHER Stated (manual) account, ANY broker — transfer-all has no broker gate.
  const targets = accounts.filter((a) => a.state === "manual" && a.id !== account.id);
  const noTargets = targets.length === 0;

  const [mode, setMode] = useState<"pick" | "create">(noTargets ? "create" : "pick");
  const [destId, setDestId] = useState("");
  const [deleteSource, setDeleteSource] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ deltas: PositionDelta[]; destName: string; sourceDeleted: boolean } | null>(null);

  const chosen = targets.find((a) => a.id === destId);

  async function run(dest: { id: string; name: string }) {
    setError(null);
    try {
      const r = await move.mutateAsync({ sourceId: account.id, toAccountId: dest.id, deleteSource });
      const sourceDeleted = !!r.deletedAccount;
      setResult({ deltas: r.destination, destName: dest.name, sourceDeleted });
      toast.success(
        `Moved ${countLabel(r.destination.length, "position")} to ${dest.name}`,
        { description: sourceDeleted ? `${account.name} was deleted.` : `${account.name} is now empty.` },
      );
    } catch (e) {
      setError(parseApiError(e).message);
    }
  }

  function done() {
    onOpenChange(false);
    // The source page is gone if we deleted it — leave for the accounts list.
    if (result?.sourceDeleted) router.push("/portfolio?tab=accounts");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!move.isPending) onOpenChange(o); }}>
      <DialogContent className="border-line bg-surface-1 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-ink">
            {result ? "Moved" : "Move everything to another account"}
          </DialogTitle>
          <DialogDescription className="text-ink3">
            {result
              ? `Every position, with its real dates and cost basis, is now in ${result.destName}.`
              : "Transfers every holding and transaction — with their real dates, cost basis and realised P&L — into another Stated account. Nothing is fabricated, nothing is lost."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <>
            <MovedList deltas={result.deltas} />
            <DialogFooter>
              <Button onClick={done}>{result.sourceDeleted ? "Back to accounts" : "Done"}</Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col gap-4">
            {mode === "pick" ? (
              <>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-ink2">Move it into</label>
                  <Select value={destId} onValueChange={setDestId} disabled={move.isPending}>
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
                  <button
                    type="button"
                    onClick={() => setMode("create")}
                    disabled={move.isPending}
                    className="mt-2 text-[12px] font-medium text-primary transition-[filter] hover:brightness-110"
                  >
                    + Create a new account for it
                  </button>
                </div>

                <DeleteSourceChoice account={account} value={deleteSource} onChange={setDeleteSource} />
                {error && <ErrorNote message={error} />}

                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)} disabled={move.isPending}>
                    Cancel
                  </Button>
                  <Button onClick={() => chosen && run({ id: chosen.id, name: chosen.name })} disabled={!chosen || move.isPending}>
                    {move.isPending && <Icons.spinner className="size-3.5 animate-spin" />}
                    Move everything
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-[12px] text-ink3">Create the account to move everything into:</p>
                <DeleteSourceChoice account={account} value={deleteSource} onChange={setDeleteSource} />
                {/* reuse the create form; on create, move into it in the same motion */}
                <CreateAccountForm
                  submitLabel="Create & move"
                  cancelLabel={noTargets ? "Cancel" : "Back"}
                  onCancel={() => (noTargets ? onOpenChange(false) : setMode("pick"))}
                  onCreated={(a) => run({ id: a.id, name: a.name })}
                />
                {error && <ErrorNote message={error} />}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteSourceChoice({
  account,
  value,
  onChange,
}: {
  account: Account;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line bg-surface-2/40 p-3">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-danger"
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-ink">Delete {account.name} after moving</span>
        <span className="block text-[12px] leading-relaxed text-ink3">
          It&apos;ll be empty once everything moves out. Leave unchecked to keep the emptied account.
        </span>
      </span>
    </label>
  );
}

function MovedList({ deltas }: { deltas: PositionDelta[] }) {
  if (deltas.length === 0) {
    return <p className="rounded-lg border border-line bg-surface-2/40 px-4 py-6 text-center text-[12.5px] text-ink3">Nothing to show.</p>;
  }
  const qty = (s: string) => {
    const n = Number(s);
    return Number.isFinite(n) ? n.toLocaleString("en-IN", { maximumFractionDigits: 4 }) : s;
  };
  return (
    <div className="max-h-[46vh] overflow-y-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="text-[9.5px] uppercase tracking-wide text-ink3">
            <th className="px-3 py-2 text-left font-semibold">Holding</th>
            <th className="px-3 py-2 text-right font-semibold">Quantity</th>
            <th className="px-3 py-2 text-right font-semibold">Avg cost</th>
          </tr>
        </thead>
        <tbody>
          {deltas.map((d) => (
            <tr key={d.symbol} className="border-t border-line">
              <td className="num px-3 py-2 font-semibold text-ink">{d.symbol}</td>
              <td className="num px-3 py-2 text-right text-ink2">
                {qty(d.quantityBefore) !== qty(d.quantityAfter) ? (
                  <>
                    <span className="text-ink3">{qty(d.quantityBefore)}</span>
                    <span className="text-ink3"> → </span>
                    {qty(d.quantityAfter)}
                  </>
                ) : (
                  qty(d.quantityAfter)
                )}
              </td>
              <td className="num px-3 py-2 text-right text-ink2">{formatINR(Number(d.avgCostAfter))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── DELETE — removes the account and its ledger ─────────────────────────────────────────────────
function DeleteAccountDialog({
  account,
  totalAccounts,
  open,
  onOpenChange,
}: {
  account: Account;
  totalAccounts: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const del = useDeleteAccount();
  const [error, setError] = useState<string | null>(null);
  const txnCount = account.transactionCount;
  // The backend refuses the user's LAST account — surface that up front rather than as a failed tap.
  const isLast = totalAccounts <= 1;

  async function confirm() {
    setError(null);
    try {
      await del.mutateAsync({ id: account.id, confirm: true });
      toast.success(`Deleted ${account.name}`, {
        description: txnCount > 0 ? `Its ${countLabel(txnCount, "transaction")} and holdings were removed.` : undefined,
      });
      onOpenChange(false);
      router.push("/portfolio?tab=accounts");
    } catch (e) {
      setError(parseApiError(e).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!del.isPending) onOpenChange(o); }}>
      <DialogContent className="border-line bg-surface-1 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-ink">Delete {account.name}?</DialogTitle>
          <DialogDescription className="text-ink3">
            {isLast
              ? "This is your only account — you must keep at least one, so it can't be deleted. Create another account first, or move these holdings into one."
              : txnCount > 0
                ? `This permanently removes the account along with its ${countLabel(txnCount, "transaction")} and its holdings. To keep the history, move everything to another account first. This can't be undone.`
                : "This permanently removes the account. It has no transactions to lose. This can't be undone."}
          </DialogDescription>
        </DialogHeader>

        {error && <ErrorNote message={error} />}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={del.isPending}>
            {isLast ? "Close" : "Keep it"}
          </Button>
          {!isLast && (
            <Button variant="destructive" onClick={confirm} disabled={del.isPending}>
              {del.isPending && <Icons.spinner className="size-3.5 animate-spin" />}
              Delete account
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
