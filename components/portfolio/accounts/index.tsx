"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { QuerySkeleton } from "@/components/ui/query-skeleton";
import { QueryError } from "@/components/ui/query-error";
import { toast } from "@/components/ui/toast";
import { Icons } from "@/lib/icons";
import { useAccounts, useBrokerCatalog } from "@/lib/api/hooks/use-accounts";
import { useBrokerStatus } from "@/lib/api/hooks/use-brokers";
import { useTransactions } from "@/lib/api/hooks/use-transactions";
import type { Account, Holding } from "@/types/portfolio";
import { AccountCard } from "./account-card";
import { CreateAccountDialog } from "./create-account-dialog";
import { LinkAccountDialog } from "./link-account-dialog";
import { useLinkFlow } from "./use-link-flow";
import { accountStatsMap } from "./lib";

// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO › ACCOUNTS — the list of the containers. What books do I have, and where does
// each one's data come from? No summary header, no totals, no health — those live on the
// portfolio page. Every card is Verified (broker feed) or Stated (the user's own entries).
// ─────────────────────────────────────────────────────────────────────────────

function NewAccountButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[12.5px] font-medium text-primary-foreground transition-[filter] hover:brightness-110"
    >
      <Icons.plus className="size-3.5" />
      New account
    </button>
  );
}

function EmptyAccounts({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-line2 px-8 py-16 text-center">
      <Icons.stack weight="duotone" className="mx-auto mb-4 size-8 text-ink3 opacity-70" />
      <h3 className="font-display text-[20px] font-semibold text-ink2">Start with an account</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink3">
        An account is a book of holdings — track one yourself, or connect a broker and let it keep the book accurate.
      </p>
      <div className="mt-5 flex justify-center">
        <NewAccountButton onClick={onCreate} />
      </div>
    </div>
  );
}

export function AccountsTab({ holdings }: { holdings: Holding[] }) {
  const accountsQ = useAccounts();
  const { data: catalogue } = useBrokerCatalog();
  const { data: brokerStatus } = useBrokerStatus();
  const { data: transactions } = useTransactions();
  const [creating, setCreating] = useState(false);
  const [linkTarget, setLinkTarget] = useState<Account | null>(null);

  const accounts = accountsQ.data ?? [];
  const adapted = brokerStatus?.available;
  const stats = accountStatsMap(holdings);

  // RECONNECT (dead daily token) from a card. For an interactive broker (Zerodha) `run` redirects
  // away, so nothing renders here; for the one-shot (mock) path it finishes inline — surface its
  // outcome as a toast (the card is too small for an inline error, and reconnect has no dialog).
  const reconnect = useLinkFlow();
  useEffect(() => {
    const p = reconnect.state.phase;
    if (p === "done" || p === "linked_unsynced") {
      toast.success("Broker reconnected", { description: "Its session is refreshed — the feed is live again." });
      reconnect.reset();
    } else if (p === "error") {
      toast.error(reconnect.state.error?.message ?? "Couldn’t reconnect. Nothing was changed.");
      reconnect.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconnect.state.phase]);

  const onReconnect = (a: Account) => {
    if (!a.brokerConnectionId) return;
    reconnect.run({
      broker: a.broker,
      accountId: a.id,
      reconnect: { connectionId: a.brokerConnectionId, accountRef: a.staleness?.brokerAccountRef ?? null },
    });
  };

  return (
    <div className="flex flex-col pb-4">
      {accountsQ.isLoading ? (
        <QuerySkeleton rows={4} rowHeight="h-28" className="mt-6" />
      ) : accountsQ.isError ? (
        <QueryError
          message={(accountsQ.error as Error)?.message ?? "Failed to load your accounts"}
          onRetry={() => accountsQ.refetch()}
          className="mt-6"
        />
      ) : accounts.length === 0 ? (
        <EmptyAccounts onCreate={() => setCreating(true)} />
      ) : (
        <>
          <div className="mb-4 mt-6 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-[17px] font-semibold text-ink">Your accounts</h2>
              <p className="mt-0.5 text-[12px] leading-relaxed text-ink2">
                The books your holdings live in — each one{" "}
                <span className="text-ink">Verified</span>{" "}
                by a broker&apos;s feed, or{" "}
                <span className="text-ink">Stated</span>{" "}
                by you.
              </p>
            </div>
            <NewAccountButton onClick={() => setCreating(true)} />
          </div>

          <Reveal>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {accounts.map((a) => (
                <AccountCard
                  key={a.id}
                  account={a}
                  catalogue={catalogue}
                  adapted={adapted}
                  stats={stats.get(a.id)}
                  onConnect={() => setLinkTarget(a)}
                  onReconnect={() => onReconnect(a)}
                />
              ))}
            </div>
          </Reveal>
        </>
      )}

      <CreateAccountDialog open={creating} onOpenChange={setCreating} />
      <LinkAccountDialog
        account={linkTarget}
        open={linkTarget !== null}
        onOpenChange={(o) => !o && setLinkTarget(null)}
        accounts={accounts}
        transactions={transactions}
        catalogue={catalogue}
        adapted={adapted}
      />
    </div>
  );
}
