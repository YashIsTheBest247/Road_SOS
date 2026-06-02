import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";

// Archivo — a heavy grotesque that hits the bold editorial display look,
// with a clean lower-weight body. One family, full weight range.
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RoadSoS — Emergency help on the road",
  description:
    "Find the nearest hospitals, police, ambulances, towing and tyre repair during a road accident — anywhere in the world. Works offline with built-in emergency numbers and an AI first-aid assistant.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "RoadSoS" },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ece6d9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full bg-paper text-ink">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
