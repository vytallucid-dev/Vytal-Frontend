import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/screens/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password — Vytal",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
