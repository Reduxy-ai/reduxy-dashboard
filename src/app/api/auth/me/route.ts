import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'
import { query } from '@/lib/database-server'

/**
 * GET /api/auth/me
 * Get current user info from cookie token (for SSO with website)
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('reduxy_auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify JWT
    const payload = await verifyJWT(token)
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = result.rows[0]

    return NextResponse.json({
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
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
