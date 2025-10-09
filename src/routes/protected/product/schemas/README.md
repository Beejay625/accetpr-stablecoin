# Product Schema - Multipart Form Data Handling

## ⚠️ Important: Multipart Form Data Type Coercion

When using `multipart/form-data` (for file uploads), all fields are sent as **strings**.

### Problem

```typescript
// Form sends:
{
  customDays: "30"  // ← String!
}

// Zod expects:
customDays: z.number()  // ← Number!
```

### Solution: Use `z.preprocess()`

```typescript
customDays: z.preprocess(
  (val) => {
    // Convert string to number for multipart/form-data
    if (typeof val === 'string') {
      const num = parseInt(val, 10);
      return isNaN(num) ? val : num;
    }
    return val;
  },
  z.number()
    .int('Custom days must be a whole number')
    .positive('Custom days must be positive')
    .max(3650, 'Custom days must not exceed 10 years')
    .optional()
)
```

### Why This Works

1. **Preprocess** converts string → number
2. **Then** validates as number
3. **Handles** both JSON and multipart requests

### Fields Using Preprocessing

- ✅ `customDays` - Convert string to number for multipart

### Fields NOT Needing Preprocessing

- ✅ `productName` - Already a string
- ✅ `amount` - Kept as string (validated with regex)
- ✅ `payoutChain` - Already a string
- ✅ `slug` - Already a string

---

## Testing

### Multipart Form Data (with file upload)
```bash
curl -X POST http://localhost:3000/api/protected/product \
  -H "Authorization: Bearer $TOKEN" \
  -F "productName=Test Product" \
  -F "customDays=30"  # ← Sent as string, converted to number
```

### JSON (without file upload)
```bash
curl -X POST http://localhost:3000/api/protected/product \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productName":"Test", "customDays":30}'  # ← Already number
```

Both work! ✅

---

**Key Takeaway:** Use `z.preprocess()` for number fields in multipart schemas.
