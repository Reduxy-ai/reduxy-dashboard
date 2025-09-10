"use client"

import { usePathname } from 'next/navigation'
import { Sidebar } from "@/components/sidebar"

interface ConditionalLayoutProps {
    children: React.ReactNode
}

const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
    const pathname = usePathname()
    const isAuthPage = AUTH_ROUTES.some(route => pathname.startsWith(route))

    if (isAuthPage) {
        // Auth pages - full screen without sidebar
        return (
            <div className="min-h-screen">
                {children}
            </div>
        )
    }

    // Dashboard pages - with sidebar
    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
} 