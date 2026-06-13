import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { PwaRegister } from "@/components/PwaRegister";
import { InstallPrompt } from "@/components/InstallPrompt";

// Display: weiche, organische Optical-Serif — gibt der App Charakter & Wärme.
const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
  axes: ["SOFT", "opsz"],
});

// UI/Body: freundliche, hochlegible Humanist-Grotesk.
const sans = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TrueLabel: Weißt du wirklich, was du isst?",
    template: "%s · TrueLabel",
  },
  description:
    "Barcode scannen und sofort sehen, wie gesund, nachhaltig und fair ein Lebensmittel wirklich ist. Unbegrenzte Scans, kostenlos, ohne Werbung.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TrueLabel",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f9f0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${sans.variable} ${display.variable}`}>
      <body>
        <div className="app">{children}</div>
        <BottomNav />
        <PwaRegister />
        <InstallPrompt />
      </body>
    </html>
  );
}
