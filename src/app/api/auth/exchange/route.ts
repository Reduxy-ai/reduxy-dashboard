import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database-server'

/**
 * POST /api/auth/exchange
 * Exchange authorization code for user info (OAuth-style flow)
 * No CORS needed - called from same origin after redirect
 */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      )
    }

    // Look up the authorization code
    const codeResult = await query(
      `
      SELECT ac.*, u.id as user_id, u.email, u.first_name, u.last_name,
             bi.plan, bi.credits_remaining, bi.credits_total, bi.credits_reset_at
      FROM authorization_codes ac
      JOIN users u ON ac.user_id = u.id
      LEFT JOIN billing_info bi ON u.id = bi.user_id
      WHERE ac.code = $1 AND ac.used = false AND ac.expires_at > NOW()
      `,
      [code]
    )

    if (codeResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired authorization code' },
        { status: 401 }
      )
    }

    const authCode = codeResult.rows[0]

    // Mark code as used (one-time use only)
    await query(
      `UPDATE authorization_codes SET used = true, used_at = NOW() WHERE code = $1`,
      [code]
    )

    // Return user info
    return NextResponse.json({
      user: {
        id: authCode.user_id,
        email: authCode.email,
        firstName: authCode.first_name,
        lastName: authCode.last_name,
        plan: authCode.plan || 'free',
        credits_remaining: authCode.credits_remaining || 10,
        credits_total: authCode.credits_total || 10,
        credits_reset_at: authCode.credits_reset_at
      }
    })
  } catch (error) {
    console.error('Error exchanging authorization code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
