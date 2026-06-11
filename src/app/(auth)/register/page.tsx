import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/register-form";
import { getOptionalSession } from "@/lib/auth";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  const session = await getOptionalSession();
  if (session) redirect("/dashboard");
  return <RegisterForm />;
}
