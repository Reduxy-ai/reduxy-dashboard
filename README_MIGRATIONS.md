# 🗄️ Database Migrations - Quick Reference

## 📋 **Commands**
```bash
npm run migrate:status     # Check migration status
npm run migrate:up         # Run all pending migrations
npm run migrate:down       # Rollback last migration
npm run migrate:generate <name>  # Generate new migration template
```

## ✅ **Current Status**
- **Migration System**: ✅ Fully implemented
- **Database Schema**: ✅ 3 migrations applied
- **Production Ready**: ✅ Yes

## 🗂️ **Applied Migrations**
1. **001_initial_schema** - Core tables (users, api_keys, preferences, billing)
2. **002_add_usage_tracking** - Analytics and API usage tracking
3. **003_add_webhooks_support** - Webhook system for integrations

## 🚀 **Quick Start**
```bash
# Check current status
npm run migrate:status

# Apply any pending migrations
npm run migrate:up

# Your database is ready! 🎉
```

For full documentation, see [MIGRATIONS.md](./MIGRATIONS.md) 