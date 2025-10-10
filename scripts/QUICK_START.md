# Quick Start - Test Protected Routes

## 🚀 One-Command Test

```bash
npm run test:routes -- --token=YOUR_CLERK_TOKEN
```

**✨ NEW:** All test output is automatically saved to `test-logs/` directory!

## 📋 Quick Commands

```bash
# Basic test
npm run test:routes -- --token=eyJhbGc...

# With verbose output
npm run test:routes -- --token=eyJhbGc... --verbose

# Custom API URL
npm run test:routes -- --token=eyJhbGc... --base-url=http://localhost:4000

# All options
npm run test:routes -- --token=eyJhbGc... --base-url=http://localhost:3000 --verbose
```

## 🔑 Get Your Token Fast

Open browser console on your logged-in app:

```javascript
(async () => {
  const token = await window.Clerk.session.getToken();
  console.log('Token:', token);
})();
```

Copy the token and paste it in the command!

## 📊 What Gets Tested (24 Tests)

- **Products** (10): Create, read, update, stats, validation
- **Unique Name** (6): Check, set, get, validation
- **Wallet** (8): Balance, transactions, withdrawals

## ✅ Success Looks Like

```
Total Tests:    24
Passed:         24
Failed:         0
Pass Rate:      100.0%
```

## ❌ If Tests Fail

1. **Check server is running**: `npm run dev`
2. **Check token is fresh**: Get new token
3. **Run verbose**: `npm run test:routes -- --token=TOKEN --verbose`
4. **Check base URL**: Default is `http://localhost:3000`

## 📝 See Full Guide

Check `TEST_ROUTES_GUIDE.md` for detailed documentation!

---

**Note**: Make sure your API server is running before testing! 🚀

