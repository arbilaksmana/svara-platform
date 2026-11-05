import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/toast";

export const metadata: Metadata = {
  title: { default: "Svara · Survei SMK Lugina", template: "%s · Svara" },
  description:
    "Modul 14: pembuat survei adopsi teknologi dan technostress dengan skoring dasar otomatis untuk siswa SMK Lugina Rancaekek.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8fafc",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-dvh">
        <StoreProvider>
          <ToastProvider>{children}</ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
