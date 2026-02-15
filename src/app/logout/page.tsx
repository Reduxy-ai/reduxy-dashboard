"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.reduxy.ai'

export default function LogoutPage() {
    const searchParams = useSearchParams()

    useEffect(() => {
        // Get redirect parameter (if coming from website)
        const redirect = searchParams.get('redirect')

        // Default redirect is dashboard
        const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.reduxy.ai'
        const finalRedirect = redirect || dashboardUrl

        // Redirect to centralized auth service logout
        // This will clear the shared SSO cookie and redirect back
        window.location.href = `${AUTH_URL}/logout?redirect_uri=${encodeURIComponent(finalRedirect)}`
    }, [searchParams])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800">
            <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg">Logging out...</p>
            </div>
        </div>
    )
}
