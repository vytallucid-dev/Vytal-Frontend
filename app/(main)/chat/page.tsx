import { Suspense } from "react";
import { ChatHub } from "@/components/chat/chat-hub";

// The dedicated chat page — the permanent home for conversations with Vytal (the discuss sheet's sibling,
// sharing all of its message rendering, loader, and progressive reveal). Two-pane on desktop, single-pane
// on mobile; the open conversation is deep-linkable via ?session=<id>. Authed by the (main) RequireAuth
// layout. Suspense wraps the hub because it reads useSearchParams.
export default function ChatPage() {
  return (
    <div className="h-full">
      <Suspense fallback={<div className="h-full bg-background" />}>
        <ChatHub />
      </Suspense>
    </div>
  );
}
