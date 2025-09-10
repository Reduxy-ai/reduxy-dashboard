#!/usr/bin/env ts-node

// Load environment variables
import dotenv from 'dotenv'
import path from 'path'

// Load .env.local first, then .env
dotenv.config({ path: path.join(process.cwd(), '.env.local') })
dotenv.config({ path: path.join(process.cwd(), '.env') })

import { runMigrations, rollbackLastMigration, getMigrationStatus, generateMigrationTemplate } from '../lib/migrations'

// Parse command line arguments
const command = process.argv[2]
const migrationName = process.argv[3]

async function main() {
    try {
        switch (command) {
            case 'up':
            case 'migrate':
                console.log('🚀 Running database migrations...')
                await runMigrations()
                break

            case 'down':
            case 'rollback':
                console.log('🔄 Rolling back last migration...')
                await rollbackLastMigration()
                break

            case 'status':
                console.log('📊 Checking migration status...')
                const status = await getMigrationStatus()
                console.log('\n📋 Migration Status:')
                console.log(`   Total migrations: ${status.total}`)
                console.log(`   Executed: ${status.executed.length}`)
                console.log(`   Pending: ${status.pending.length}`)

                if (status.executed.length > 0) {
                    console.log('\n✅ Executed migrations:')
                    status.executed.forEach(id => console.log(`   - ${id}`))
                }

                if (status.pending.length > 0) {
                    console.log('\n⏳ Pending migrations:')
                    status.pending.forEach(id => console.log(`   - ${id}`))
                }
                break

            case 'generate':
                if (!migrationName) {
                    console.error('❌ Migration name is required')
                    console.log('Usage: npm run migrate generate <migration_name>')
                    process.exit(1)
                }

                console.log(`📝 Generating migration template: ${migrationName}`)
                const template = generateMigrationTemplate(migrationName)
                console.log('\n📄 Add this to your migrations array in src/lib/migrations.ts:')
                console.log(template)
                break

            case 'help':
            case '--help':
            case '-h':
            default:
                console.log('🗄️ Database Migration CLI')
                console.log('')
                console.log('Usage:')
                console.log('  npm run migrate up        - Run all pending migrations')
                console.log('  npm run migrate down      - Rollback last migration')
                console.log('  npm run migrate status    - Show migration status')
                console.log('  npm run migrate generate <name> - Generate migration template')
                console.log('  npm run migrate help      - Show this help')
                console.log('')
                console.log('Examples:')
                console.log('  npm run migrate up')
                console.log('  npm run migrate status')
                console.log('  npm run migrate generate add_user_roles')
                console.log('  npm run migrate down')
                break
        }
    } catch (error) {
        console.error('💥 Migration error:', error)
        process.exit(1)
    }
}

// Run the CLI
main() 