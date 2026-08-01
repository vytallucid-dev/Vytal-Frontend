import { Suspense } from "react";
import { cookies } from "next/headers";
import { ChatHub } from "@/components/chat/chat-hub";
import { CHAT_RAIL_COOKIE, uiPreferenceValue } from "@/lib/ui-preference";

// The dedicated chat page — the permanent home for conversations with Vytal (the discuss sheet's sibling,
// sharing all of its message rendering, loader, and progressive reveal). Two-pane on desktop, single-pane
// on mobile; the open conversation is deep-linkable via ?session=<id>. Authed by the (main) RequireAuth
// layout. Suspense wraps the hub because it reads useSearchParams.
//
// ★ THE RAIL PREFERENCE IS READ HERE, ON THE SERVER. Reading the cookie in the Server Component and
//   handing the answer to the hub as its FIRST state is what makes a collapsed rail stay collapsed
//   across a page load without a frame of it being open — the flash a client-side read (localStorage or
//   document.cookie in an effect) cannot avoid. It is the same cookie convention the app sidebar uses;
//   see lib/ui-preference.ts. Cost: this route renders per request instead of being prerendered — it is
//   an authed, client-driven surface with nothing to prerender but a shell.
export default async function ChatPage() {
  const railOpen = uiPreferenceValue((await cookies()).get(CHAT_RAIL_COOKIE)?.value, true);

  return (
    <div className="h-full">
      <Suspense fallback={<div className="h-full bg-background" />}>
        <ChatHub defaultRailOpen={railOpen} />
      </Suspense>
    </div>
  );
}
