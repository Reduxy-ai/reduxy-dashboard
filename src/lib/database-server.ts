import { Pool } from 'pg'
import { hashPassword, generateApiKey } from './auth'

// Server-side database connection
let pool: Pool | null = null

function getPool(): Pool {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        })

        pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err)
        })
    }
    return pool
}

export async function query(text: string, params?: any[]): Promise<any> {
    const client = await getPool().connect()
    try {
        const result = await client.query(text, params)
        return result
    } finally {
        client.release()
    }
}

// Initialize database using migration system
export async function initializeDatabase(): Promise<void> {
    try {
        // Import migrations and run them
        const { runMigrations } = await import('./migrations')
        await runMigrations()
        console.log('Database initialized successfully using migrations')
    } catch (error) {
        console.error('Error initializing database:', error)
        throw error
    }
}

// User database functions
export async function createUserInDB(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    company?: string
    plan: string
}) {
    try {
        const hashedPassword = await hashPassword(userData.password)

        // Insert user
        const userResult = await query(
            `INSERT INTO users (email, password_hash, first_name, last_name, company, plan, is_email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, company, plan, is_email_verified, created_at, updated_at`,
            [userData.email, hashedPassword, userData.firstName, userData.lastName, userData.company || null, userData.plan, false]
        )

        const user = userResult.rows[0]

        // Create default preferences
        await query(
            `INSERT INTO user_preferences (user_id, theme, email_notifications, security_alerts, weekly_reports, language)
       VALUES ($1, 'system', true, true, false, 'en')`,
            [user.id]
        )

        // Create billing info if plan is not starter
        if (userData.plan !== 'starter') {
            const periodStart = new Date()
            const periodEnd = new Date()
            periodEnd.setMonth(periodEnd.getMonth() + 1)

            await query(
                `INSERT INTO billing_info (user_id, plan, status, current_period_start, current_period_end, cancel_at_period_end)
         VALUES ($1, $2, 'active', $3, $4, false)`,
                [user.id, userData.plan, periodStart, periodEnd]
            )
        }

        return {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            plan: user.plan,
            isEmailVerified: user.is_email_verified,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            company: user.company,
            apiKeys: [],
            preferences: {
                theme: 'system',
                emailNotifications: true,
                securityAlerts: true,
                weeklyReports: false,
                language: 'en'
            }
        }
    } catch (error) {
        console.error('Error creating user:', error)
        throw error
    }
}

export async function findUserByEmailInDB(email: string) {
    try {
        const userResult = await query('SELECT * FROM users WHERE email = $1', [email])

        if (userResult.rows.length === 0) {
            return null
        }

        const user = userResult.rows[0]

        // Get preferences
        const preferencesResult = await query(
            'SELECT * FROM user_preferences WHERE user_id = $1',
            [user.id]
        )

        // Get API keys
        const apiKeysResult = await query(
            'SELECT id, name, key_prefix, last_used, created_at, is_active FROM api_keys WHERE user_id = $1 AND is_active = true',
            [user.id]
        )

        // Get billing info
        const billingResult = await query(
            'SELECT * FROM billing_info WHERE user_id = $1',
            [user.id]
        )

        const preferences = preferencesResult.rows[0] || {
            theme: 'system',
            email_notifications: true,
            security_alerts: true,
            weekly_reports: false,
            language: 'en'
        }

        const apiKeys = apiKeysResult.rows.map((key: any) => ({
            id: key.id,
            name: key.name,
            key: `${key.key_prefix}${'*'.repeat(28)}`, // Show only prefix for security
            lastUsed: key.last_used,
            createdAt: key.created_at,
            isActive: key.is_active
        }))

        const billingInfo = billingResult.rows[0] ? {
            plan: billingResult.rows[0].plan,
            status: billingResult.rows[0].status,
            currentPeriodStart: billingResult.rows[0].current_period_start,
            currentPeriodEnd: billingResult.rows[0].current_period_end,
            cancelAtPeriodEnd: billingResult.rows[0].cancel_at_period_end,
            trialEnd: billingResult.rows[0].trial_end
        } : undefined

        return {
            id: user.id,
            email: user.email,
            password: user.password_hash, // Include for auth verification
            firstName: user.first_name,
            lastName: user.last_name,
            plan: user.plan,
            isEmailVerified: user.is_email_verified,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
            company: user.company,
            apiKeys,
            preferences: {
                theme: preferences.theme,
                emailNotifications: preferences.email_notifications,
                securityAlerts: preferences.security_alerts,
                weeklyReports: preferences.weekly_reports,
                language: preferences.language
            },
            billingInfo
        }
    } catch (error) {
        console.error('Error finding user by email:', error)
        return null
    }
}

export async function createApiKeyInDB(userId: string, name: string): Promise<string | null> {
    try {
        const apiKey = generateApiKey()
        const keyHash = await hashPassword(apiKey) // Hash the key for security
        const keyPrefix = apiKey.substring(0, 8) // Store first 8 chars for display

        await query(
            `INSERT INTO api_keys (user_id, name, key_hash, key_prefix, is_active, created_at)
       VALUES ($1, $2, $3, $4, true, NOW())`,
            [userId, name, keyHash, keyPrefix]
        )

        return apiKey // Return the full key only once
    } catch (error) {
        console.error('Error creating API key:', error)
        return null
    }
}

export async function deleteApiKeyInDB(userId: string, keyId: string): Promise<boolean> {
    try {
        const result = await query(
            'UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2',
            [keyId, userId]
        )

        return result.rowCount > 0
    } catch (error) {
        console.error('Error deleting API key:', error)
        return false
    }
} 