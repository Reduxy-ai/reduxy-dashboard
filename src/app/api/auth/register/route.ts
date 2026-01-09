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
                { error: 'This email is already registered. Please login instead or use a different email.' },
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
        
        // Provide more specific error messages
        let errorMessage = 'Registration failed. Please try again.'
        
        if (error instanceof Error) {
            if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
                errorMessage = 'This email is already registered. Please login instead.'
            } else if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
                errorMessage = 'Unable to connect to the database. Please try again later.'
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Request timed out. Please try again.'
            }
        }
        
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        )
    }
} 