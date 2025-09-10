import { NextRequest, NextResponse } from 'next/server'

// Mock login for now - will implement database later
export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Mock authentication - replace with database call
        if (email === 'admin@reduxy.ai' && password === 'admin123') {
            const user = {
                id: 'user_1',
                email: 'admin@reduxy.ai',
                firstName: 'Admin',
                lastName: 'User',
                plan: 'pro',
                isEmailVerified: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                company: 'Reduxy Inc.',
                apiKeys: [],
                preferences: {
                    theme: 'system',
                    emailNotifications: true,
                    securityAlerts: true,
                    weeklyReports: true,
                    language: 'en'
                },
                billingInfo: {
                    plan: 'pro',
                    status: 'active',
                    currentPeriodStart: new Date().toISOString(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    cancelAtPeriodEnd: false
                }
            }

            const token = 'mock-jwt-token'

            return NextResponse.json({
                user,
                token
            })
        }

        return NextResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
        )
    } catch (error) {
        console.error('Authentication error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 