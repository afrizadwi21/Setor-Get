import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Setor-Get – Platform Setor & Cek Akun Terverifikasi",
  description: "Setor akun Gmail terformat dan dapatkan imbalan transparan dengan verifikasi cepat dan aman.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
