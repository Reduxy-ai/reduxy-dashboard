import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'
import { query } from '@/lib/database-server'

// Helper to add CORS headers
function addCorsHeaders(response: NextResponse, origin: string | null) {
  const allowedOrigins = [
    'https://www.reduxy.ai',
    'https://reduxy.ai',
    'http://localhost:3000',
    'http://localhost:3001',
  ]

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}

/**
 * OPTIONS /api/auth/me
 * Handle preflight request
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const response = new NextResponse(null, { status: 204 })

  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')

  return addCorsHeaders(response, origin)
}

/**
 * GET /api/auth/me
 * Get current user info from cookie token (for SSO with website)
 */
export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get('origin')

    // Get token from cookie
    const token = request.cookies.get('reduxy_auth_token')?.value

    if (!token) {
      const response = NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
      return addCorsHeaders(response, origin)
    }

    // Verify JWT
    const payload = await verifyJWT(token)
    if (!payload || !payload.userId) {
      const response = NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
      return addCorsHeaders(response, origin)
    }

    // Fetch user data with credits
    const result = await query(
      `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        bi.plan,
        bi.credits_remaining,
        bi.credits_total,
        bi.credits_reset_at
      FROM users u
      LEFT JOIN billing_info bi ON u.id = bi.user_id
      WHERE u.id = $1
      `,
      [payload.userId]
    )

    if (result.rows.length === 0) {
      const response = NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
      return addCorsHeaders(response, origin)
    }

    const user = result.rows[0]

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        plan: user.plan || 'free',
        credits_remaining: user.credits_remaining || 10,
        credits_total: user.credits_total || 10,
        credits_reset_at: user.credits_reset_at
      }
    })

    return addCorsHeaders(response, origin)
  } catch (error) {
    console.error('Error fetching user:', error)
    const origin = request.headers.get('origin')
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return addCorsHeaders(response, origin)
  }
}
