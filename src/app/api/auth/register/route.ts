import { NextRequest, NextResponse } from 'next/server'
import { createUserInDB, findUserByEmailInDB } from '@/lib/database-server'
import { createJWT } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const { email, password, firstName, lastName, company, plan, agreeToTerms } = await request.json()

        if (!email || !password || !firstName || !lastName || !plan) {
            return NextResponse.json(
                { error: 'All required fields must be provided' },
                { status: 400 }
            )
        }

        if (!agreeToTerms) {
            return NextResponse.json(
                { error: 'You must agree to the terms and conditions' },
                { status: 400 }
            )
        }

        // Database tables should already exist via migrations

        // Check if user already exists
        const existingUser = await findUserByEmailInDB(email)
        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already registered' },
                { status: 409 }
            )
        }

        // Create new user in database
        const user = await createUserInDB({
            email,
            password,
            firstName,
            lastName,
            company,
            plan
        })

        // Create JWT token
        const token = await createJWT({
            userId: user.id,
            email: user.email,
            plan: user.plan
        })

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