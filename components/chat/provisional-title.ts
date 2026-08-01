// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// THE PROVISIONAL TITLE — what a brand-new conversation is called before anything has named it.
//
// THE PROBLEM. A chat-page session is created (POST /chat/sessions) with the fixed placeholder below,
// and the list is refreshed the moment it exists — so it appears as "New conversation" IMMEDIATELY. The
// first real title (the truncated first message) is written by the server in the same transaction that
// persists the first exchange, i.e. only when the reply comes back; the model-written one is a job that
// runs after that. There is no streaming transport, so on a question that costs several tool calls the
// reader watches "New conversation" for the whole generation — the longer the question, the longer the
// lie, which is exactly backwards.
//
// ★ THE FIX IS THE READER'S OWN WORDS, NOT A GUESS. The instant they send, we show their message
//   truncated. It cannot be wrong, because it is not a claim about the conversation — it IS the
//   conversation's first line. A model-flavoured summary invented client-side could be wrong, and a
//   wrong title is worse than a neutral one.
//
// ★ AND IT IS THE SAME STRING THE SERVER IS ABOUT TO WRITE. truncateTitle() below mirrors the backend's
//   (chat-controller.ts §truncateTitle) exactly — same trim, same whitespace collapse, same 48-character
//   ceiling, same ellipsis. So when the send response lands and the list refetches, the title the reader
//   is looking at does not change at all. The only visible change is the LAST one: the model's 4–6 word
//   title, arriving once, into a header that has been stable since the moment they hit Enter.
//
// ⚠ IT MAY ONLY EVER REPLACE THE PLACEHOLDER. resolveTitle treats any other server title — the server's
//   own truncation, the model's, and above all a rename the reader typed — as the authority. That is
//   what makes this safe against the two races that matter: a rename made while the title job is
//   generating, and a title job that finishes while the reader is renaming.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

/** The literal the server stores at creation time (chat-controller.ts: createChatPageSession(…, "New
 *  conversation")). The ONE title a client-side provisional is allowed to stand in for. */
export const PLACEHOLDER_TITLE = "New conversation";

/** Mirrors the server's own cap, so both sides truncate at the same character. */
export const PROVISIONAL_TITLE_MAX = 48;

/** The reader's message → the title they will see a fraction of a second later. */
export function provisionalTitleFrom(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length === 0) return PLACEHOLDER_TITLE;
  return t.length > PROVISIONAL_TITLE_MAX
    ? `${t.slice(0, PROVISIONAL_TITLE_MAX - 1).trimEnd()}…`
    : t;
}

/**
 * Which title to show for a conversation.
 *
 * Returns null when nothing better than the placeholder is known — the caller decides what to render
 * then (the chat page says "New conversation"; the sidekick panel prefers the subject it is opening on).
 */
export function resolveTitle(
  serverTitle: string | null | undefined,
  provisional: string | null | undefined,
): string | null {
  const server = serverTitle?.trim();
  // Anything the server has actually named this conversation outranks our stand-in — including a title
  // that arrived DURING the generation we are standing in for.
  if (server && server !== PLACEHOLDER_TITLE) return server;
  return provisional?.trim() || null;
}
