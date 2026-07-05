"use client";

/**
 * SidebarUser — the footer account card, wired to the real session.
 * Shows the authenticated user's name + email (from Supabase user_metadata,
 * falling back to the email), with a menu to reach settings or sign out. Sign
 * out clears the session; RequireAuth then bounces to /login (we also route
 * explicitly for snappiness).
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/providers/auth-provider";
import { Icons } from "@/lib/icons";
import { toast } from "@/components/ui/toast";

function nameFromUser(
  meta: Record<string, unknown> | undefined,
  email: string | undefined,
): string {
  const fromMeta =
    (typeof meta?.display_name === "string" && meta.display_name) ||
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    "";
  if (fromMeta.trim()) return fromMeta.trim();
  if (email) {
    const local = email.split("@")[0];
    if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return "Your account";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const chars = parts.map((p) => p.charAt(0).toUpperCase()).join("");
  return chars || "U";
}

export function SidebarUser({ collapsed }: { collapsed: boolean }) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const name = nameFromUser(user?.user_metadata, user?.email);
  const email = user?.email ?? "";

  async function onSignOut() {
    await signOut();
    toast.success("Signed out", { description: "You've been securely signed out." });
    router.replace("/login");
  }

  const menu = (
    <DropdownMenuContent
      side={collapsed ? "right" : "top"}
      align={collapsed ? "start" : "end"}
      sideOffset={8}
      className="w-56"
    >
      <DropdownMenuLabel className="flex flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-ink">{name}</span>
        {email && <span className="truncate text-xs font-normal text-ink3">{email}</span>}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/settings" className="cursor-pointer gap-2">
          <Icons.settings className="size-4" />
          Account &amp; settings
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          void onSignOut();
        }}
        className="cursor-pointer gap-2 text-danger focus:text-danger"
      >
        <Icons.signout className="size-4" />
        Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account"
          className="mx-auto grid size-9 place-items-center rounded-full border border-primary/20 bg-primary/12 text-xs font-bold text-primary outline-none ring-primary/40 transition-colors hover:bg-primary/20 focus-visible:ring-2"
        >
          {initials(name)}
        </DropdownMenuTrigger>
        {menu}
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left outline-none transition-colors hover:bg-surface-2 focus-visible:bg-surface-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/12 text-xs font-bold text-primary">
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium text-ink">{name}</p>
          <p className="truncate text-xs text-ink3">{email || "Signed in"}</p>
        </div>
        <Icons.caretUp className="ml-auto size-4 shrink-0 text-ink3" />
      </DropdownMenuTrigger>
      {menu}
    </DropdownMenu>
  );
}
