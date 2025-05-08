import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import ClientSessionProvider from "@/components/ClientSessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Text Classification Chat Bot",
  description: "Text Classification Chat Bot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-zinc-50"}>
        <ClientSessionProvider>{children}</ClientSessionProvider>
      </body>
    </html>
  );
}
