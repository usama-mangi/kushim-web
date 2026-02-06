import type { Metadata } from "next";
import { JetBrains_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";
import { SentryProvider } from "@/components/SentryProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { KeyboardShortcutsModal } from "@/components/modals/KeyboardShortcuts";
import { AIProvider } from "@/components/ai/AIProvider";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
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
        className={`${ibmPlexSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <SentryProvider>
          <ErrorBoundary>
            <AuthProvider>
              <Navbar />
              {children}
              <AIProvider />
              <CommandPalette />
              <KeyboardShortcutsModal />
              <Toaster position="top-right" richColors />
            </AuthProvider>
          </ErrorBoundary>
        </SentryProvider>
      </body>
    </html>
  );
}
