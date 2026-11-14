import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz", "SOFT"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: "Lumora — Luminaires & art mural imprimés en 3D en Tunisie", template: "%s · Lumora" },
  description:
    "Lumora dessine et fabrique en Tunisie des luminaires et pièces d'art mural imprimés en 3D, en matériaux biosourcés. Livraison partout en Tunisie.",
  openGraph: { siteName: "Lumora", locale: "fr_TN", type: "website", images: ["/catalog/hero.webp"] },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#0d0a08" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
