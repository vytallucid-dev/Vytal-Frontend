"use client";

/**
 * AdminGuard — role gate for the Admin Panel (the Data hub + every ingestion
 * detail page under /admin/*).
 *
 * The (main) layout's RequireAuth already guarantees a session here; this layer
 * adds the ROLE check on top. Admin status comes from GET /api/v1/me/profile
 * (role lives in public.users.role, never the JWT) via useMe().
 *
 *   • still resolving   → calm loading state (never flash the panel or the block)
 *   • not an admin      → a clear "restricted" screen (no silent redirect loop)
 *   • admin             → render the panel
 *
 * This is defense-in-depth for the UI only. Every /admin/* API route is
 * independently enforced with requireAdmin on the backend, so hiding the UI is
 * a courtesy, not the security boundary.
 */

import Link from "next/link";
import { useMe } from "@/lib/api/hooks/use-me";
import { AuthLoading } from "@/components/auth/auth-loading";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";

function AccessRestricted() {
  return (
    <div className="mx-auto flex min-h-[70svh] w-full max-w-lg flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="glass-strong relative overflow-hidden rounded-3xl border border-border/70 p-8 sm:p-10">
        <div className="bg-aurora pointer-events-none absolute inset-0 -z-10 opacity-20" />
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/25">
          <Icons.lock weight="duotone" className="size-7" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight">
          Access <span className="text-gradient">restricted</span>
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          The Admin Panel is available to administrators only. If you believe you
          should have access, contact your workspace admin.
        </p>
        <Button asChild variant="gradient" className="mt-6">
          <Link href="/dashboard">
            <Icons.dashboard weight="duotone" className="size-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isResolving } = useMe();

  if (isResolving) return <AuthLoading message="Checking access…" />;
  if (!isAdmin) return <AccessRestricted />;
  return <>{children}</>;
}
