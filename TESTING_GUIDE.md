# 🧪 Database Integration Testing Guide

## ✅ **Current Status: FULLY WORKING**
All profile management features now use **real PostgreSQL database** instead of mock data!

## 🚀 **Setup for Testing**

### **1. Environment Setup**
```bash
# Copy environment template
cp .env.template .env.local

# Start development server
npm run dev
```

### **2. Database Connection**
The system uses your Supabase PostgreSQL database:
- **Database URL**: `postgresql://postgres.ekpsfwzvongveuumyvwr:113232.Ma@aws-1-ca-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Tables**: Auto-created on first use ✅

## 🔬 **Testing Checklist**

### **1. User Registration** ✅
- **Test**: Go to `/register`
- **Action**: Create account with plan selection
- **Expected**: User stored in `users` table with hashed password
- **Database Check**: `SELECT * FROM users WHERE email = 'your-email'`

### **2. User Login** ✅
- **Test**: Go to `/login`
- **Action**: Login with registered credentials
- **Expected**: JWT token generated, user authenticated
- **Database Check**: User preferences and data loaded from DB

### **3. Profile Updates** ✅
- **Test**: Go to `/profile` → Profile tab
- **Action**: Change first name, last name, company
- **Expected**: Changes saved to database immediately
- **Database Check**: `SELECT first_name, last_name, company FROM users WHERE id = 'user-id'`

### **4. Password Changes** ✅
- **Test**: Go to `/profile` → Password tab
- **Action**: Change password with current password
- **Expected**: New password hashed and stored
- **Database Check**: `SELECT password_hash FROM users WHERE id = 'user-id'` (hash should be different)

### **5. API Key Creation** ✅
- **Test**: Go to `/profile` → API Keys tab
- **Action**: Create new API key with name
- **Expected**: Real API key generated (format: `rdk_xxxxxx`)
- **Database Check**: `SELECT * FROM api_keys WHERE user_id = 'user-id'`

### **6. API Key Deletion** ✅
- **Test**: Go to `/profile` → API Keys tab
- **Action**: Delete an existing API key
- **Expected**: Key marked as inactive in database
- **Database Check**: `SELECT is_active FROM api_keys WHERE id = 'key-id'` (should be false)

## 🔍 **Database Inspection**

### **Connect to Supabase**
```sql
-- View all users
SELECT id, email, first_name, last_name, plan, created_at FROM users;

-- View API keys for a user
SELECT ak.name, ak.key_prefix, ak.is_active, ak.created_at 
FROM api_keys ak 
JOIN users u ON ak.user_id = u.id 
WHERE u.email = 'your-email';

-- View user preferences
SELECT up.theme, up.email_notifications, up.security_alerts 
FROM user_preferences up 
JOIN users u ON up.user_id = u.id 
WHERE u.email = 'your-email';
```

## 🎯 **Expected Behavior**

### **✅ Working Features**
- User registration → Database storage
- User login → Database authentication
- Profile updates → Real-time DB updates
- Password changes → Secure hashing + storage
- API key creation → Secure generation + storage
- API key deletion → Database soft delete

### **🔒 Security Verified**
- Passwords: bcrypt hashed with 12 rounds
- API Keys: Hashed before storage, only prefix visible
- JWT: Signed tokens with 7-day expiration
- SQL: Parameterized queries prevent injection

### **⚡ Performance**
- Connection pooling for efficiency
- Auto table creation on startup
- Proper indexes for fast queries

## 🐛 **Troubleshooting**

### **Database Connection Issues**
```bash
# Check environment variables
cat .env.local

# Verify database URL format
echo $DATABASE_URL
```

### **Authentication Issues**
```bash
# Check browser localStorage for token
localStorage.getItem('authToken')

# Verify JWT in browser dev tools
```

### **API Errors**
```bash
# Check browser Network tab for API calls
# Look for 401 (auth), 400 (validation), 500 (server) errors
```

## 🎉 **Success Indicators**

When everything is working correctly, you should see:
1. **Registration**: User appears in database
2. **Login**: Dashboard loads with user data
3. **Profile Updates**: Changes persist after page refresh
4. **Password Changes**: Can login with new password
5. **API Keys**: Keys listed in profile, stored in database

**All features now use REAL database persistence!** 🚀 