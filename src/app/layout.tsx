import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { RouteGuard } from "@/components/auth/route-guard";
import { Sidebar } from "@/components/sidebar";
import { ConditionalLayout } from "@/components/conditional-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reduxy Dashboard",
  description: "Analytics and monitoring dashboard for Reduxy AI Gateway",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          defaultTheme="system"
          storageKey="reduxy-ui-theme"
        >
          <AuthProvider>
            <RouteGuard>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </RouteGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
