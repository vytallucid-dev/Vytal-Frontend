import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/screens/login-form";

export const metadata: Metadata = {
  title: "Sign in — Vytal",
};

export default function LoginPage() {
  // LoginForm reads ?redirect / ?reset via useSearchParams → needs a Suspense boundary.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
