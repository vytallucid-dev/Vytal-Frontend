// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// UI PREFERENCES — small, non-secret "how I like this surface" flags that must survive a page load.
//
// ★ COOKIES, BECAUSE THAT IS WHAT THIS APP ALREADY USES. components/ui/sidebar.tsx persists the app
//   sidebar's open state as a `sidebar_state` cookie, path=/, 7-day max-age. This file is that same
//   convention, named and reusable, so the second preference does not arrive as a second mechanism.
//
// ★ AND BECAUSE A COOKIE CAN BE READ ON THE SERVER. That is the difference that matters here: a Server
//   Component can read it with next/headers cookies() and pass the answer down as the FIRST rendered
//   state, so a collapsed rail is never painted open for a frame and then folded away. localStorage
//   cannot do that — it would force either a flash or a hydration mismatch.
//
// ⚠ NOTE ON THE EXISTING SIDEBAR COOKIE: it is written but never read back (the (main) layout mounts
//   SidebarProvider with no `defaultOpen`, so it always starts expanded). That is pre-existing and out
//   of scope here — but it is why this file exists rather than a second copy of the same three lines.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

/** One week — the sidebar cookie's own lifetime, kept identical so preferences expire together. */
export const UI_PREFERENCE_MAX_AGE = 60 * 60 * 24 * 7;

/** Is /chat's conversation rail expanded? Absent ⇒ yes (the surface's default). */
export const CHAT_RAIL_COOKIE = "chat_rail_state";

/** Client-side write. Values are plain booleans as text, matching `sidebar_state`. */
export function writeUiPreference(name: string, value: boolean): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${UI_PREFERENCE_MAX_AGE}; SameSite=Lax`;
}

/** Parse a "true"/"false" cookie value into a boolean, falling back when it is absent or malformed. */
export function uiPreferenceValue(raw: string | undefined, fallback: boolean): boolean {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return fallback;
}
