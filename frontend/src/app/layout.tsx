import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Figtree, Literata } from "next/font/google";
import "./globals.css";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-display",
  display: "swap",
});

const body = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const reading = Literata({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-reading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Setor Gmail — Setiap Gmail yang lolos dibayar Rp2.500",
  description:
    "Setor Gmail berawalan get, pantau statusnya dari Pending sampai Diterima, lalu tarik saldo ke DANA, OVO, GoPay, atau rekening bank mulai Rp25.000.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f4efdc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable} ${reading.variable}`}>
      <body>{children}</body>
    </html>
  );
}
