import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Source_Sans_3 } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// next/font downloads these at BUILD time and serves them from our own domain.
// Visitors' browsers never contact Google.
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  variable: "--font-source-sans",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "napfdeal – Preisvergleich für Haustierbedarf",
    template: "%s · napfdeal",
  },
  description:
    "Preise für Futter, Streu und Zubehör aus mehreren Shops in Deutschland und Österreich, mit Preisverlauf, Grundpreis und Preis-Alarm.",
  applicationName: "napfdeal",
  // Ownership check for the Awin publisher application.
  // Renders <meta name="awin-verification" content="Awin"> on every page.
  other: {
    "awin-verification": "Awin",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f1e6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${fraunces.variable} ${sourceSans.variable} ${caveat.variable}`}>
      <body className="min-h-screen bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
