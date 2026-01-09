import { NextRequest, NextResponse } from 'next/server'
import { runMigrations, getMigrationStatus } from '@/lib/migrations'

// Secret key for admin operations (set in environment)
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'reduxy-admin-secret-change-me'

export async function POST(request: NextRequest) {
    try {
        // Check admin secret
        const authHeader = request.headers.get('authorization')
        if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Run migrations
        await runMigrations()

        // Get status after migration
        const status = await getMigrationStatus()

        return NextResponse.json({
            success: true,
            message: 'Migrations completed',
            status
        })
    } catch (error) {
        console.error('Migration error:', error)
        return NextResponse.json(
            { error: 'Migration failed', details: String(error) },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        // Check admin secret
        const authHeader = request.headers.get('authorization')
        if (!authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const status = await getMigrationStatus()

        return NextResponse.json({
            success: true,
            status
        })
    } catch (error) {
        console.error('Migration status error:', error)
        return NextResponse.json(
            { error: 'Failed to get migration status', details: String(error) },
            { status: 500 }
        )
    }
}

