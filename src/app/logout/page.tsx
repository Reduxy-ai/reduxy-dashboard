"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function LogoutPage() {
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        const redirect = searchParams.get('redirect')

        // Call logout API to clear cookie
        fetch('/api/auth/logout-page', {
            method: 'POST',
        }).then(() => {
            console.log('Dashboard session cleared')

            if (redirect) {
                // Redirect back to website
                window.location.href = redirect
            } else {
                // Stay on dashboard, go to login
                router.push('/login')
            }
        }).catch(error => {
            console.error('Logout failed:', error)
            // Redirect anyway
            if (redirect) {
                window.location.href = redirect
            } else {
                router.push('/login')
            }
        })
    }, [searchParams, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800">
            <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg">Logging out...</p>
            </div>
        </div>
    )
}
