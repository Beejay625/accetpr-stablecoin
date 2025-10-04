# Clerk Authentication Setup Guide

This guide explains how to integrate Clerk authentication with your StableStack backend application.

## Overview

Clerk has been integrated specifically for **server-side request authentication verification**. Since Clerk SDK handles authentication on the frontend, the backend's role is simply to **verify that incoming requests are authenticated** and protect routes accordingly.

## Environment Variables Required

Add these environment variables to your `.env` file:

```bash
# Clerk Authentication (Required)
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **Important**: The `CLERK_SECRET_KEY` is mandatory for the backend to function. The `CLERK_PUBLISHABLE_KEY` is optional for backend operations.

## How to Get Clerk Keys

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. In your Clerk dashboard:
   - Go to "API Keys"
   - Copy the "Secret Key" for `CLERK_SECRET_KEY`
   - Copy the "Publishable Key" for `CLERK_PUBLISHABLE_KEY`

## API Endpoints

### Authentication Verification Routes (`/api/auth`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/verify` | GET | Verify authentication status | ✅ |
| `/api/auth/info` | GET | Get authentication information | ⚪ Public |

### Protected Example Routes (`/api/protected`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/protected/dashboard` | GET | Example protected dashboard | ✅ |
| `/api/protected/user-data` | GET | Example user-specific data | ✅ |
| `/api/protected/create-resource` | POST | Example protected POST endpoint | ✅ |
| `/api/protected/status` | GET | Check auth status (public) | ⚪ Public |

## Usage Examples

### Frontend Integration

For your frontend application, use Clerk's React/Vue.js SDKs:

```javascript
// Frontend authentication example
import { useUser, useAuth } from '@clerk/nextjs';

function MyComponent() {
  const { isAuthenticated, userId } = useAuth();
  const { user } = useUser();

  // Check authentication
  if (!isAuthenticated) {
    return <LoginButton />;
  }

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      <p>User ID: {userId}</p>
    </div>
  );
}
```

### Backend API Calls

Make authenticated requests to your backend:

```javascript
// Example API call with authentication
const response = await fetch('/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
    'Content-Type': 'application/json',
  },
});

const userData = await response.json();
```

### Protecting Routes

```javascript
// Example: Route requiring authentication
router.get('/protected-data', requireAuth, async (req, res) => {
  const { userId } = getAuth(req);
  // Your protected logic here
  res.json({ message: 'Protected data', userId });
});

// Example: Admin-only route
router.get('/admin/users', requireRole(['admin']), async (req, res) => {
  // Admin logic here
});
```

## Middleware Components

### Core Clerk Middleware

- **`clerkMiddlewareHandler`**: Applied globally to all routes
- **`getAuth(req)`**: Helper to get authentication state
- **`requireAuth`**: Middleware to protect routes
- **`requireRole(roles)`**: Middleware for role-based access control
- **`getCurrentUser`**: Middleware to fetch current user data

### Custom Middleware Examples

```typescript
// Example: Check if user is authenticated
import { getAuth } from '../middleware/clerk';

router.get('/optional-data', (req, res) => {
  const { isAuthenticated, userId } = getAuth(req);
  
  if (isAuthenticated) {
    // Return personalized data
    res.json({ personalized: true, userId });
  } else {
    // Return public data
    res.json({ personalized: false });
  }
});
```

## Security Features

1. **Automatic Session Validation**: Clerk middleware validates every request
2. **Secure Token Handling**: JWT tokens are automatically managed
3. **Role-Based Access Control**: Easy implementation of user roles
4. **Webhook Support**: Built-in webhook handling for events
5. **Production Security**: Ready for production deployment

## Development vs Production

### Development
- Use test keys (`sk_test_...`)
- Clerk provides a test environment
- Authentication tokens are prefixed with `test_`

### Production
- Use live keys (`sk_live_...`)
- Ensure environment variables are secure
- Set up webhooks for production events
- Monitor authentication logs

## Troubleshooting

### Common Issues

1. **"CLERK_SECRET_KEY is required"**
   - Make sure you've added `CLERK_SECRET_KEY` to your `.env` file
   - Verify the key is correct and active

2. **"User not authenticated"**
   - Check that the user is signed in on the frontend
   - Verify the session token is being sent correctly

3. **CORS Issues**
   - Ensure your frontend domain is allowed in Clerk settings
   - Check `CORS_ORIGIN` environment variable

### Debug Endpoints

Use these endpoints for debugging:

- `GET /api/protected/test-auth` - Check authentication status
- `GET /api/auth/session` - View session details

## Next Steps

1. Set up your Clerk account and add the environment variables
2. Integrate Clerk SDK in your frontend application
3. Test the authentication flow with the provided endpoints
4. Customize the middleware and routes as needed for your application
5. Deploy with production Clerk keys

For more information, visit the [Clerk Documentation](https://clerk.com/docs).
