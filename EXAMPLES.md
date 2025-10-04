# Clerk Authentication Examples

## How to Use Authentication in Your Routes

### 1. Protect Any Route with Authentication

Simply use the `requireAuth` middleware:

```typescript
import { Router } from 'express';
import { requireAuth, getUserId } from '../middleware/clerk';

const router = Router();

// Protected endpoint - requires authentication
router.get('/my-data', requireAuth, (req, res) => {
  const userId = getUserId(req); // Get the authenticated user ID
  
  res.json({
    message: 'This is protected data',
    userId,
    data: { /* your data here */ }
  });
});
```

### 2. Optional Authentication (Check if User is Logged In)

```typescript
import { isAuthenticated, getUserId } from '../middleware/clerk';

router.get('/optional-data', (req, res) => {
  if (isAuthenticated(req)) {
    const userId = getUserId(req);
    res.json({
      personalized: true,
      userId,
      data: { /* personalized data */ }
    });
  } else {
    res.json({
      personalized: false,
      data: { /* public data */ }
    });
  }
});
```

### 3. Frontend Request Example

Your frontend (with Clerk SDK) makes requests like this:

```javascript
// Frontend code
import { useAuth } from '@clerk/nextjs';

function MyComponent() {
  const { getToken } = useAuth();

  const fetchProtectedData = async () => {
    const token = await getToken();
    
    const response = await fetch('/api/my-protected-endpoint', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  };

  return (
    <button onClick={fetchProtectedData}>
      Get My Data
    </button>
  );
}
```

### 4. How Requests Are Validated

1. **Frontend**: User logs in via Clerk SDK
2. **Frontend**: Uses Clerk SDK to get session token
3. **Frontend**: Sends request with `Authorization: Bearer <token>` header
4. **Backend**: Clerk middleware automatically validates the token
5. **Backend**: If valid, `requireAuth` allows request through
6. **Backend**: If invalid, `requireAuth` returns 401 error

### 5. Testing Authentication

#### Test Public Endpoint:
```bash
curl http://localhost:3000/api/auth/info
# Returns: { "authenticated": false, "userId": null, "message": "You are not authenticated" }
```

#### Test Protected Endpoint (without token):
```bash
curl http://localhost:3000/api/auth/verify
# Returns: { "error": "Unauthorized", "message": "This endpoint requires authentication", "code": "AUTH_REQUIRED" }
```

#### Test Protected Endpoint (with valid token):
```bash
curl -H "Authorization: Bearer <your-clerk-token>" http://localhost:3000/api/auth/verify
# Returns: { "authenticated": true, "userId": "user_xxx", "message": "Authentication verified successfully" }
```

## Key Points

1. **Frontend handles authentication** - Clerk SDK manages login/logout
2. **Backend verifies requests** - Only validates that requests are authenticated
3. **Simple protection** - Just add `requireAuth` to any route that needs protection
4. **User ID available** - Use `getUserId(req)` to get the authenticated user's ID
5. **Clean separation** - Frontend auth logic separate from backend verification

## Environment Setup

Just add these to your `.env`:

```bash
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

That's it! Your backend is now ready to verify authenticated requests from your Clerk-enabled frontend.
