import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database-server'
import { verifySession } from '@/lib/auth'

/**
 * GET /api/billing/transactions
 * Get user's credit transaction history
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user session
    const session = await verifySession(request)
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.userId

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get credit transactions
    const result = await query(
      `
      SELECT
        id,
        operation_type,
        credits_used,
        credits_remaining,
        request_id,
        endpoint,
        file_size_bytes,
        processing_time_ms,
        created_at
      FROM credit_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [userId, limit, offset]
    )

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM credit_transactions WHERE user_id = $1`,
      [userId]
    )

    return NextResponse.json({
      transactions: result.rows,
      total: parseInt(countResult.rows[0]?.total || '0'),
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
