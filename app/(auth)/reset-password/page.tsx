import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/screens/reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password — Vytal",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
