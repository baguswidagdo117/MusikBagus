import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/toast";
import { PwaRegister } from "@/components/pwa-register";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  applicationName: "BagusMusik",
  title: {
    default: "BagusMusik - Servis & Reparasi Alat Musik",
    template: "%s | BagusMusik",
  },
  description:
    "BagusMusik melayani servis dan reparasi gitar, bass, keyboard, drum, amplifier, dan mikrofon. Booking online, cek status servis, dan transparan biaya.",
  keywords: [
    "servis alat musik",
    "reparasi gitar",
    "servis keyboard",
    "servis drum",
    "bengkel musik Pekalongan",
    "BagusMusik",
  ],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BagusMusik",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "BagusMusik",
    title: "BagusMusik - Servis & Reparasi Alat Musik",
    description:
      "Booking servis alat musik, cek status perbaikan, dan transparan biaya.",
    url: appUrl,
  },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#111418",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="bg-paper text-ink-900">
        {children}
        <Toaster />
        <PwaRegister />
      </body>
    </html>
  );
}
