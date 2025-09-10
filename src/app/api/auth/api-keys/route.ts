import { NextRequest, NextResponse } from 'next/server'
import { createApiKeyInDB, deleteApiKeyInDB } from '@/lib/database-server'
import { verifyJWT } from '@/lib/auth'

// Create new API key
export async function POST(request: NextRequest) {
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

        const { name } = await request.json()
        if (!name) {
            return NextResponse.json(
                { error: 'API key name is required' },
                { status: 400 }
            )
        }

        const apiKey = await createApiKeyInDB(payload.userId, name)
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Failed to create API key' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            apiKey,
            message: 'API key created successfully'
        })
    } catch (error) {
        console.error('API key creation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Delete API key
export async function DELETE(request: NextRequest) {
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

        const { keyId } = await request.json()
        if (!keyId) {
            return NextResponse.json(
                { error: 'API key ID is required' },
                { status: 400 }
            )
        }

        const success = await deleteApiKeyInDB(payload.userId, keyId)
        if (!success) {
            return NextResponse.json(
                { error: 'Failed to delete API key' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            message: 'API key deleted successfully'
        })
    } catch (error) {
        console.error('API key deletion error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
} 