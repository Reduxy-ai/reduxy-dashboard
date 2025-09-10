import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmailInDB, query } from '@/lib/database-server'
import { verifyJWT } from '@/lib/auth'

// Get user profile
export async function GET(request: NextRequest) {
    try {
        // Get JWT token from Authorization header
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Authorization token required' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7) // Remove 'Bearer ' prefix
        const payload = await verifyJWT(token)
        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            )
        }

        const user = await findUserByEmailInDB(payload.email)
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user

        return NextResponse.json({ user: userWithoutPassword })
    } catch (error) {
        console.error('Profile fetch error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Update user profile
export async function PUT(request: NextRequest) {
    try {
        // Get JWT token from Authorization header
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Authorization token required' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7) // Remove 'Bearer ' prefix
        const payload = await verifyJWT(token)
        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            )
        }

        const { firstName, lastName, company } = await request.json()

        if (!firstName || !lastName) {
            return NextResponse.json(
                { error: 'First name and last name are required' },
                { status: 400 }
            )
        }

        // Update user profile in database
        const result = await query(
            `UPDATE users 
       SET first_name = $1, last_name = $2, company = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, first_name, last_name, company, plan, is_email_verified, created_at, updated_at`,
            [firstName, lastName, company || null, payload.userId]
        )

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        const updatedUser = result.rows[0]

        return NextResponse.json({
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                firstName: updatedUser.first_name,
                lastName: updatedUser.last_name,
                company: updatedUser.company,
                plan: updatedUser.plan,
                isEmailVerified: updatedUser.is_email_verified,
                createdAt: updatedUser.created_at,
                updatedAt: updatedUser.updated_at
            },
            message: 'Profile updated successfully'
        })
    } catch (error) {
        console.error('Profile update error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 