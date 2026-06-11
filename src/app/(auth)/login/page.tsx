import { Suspense } from "react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getOptionalSession } from "@/lib/auth";

export const metadata = { title: "Log in" };

export default async function LoginPage() {
  const session = await getOptionalSession();
  if (session) redirect("/dashboard");

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
