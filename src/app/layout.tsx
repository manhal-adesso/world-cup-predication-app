import type { Metadata } from "next";

import "./globals.css";

import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: { default: "adesso world cup prediction", template: "%s · adesso world cup prediction" },
  description: "Predict every match. Climb the leaderboard. Win bragging rights.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <footer className="border-t py-4 text-center text-xs text-muted-foreground">
              <div className="container">
                Built for the 2026 FIFA World Cup ·{" "}
                <a href="https://www.fifa.com" className="hover:underline" rel="noreferrer" target="_blank">
                  fifa.com
                </a>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
