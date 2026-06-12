import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  const links = [
    { href: "/admin",           label: "Overview" },
    { href: "/admin/import",    label: "Import ICS" },
    { href: "/admin/matches",   label: "Matches" },
    { href: "/admin/predictions", label: "Predictions" },
    { href: "/admin/results",   label: "Results" },
    { href: "/admin/users",     label: "Users" },
  ];

  return (
    <div className="container py-8">
      <header className="mb-6 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Admin</h1>
      </header>
      <nav className="mb-6 flex flex-wrap gap-2 border-b pb-3">
        {links.map((l) => (
          <Button key={l.href} asChild variant="ghost" size="sm">
            <Link href={l.href}>{l.label}</Link>
          </Button>
        ))}
      </nav>
      {children}
    </div>
  );
}
