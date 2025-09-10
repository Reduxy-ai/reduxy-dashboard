# 🗄️ Database Migrations Guide

## 📋 **Overview**
This project uses a custom migration system for PostgreSQL database schema management. Migrations allow you to:
- Version control your database schema
- Apply changes incrementally 
- Rollback changes safely
- Maintain consistency across environments

## 🚀 **Quick Start**

### **Check Migration Status**
```bash
npm run migrate:status
```

### **Run All Pending Migrations**
```bash
npm run migrate:up
```

### **Rollback Last Migration**
```bash
npm run migrate:down
```

## 📝 **Available Commands**

| Command | Description |
|---------|-------------|
| `npm run migrate` | Show help |
| `npm run migrate:up` | Run all pending migrations |
| `npm run migrate:down` | Rollback the last migration |
| `npm run migrate:status` | Show migration status |
| `npm run migrate:generate <name>` | Generate new migration template |

## 🏗️ **Current Migration Structure**

### **Migration 001: Initial Schema**
- ✅ Creates core tables: `users`, `api_keys`, `user_preferences`, `billing_info`
- ✅ Sets up primary keys, foreign keys, and constraints
- ✅ Creates essential indexes for performance

### **Migration 002: Usage Tracking**
- ✅ Adds `usage_tracking` table for API analytics
- ✅ Tracks endpoint usage, response times, IP addresses
- ✅ Adds usage counter to API keys

### **Migration 003: Webhooks Support**
- ✅ Adds `webhooks` and `webhook_deliveries` tables
- ✅ Supports event-driven integrations
- ✅ Includes retry logic and delivery tracking

## 📊 **Database Schema**

### **Core Tables**
```sql
-- Users and authentication
users (id, email, password_hash, first_name, last_name, company, plan, ...)
user_preferences (user_id, theme, email_notifications, ...)
api_keys (id, user_id, name, key_hash, key_prefix, is_active, ...)

-- Billing and subscriptions  
billing_info (user_id, plan, status, stripe_customer_id, ...)

-- Analytics and tracking
usage_tracking (id, user_id, api_key_id, endpoint, method, status_code, ...)

-- Webhooks and integrations
webhooks (id, user_id, name, url, secret_key, events, ...)
webhook_deliveries (id, webhook_id, event_type, payload, status, ...)
```

### **Migration Tracking**
```sql
-- System table for tracking applied migrations
schema_migrations (id, name, executed_at)
```

## ✨ **Creating New Migrations**

### **1. Generate Migration Template**
```bash
npm run migrate:generate add_user_roles
```

### **2. Edit the Migration**
Add the generated template to `src/lib/migrations.ts`:

```typescript
{
  id: '004',
  name: 'add_user_roles',
  timestamp: '2024-03-01T10:00:00Z',
  up: `
    -- Create user roles table
    CREATE TABLE user_roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(50) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create index
    CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
  `,
  down: `
    -- Drop user roles table
    DROP INDEX IF EXISTS idx_user_roles_user_id;
    DROP TABLE IF EXISTS user_roles CASCADE;
  `
}
```

### **3. Apply the Migration**
```bash
npm run migrate:up
```

## 🔄 **Migration Best Practices**

### **✅ Do's**
- **Always test migrations** on a copy of production data
- **Write rollback scripts** for every migration
- **Use transactions** for multi-step migrations
- **Add indexes** for frequently queried columns
- **Use descriptive names** for migrations
- **Version control** all migration files

### **❌ Don'ts**
- **Never modify existing migrations** that have been applied
- **Don't drop columns** without considering data loss
- **Avoid large data migrations** in schema changes
- **Don't skip rollback testing**

## 🛠️ **Development Workflow**

### **1. Local Development**
```bash
# Check current status
npm run migrate:status

# Apply any pending migrations
npm run migrate:up

# Start development
npm run dev
```

### **2. Adding Features**
```bash
# Create migration for new feature
npm run migrate:generate add_feature_name

# Edit the migration file
# Test the migration
npm run migrate:up

# Test rollback
npm run migrate:down
npm run migrate:up
```

### **3. Production Deployment**
```bash
# Check what will be applied
npm run migrate:status

# Apply migrations
npm run migrate:up

# Deploy application
npm run build
npm start
```

## 🏥 **Production Maintenance**

### **Schema Changes**
```bash
# Always backup before migrations
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Apply migrations
npm run migrate:up

# Verify changes
npm run migrate:status
```

### **Emergency Rollback**
```bash
# Rollback last migration
npm run migrate:down

# Check status
npm run migrate:status

# Restart application if needed
```

### **Data Migration**
For large data migrations, create separate scripts:
```bash
# Create data migration script
touch scripts/data_migration_001.sql

# Run manually with monitoring
psql $DATABASE_URL -f scripts/data_migration_001.sql
```

## 🔍 **Troubleshooting**

### **Migration Fails**
1. Check database connectivity
2. Verify SQL syntax
3. Check for constraint violations
4. Review database logs
5. Rollback if necessary

### **Rollback Fails**
1. Manually inspect the database
2. Fix data inconsistencies
3. Update rollback script
4. Try rollback again

### **Schema Drift**
1. Compare database with migrations
2. Generate corrective migration
3. Apply and test thoroughly

## 📋 **Monitoring**

### **Track Migration Status**
```sql
-- See all applied migrations
SELECT * FROM schema_migrations ORDER BY id;

-- Check table structure
\d+ users
\d+ api_keys
```

### **Performance Monitoring**
```sql
-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats WHERE tablename = 'users';

-- Monitor query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

## 🎯 **Future Migrations**

### **Planned Features**
- **User Roles & Permissions** (Migration 004)
- **Team Management** (Migration 005)  
- **Advanced Analytics** (Migration 006)
- **Audit Logging** (Migration 007)

### **Migration Roadmap**
1. **Phase 1**: Core functionality (✅ Complete)
2. **Phase 2**: Analytics & webhooks (✅ Complete)
3. **Phase 3**: Advanced features (🔄 Planning)
4. **Phase 4**: Enterprise features (📋 Future)

## 🚨 **Important Notes**

- **Always backup** production data before migrations
- **Test migrations** on staging environment first
- **Monitor performance** after applying migrations
- **Document** any manual data changes needed
- **Coordinate** with team for production deployments

Your database schema is now **version controlled** and **maintainable**! 🎉 