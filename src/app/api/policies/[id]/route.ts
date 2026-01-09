import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { 
    getPolicyById, 
    updatePolicyInDB,
    deletePolicyInDB 
} from '@/lib/database-server'
import type { PolicyData } from '@/types/auth'

// GET /api/policies/[id] - Get a single policy
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')?.value

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const payload = await verifyToken(token)
        if (!payload || !payload.userId) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            )
        }

        const policy = await getPolicyById(id, payload.userId)

        if (!policy) {
            return NextResponse.json(
                { error: 'Policy not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ policy })
    } catch (error) {
        console.error('Error fetching policy:', error)
        return NextResponse.json(
            { error: 'Failed to fetch policy' },
            { status: 500 }
        )
    }
}

// PUT /api/policies/[id] - Update a policy
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')?.value

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const payload = await verifyToken(token)
        if (!payload || !payload.userId) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            )
        }

        const body = await request.json()

        // Validate name if provided
        if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
            return NextResponse.json(
                { error: 'Policy name cannot be empty' },
                { status: 400 }
            )
        }

        const updateData: Partial<PolicyData> = {}
        
        if (body.name !== undefined) updateData.name = body.name.trim()
        if (body.description !== undefined) updateData.description = body.description?.trim() || undefined
        if (body.piiSettings !== undefined) updateData.piiSettings = body.piiSettings
        if (body.documentSettings !== undefined) updateData.documentSettings = body.documentSettings
        if (body.imageSettings !== undefined) updateData.imageSettings = body.imageSettings
        if (body.textSettings !== undefined) updateData.textSettings = body.textSettings
        if (body.isDefault !== undefined) updateData.isDefault = body.isDefault

        const policy = await updatePolicyInDB(id, payload.userId, updateData)

        if (!policy) {
            return NextResponse.json(
                { error: 'Policy not found or update failed' },
                { status: 404 }
            )
        }

        return NextResponse.json({ policy })
    } catch (error) {
        console.error('Error updating policy:', error)
        return NextResponse.json(
            { error: 'Failed to update policy' },
            { status: 500 }
        )
    }
}

// DELETE /api/policies/[id] - Delete a policy
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')?.value

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const payload = await verifyToken(token)
        if (!payload || !payload.userId) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            )
        }

        // Check if it's the default policy
        const policy = await getPolicyById(id, payload.userId)
        if (!policy) {
            return NextResponse.json(
                { error: 'Policy not found' },
                { status: 404 }
            )
        }

        if (policy.isDefault) {
            return NextResponse.json(
                { error: 'Cannot delete default policy. Set another policy as default first.' },
                { status: 400 }
            )
        }

        const success = await deletePolicyInDB(id, payload.userId)

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to delete policy' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting policy:', error)
        return NextResponse.json(
            { error: 'Failed to delete policy' },
            { status: 500 }
        )
    }
}

