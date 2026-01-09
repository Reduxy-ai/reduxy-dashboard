import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'
import { bindPolicyToApiKey } from '@/lib/database-server'

export async function PUT(request: NextRequest) {
    try {
        // Get token from header
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const token = authHeader.substring(7)
        const payload = await verifyJWT(token)
        
        if (!payload || !payload.userId) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { apiKeyId, policyId } = body

        if (!apiKeyId) {
            return NextResponse.json(
                { error: 'API key ID is required' },
                { status: 400 }
            )
        }

        // bindPolicyToApiKey handles verification internally
        const success = await bindPolicyToApiKey(apiKeyId, policyId || null, payload.userId)

        if (!success) {
            return NextResponse.json(
                { error: 'API key or policy not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            message: policyId ? 'Policy bound to API key' : 'Policy removed from API key'
        })
    } catch (error) {
        console.error('Bind policy error:', error)
        return NextResponse.json(
            { error: 'Failed to bind policy' },
            { status: 500 }
        )
    }
}

