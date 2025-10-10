# 📄 Automatic Test Logging Feature

## ✨ What's New

Every test run now automatically saves a complete log file with all test output!

## 📁 Where Are Logs Saved?

```
test-logs/
├── test-run-2025-01-09_14-30-45.log
├── test-run-2025-01-09_15-22-10.log
└── test-run-2025-01-09_16-05-33.log
```

- **Location**: `test-logs/` directory
- **Format**: `test-run-YYYY-MM-DD_HH-MM-SS.log`
- **Automatic**: No configuration needed!

## 🎯 Why This Is Useful

### 1. **Capture Fast Output**
Tests run quickly - logs let you review details later:
```bash
# Run tests (they execute in ~8 seconds)
npm run test:routes -- --token=YOUR_TOKEN

# Review the log file afterwards
cat test-logs/test-run-2025-01-09_14-30-45.log
```

### 2. **Debug Failed Tests**
Find exactly what went wrong:
```bash
# Search for all errors
grep -n "✗\|500\|422\|401" test-logs/test-run-*.log

# View only failed tests
grep -A 3 "✗" test-logs/test-run-2025-01-09_14-30-45.log
```

### 3. **Compare Runs**
Compare successful vs failed runs:
```bash
# Compare two test runs
diff test-logs/test-run-2025-01-09_14-30-45.log \
     test-logs/test-run-2025-01-09_15-22-10.log
```

### 4. **Share with Team**
Easy to share specific test failures:
```bash
# Send log file to teammate
cat test-logs/test-run-2025-01-09_14-30-45.log | pbcopy
```

### 5. **CI/CD Integration**
Archive logs in your CI pipeline:
```yaml
- name: Run API Tests
  run: npm run test:routes -- --token=$CLERK_TOKEN

- name: Archive Test Logs
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: test-logs
    path: test-logs/
```

## 📊 What's Logged?

Every log file contains:

1. **Test Configuration**
   - Base URL
   - Token (first 20 chars)
   - Verbose mode status
   - Log file path

2. **All Test Output**
   - Test names and results
   - Status codes
   - Pass/fail indicators
   - Timing information

3. **Verbose Details** (if enabled)
   - Request method and endpoint
   - Request body
   - Response status
   - Response body
   - Request duration

4. **Summary Statistics**
   - Total tests
   - Passed/Failed counts
   - Pass rate percentage
   - Total duration

## 🔍 Useful Commands

### View Latest Log
```bash
cat test-logs/$(ls -t test-logs/*.log | head -1)
```

### View Latest Log (Pretty)
```bash
less test-logs/$(ls -t test-logs/*.log | head -1)
```

### Find All Failed Tests
```bash
grep "✗" test-logs/test-run-*.log
```

### Find All 500 Errors
```bash
grep -n "500" test-logs/test-run-*.log
```

### Count Total Test Runs
```bash
ls -1 test-logs/*.log | wc -l
```

### View Test Success Rate History
```bash
grep "Pass Rate:" test-logs/test-run-*.log
```

### Clean Old Logs (7+ days)
```bash
find test-logs/ -name "*.log" -mtime +7 -delete
```

### Clean All Logs
```bash
rm test-logs/*.log
```

## 📝 Log File Contents Example

```
════════════════════════════════════════════════════════════════════════════════
🧪 PROTECTED ROUTES TEST SUITE
════════════════════════════════════════════════════════════════════════════════

📍 Base URL: http://localhost:3000
🔑 Token: eyJhbGciOiJSUzI1NiIs...
📝 Verbose: No
📄 Log File: /path/to/test-logs/test-run-2025-01-09_14-30-45.log

────────────────────────────────────────────────────────────────────────────────

⚙️  Setting up prerequisites...
   ✓ Unique name set: testuser1234567890

👤 Testing Unique Name Routes...
📦 Testing Product Routes...
💰 Testing Wallet Routes...

════════════════════════════════════════════════════════════════════════════════
📊 TEST RESULTS SUMMARY
════════════════════════════════════════════════════════════════════════════════

Unique Name Routes:
────────────────────────────────────────────────────────────────────────────────
  ✓ Get Current Unique Name                            [200] 399ms
  ✓ Check Unique Name Availability                     [200] 427ms
  ✗ Check Invalid Unique Name                          [200] 348ms
    └─ Expected status 400 or 422, got 200
  ...

════════════════════════════════════════════════════════════════════════════════
SUMMARY
════════════════════════════════════════════════════════════════════════════════
Total Tests:    20
Passed:         13
Failed:         7
Pass Rate:      65.0%
Total Duration: 8002ms
════════════════════════════════════════════════════════════════════════════════

📄 Full test log saved to: /path/to/test-logs/test-run-2025-01-09_14-30-45.log
   You can review it with: cat /path/to/test-logs/test-run-2025-01-09_14-30-45.log
```

## 🔒 Privacy & Security

- ✅ Logs are automatically in `.gitignore`
- ✅ Tokens are truncated (only first 20 chars shown)
- ✅ Logs stored locally only
- ✅ No logs sent to external services

## 💡 Pro Tips

1. **Review After Tests**: Since tests run fast, review logs afterwards
2. **Keep Recent Logs**: Useful for debugging and comparison
3. **Search Patterns**: Use grep to find specific issues quickly
4. **Share Selectively**: Only share relevant log sections
5. **CI Archives**: Keep logs in CI for debugging failed builds

---

**All logs are created automatically on every test run. No configuration needed!** 🎉

