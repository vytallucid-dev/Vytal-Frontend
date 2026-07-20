"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Icons } from "@/lib/icons";
import { useBrokerCatalog, useCreateAccount } from "@/lib/api/hooks/use-accounts";
import type { Account } from "@/types/portfolio";
import { isNotAtBroker } from "./lib";

// ─────────────────────────────────────────────────────────────────────────────
// CREATE-ACCOUNT FORM — the two fields (name + broker) + their validation + the POST. Extracted so
// the SAME component backs both the standalone create dialog AND the inline "create a destination"
// step of the link flow (a new safe home for a book about to be linked). One implementation, so the
// two surfaces can never drift on what creating an account means.
// ─────────────────────────────────────────────────────────────────────────────

/** Read a field-scoped or form-level message off whatever the fetch layer threw. Duplicate names
 *  (409 duplicate_name) and name validation errors map to the NAME field; anything else is form-level.
 *  Never a toast (the mutation opts out). */
function parseCreateError(err: unknown): { field?: "name"; message: string } {
  const detail = (err as { apiError?: { detail?: { error?: string; message?: string; details?: { name?: string[] } }; message?: string } })?.apiError;
  const body = detail?.detail;
  if (body?.error === "duplicate_name") return { field: "name", message: body.message ?? "You already have an account with that name." };
  if (body?.details?.name?.length) return { field: "name", message: body.details.name[0] };
  return { message: body?.message ?? detail?.message ?? "Couldn't create the account. Please try again." };
}

export function CreateAccountForm({
  onCreated,
  onCancel,
  submitLabel = "Create account",
  cancelLabel = "Cancel",
  autoFocus = true,
  /** Reset the fields whenever this key changes (e.g. a dialog re-opening). */
  resetKey,
  /** Lock the broker to a specific id (e.g. a rescue destination MUST be the source's broker). When
   *  set, the picker is replaced by a read-only line — the broker is a requirement, not a choice. */
  fixedBroker,
}: {
  onCreated: (account: Account) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  autoFocus?: boolean;
  resetKey?: unknown;
  fixedBroker?: string;
}) {
  const { data: catalogue } = useBrokerCatalog();
  const create = useCreateAccount();

  const [name, setName] = useState("");
  const [broker, setBroker] = useState(fixedBroker ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setName("");
    setBroker(fixedBroker ?? "");
    setNameError(null);
    setFormError(null);
  }, [resetKey, fixedBroker]);

  const canSubmit = name.trim().length > 0 && broker.length > 0 && !create.isPending;

  async function submit() {
    setNameError(null);
    setFormError(null);
    if (!name.trim()) return setNameError("Give this account a name.");
    if (!broker) return setFormError("Choose where this account is held.");
    try {
      const res = await create.mutateAsync({ name: name.trim(), broker });
      onCreated(res.data);
    } catch (err) {
      const p = parseCreateError(err);
      if (p.field === "name") setNameError(p.message);
      else setFormError(p.message);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* name */}
      <div>
        <label htmlFor="acct-name" className="mb-1 block text-[11px] font-medium text-ink2">
          Name
        </label>
        <Input
          id="acct-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSubmit) submit();
          }}
          placeholder="e.g. Long-term equity"
          aria-invalid={!!nameError}
          autoFocus={autoFocus}
          className="h-9 text-[13px]"
        />
        {nameError && <p className="mt-1 text-[11px] text-danger">{nameError}</p>}
      </div>

      {/* broker */}
      <div>
        <label className="mb-1 block text-[11px] font-medium text-ink2">Where is it held?</label>
        {fixedBroker ? (
          <div className="flex h-9 items-center gap-1.5 rounded-md border border-line2 bg-surface-2/60 px-3 text-[13px] text-ink2">
            <Icons.building weight="duotone" className="size-3.5 shrink-0 text-ink3" />
            {catalogue?.find((b) => b.id === fixedBroker)?.displayName ?? fixedBroker}
          </div>
        ) : (
          <Select value={broker} onValueChange={setBroker}>
            <SelectTrigger className="h-9 text-[13px]">
              <SelectValue placeholder="Choose a broker…" />
            </SelectTrigger>
            <SelectContent>
              {catalogue?.map((b) => (
                <SelectItem key={b.id} value={b.id} className="text-[13px]">
                  {b.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {!fixedBroker && isNotAtBroker(broker) && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-ink3">
            <Icons.info weight="duotone" className="mt-px size-3.5 shrink-0" />
            For holdings you keep outside any broker — bank-bought SGBs, bonds held directly in NSDL, physical
            certificates. It can never be connected to a feed.
          </p>
        )}
      </div>

      {formError && (
        <div
          className="flex items-start gap-2 rounded-lg border px-3 py-2 text-[12px]"
          style={{ color: "var(--crit)", borderColor: "var(--crit-bd)", background: "var(--crit-bg)" }}
        >
          <Icons.warning weight="fill" className="mt-0.5 size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="mt-1 flex items-center justify-end gap-2">
        {onCancel && (
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={create.isPending}>
            {cancelLabel}
          </Button>
        )}
        <Button className="flex-1" onClick={submit} disabled={!canSubmit}>
          {create.isPending && <Icons.spinner className="size-3.5 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
