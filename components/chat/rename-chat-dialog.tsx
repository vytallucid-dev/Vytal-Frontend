"use client";

// Rename a conversation — the house Dialog pattern (a plain Dialog, no AlertDialog primitive exists).
// PATCH sets titleSource="user", which the server's title job respects (never overwrites a user title).

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRenameChatSession } from "@/lib/api/hooks/use-chat-sessions";
import type { ChatSession } from "@/types/chat";

const MAX_TITLE_LENGTH = 200; // mirrors the server (PatchBody: .max(200))

export function RenameChatDialog({
  session,
  onOpenChange,
}: {
  /** The session to rename, or null when closed. */
  session: ChatSession | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const rename = useRenameChatSession();

  // Seed the field each time a session opens.
  useEffect(() => {
    if (session) setValue(session.title);
  }, [session]);

  const trimmed = value.trim();
  const canSave = trimmed.length > 0 && trimmed !== session?.title && !rename.isPending;

  const save = () => {
    if (!session || !canSave) return;
    rename.mutate(
      { id: session.id, title: trimmed },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={session != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-line bg-surface-1">
        <DialogHeader>
          <DialogTitle className="font-display">Rename conversation</DialogTitle>
          <DialogDescription>Give this conversation a name you&apos;ll recognise later.</DialogDescription>
        </DialogHeader>
        <input
          ref={inputRef}
          value={value}
          autoFocus
          maxLength={MAX_TITLE_LENGTH}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            }
          }}
          className="w-full rounded-lg border border-line2 bg-surface-2 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink3 focus:border-line3"
          placeholder="Conversation name"
          aria-label="Conversation name"
        />
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!canSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
