import type { Metadata } from "next";
import { headers } from "next/headers";
import { AppKitProvider } from "@/context/AppKitProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "x402 Bruma — Informe Crediticio",
  description:
    "Demo de pagos x402 en Avalanche y Avalanche Fuji para el Informe Crediticio",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie");

  return (
    <html lang="en">
      <body className="antialiased">
        <AppKitProvider cookies={cookieHeader}>{children}</AppKitProvider>
      </body>
    </html>
  );
}
