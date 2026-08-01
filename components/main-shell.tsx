"use client";

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN SHELL — the per-route content frame inside the sidebar inset. Most routes get the page-level
// Navbar over a padded, independently-scrolling <main>. The chat page keeps the Navbar too, but its
// <main> is FULL-BLEED: no page padding, and the body itself does not scroll (each chat region scrolls on
// its own). This lives here — rather than in a nested layout — because Next layouts NEST: a chat
// sub-layout renders INSIDE this <main>, so it could not change the padding/scroll of this <main>.
//
// ★ IT IS ALSO THE SIDEKICK CONVERSATION MANAGER'S HOST ON DESKTOP, and that is deliberate. The manager
// must cover the CONTENT REGION and nothing else — never the sidekick panel, so the reader can still see
// the conversation they are managing. Rendering it here, `absolute inset-0` inside this frame, makes that
// true by construction: this element already IS the content region, whatever the sidebar and the panel
// are currently doing to its width. No viewport maths, nothing to keep in sync.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";
import { useSidekick } from "@/components/sidekick/sidekick-provider";
import { SidekickConversationManager } from "@/components/sidekick/sidekick-conversation-manager";

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { open, isMobile } = useSidekick();
  const fullBleed = pathname === "/chat" || pathname.startsWith("/chat/");

  // Mounted only while the panel is open (the manager is the panel's, and it costs a sessions fetch), and
  // only on desktop — on mobile the panel hosts it full-bleed instead, since it covers the screen there.
  const manager = open && !isMobile ? <SidekickConversationManager /> : null;

  if (fullBleed) {
    return (
      <div className="relative flex h-svh min-w-0 flex-col">
        <Navbar />
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
        {manager}
      </div>
    );
  }

  return (
    <div className="relative flex h-svh min-w-0 flex-col">
      <Navbar />
      {/* `relative` so a page-level popover (the dashboard's Ask-Vytal suggestions) can portal INTO this
          scroller and be positioned against it. That is what lets such a panel scroll with the content
          natively — no per-frame JS repositioning, so no jitter — while this element's own overflow
          clips it, so it can never paint over the Navbar above. See ask-vytal §ANCHORING. */}
      <main className="custom-scrollbar relative min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-10 pt-4 sm:px-5 lg:px-6">
        {children}
      </main>
      {manager}
    </div>
  );
}
