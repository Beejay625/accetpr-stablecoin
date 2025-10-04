# API Response Guide

This guide explains how to ensure accurate API responses for success, errors, and custom error handling.

## 📋 Standard Response Structure

### ✅ Success Response
```json
{
  "success": true,
  "message": "Authentication test successful",
  "data": {
    "userId": "user_123",
    "isAuthenticated": true,
    "user": {
      "id": "user_123",
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### ❌ Error Response
```json
{
  "success": false
  "message": "Invalid user ID format",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "validationErrors": [
        { "field": "userId", "message": "User ID must be at least 10 characters long" }
      ]
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🎯 Using ApiResponseHelper

### Success Responses
```typescript
import { ApiResponseHelper, StatusCodes } from '../utils/apiResponse";

// Basic success
ApiResponseHelper.success(res, 'User created successfully', userData);

// Success with custom status code
ApiResponseHelper.success(res, 'Data synced', syncResult, StatusCodes.CREATED);
```

### Error Responses by Type

#### 1. **Clerk/Security Errors**
```typescript
try {
  const user = await clerkClient.users.getUser(userId);
} catch (error) {
  ApiResponseHelper.clerkError(res, error);
}
// Returns: 401, 403, 404 with appropriate Clerk error codes
```

#### 2. **Validation Errors**
```typescript
// Custom validation
ApiResponseHelper.validationError(res, 'Invalid input format', [
  { field: 'email', message: 'Must be a valid email address' },
  { field: 'password', message: 'Must be at least 8 characters' }
]);
// Returns: 400 with VALIDATION_ERROR
```

#### 3. **Business Logic Errors**
```typescript
// Custom business rules
if (user.status === 'suspended') {
  ApiResponseHelper.error(res, 'Account suspended', StatusCodes.FORBIDDEN, 'ACCOUNT_SUSPENDED');
}
// Returns: 403 with ACCOUNT_SUSPENDED
```

#### 4. **Database Errors**
```typescript
try {
  await db.createUser(userData);
} catch (error) {
  ApiResponseHelper.databaseError(res, error);
}
// Returns: 500 with DATABASE_ERROR
```

#### 5. **Unexpected Errors**
```typescript
try {
  // Any business logic
} catch (error) {
  ApiResponseHelper.serverError(res, error);
  // Logs error with unique ID, returns generic 500
}
```

## 🔧 Controller Implementation

### Example Controller
```typescript
export class UserController {
  static async createUser(req: Request, res: Response) {
    try {
      // 1. Validate input
      const errors = validateInput(req.body);
      if (errors.length > 0) {
        ApiResponseHelper.validationError(res, 'Invalid input', errors);
        return;
      }

      // 2. Business logic
      const user = await UserService.create(req.body);
      
      // 3. Success response
      ApiResponseHelper.success(res, 'User created successfully', {
        userId: user.id,
        email: user.email,
        createdAt: user.createdAt,
      }, StatusCodes.CREATED);

    } catch (error: any) {
      // 4. Handle errors appropriately
      if (error.code === 'CONFLICT') {
        ApiResponseHelper.error(res, 'Email already exists', StatusCodes.CONFLICT, 'EMAIL_EXISTS');
      } else if (error.name?.includes('prisma') || error.code?.startsWith('P')) {
        ApiResponseHelper.databaseError(res, error);
      } else {
        ApiResponseHelper.serverError(res, error);
      }
    }
  }
}
```

## 📊 Error Types & Status Codes

| Error Type | Status Code | Error Code | When to Use |
|------------|-------------|------------|-------------|
| Validation | 400 | VALIDATION_ERROR | Invalid input, format errors |
| Unauthorized | 401 | UNAUTHORIZED, INVALID_TOKEN | Auth failures |
| Forbidden | 403 | FORBIDDEN, ACCESS_DENIED | No permission |
| Not Found | 404 | NOT_FOUND, USER_NOT_FOUND | Resource missing |
| Conflict | 409 | CONFLICT, EMAIL_EXISTS | Duplicate resources |
| Unprocessable | 422 | UNPROCESSABLE_ENTITY | Business rule violations |
| Rate Limited | 429 | TOO_MANY_REQUESTS | Rate limit exceeded |
| Server | 500 | INTERNAL_ERROR | Unexpected errors |
| Service | 503 | SERVICE_UNAVAILABLE | External service down |

## 🎯 Best Practices

### ✅ DO
- Always use `ApiResponseHelper` for consistent responses
- Provide meaningful error messages
- Include appropriate status codes
- Log unexpected errors (handler does this automatically)
- Use specific error codes for different error types
- Return data structure in `data` field for success

### ❌ DON'T
- Mix different response formats in the same API
- Expose internal implementation details in error messages
- Return different success response formats
- Ignore errors - always handle them appropriately
- Use generic error codes for specific business errors

## 🧪 Testing Response Format

Use this pattern in tests:

```typescript
// Test success response
const response = await request(app).get('/api/protected/test-auth');
expect(response.body).toMatchObject({
  success: true,
  message: expect.any(String),
  data: expect.any(Object),
  timestamp: expect.any(String)
});

// Test error response
expect(errorResponse.body).toMatchObject({
  success: false,
  message: expect.any(String),
  error: {
    code: expect.any(String),
    details: expect.any(Object)
  },
  timestamp: expect.any(String)
});
```

This ensures all API responses are consistent, accurate, and professional! 🚀
