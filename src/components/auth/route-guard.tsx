"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface RouteGuardProps {
    children: React.ReactNode
}

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']

export function RouteGuard({ children }: RouteGuardProps) {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Don't redirect while loading
        if (isLoading) return

        const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))

        // If user is not authenticated and trying to access protected route
        if (!user && !isPublicRoute) {
            router.push('/login')
            return
        }

        // If user is authenticated and trying to access public auth routes
        if (user && isPublicRoute) {
            router.push('/')
            return
        }
    }, [user, isLoading, router, pathname])

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    // Show nothing while redirecting
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
    if ((!user && !isPublicRoute) || (user && isPublicRoute)) {
        return null
    }

    return <>{children}</>
} 