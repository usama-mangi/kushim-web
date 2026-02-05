import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";
import { SentryProvider } from "@/components/SentryProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kushim - Compliance Automation Platform",
  description: "Automate SOC 2 compliance with integrated monitoring and evidence collection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SentryProvider>
          <ErrorBoundary>
            <AuthProvider>
              <Navbar />
              {children}
              <Toaster position="top-right" richColors />
            </AuthProvider>
          </ErrorBoundary>
        </SentryProvider>
      </body>
    </html>
  );
}
