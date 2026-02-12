import { NextRequest, NextResponse } from 'next/server'

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
 * OPTIONS /api/auth/logout
 * Handle preflight request
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const response = new NextResponse(null, { status: 204 })

  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')

  return addCorsHeaders(response, origin)
}

/**
 * POST /api/auth/logout
 * Clear authentication cookie (for SSO with website)
 */
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get('origin')
    const response = NextResponse.json({ success: true })

    // Clear the auth cookie
    response.cookies.delete('reduxy_auth_token')

    return addCorsHeaders(response, origin)
  } catch (error) {
    console.error('Error during logout:', error)
    const origin = request.headers.get('origin')
    const response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return addCorsHeaders(response, origin)
  }
}
