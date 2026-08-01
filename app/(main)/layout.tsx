import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RequireAuth } from "@/components/auth/route-guard";
import { MainShell } from "@/components/main-shell";
import { SidekickProvider } from "@/components/sidekick/sidekick-provider";
import { SidekickPanel } from "@/components/sidekick/sidekick-panel";
import { ChatShortcutsProvider } from "@/components/shortcuts/chat-shortcuts";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <SidebarProvider>
      {/* static grid backdrop (depth from surfaces + hairline grid, no motion) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-grid opacity-30 mask-[radial-gradient(ellipse_at_center,black,transparent_78%)]" />
      </div>
      {/* ★ SIDEKICK LIVES AT THE SHELL, NOT IN A CARD. The panel is a RAIL — the app sidebar's mirror —
          so its spacer has to be a sibling of the inset for the content to sit between the two and
          resize as it opens. Mounting the provider here (inside SidebarProvider, so it can reach the
          sidebar it has to collapse) is also what lets the conversation survive navigation: the reader
          keeps browsing while it talks, which is the entire reason it stopped being a sheet. */}
      <SidekickProvider>
        {/* The Vytal keyboard layer (⌥A / ⌥N / ⌥B). Inside SidekickProvider because it dispatches to
            the panel's actions, and ABOVE the router outlet because the chat page claims those same
            three keys while it is mounted. Renders no DOM of its own — the sidebar and the inset stay
            siblings in the shell's flex row. */}
        <ChatShortcutsProvider>
          <AppSidebar />
          <SidebarInset className="min-w-0 bg-transparent">
            {/* Per-route frame: Navbar + padded scroll for most pages; full-bleed for /chat. */}
            <MainShell>{children}</MainShell>
          </SidebarInset>
          <SidekickPanel />
        </ChatShortcutsProvider>
      </SidekickProvider>
      </SidebarProvider>
    </RequireAuth>
  );
}
