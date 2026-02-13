"use client"

import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function RegisterPage() {
    useEffect(() => {
        // Redirect to auth service for registration
        const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.reduxy.ai'
        const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.reduxy.ai'

        // Redirect to auth service register with return URL
        window.location.href = `${AUTH_URL}/register?redirect_uri=${encodeURIComponent(DASHBOARD_URL)}`
    }, [])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-muted-foreground">Redirecting to registration...</p>
            </div>
        </div>
    )
}
