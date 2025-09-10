import { query } from './database-server'

// Migration interface
interface Migration {
    id: string
    name: string
    up: string
    down: string
    timestamp: string
}

// All database migrations
const migrations: Migration[] = [
    {
        id: '001',
        name: 'initial_schema',
        timestamp: '2024-01-01T00:00:00Z',
        up: `
      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        company VARCHAR(255),
        plan VARCHAR(50) NOT NULL DEFAULT 'starter',
        is_email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create API keys table
      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        key_hash VARCHAR(255) NOT NULL,
        key_prefix VARCHAR(20) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_used TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create user preferences table
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        theme VARCHAR(20) DEFAULT 'system',
        email_notifications BOOLEAN DEFAULT TRUE,
        security_alerts BOOLEAN DEFAULT TRUE,
        weekly_reports BOOLEAN DEFAULT FALSE,
        language VARCHAR(10) DEFAULT 'en'
      );

      -- Create billing info table
      CREATE TABLE IF NOT EXISTS billing_info (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        plan VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        current_period_start TIMESTAMP WITH TIME ZONE,
        current_period_end TIMESTAMP WITH TIME ZONE,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        trial_end TIMESTAMP WITH TIME ZONE,
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
      CREATE INDEX IF NOT EXISTS idx_billing_info_user_id ON billing_info(user_id);
      CREATE INDEX IF NOT EXISTS idx_billing_info_stripe_customer ON billing_info(stripe_customer_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = TRUE;
    `,
        down: `
      -- Drop all tables and indexes (use with caution!)
      DROP INDEX IF EXISTS idx_api_keys_active;
      DROP INDEX IF EXISTS idx_billing_info_stripe_customer;
      DROP INDEX IF EXISTS idx_billing_info_user_id;
      DROP INDEX IF EXISTS idx_api_keys_key_hash;
      DROP INDEX IF EXISTS idx_api_keys_user_id;
      DROP INDEX IF EXISTS idx_users_email;
      
      DROP TABLE IF EXISTS billing_info CASCADE;
      DROP TABLE IF EXISTS user_preferences CASCADE;
      DROP TABLE IF EXISTS api_keys CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `
    },
    {
        id: '002',
        name: 'add_usage_tracking',
        timestamp: '2024-01-15T10:00:00Z',
        up: `
      -- Create usage tracking table
      CREATE TABLE IF NOT EXISTS usage_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status_code INTEGER NOT NULL,
        request_size INTEGER DEFAULT 0,
        response_size INTEGER DEFAULT 0,
        processing_time_ms INTEGER DEFAULT 0,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for usage tracking
      CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
      CREATE INDEX IF NOT EXISTS idx_usage_tracking_api_key_id ON usage_tracking(api_key_id);
      CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON usage_tracking(created_at);
      CREATE INDEX IF NOT EXISTS idx_usage_tracking_endpoint ON usage_tracking(endpoint);

      -- Update API keys table to track last usage
      ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
    `,
        down: `
      -- Remove usage tracking
      ALTER TABLE api_keys DROP COLUMN IF EXISTS usage_count;
      
      DROP INDEX IF EXISTS idx_usage_tracking_endpoint;
      DROP INDEX IF EXISTS idx_usage_tracking_created_at;
      DROP INDEX IF EXISTS idx_usage_tracking_api_key_id;
      DROP INDEX IF EXISTS idx_usage_tracking_user_id;
      
      DROP TABLE IF EXISTS usage_tracking CASCADE;
    `
    },
    {
        id: '003',
        name: 'add_webhooks_support',
        timestamp: '2024-02-01T12:00:00Z',
        up: `
      -- Create webhooks table
      CREATE TABLE IF NOT EXISTS webhooks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(2048) NOT NULL,
        secret_key VARCHAR(255) NOT NULL,
        events TEXT[] NOT NULL DEFAULT '{}',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create webhook deliveries table for tracking
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        response_status INTEGER,
        response_body TEXT,
        attempts INTEGER DEFAULT 0,
        next_retry_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        delivered_at TIMESTAMP WITH TIME ZONE
      );

      -- Create indexes for webhooks
      CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
      CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active) WHERE is_active = TRUE;
      CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
      CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
      CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE status = 'pending';
    `,
        down: `
      -- Remove webhooks support
      DROP INDEX IF EXISTS idx_webhook_deliveries_retry;
      DROP INDEX IF EXISTS idx_webhook_deliveries_status;
      DROP INDEX IF EXISTS idx_webhook_deliveries_webhook_id;
      DROP INDEX IF EXISTS idx_webhooks_active;
      DROP INDEX IF EXISTS idx_webhooks_user_id;
      
      DROP TABLE IF EXISTS webhook_deliveries CASCADE;
      DROP TABLE IF EXISTS webhooks CASCADE;
    `
    }
]

// Create migrations tracking table
async function createMigrationsTable(): Promise<void> {
    await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(10) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
}

// Get executed migrations
async function getExecutedMigrations(): Promise<string[]> {
    try {
        const result = await query('SELECT id FROM schema_migrations ORDER BY id')
        return result.rows.map((row: any) => row.id)
    } catch (error) {
        // Table doesn't exist yet, return empty array
        return []
    }
}

// Execute a single migration
async function executeMigration(migration: Migration): Promise<void> {
    try {
        console.log(`🔄 Running migration ${migration.id}: ${migration.name}`)

        // Execute the migration SQL
        await query(migration.up)

        // Record the migration as executed
        await query(
            'INSERT INTO schema_migrations (id, name) VALUES ($1, $2)',
            [migration.id, migration.name]
        )

        console.log(`✅ Migration ${migration.id} completed successfully`)
    } catch (error) {
        console.error(`❌ Migration ${migration.id} failed:`, error)
        throw error
    }
}

// Rollback a single migration
async function rollbackMigration(migration: Migration): Promise<void> {
    try {
        console.log(`🔄 Rolling back migration ${migration.id}: ${migration.name}`)

        // Execute the rollback SQL
        await query(migration.down)

        // Remove the migration record
        await query('DELETE FROM schema_migrations WHERE id = $1', [migration.id])

        console.log(`✅ Migration ${migration.id} rolled back successfully`)
    } catch (error) {
        console.error(`❌ Rollback of migration ${migration.id} failed:`, error)
        throw error
    }
}

// Run all pending migrations
export async function runMigrations(): Promise<void> {
    try {
        console.log('🚀 Starting database migrations...')

        // Create migrations table if it doesn't exist
        await createMigrationsTable()

        // Get list of executed migrations
        const executedMigrations = await getExecutedMigrations()

        // Find pending migrations
        const pendingMigrations = migrations.filter(
            migration => !executedMigrations.includes(migration.id)
        )

        if (pendingMigrations.length === 0) {
            console.log('✅ No pending migrations found')
            return
        }

        console.log(`📋 Found ${pendingMigrations.length} pending migrations`)

        // Execute each pending migration
        for (const migration of pendingMigrations) {
            await executeMigration(migration)
        }

        console.log('🎉 All migrations completed successfully!')
    } catch (error) {
        console.error('💥 Migration failed:', error)
        throw error
    }
}

// Rollback the last migration
export async function rollbackLastMigration(): Promise<void> {
    try {
        console.log('🔄 Rolling back last migration...')

        // Get the last executed migration
        const result = await query(
            'SELECT id FROM schema_migrations ORDER BY id DESC LIMIT 1'
        )

        if (result.rows.length === 0) {
            console.log('ℹ️ No migrations to rollback')
            return
        }

        const lastMigrationId = result.rows[0].id
        const migration = migrations.find(m => m.id === lastMigrationId)

        if (!migration) {
            throw new Error(`Migration ${lastMigrationId} not found in migration files`)
        }

        await rollbackMigration(migration)
        console.log('✅ Last migration rolled back successfully!')
    } catch (error) {
        console.error('💥 Rollback failed:', error)
        throw error
    }
}

// Get migration status
export async function getMigrationStatus(): Promise<{
    executed: string[]
    pending: string[]
    total: number
}> {
    try {
        await createMigrationsTable()
        const executedMigrations = await getExecutedMigrations()
        const allMigrationIds = migrations.map(m => m.id)
        const pendingMigrations = allMigrationIds.filter(
            id => !executedMigrations.includes(id)
        )

        return {
            executed: executedMigrations,
            pending: pendingMigrations,
            total: migrations.length
        }
    } catch (error) {
        console.error('Error getting migration status:', error)
        throw error
    }
}

// Create a new migration file template
export function generateMigrationTemplate(name: string): string {
    const timestamp = new Date().toISOString()
    const id = String(migrations.length + 1).padStart(3, '0')

    return `{
  id: '${id}',
  name: '${name}',
  timestamp: '${timestamp}',
  up: \`
    -- Add your forward migration SQL here
    
  \`,
  down: \`
    -- Add your rollback migration SQL here
    
  \`
}`
}

// Export migrations for reference
export { migrations } 