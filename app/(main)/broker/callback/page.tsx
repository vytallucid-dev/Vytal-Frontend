"use client";

/**
 * /broker/callback — the INTERACTIVE (OAuth) broker redirect landing.
 * ---------------------------------------------------------------------------
 * An OAuth broker (e.g. Zerodha/Kite) sends the user here after login, carrying `request_token`
 * + `state` on the URL. We pick up the resume state saved before the redirect (which account to
 * bind, which broker, whether the destructive confirm is needed), complete the exchange, then
 * link → sync — the same second half the one-shot flow runs, shared verbatim (use-link-flow).
 *
 * ABANDON / DENY: if the user backed out at the broker there is no request_token. That is not an
 * error — nothing was linked, the account is untouched — so we say exactly that and offer a way back.
 *
 * NOTE: this route is the target for KITE_REDIRECT_URI (`<origin>/broker/callback`). Zerodha is
 * unconfigured in this environment, so this path is built but exercised only once Kite keys exist;
 * the verifiable path is the one-shot (mock) flow.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { Icons } from "@/lib/icons";
import { clearResume, readResume, useLinkFlow } from "@/components/portfolio/accounts/use-link-flow";

const ACCOUNTS_HREF = "/portfolio?tab=accounts";

type View = "working" | "cancelled" | "error";

export default function BrokerCallbackPage() {
  const router = useRouter();
  const { complete } = useLinkFlow();
  const [view, setView] = React.useState<View>("working");
  const [message, setMessage] = React.useState<string>("");
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (ran.current) return; // fire once (StrictMode-safe)
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const requestToken = params.get("request_token");
    const state = params.get("state");
    const resume = readResume();
    clearResume();

    // No token (or lost resume) ⇒ the user didn't complete consent at the broker. Nothing happened.
    if (!requestToken || !state || !resume) {
      setView("cancelled");
      return;
    }

    (async () => {
      const reconnecting = resume.reconnect != null;
      const res = await complete({
        broker: resume.broker,
        accountId: resume.accountId,
        confirm: resume.confirm,
        reconnect: resume.reconnect,
        state,
        params: { request_token: requestToken },
      });
      if (res.ok) {
        toast.success(reconnecting ? "Broker reconnected" : "Broker connected", {
          description: res.synced
            ? reconnecting
              ? "Its session is refreshed — the feed is live again."
              : "Its holdings now come straight from the broker’s feed."
            : reconnecting
              ? "Reconnected — the next sync will refresh shortly."
              : "Linked — the first sync will refresh shortly.",
        });
        router.replace(ACCOUNTS_HREF);
      } else {
        // Surface the SPECIFIC reason (e.g. the wrong-demat guard names the expected demat), falling
        // back to the generic line only when the flow gave none.
        setMessage(res.message ?? "We couldn’t finish connecting. Your account is unchanged.");
        setView("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 pt-24 text-center">
      {view === "working" ? (
        <div className="flex items-center gap-2.5 text-ink2">
          <Icons.spinner className="size-5 animate-spin text-primary" />
          <span className="text-[13px]">Finishing the connection…</span>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl" style={{ background: "color-mix(in oklch, var(--ctx) 12%, transparent)" }}>
            <Icons.prohibit weight="duotone" className="size-6 text-ink2" />
          </span>
          <div className="flex flex-col gap-1.5">
            <p className="font-display text-[17px] font-semibold text-ink">
              {view === "cancelled" ? "Connection cancelled" : "Couldn’t connect"}
            </p>
            <p className="text-[13px] leading-relaxed text-ink2">
              {view === "cancelled" ? "You backed out at the broker — your account is unchanged." : message}
            </p>
          </div>
          <Link href={ACCOUNTS_HREF} className="text-[13px] font-medium text-primary transition-[filter] hover:brightness-110">
            Back to accounts
          </Link>
        </div>
      )}
    </div>
  );
}
