"use client";

import { useParams } from "next/navigation";
import { AccountDetail } from "@/components/portfolio/account-detail";

// One account, on its own — the flattened, account-scoped view of a single book. The Accounts
// tab cards link here (/portfolio/accounts/:id). Read-only this build: no link / unlink / pause /
// sync / transfer / delete / manual entry — those actions land in the header region next.
export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params.id ?? "");
  return <AccountDetail accountId={id} />;
}
