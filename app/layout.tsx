import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Church Equipment",
  description: "Simple church equipment requests and checkouts",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Equipment" }
};
export const viewport: Viewport = { themeColor: "#28604e", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><PwaRegister/>{children}</body></html>;
}
