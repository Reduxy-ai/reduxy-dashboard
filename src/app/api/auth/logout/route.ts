import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/auth/logout
 * Clear authentication cookie (for SSO with website)
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })

    // Clear the auth cookie
    response.cookies.delete('reduxy_auth_token')

    return response
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
