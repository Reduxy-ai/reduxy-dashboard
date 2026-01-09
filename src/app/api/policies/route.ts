import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'
import { 
    getPoliciesForUser, 
    createPolicyInDB,
    getDefaultPolicy 
} from '@/lib/database-server'
import type { PolicyData } from '@/types/auth'

// Helper to extract token from Authorization header
function getTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7)
    }
    return null
}

// GET /api/policies - List all policies for the current user
export async function GET(request: NextRequest) {
    try {
        const token = getTokenFromRequest(request)

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized - No token provided' },
                { status: 401 }
            )
        }

        const payload = await verifyJWT(token)
        if (!payload || !payload.userId) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            )
        }

        const policies = await getPoliciesForUser(payload.userId)

        return NextResponse.json({ policies })
    } catch (error) {
        console.error('Error fetching policies:', error)
        return NextResponse.json(
            { error: 'Failed to fetch policies' },
            { status: 500 }
        )
    }
}

// POST /api/policies - Create a new policy
export async function POST(request: NextRequest) {
    try {
        const token = getTokenFromRequest(request)

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized - No token provided' },
                { status: 401 }
            )
        }

        const payload = await verifyJWT(token)
        if (!payload || !payload.userId) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            )
        }

        const body = await request.json()
        
        // Validate required fields
        if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
            return NextResponse.json(
                { error: 'Policy name is required' },
                { status: 400 }
            )
        }

        const policyData: PolicyData = {
            name: body.name.trim(),
            description: body.description?.trim() || undefined,
            piiSettings: body.piiSettings,
            documentSettings: body.documentSettings,
            imageSettings: body.imageSettings,
            textSettings: body.textSettings,
            isDefault: body.isDefault || false,
        }

        const policy = await createPolicyInDB(payload.userId, policyData)

        if (!policy) {
            return NextResponse.json(
                { error: 'Failed to create policy' },
                { status: 500 }
            )
        }

        return NextResponse.json({ policy }, { status: 201 })
    } catch (error) {
        console.error('Error creating policy:', error)
        return NextResponse.json(
            { error: 'Failed to create policy' },
            { status: 500 }
        )
    }
}

