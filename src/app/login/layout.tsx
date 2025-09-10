import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
    title: "Login - Reduxy Dashboard",
    description: "Sign in to Reduxy Dashboard",
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ThemeProvider defaultTheme="system" storageKey="reduxy-ui-theme">
            {children}
        </ThemeProvider>
    );
} 