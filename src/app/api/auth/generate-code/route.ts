import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database-server'
import { verifyJWT, generateAuthorizationCode } from '@/lib/auth'

/**
 * POST /api/auth/generate-code
 * Generate authorization code for SSO redirect
 * Called after successful login on dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const { redirect_uri } = await request.json()

    if (!redirect_uri) {
      return NextResponse.json(
        { error: 'redirect_uri is required' },
        { status: 400 }
      )
    }

    // Get user from session cookie
    const token = request.cookies.get('reduxy_auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const payload = await verifyJWT(token)
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Generate authorization code
    const code = generateAuthorizationCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

    // Store in database
    await query(
      `
      INSERT INTO authorization_codes (code, user_id, redirect_uri, expires_at)
      VALUES ($1, $2, $3, $4)
      `,
      [code, payload.userId, redirect_uri, expiresAt]
    )

    // Return the code
    return NextResponse.json({ code })
  } catch (error) {
    console.error('Error generating authorization code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
