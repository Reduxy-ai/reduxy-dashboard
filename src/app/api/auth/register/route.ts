import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { email, password, firstName, lastName, company, plan } = await request.json()

        if (!email || !password || !firstName || !lastName || !plan) {
            return NextResponse.json(
                { error: 'All required fields must be provided' },
                { status: 400 }
            )
        }

        // Mock registration - replace with database call
        const user = {
            id: `user_${Date.now()}`,
            email,
            firstName,
            lastName,
            plan,
            isEmailVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            company: company || null,
            apiKeys: [],
            preferences: {
                theme: 'system',
                emailNotifications: true,
                securityAlerts: true,
                weeklyReports: false,
                language: 'en'
            }
        }

        const token = `mock-jwt-token-${Date.now()}`

        return NextResponse.json({
            user,
            token
        })
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 