# 🐛 Authentication Debug Guide

## Quick Debug Steps

### 1. Check Browser Console
Open browser dev tools and look for:
- Any console.log messages from the API calls
- Network tab errors (401, 500, etc.)
- Local storage token

### 2. Test Authentication Token
Open browser console and run:
```javascript
// Check if token exists
console.log('Token:', localStorage.getItem('reduxy_auth_token'))

// Check user state
console.log('User:', JSON.parse(localStorage.getItem('user') || 'null'))
```

### 3. Test API Manually
In browser console:
```javascript
// Test profile update
const token = localStorage.getItem('reduxy_auth_token')
fetch('/api/auth/profile', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    firstName: 'Test',
    lastName: 'User',
    company: 'Test Co'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

### 4. Test API Key Creation
```javascript
const token = localStorage.getItem('reduxy_auth_token')
fetch('/api/auth/api-keys', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Test Key'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

### 5. Check Environment Variables
On server, verify:
- JWT_SECRET is set
- DATABASE_URL is correct
- All required env vars are loaded

### 6. Common Issues
- **401 Unauthorized**: Token missing or invalid
- **500 Internal Error**: Database connection or server error
- **400 Bad Request**: Missing required fields
- **404 Not Found**: User not found in database

## Fix Steps

1. **Re-login**: Try logging out and logging in again
2. **Check Network Tab**: Look for actual error responses
3. **Verify Database**: Run `npm run migrate:status`
4. **Check Logs**: Look at server console for errors 