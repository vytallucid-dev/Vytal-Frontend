"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreateAccountForm } from "./create-account-form";

export function CreateAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-line rounded-lg bg-surface-1 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-ink">New account</DialogTitle>
          <DialogDescription className="text-ink3">
            A book to hold positions in. Track it yourself, or tag its broker so you can connect it later.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-1">
          {/* reset the fields each time the dialog opens (resetKey = open) */}
          <CreateAccountForm
            resetKey={open}
            onCreated={() => onOpenChange(false)} // the list refetches via invalidation; the new card appears
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
