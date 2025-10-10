# How to Access Admin Endpoints

## Prerequisites

1. **Clerk Account**: You must have a Clerk account and be authenticated
2. **Admin Email**: Your email must be in the `ADMIN_EMAILS` environment variable

## Setup Steps

### 1. Add Your Email to Admin List

Edit your `.env` file:

```bash
ADMIN_EMAILS="your-email@example.com,another-admin@example.com"
```

**Important Notes:**
- Use the **exact email** from your Clerk account (primary email address)
- Multiple emails can be comma-separated
- Email matching is case-insensitive
- No spaces around commas recommended

### 2. Restart the Server

After modifying `.env`:

```bash
# Kill existing servers
lsof -ti:3000 | xargs kill -9

# Restart
npm run dev
# OR
npm start
```

### 3. Get Your Clerk Authentication Token

You need a valid Clerk JWT token. Here are the ways to get it:

#### Option A: From Your Frontend Application

If you have a frontend using Clerk:

```javascript
// In your React/Next.js app
import { useAuth } from '@clerk/nextjs'; // or @clerk/react

function MyComponent() {
  const { getToken } = useAuth();
  
  const fetchAdminData = async () => {
    const token = await getToken();
    console.log('Your token:', token); // Copy this!
    
    const response = await fetch('http://localhost:3000/api/v1/protected/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log(data);
  };
  
  return <button onClick={fetchAdminData}>Get Admin Data</button>;
}
```

#### Option B: From Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to "Users" section
4. Find your user and click on it
5. Copy the session token or use Clerk's API to generate one

#### Option C: Using Clerk Backend SDK

```javascript
import { clerkClient } from '@clerk/clerk-sdk-node';

// Generate a token for testing
const token = await clerkClient.sessions.getToken(sessionId, 'your-template');
```

### 4. Make API Requests

Once you have your token:

#### Using cURL

```bash
# Dashboard overview
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3000/api/v1/protected/admin/dashboard

# Revenue analytics (last 30 days)
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  "http://localhost:3000/api/v1/protected/admin/analytics/revenue?period=30d"

# User analytics
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3000/api/v1/protected/admin/analytics/users

# Product analytics (top 10)
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  "http://localhost:3000/api/v1/protected/admin/analytics/products?limit=10"

# System health
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3000/api/v1/protected/admin/analytics/system-health

# Detailed report
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  "http://localhost:3000/api/v1/protected/admin/analytics/detailed?period=30d"
```

#### Using JavaScript/Fetch

```javascript
const token = 'YOUR_TOKEN_HERE';

const response = await fetch('http://localhost:3000/api/v1/protected/admin/dashboard', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

#### Using Postman

1. Create a new request
2. Method: **GET**
3. URL: `http://localhost:3000/api/v1/protected/admin/dashboard`
4. Go to **Headers** tab
5. Add header:
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN_HERE`
6. Click **Send**

#### Using Thunder Client (VS Code)

1. Install Thunder Client extension
2. Create new request
3. Method: **GET**
4. URL: `http://localhost:3000/api/v1/protected/admin/dashboard`
5. Headers:
   - `Authorization`: `Bearer YOUR_TOKEN_HERE`
6. Send

## Available Endpoints

All endpoints are prefixed with: `http://localhost:3000/api/v1/protected/admin`

| Endpoint | Description | Query Params |
|----------|-------------|--------------|
| `/dashboard` | Overview of all metrics | `startDate`, `endDate` |
| `/analytics/revenue` | Revenue metrics | `period`, `startDate`, `endDate` |
| `/analytics/users` | User activity | `period`, `startDate`, `endDate` |
| `/analytics/products` | Product stats | `limit`, `offset`, `status` |
| `/analytics/system-health` | System health | `limit` |
| `/analytics/detailed` | Full report | All above params |

### Query Parameters

**Date Filters:**
- `period`: `today`, `7d`, `30d`, `90d`, `all`
- `startDate`: ISO 8601 date (e.g., `2025-01-01T00:00:00Z`)
- `endDate`: ISO 8601 date (e.g., `2025-01-31T23:59:59Z`)

**Pagination:**
- `limit`: Number of results (1-100, default: 10)
- `offset`: Skip N results (default: 0)

**Filters:**
- `status`: Product status (`active`, `expired`, `cancelled`)

## Response Examples

### Success Response (200)

```json
{
  "ok": true,
  "message": "Dashboard overview retrieved successfully",
  "data": {
    "revenue": {
      "total": 12543050,
      "totalInDollars": 125430.50,
      "breakdown": [...],
      "successRate": 95.2
    },
    "users": {
      "total": 1250,
      "newUsers": 87,
      "activeCreators": 234
    },
    "products": {
      "total": 567,
      "byStatus": [...]
    },
    "systemHealth": {
      "status": "healthy",
      "successRate": 95.2
    }
  },
  "requestId": "req_xxx"
}
```

### Error Responses

**401 Unauthorized** (No token or invalid token)
```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "requestId": "req_xxx"
  }
}
```

**403 Forbidden** (Authenticated but not admin)
```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access denied: Insufficient permissions",
    "requestId": "req_xxx"
  }
}
```

## Troubleshooting

### Getting 403 Forbidden

1. **Check your email in Clerk**: 
   - Go to Clerk Dashboard → Users → Your User
   - Verify the primary email address

2. **Check ADMIN_EMAILS in .env**:
   ```bash
   cat .env | grep ADMIN_EMAILS
   ```

3. **Check server logs**:
   ```bash
   tail -f server.log
   ```
   
   Look for lines like:
   ```
   [WARN] requireAdmin - Admin access denied: User is not an admin
     email: "user@example.com"
   ```

4. **Ensure exact match**: Email in ADMIN_EMAILS must match email in Clerk exactly

### Getting 401 Unauthorized

1. **Token expired**: Clerk tokens expire. Get a fresh token
2. **Token format**: Ensure you're using `Bearer YOUR_TOKEN` format
3. **No token**: Make sure Authorization header is included

### Server Not Running

```bash
# Check if server is running
lsof -i :3000

# If not running, start it
npm run dev
```

### Admin Emails Not Loading

1. Verify `.env` file exists in project root
2. Restart server after changing `.env`
3. Check for typos in email addresses
4. Ensure no extra spaces in ADMIN_EMAILS value

## Testing Script

Use the included test script:

```bash
# Set your token
export ADMIN_TOKEN="your-clerk-token-here"

# Run tests
./test-admin-endpoints.sh
```

## Security Notes

- ✅ All requests are logged with email, userId, and endpoint
- ✅ Failed admin access attempts are logged
- ✅ Tokens should be kept secure (never commit to git)
- ✅ Use HTTPS in production
- ✅ Rotate admin emails periodically
- ✅ Monitor admin access logs regularly

## Quick Start Checklist

- [ ] Add your email to `ADMIN_EMAILS` in `.env`
- [ ] Restart the server
- [ ] Get your Clerk JWT token
- [ ] Test with: `curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/v1/protected/admin/dashboard`
- [ ] If 403: Verify email matches exactly
- [ ] If 401: Get a fresh token
- [ ] Check server logs for debugging

## Production Deployment

When deploying to production:

1. Set `ADMIN_EMAILS` in your hosting platform's environment variables
2. Use HTTPS for all requests
3. Ensure Clerk is configured for production domain
4. Monitor admin access logs
5. Consider adding IP whitelisting for extra security
6. Set up alerts for failed admin access attempts

---

**Need Help?** Check the server logs at `server.log` for detailed error messages and admin access attempts.

