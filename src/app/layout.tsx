import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/layout/pwa-register";

export const metadata: Metadata = {
  title: "Control de Acceso Trenova",
  description: "PWA multitenant para control de acceso residencial",
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
