import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmailInDB, query } from '@/lib/database-server'
import { verifyJWT, verifyPassword, hashPassword } from '@/lib/auth'

// Update user password
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

        const { currentPassword, newPassword, confirmPassword } = await request.json()

        if (!currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json(
                { error: 'All password fields are required' },
                { status: 400 }
            )
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json(
                { error: 'New passwords do not match' },
                { status: 400 }
            )
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'New password must be at least 6 characters long' },
                { status: 400 }
            )
        }

        // Get current user
        const user = await findUserByEmailInDB(payload.email)
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Verify current password
        const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password)
        if (!isCurrentPasswordValid) {
            return NextResponse.json(
                { error: 'Current password is incorrect' },
                { status: 400 }
            )
        }

        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword)

        // Update password in database
        await query(
            `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
            [hashedNewPassword, payload.userId]
        )

        return NextResponse.json({
            message: 'Password updated successfully'
        })
    } catch (error) {
        console.error('Password update error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 