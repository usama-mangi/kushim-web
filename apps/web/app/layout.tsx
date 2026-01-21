import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'sonner';
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Kushim Dashboard",
  description: "Unified Data Aggregator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
