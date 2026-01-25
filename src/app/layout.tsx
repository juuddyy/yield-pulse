import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yield Pulse | Track Your DeFi Yields",
  description:
    "Track your investments, profits, and yields across DeFi platforms like Mezo. See real PnL, not just APR percentages.",
  keywords: [
    "DeFi",
    "yield tracking",
    "Mezo",
    "BTC yield",
    "crypto portfolio",
    "PnL tracker",
  ],
  authors: [{ name: "Yield Pulse" }],
  openGraph: {
    title: "Yield Pulse | Track Your DeFi Yields",
    description:
      "Track your investments, profits, and yields across DeFi platforms.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yield Pulse | Track Your DeFi Yields",
    description:
      "Track your investments, profits, and yields across DeFi platforms.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
