# Admin Analytics API - Setup & Usage Guide

## Overview

The admin analytics API provides comprehensive read-only access to platform metrics including revenue, user activity, product performance, and system health.

## Setup

### 1. Add Admin Emails to Environment

Add admin email addresses to your `.env` file:

```bash
ADMIN_EMAILS="admin@example.com,manager@example.com,owner@example.com"
```

**Notes:**
- Multiple emails can be comma-separated
- Email matching is case-insensitive
- No database changes required
- Changes require server restart

### 2. Restart Server

```bash
npm run dev
```

### 3. Authenticate

Admin users must authenticate via Clerk. Use the same authentication flow as regular users. The system will automatically check if the authenticated user's email is in the admin list.

## API Endpoints

Base path: `/api/protected/admin`

All endpoints require:
- Valid Clerk authentication token
- User email in ADMIN_EMAILS environment variable

### Dashboard Overview

```bash
GET /api/protected/admin/dashboard
```

Returns comprehensive dashboard with all key metrics.

**Query Parameters:**
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/protected/admin/dashboard?period=30d"
```

### Revenue Analytics

```bash
GET /api/protected/admin/analytics/revenue
```

Detailed revenue metrics and breakdowns.

**Query Parameters:**
- `period`: `today`, `7d`, `30d`, `90d`, `all`
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/protected/admin/analytics/revenue?period=30d"
```

### User Analytics

```bash
GET /api/protected/admin/analytics/users
```

User activity and growth metrics.

**Query Parameters:**
- `period`: `today`, `7d`, `30d`, `90d`, `all`
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/protected/admin/analytics/users?period=7d"
```

### Product Analytics

```bash
GET /api/protected/admin/analytics/products
```

Product performance and statistics.

**Query Parameters:**
- `limit` (optional): Number of top products to return (default: 10, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by status (`active`, `expired`, `cancelled`)

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/protected/admin/analytics/products?limit=20"
```

### System Health

```bash
GET /api/protected/admin/analytics/system-health
```

System health metrics and failure analysis.

**Query Parameters:**
- `limit` (optional): Number of recent failures to return (default: 20, max: 100)

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/protected/admin/analytics/system-health?limit=10"
```

### Detailed Report

```bash
GET /api/protected/admin/analytics/detailed
```

Comprehensive analytics report with all metrics.

**Query Parameters:**
- `period`: `today`, `7d`, `30d`, `90d`, `all`
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string
- `limit` (optional): Pagination limit (default: 10, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Product status filter

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/protected/admin/analytics/detailed?period=30d&limit=20"
```

## Response Format

All endpoints return JSON with the following structure:

```json
{
  "ok": true,
  "message": "Dashboard overview retrieved successfully",
  "data": {
    // Analytics data here
  },
  "requestId": "req_xxx"
}
```

### Example Dashboard Response

```json
{
  "ok": true,
  "message": "Dashboard overview retrieved successfully",
  "data": {
    "revenue": {
      "total": 12543050,
      "totalInDollars": 125430.50,
      "breakdown": [
        {
          "status": "SUCCEEDED",
          "count": 98,
          "amount": 12000000,
          "amountInDollars": 120000
        }
      ],
      "successRate": 95.2,
      "averageTransaction": 1281.95
    },
    "users": {
      "total": 1250,
      "newUsers": 87,
      "activeCreators": 234,
      "buyers": 456,
      "growthRate": 7.3
    },
    "products": {
      "total": 567,
      "byStatus": [
        { "status": "active", "count": 489 },
        { "status": "expired", "count": 45 },
        { "status": "cancelled", "count": 33 }
      ],
      "withNoSales": 123,
      "averagePrice": 14999,
      "averagePriceInDollars": 149.99
    },
    "systemHealth": {
      "paymentIntents": {
        "total": 117,
        "byStatus": [...]
      },
      "successRate": 95.2,
      "failureRate": 4.8,
      "recentFailures": 3,
      "status": "healthy"
    }
  }
}
```

## Error Responses

### 401 Unauthorized
User is not authenticated.

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

### 403 Forbidden
User is authenticated but not an admin.

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

### 422 Validation Error
Invalid query parameters.

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [...],
    "requestId": "req_xxx"
  }
}
```

## Testing

### Run Basic Connectivity Test

```bash
./admin-test-simple.sh
```

Tests if server is running and admin routes are configured.

### Run Full Test Suite

```bash
# With admin authentication
ADMIN_TOKEN="your_clerk_token_here" ./test-admin-endpoints.sh

# With both admin and non-admin users
ADMIN_TOKEN="admin_token" NON_ADMIN_TOKEN="user_token" ./test-admin-endpoints.sh
```

## Security

- **Authentication**: All endpoints require valid Clerk authentication
- **Authorization**: Email-based whitelist from environment variables
- **Audit Logging**: All admin access is logged with email, userId, endpoint, and timestamp
- **Read-Only**: No mutation operations allowed (GET requests only)
- **Rate Limiting**: Subject to standard API rate limits

## Monitoring

Admin access logs can be found in your application logs:

```
[INFO] requireAdmin - Admin access granted
  userId: "user_xxx"
  email: "admin@example.com"
  endpoint: "/api/protected/admin/dashboard"
  method: "GET"
  ip: "127.0.0.1"
```

Failed admin access attempts are also logged:

```
[WARN] requireAdmin - Admin access denied: User is not an admin
  userId: "user_yyy"
  email: "user@example.com"
  endpoint: "/api/protected/admin/dashboard"
```

## Troubleshooting

### Admin emails not working

1. Check `.env` file has correct format:
   ```
   ADMIN_EMAILS="email1@example.com,email2@example.com"
   ```

2. Restart the server after changing `.env`

3. Verify email matches exactly (case-insensitive but no extra spaces)

### 403 Forbidden even with admin email

1. Verify user is authenticated via Clerk
2. Check user's primary email in Clerk dashboard
3. Ensure email is in ADMIN_EMAILS list
4. Check server logs for admin access attempts

### No data returned

This is normal if:
- No users have registered yet
- No products have been created
- No payments have been processed

The API will return zero values and empty arrays for missing data.

## Future Enhancements

Potential additions:
- Export functionality (CSV, PDF)
- Real-time updates via WebSockets
- Email reports (scheduled)
- More granular time-series analytics
- Custom dashboard configurations
- Performance monitoring metrics

