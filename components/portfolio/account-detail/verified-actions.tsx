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
import type { Account, BrokerCatalogEntry, BrokerMeta, RescuePreview } from "@/types/portfolio";
import { useDeleteAccount } from "@/lib/api/hooks/use-accounts";
import { parseApiError, type ParsedApiError } from "@/lib/api/hooks/use-brokers";
import {
  previewRescue,
  useDiscardAccount,
  usePauseAccount,
  useResumeAccount,
  useRescueAccount,
  useSyncNow,
} from "@/lib/api/hooks/use-verified-actions";
import { brokerLabel, countLabel, needsReconnect } from "@/components/portfolio/accounts/lib";
import { useLinkFlow } from "@/components/portfolio/accounts/use-link-flow";
import { CreateAccountForm } from "@/components/portfolio/accounts/create-account-form";

// ─────────────────────────────────────────────────────────────────────────────
// VERIFIED (broker-fed) ACCOUNT ACTIONS.
//
//   • SYNC NOW     — refresh the snapshot; a dead session says so plainly (book unchanged).
//   • PAUSE/RESUME — deactivate/activate the feed. "Paused" is the account's linked_stale state
//                    (the ONLY thing that produces it is a sever), read back honestly — not faked.
//   • RESCUE       — move the book to a SAME-BROKER Stated account. The confirm shows the FABRICATED
//                    per-row date (the broker feed has no purchase dates), states that this deletes
//                    the broker account + forgets the connection, and names the downgrade: attested
//                    holdings become Stated claims. Factual tone, no alarm styling.
//   • DELETE       — remove the account AND its connection, discarding the broker holdings (the
//                    honest deactivate→clear→delete). Contrasted with rescue, which keeps them.
//
// No score/band/health/coverage. No fabricated value. No manual entry (forbidden on a linked book).
// No broker id hardcoded in any conditional.
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2025-03-12" → "12 Mar 2025" (parsed from parts — no timezone can shift the day). */
function fmtISODate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

export function VerifiedActions({
  account,
  accounts,
  holdingCount,
  catalogue,
  adapted,
}: {
  account: Account;
  accounts: Account[];
  /** Open positions on THIS account (from the holdings union) — what a discard drops / a rescue moves. */
  holdingCount: number;
  catalogue: BrokerCatalogEntry[] | undefined;
  adapted: BrokerMeta[] | undefined;
}) {
  const sync = useSyncNow();
  const pause = usePauseAccount();
  const resume = useResumeAccount();
  const flow = useLinkFlow(); // RECONNECT is the link flow with a reconnect intent (initiate→complete)
  const [syncError, setSyncError] = useState<ParsedApiError | null>(null);
  const [rescueOpen, setRescueOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const connectionId = account.brokerConnectionId;
  const isLive = account.state === "linked_live";
  const isPaused = account.state === "linked_stale" && connectionId !== null;
  const isShell = account.state === "linked_stale" && connectionId === null; // post clear-data husk
  // The daily token expired (linked_live + sessionState "dead"). Routine, needs a reconnect — NOT
  // paused (Pause wins in the shared resolver, so this is never true for a paused book).
  const dead = needsReconnect(account);
  const brokerName = brokerLabel(account.broker, catalogue, adapted);
  const reconnecting = ["connecting", "redirecting", "linking", "syncing"].includes(flow.state.phase);
  const flowError = flow.state.phase === "error" ? flow.state.error : null;

  async function doSync() {
    if (!connectionId) return;
    setSyncError(null);
    try {
      await sync.mutateAsync(connectionId);
      toast.success("Synced", { description: `${account.name} is up to date with the broker.` });
    } catch (e) {
      setSyncError(parseApiError(e)); // book unchanged; it still shows its last real sync
    }
  }

  /** RECONNECT — re-authenticate the SAME demat (initiate→complete again). No link, no destructive
   *  confirm: the account is already bound, its ledger already replaced. For Zerodha this redirects
   *  to Kite; for a one-shot broker it finishes inline (flow.state drives the button + notes). */
  function doReconnect() {
    if (!connectionId) return;
    setSyncError(null);
    flow.run({
      broker: account.broker,
      accountId: account.id,
      reconnect: { connectionId, accountRef: account.staleness?.brokerAccountRef ?? null },
    });
  }

  async function doPause() {
    if (!connectionId) return;
    try {
      await pause.mutateAsync(connectionId);
      toast.success(`Paused ${account.name}`, { description: "The feed is stopped. Everything is kept as of now — resume any time." });
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  }

  async function doResume() {
    if (!connectionId) return;
    try {
      await resume.mutateAsync(connectionId);
      toast.success(`Resumed ${account.name}`, { description: "The feed is live again." });
    } catch (e) {
      toast.error(parseApiError(e).message);
    }
  }

  const busy = sync.isPending || pause.isPending || resume.isPending || reconnecting;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* primary lifecycle action. A dead (token-expired) live account leads with RECONNECT, not
            Sync now — syncing a dead session only 409s; reconnect is the answer to it. */}
        {isLive && !dead && (
          <Button onClick={doSync} disabled={busy} className="gap-1.5">
            {sync.isPending ? <Icons.spinner className="size-4 animate-spin" /> : <Icons.refresh className="size-4" />}
            Sync now
          </Button>
        )}
        {isLive && dead && (
          <Button onClick={doReconnect} disabled={busy} className="gap-1.5">
            {reconnecting ? <Icons.spinner className="size-4 animate-spin" /> : <Icons.refresh className="size-4" />}
            Reconnect
          </Button>
        )}
        {isPaused && (
          <Button onClick={doResume} disabled={busy} className="gap-1.5">
            {resume.isPending ? <Icons.spinner className="size-4 animate-spin" /> : <Icons.play weight="fill" className="size-4" />}
            Resume
          </Button>
        )}
        {/* No "Paused" chip here — the header's status line already reads "Paused · synced …" (item 2:
            a paused book shows Paused + its last sync and nothing else). The Resume button is the action. */}
        {isShell && (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink3">
            <Icons.prohibit weight="duotone" className="size-4 shrink-0" />
            Broker disconnected — no feed and no holdings remain
          </span>
        )}

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-1.5" disabled={busy}>
                Manage
                <Icons.caretDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 border-line bg-surface-1">
              {isLive && (
                <DropdownMenuItem onSelect={doPause} className="gap-2 text-ink2">
                  <Icons.pause className="size-4" />
                  Pause the feed
                </DropdownMenuItem>
              )}
              {(isLive || isPaused) && (
                <DropdownMenuItem onSelect={() => setRescueOpen(true)} className="gap-2 text-ink2">
                  <Icons.arrowsOutSimple className="size-4" />
                  Move to a Stated account
                </DropdownMenuItem>
              )}
              {(isLive || isPaused) && <DropdownMenuSeparator className="bg-line" />}
              <DropdownMenuItem onSelect={() => setDeleteOpen(true)} className="gap-2 text-danger focus:text-danger">
                <Trash2 className="size-4" />
                Delete account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Dead state — a one-line, routine explanation under the Reconnect button (or the wrong-demat
          error if a reconnect just went to the wrong Kite account). Never alarming; the data is real. */}
      {isLive && dead &&
        (flowError ? (
          <p className="flex items-start gap-1.5 text-[12px] text-ink3">
            <Icons.warning weight="duotone" className="mt-0.5 size-3.5 shrink-0" style={{ color: "var(--high)" }} />
            <span>{flowError.message}</span>
          </p>
        ) : (
          <p className="text-[12px] leading-relaxed text-ink3">
            {brokerName}&apos;s session expired, as it does every day — your holdings are unchanged. Reconnect to
            refresh the feed.
          </p>
        ))}

      {/* Sync-now error. The backend message and our sentence are SEPARATE elements — never one text
          node (the concatenation bug). For session_dead specifically, the message asks to reconnect,
          so we make that the action rather than leaving advice with no button. */}
      {syncError &&
        (syncError.code === "session_dead" ? (
          <div className="flex flex-col items-start gap-1.5">
            <p className="text-[12px] text-ink3">{syncError.message}</p>
            <p className="text-[12px] text-ink3">Your book is unchanged and still shows its last real sync.</p>
            <Button onClick={doReconnect} disabled={busy} className="mt-0.5 gap-1.5">
              {reconnecting ? <Icons.spinner className="size-4 animate-spin" /> : <Icons.refresh className="size-4" />}
              Reconnect
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="flex items-start gap-1.5 text-[12px] text-ink3">
              <Icons.warning weight="duotone" className="mt-0.5 size-3.5 shrink-0" style={{ color: "var(--high)" }} />
              <span>{syncError.message}</span>
            </p>
            <p className="pl-5 text-[12px] text-ink3">Your book is unchanged and still shows its last real sync.</p>
          </div>
        ))}

      {rescueOpen && (
        <RescueDialog
          account={account}
          accounts={accounts}
          catalogue={catalogue}
          adapted={adapted}
          open={rescueOpen}
          onOpenChange={setRescueOpen}
        />
      )}
      {deleteOpen && (
        <DeleteVerifiedDialog
          account={account}
          holdingCount={holdingCount}
          totalAccounts={accounts.length}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </div>
  );
}

// ── RESCUE — move a linked book to a same-broker Stated account (the fabricated-date door) ────────
function RescueDialog({
  account,
  accounts,
  catalogue,
  adapted,
  open,
  onOpenChange,
}: {
  account: Account;
  accounts: Account[];
  catalogue: BrokerCatalogEntry[] | undefined;
  adapted: BrokerMeta[] | undefined;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const rescue = useRescueAccount();
  const brokerName = brokerLabel(account.broker, catalogue, adapted);

  // Destinations: same-broker Stated accounts ONLY — the backend enforces this too (broker_mismatch),
  // so this filter mirrors the server, it does not invent a rule.
  const targets = accounts.filter((a) => a.state === "manual" && a.broker === account.broker && a.id !== account.id);
  const noTargets = targets.length === 0;

  const [mode, setMode] = useState<"pick" | "create">(noTargets ? "create" : "pick");
  const [dest, setDest] = useState<{ id: string; name: string } | null>(null);
  const [preview, setPreview] = useState<RescuePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueToPreview(d: { id: string; name: string }) {
    setError(null);
    setPreviewing(true);
    try {
      const p = await previewRescue(account.id, d.id);
      setDest(d);
      setPreview(p);
    } catch (e) {
      setError(parseApiError(e).message); // broker_mismatch / unrescuable / nothing_to_rescue
    } finally {
      setPreviewing(false);
    }
  }

  async function commit() {
    if (!dest) return;
    setError(null);
    try {
      const result = await rescue.mutateAsync({ accountId: account.id, rescueToAccountId: dest.id });
      toast.success(`Rescued into ${dest.name}`, {
        description: `${countLabel(result.rescued?.length ?? preview?.willRescue.length ?? 0, "holding")} are now Stated. ${brokerName} was disconnected.`,
      });
      onOpenChange(false);
      router.push(`/portfolio/accounts/${dest.id}`); // land on the now-Stated book
    } catch (e) {
      setError(parseApiError(e).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!rescue.isPending) onOpenChange(o); }}>
      <DialogContent className="border-line bg-surface-1 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-ink">Move {account.name} to a Stated account</DialogTitle>
          <DialogDescription className="text-ink3">
            {preview
              ? `Its ${brokerName} holdings become your own Stated entries, and ${account.name} is removed.`
              : `Choose a ${brokerName} Stated account to carry these holdings. They can only move to a ${brokerName} book.`}
          </DialogDescription>
        </DialogHeader>

        {!preview ? (
          <div className="flex flex-col gap-4">
            {mode === "pick" ? (
              <>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-ink2">Move it into</label>
                  <Select
                    value={dest?.id ?? ""}
                    onValueChange={(id) => setDest(targets.find((a) => a.id === id) ?? null)}
                    disabled={previewing}
                  >
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue placeholder={`Choose a ${brokerName} Stated account…`} />
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
                    disabled={previewing}
                    className="mt-2 text-[12px] font-medium text-primary transition-[filter] hover:brightness-110"
                  >
                    + Create a new {brokerName} account for it
                  </button>
                </div>
                {error && <ErrorNote message={error} />}
                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)} disabled={previewing}>
                    Cancel
                  </Button>
                  <Button onClick={() => dest && continueToPreview(dest)} disabled={!dest || previewing}>
                    {previewing && <Icons.spinner className="size-3.5 animate-spin" />}
                    Continue
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-[12px] text-ink3">Create the {brokerName} account to carry these holdings:</p>
                <CreateAccountForm
                  fixedBroker={account.broker}
                  submitLabel="Create & continue"
                  cancelLabel={noTargets ? "Cancel" : "Back"}
                  onCancel={() => (noTargets ? onOpenChange(false) : setMode("pick"))}
                  onCreated={(a) => continueToPreview({ id: a.id, name: a.name })}
                />
                {error && <ErrorNote message={error} />}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* THE FABRICATED-DATE DISCLOSURE — never softened, never omitted. The dates below are
                the exact ones the ledger will record (from the preview), not a second derivation. */}
            <div className="rounded-lg border border-line bg-surface-2/40 p-3">
              <p className="text-[12.5px] leading-relaxed text-ink2">
                {brokerName}&apos;s feed carries <span className="font-medium text-ink">no purchase dates</span>. Each of
                these is dated to your last sync — shown per row below — which is{" "}
                <span className="font-medium text-ink">not</span> when you actually bought them.
              </p>
            </div>

            <div className="max-h-[38vh] overflow-y-auto rounded-lg border border-line">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="text-[9.5px] uppercase tracking-wide text-ink3">
                    <th className="px-3 py-2 text-left font-semibold">Holding</th>
                    <th className="px-3 py-2 text-right font-semibold">Quantity</th>
                    <th className="px-3 py-2 text-right font-semibold">Cost / share</th>
                    <th className="px-3 py-2 text-right font-semibold">Dated</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.willRescue.map((r) => (
                    <tr key={r.symbol} className="border-t border-line">
                      <td className="num px-3 py-2 font-semibold text-ink">{r.symbol}</td>
                      <td className="num px-3 py-2 text-right text-ink2">{Number(r.quantity).toLocaleString("en-IN", { maximumFractionDigits: 4 })}</td>
                      <td className="num px-3 py-2 text-right text-ink2">{formatINR(Number(r.costPerShare))}</td>
                      <td className="num px-3 py-2 text-right text-ink3">{fmtISODate(r.tradeDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* what it costs — the connection is forgotten, and the attestation is lost */}
            <ul className="flex flex-col gap-1.5 text-[12px] leading-relaxed text-ink2">
              <li className="flex items-start gap-2">
                <Icons.close className="mt-0.5 size-3.5 shrink-0 text-ink3" />
                <span>{account.name} is removed and {brokerName} is disconnected — the connection is forgotten.</span>
              </li>
              <li className="flex items-start gap-2">
                <Icons.close className="mt-0.5 size-3.5 shrink-0 text-ink3" />
                <span>
                  These holdings stop being <span className="font-medium text-ink">Verified</span> by {brokerName} and
                  become <span className="font-medium text-ink">Stated</span> — your own claims. That is a real
                  downgrade: they are no longer attested by the broker.
                </span>
              </li>
            </ul>

            {error && <ErrorNote message={error} />}

            <DialogFooter>
              <Button variant="outline" onClick={() => { setPreview(null); setError(null); }} disabled={rescue.isPending}>
                Back
              </Button>
              <Button onClick={commit} disabled={rescue.isPending}>
                {rescue.isPending && <Icons.spinner className="size-3.5 animate-spin" />}
                Move {preview.willRescue.length > 0 ? countLabel(preview.willRescue.length, "holding") : "holdings"} &amp; disconnect
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── DELETE / DISCARD — remove the account + its connection, dropping the broker holdings ──────────
function DeleteVerifiedDialog({
  account,
  holdingCount,
  totalAccounts,
  open,
  onOpenChange,
}: {
  account: Account;
  holdingCount: number;
  totalAccounts: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const discard = useDiscardAccount();
  const del = useDeleteAccount(); // the plain path for a connection-less shell
  const [error, setError] = useState<string | null>(null);

  const connectionId = account.brokerConnectionId;
  const isShell = connectionId === null; // no connection/holdings left — a plain delete
  const isLast = totalAccounts <= 1;
  const pending = discard.isPending || del.isPending;

  async function confirm() {
    setError(null);
    try {
      if (isShell) {
        await del.mutateAsync({ id: account.id, confirm: true });
      } else {
        await discard.mutateAsync({ accountId: account.id, connectionId: connectionId! });
      }
      toast.success(`Deleted ${account.name}`);
      onOpenChange(false);
      router.push("/portfolio?tab=accounts");
    } catch (e) {
      setError(parseApiError(e).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!pending) onOpenChange(o); }}>
      <DialogContent className="border-line bg-surface-1 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-ink">Delete {account.name}?</DialogTitle>
          <DialogDescription className="text-ink3">
            {isLast
              ? "This is your only account — you must keep at least one, so it can't be deleted."
              : isShell
                ? "This removes the account. Its broker connection and holdings are already gone. This can't be undone."
                : `This disconnects the broker and permanently discards ${
                    holdingCount > 0 ? `its ${countLabel(holdingCount, "holding")}` : "its holdings"
                  }, then removes the account. To keep those holdings, use “Move to a Stated account” instead. This can't be undone.`}
          </DialogDescription>
        </DialogHeader>

        {error && <ErrorNote message={error} />}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {isLast ? "Close" : "Keep it"}
          </Button>
          {!isLast && (
            <Button variant="destructive" onClick={confirm} disabled={pending}>
              {pending && <Icons.spinner className="size-3.5 animate-spin" />}
              {isShell ? "Delete account" : "Discard & delete"}
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
