# 🧪 Quick Test Commands

## 🚀 Get Fresh Token & Run Tests

### Step 1: Get Token
Open browser console on your logged-in app and run:
```javascript
(async () => {
  const token = await window.Clerk.session.getToken();
  console.log('\n========== COPY THIS COMMAND ==========\n');
  console.log(`npm run test:routes -- --token=${token} --verbose\n`);
  console.log('=======================================\n');
})();
```

### Step 2: Copy and Run Immediately
The command will be printed - copy and paste it in terminal.

## 📊 Current Test Results

**Pass Rate**: 72.2% (13/18 tests)

### ✅ Passing (13 tests):
- All Unique Name tests (6/6)
- Most Product tests (5/6)
- Some Wallet tests (2/6)

### ❌ Failing (5 tests):
1. Create Product - Validation bug (gets 201 but fails check)
2. Get Wallet Balance - 500 error
3. Get Transactions (Base Sepolia) - 500 error
4. Get Transactions (Invalid Chain) - 500 error  
5. Single Withdrawal - Complete Data - 500 error

## 🔍 Debug Specific Issues

### See Create Product Response
```bash
npm run test:routes -- --token=YOUR_TOKEN --verbose 2>&1 | grep -A 30 "POST /api/v1/protected/product" | head -50
```

### See Wallet Balance Error
```bash
npm run test:routes -- --token=YOUR_TOKEN --verbose 2>&1 | grep -A 30 "GET /api/v1/protected/wallet/balance"
```

### See All 500 Errors
```bash
npm run test:routes -- --token=YOUR_TOKEN --verbose 2>&1 | grep -B 5 -A 20 "500"
```

## 📄 Review Test Logs

Latest log file:
```bash
cat test-logs/$(ls -t test-logs/*.log | head -1)
```

All logs:
```bash
ls -ltr test-logs/
```

## ⚡ Quick Run (No Verbose)
```bash
npm run test:routes -- --token=YOUR_TOKEN
```

---

**Remember: Tokens expire in ~60 seconds! Run tests immediately after getting token.** ⏱️

