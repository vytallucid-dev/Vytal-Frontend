"use client";

// Delete a conversation — the house destructive-confirm pattern (a plain Dialog + a destructive Button;
// there is no AlertDialog primitive). The delete cascades its messages server-side. The success/error
// toast is fired by the MutationCache (meta on useDeleteChatSession) — we do NOT toast here.

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icons } from "@/lib/icons";
import { useDeleteChatSession } from "@/lib/api/hooks/use-chat-sessions";
import type { ChatSession } from "@/types/chat";

export function DeleteChatDialog({
  session,
  onOpenChange,
  onDeleted,
}: {
  /** The session to delete, or null when closed. */
  session: ChatSession | null;
  onOpenChange: (open: boolean) => void;
  /** Called with the deleted id after success (the hub clears the URL if it was the active one). */
  onDeleted: (id: string) => void;
}) {
  const del = useDeleteChatSession();

  const confirm = () => {
    if (!session) return;
    const id = session.id;
    del.mutate(id, {
      onSuccess: () => {
        onDeleted(id);
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={session != null} onOpenChange={(o) => { if (!del.isPending) onOpenChange(o); }}>
      <DialogContent className="max-w-sm border-line bg-surface-1">
        <DialogHeader>
          <DialogTitle className="font-display text-ink">Delete this conversation?</DialogTitle>
          <DialogDescription className="text-ink3">
            <span className="text-ink2">“{session?.title}”</span> and its messages will be removed. This can&apos;t
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={del.isPending}>
            Keep it
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={del.isPending}>
            {del.isPending && <Icons.spinner className="size-3.5 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
