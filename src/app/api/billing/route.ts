import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database-server'
import { verifySession } from '@/lib/auth'

/**
 * GET /api/billing
 * Get user's billing info including credits
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

    // Get billing info with credits
    const result = await query(
      `
      SELECT
        bi.plan,
        bi.status,
        bi.credits_remaining,
        bi.credits_total,
        bi.credits_reset_at,
        bi.current_period_start,
        bi.current_period_end,
        bi.cancel_at_period_end,
        bi.trial_end,
        bi.stripe_customer_id,
        bi.stripe_subscription_id
      FROM billing_info bi
      WHERE bi.user_id = $1
      `,
      [userId]
    )

    if (result.rows.length === 0) {
      // No billing info yet, return defaults
      return NextResponse.json({
        plan: 'free',
        status: 'active',
        credits_remaining: 10,
        credits_total: 10,
        credits_reset_at: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        trial_end: null
      })
    }

    const billingInfo = result.rows[0]

    return NextResponse.json({
      plan: billingInfo.plan,
      status: billingInfo.status,
      credits_remaining: billingInfo.credits_remaining,
      credits_total: billingInfo.credits_total,
      credits_reset_at: billingInfo.credits_reset_at,
      current_period_start: billingInfo.current_period_start,
      current_period_end: billingInfo.current_period_end,
      cancel_at_period_end: billingInfo.cancel_at_period_end,
      trial_end: billingInfo.trial_end,
      has_stripe: !!billingInfo.stripe_customer_id
    })
  } catch (error) {
    console.error('Error fetching billing info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
