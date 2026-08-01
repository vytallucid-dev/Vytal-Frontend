import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { CatalogueProvider } from "@/components/providers/catalogue-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/toast";
import type { Metadata } from "next";
import { Inter, Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

/* UI / body / labels / buttons — the default interface typeface */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

/* Display serif — entity names, verdict / diagnosis sentences, section heroes */
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

/* Numbers / data — tabular monospace for every figure (scores, prices, ratios) */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vytal — Intelligent Investing, Beautifully Clear",
  description:
    "A premium analysis terminal for Indian markets. Health Scores and portfolio intelligence — designed to make confident investing effortless.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${fraunces.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
        >
          <AuthProvider>
            <QueryProvider>
              {/* Fetches the copy catalogue ONCE and hydrates the module store the four finding
                  resolvers read. Renders children unchanged and never blocks — a failed fetch
                  leaves every surface on its bundled copy, not on title-only. */}
              <CatalogueProvider>{children}</CatalogueProvider>
            </QueryProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
