# 🚀 QUICK START - Integration Testing
## Get Up and Running in 10 Minutes

### Last Updated
November 17, 2025

---

## ⏱️ 10-MINUTE SETUP

### Step 1: Start Backend (2 minutes)

```bash
# Navigate to backend
cd Backend/nabunturan

# Start Spring Boot server
mvn spring-boot:run

# Wait for "Started NabunturanApplication"
# Server should be running on http://localhost:8080
```

**Verify Backend**:
```bash
curl http://localhost:8080/api/blockchain/health
```

Expected response:
```json
{
  "result": "SUCCESS",
  "message": "Blockchain integration is operational...",
  "data": "OK"
}
```

---

### Step 2: Install Lace Wallet (3 minutes)

1. **Install Extension**
   - Chrome/Edge: [https://www.lace.io/](https://www.lace.io/)
   - Click "Add to Chrome/Edge"

2. **Setup Wallet**
   - Open Lace extension
   - Click "Create wallet" or "Restore wallet"
   - **IMPORTANT**: Select "Preview Testnet" or "Preprod Testnet"
   - Complete setup

3. **Get Test ADA**
   - Copy your wallet address (starts with `addr_test1`)
   - Go to: [https://docs.cardano.org/cardano-testnet/tools/faucet/](https://docs.cardano.org/cardano-testnet/tools/faucet/)
   - Paste address, request test ADA
   - Wait 2-5 minutes for confirmation

---

### Step 3: Test with Postman (5 minutes)

1. **Import Collection**
   - Open Postman
   - Click "Import" → "Raw text"
   - Paste collection from `INTEGRATION_TESTING_GUIDE.md`
   - Click "Import"

2. **Set Variables**
   - Click collection → "Variables" tab
   - Set `baseUrl` = `http://localhost:8080`
   - Set `walletAddress` = your Lace wallet address (from Step 2)
   - Click "Save"

3. **Run Tests** (in order)
   - ✅ Health Check → should return SUCCESS
   - ✅ Create Note → should return 201
   - ✅ Get Notes by Wallet → should return your note
   - ✅ Create Pending Transaction → should return transaction ID
   - ✅ Submit Transaction → should return MEMPOOL status

---

## 🧪 QUICK TEST SCENARIOS

### Scenario 1: Privacy Test (30 seconds)

**Goal**: Verify wallet filtering works

```bash
# Test with your wallet address
curl http://localhost:8080/api/notes/wallet/YOUR_WALLET_ADDRESS

# Test with different wallet address
curl http://localhost:8080/api/notes/wallet/addr_test1qvq9prvx8ufwutkwxx9cmmuuajaqmjqwujqlp9d8pvg6gupcldkz3kvxqcdxqylqjp7fzswyj9l7crr2s4x4uffqk9nsg4frrq

# Result: Should only see your notes, not the other wallet's notes
```

✅ **PASS**: Returns different notes for different wallets  
❌ **FAIL**: Returns same notes for all wallets

---

### Scenario 2: Complete Workflow (2 minutes)

**Goal**: Create note, create pending tx, submit tx

```bash
# 1. Create note
WALLET_ADDRESS="YOUR_WALLET_ADDRESS_HERE"

curl -X POST http://localhost:8080/api/notes \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Quick Test Note\",
    \"content\": \"Testing workflow\",
    \"category\": \"Test\",
    \"isPinned\": false,
    \"createdByWallet\": \"$WALLET_ADDRESS\"
  }"

# Save the returned "id" value (let's say it's 123)

# 2. Create pending transaction
curl -X POST http://localhost:8080/api/blockchain/transactions/pending \
  -H "Content-Type: application/json" \
  -d "{
    \"noteId\": 123,
    \"type\": \"CREATE\",
    \"walletAddress\": \"$WALLET_ADDRESS\",
    \"metadata\": \"{\\\"title\\\":\\\"Quick Test Note\\\"}\"
  }"

# Save the returned transaction "id" (let's say it's 456)

# 3. Submit transaction
curl -X PUT http://localhost:8080/api/blockchain/transactions/456/submit \
  -H "Content-Type: application/json" \
  -d "{
    \"txHash\": \"a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd\"
  }"

# Should return status: "MEMPOOL"
```

✅ **PASS**: All 3 requests succeed, note marked as onChain  
❌ **FAIL**: Any request fails or note not updated

---

### Scenario 3: Error Handling (1 minute)

**Goal**: Verify validation works

```bash
# Test 1: Invalid wallet address (empty)
curl http://localhost:8080/api/notes/wallet/

# Expected: 404 Not Found

# Test 2: Invalid transaction type
curl -X POST http://localhost:8080/api/blockchain/transactions/pending \
  -H "Content-Type: application/json" \
  -d "{
    \"noteId\": 1,
    \"type\": \"INVALID\",
    \"walletAddress\": \"addr_test1...\",
    \"metadata\": \"{}\"
  }"

# Expected: 400 Bad Request, "Transaction type must be CREATE, UPDATE, or DELETE"

# Test 3: Invalid txHash format (too short)
curl -X PUT http://localhost:8080/api/blockchain/transactions/1/submit \
  -H "Content-Type: application/json" \
  -d "{
    \"txHash\": \"abc123\"
  }"

# Expected: 400 Bad Request, "Invalid transaction hash format"
```

✅ **PASS**: All return appropriate error messages  
❌ **FAIL**: Returns 500 errors or unclear messages

---

## 🌐 BROWSER CONSOLE TEST

### Quick Frontend Test (1 minute)

Open browser console (F12) and run:

```javascript
// Quick integration test
(async () => {
  // Test wallet connection
  if (!window.cardano || !window.cardano.lace) {
    console.error('❌ Lace wallet not found');
    return;
  }
  
  const address = await window.cardano.lace.enable();
  console.log('✅ Wallet:', address.substring(0, 20) + '...');
  
  // Test API
  const response = await fetch(`http://localhost:8080/api/notes/wallet/${address}`);
  const data = await response.json();
  console.log('✅ Notes:', data.data.length, 'found');
  
  console.log('🎉 Integration working!');
})();
```

Expected output:
```
✅ Wallet: addr_test1qvq9prvx8...
✅ Notes: 3 found
🎉 Integration working!
```

---

## 📊 CHECKLIST - Ready for Frontend Integration?

### Backend Checklist

- [ ] Server running on http://localhost:8080
- [ ] Health endpoint returns SUCCESS
- [ ] Database connected and migrated
- [ ] All 3 critical endpoints working:
  - [ ] GET `/api/notes/wallet/{address}`
  - [ ] POST `/api/blockchain/transactions/pending`
  - [ ] PUT `/api/blockchain/transactions/{id}/submit`

### Wallet Checklist

- [ ] Lace extension installed
- [ ] Wallet created/restored
- [ ] Testnet selected (Preview or Preprod)
- [ ] Test ADA received (check balance > 2 ADA)
- [ ] Can access `window.cardano.lace` in console

### Testing Checklist

- [ ] Privacy test passed
- [ ] Complete workflow test passed
- [ ] Error handling test passed
- [ ] Browser console test passed

### Integration Checklist

- [ ] AL PRINCE: Can connect wallet ✅
- [ ] GARING: Can see wallet-filtered notes ✅
- [ ] YONG: Can create pending transactions ✅
- [ ] IVAN: Can submit transactions ✅

---

## 🚨 COMMON ISSUES & FIXES

### Issue 1: "Connection refused" when calling API

**Problem**: Backend not running

**Fix**:
```bash
cd Backend/nabunturan
mvn spring-boot:run
```

Wait for "Started NabunturanApplication" message

---

### Issue 2: "Lace wallet not found"

**Problem**: Extension not installed or not enabled

**Fix**:
1. Install from [lace.io](https://www.lace.io/)
2. Refresh browser page
3. Check console: `window.cardano.lace` should exist

---

### Issue 3: "Insufficient funds" error

**Problem**: Wallet has < 2 ADA

**Fix**:
1. Go to [Cardano Testnet Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/)
2. Request test ADA
3. Wait 2-5 minutes
4. Check balance in Lace wallet

---

### Issue 4: "Database error" in backend logs

**Problem**: MySQL not running or database not created

**Fix**:
```bash
# Start MySQL
# Windows: Start MySQL service
# Mac: brew services start mysql
# Linux: sudo systemctl start mysql

# Create database
mysql -u root -p
CREATE DATABASE notesappdb;
exit;

# Restart backend
```

---

### Issue 5: "Wrong network" error

**Problem**: Lace on mainnet instead of testnet

**Fix**:
1. Open Lace wallet
2. Click Settings → Network
3. Select "Preview Testnet" or "Preprod"
4. Reload page

---

### Issue 6: Transaction stuck in PENDING

**Problem**: Transaction created but not submitted

**This is normal!** PENDING means:
- Transaction created in backend
- Waiting for IVAN to sign with Lace
- Not yet submitted to blockchain

To fix:
- Sign transaction in Lace popup
- OR call submit endpoint with txHash

---

## 📞 TEAM COMMUNICATION

### Share These Results

After testing, share with team:

```
# Test Results Template

✅ Backend Status: Running
✅ Health Check: PASSED
✅ Database: Connected
✅ Wallet Integration: Working
✅ Privacy Filtering: Working
✅ Pending Transactions: Working
✅ Transaction Submission: Working

Ready for frontend integration! 🎉

Base URL: http://localhost:8080
Wallet Address: addr_test1qvq...
Test Notes Created: 5
Test Transactions: 3

Issues Found: None
```

---

## 🎯 NEXT STEPS

### After Quick Start

1. **Frontend Team**:
   - AL PRINCE: Implement wallet connection UI
   - GARING: Use wallet address to filter notes
   - YONG: Integrate transaction builder
   - IVAN: Integrate Lace signing

2. **Full Testing**:
   - Run complete Postman collection
   - Test all error scenarios
   - Performance testing
   - E2E workflow testing

3. **Documentation**:
   - Review `API_DOCUMENTATION_FRONTEND.md`
   - Review `FRONTEND_INTEGRATION_GUIDE.md`
   - Review `INTEGRATION_TESTING_GUIDE.md`

---

## 💡 PRO TIPS

### Tip 1: Use Postman Environment Variables

Save frequently used values:
- `baseUrl`: http://localhost:8080
- `walletAddress`: Your wallet address
- `noteId`: Last created note
- `transactionId`: Last created transaction

This makes testing faster!

---

### Tip 2: Keep Backend Logs Visible

Run backend with logs visible:
```bash
mvn spring-boot:run | grep -E "(ERROR|INFO.*blockchain|INFO.*transaction|INFO.*wallet)"
```

You'll see real-time API calls and errors.

---

### Tip 3: Use Browser DevTools Network Tab

When testing frontend integration:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter: "XHR"
4. Watch API calls in real-time
5. Check request/response bodies

---

### Tip 4: Create Test Data Script

Save this as `test-data.sh`:
```bash
#!/bin/bash
WALLET="addr_test1qvq..."

# Create 5 test notes
for i in {1..5}; do
  curl -X POST http://localhost:8080/api/notes \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Test Note $i\",\"content\":\"Content $i\",\"createdByWallet\":\"$WALLET\"}"
done

echo "Created 5 test notes!"
```

Run: `chmod +x test-data.sh && ./test-data.sh`

---

## ✅ SUCCESS CRITERIA

You're ready for full integration when:

- ✅ Backend responds to all API calls
- ✅ Wallet connects successfully
- ✅ Notes filtered by wallet address
- ✅ Pending transactions created
- ✅ Transactions submitted successfully
- ✅ No errors in backend logs
- ✅ All Postman tests pass
- ✅ Browser console test passes

---

## 🎉 YOU'RE READY!

If you've completed all steps above, you're ready for full frontend-backend integration!

### What's Working Now:

1. ✅ **Backend APIs** - All 3 critical endpoints live
2. ✅ **Wallet Integration** - Lace wallet ready
3. ✅ **Privacy** - Wallet-based filtering working
4. ✅ **Transaction Lifecycle** - PENDING → MEMPOOL → CONFIRMED
5. ✅ **Error Handling** - Validation and errors working

### Go Build Something Amazing! 🚀

---

**Document Version**: 1.0  
**Last Updated**: November 17, 2025  
**Time to Complete**: ~10 minutes  
**Difficulty**: ⭐⭐ (Easy - Moderate)  
**Status**: ✅ Ready to Use  
**Maintained By**: BRETT (Backend Developer)

