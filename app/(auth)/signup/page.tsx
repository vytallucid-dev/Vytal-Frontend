import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/screens/signup-form";

export const metadata: Metadata = {
  title: "Create your account — Vytal",
};

export default function SignupPage() {
  return <SignupForm />;
}
