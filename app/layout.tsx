import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "x402 Bruma — Informe Crediticio",
  description: "Demo de pagos x402 en Avalanche y Avalanche Fuji para el Informe Crediticio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
