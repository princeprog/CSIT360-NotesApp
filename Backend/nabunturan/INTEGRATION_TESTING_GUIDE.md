# 🧪 INTEGRATION TESTING GUIDE
## Complete Testing Strategy for Wallet Integration

### Last Updated
November 17, 2025

---

## 📋 TABLE OF CONTENTS

1. [Testing Prerequisites](#prerequisites)
2. [Manual Testing Scenarios](#manual-testing)
3. [Postman Collection](#postman-collection)
4. [cURL Commands](#curl-commands)
5. [Frontend Integration Tests](#frontend-tests)
6. [End-to-End Workflow Tests](#e2e-tests)
7. [Error Scenario Tests](#error-tests)
8. [Performance Tests](#performance-tests)

---

## ✅ PREREQUISITES

### Backend Setup

1. **Start Backend Server**
   ```bash
   cd Backend/nabunturan
   mvn spring-boot:run
   ```

2. **Verify Backend is Running**
   ```bash
   curl http://localhost:8080/api/blockchain/health
   ```
   Expected: `{"result":"SUCCESS", ...}`

3. **Check Database Connection**
   - MySQL should be running
   - Database `notesappdb` should exist
   - Tables should be created (Flyway migrations)

### Frontend Setup

1. **Install Lace Wallet Extension**
   - Go to [https://www.lace.io/](https://www.lace.io/)
   - Install Chrome/Edge extension
   - Create or import wallet
   - **Switch to Preprod or Preview testnet**

2. **Get Testnet ADA**
   - Go to [Cardano Testnet Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/)
   - Request test ADA for your wallet address
   - Wait for confirmation (2-5 minutes)

3. **Verify Wallet Setup**
   - Open browser console
   - Type: `window.cardano.lace`
   - Should see wallet API object

---

## 🧪 MANUAL TESTING SCENARIOS

### Test Suite 1: Wallet Connection (AL PRINCE)

**Test 1.1: Connect Lace Wallet**
- **Action**: Click "Connect Lace Wallet" button
- **Expected**:
  - Lace popup appears requesting permission
  - After approval, wallet address displays
  - Address stored in localStorage
  - Other components receive wallet address

**Test 1.2: Disconnect Wallet**
- **Action**: Click "Disconnect" button
- **Expected**:
  - Wallet address clears
  - localStorage cleared
  - App shows "Connect wallet" prompt

**Test 1.3: Auto-reconnect on Page Reload**
- **Action**: Refresh page after connecting
- **Expected**:
  - Wallet automatically reconnects
  - No permission popup (already granted)
  - Address loads from localStorage

**Test 1.4: No Lace Installed**
- **Action**: Disable Lace extension, try to connect
- **Expected**:
  - Button disabled
  - Shows "Install Lace Wallet" link
  - No errors in console

---

### Test Suite 2: Notes Management (GARING)

**Test 2.1: Create Note with Wallet**
- **Prerequisites**: Wallet connected
- **API**: `POST /api/notes`
- **Request Body**:
  ```json
  {
    "title": "Test Note 1",
    "content": "This is a test note",
    "category": "Testing",
    "isPinned": false,
    "createdByWallet": "addr_test1qvq9prvx8ufwutkwxx9cmmuuajaqmjqwujqlp9d8pvg6gupcldkz3kvxqcdxqylqjp7fzswyj9l7crr2s4x4uffqk9nsg4frrq"
  }
  ```
- **Expected**:
  - Status: 201 Created
  - Response includes noteId
  - Note appears in user's list

**Test 2.2: Get Notes by Wallet**
- **Prerequisites**: At least one note created
- **API**: `GET /api/notes/wallet/{address}`
- **Replace** `{address}` with your wallet address
- **Expected**:
  - Status: 200 OK
  - Returns array of user's notes only
  - Does NOT return other users' notes
  - Each note has `createdByWallet` field

**Test 2.3: Get Notes for Different Wallet**
- **Action**: Query with different wallet address
- **Expected**:
  - Returns empty array (or that wallet's notes)
  - Does NOT return your notes

**Test 2.4: Privacy Verification**
- **Action**: 
  1. Create note with wallet A
  2. Query with wallet B
- **Expected**:
  - Wallet B does NOT see wallet A's notes
  - Privacy is maintained

---

### Test Suite 3: Pending Transactions (YONG)

**Test 3.1: Create Pending Transaction**
- **Prerequisites**: Note exists (noteId=1)
- **API**: `POST /api/blockchain/transactions/pending`
- **Request Body**:
  ```json
  {
    "noteId": 1,
    "type": "CREATE",
    "walletAddress": "addr_test1qvq...",
    "metadata": "{\"title\":\"Test Note\",\"content\":\"Content\"}"
  }
  ```
- **Expected**:
  - Status: 201 Created
  - Returns transaction with:
    - `id` (transaction ID)
    - `status`: "PENDING"
    - `txHash`: "pending_..."
    - `blockHeight`: 0
  - Transaction saved in database

**Test 3.2: Create Pending for Invalid Note**
- **Action**: Use non-existent noteId (e.g., 99999)
- **Expected**:
  - Status: 400 Bad Request
  - Error message: "Note with ID 99999 not found"

**Test 3.3: Create Pending with Invalid Type**
- **Action**: Use invalid type (e.g., "INVALID")
- **Expected**:
  - Status: 400 Bad Request
  - Error message: "Transaction type must be CREATE, UPDATE, or DELETE"

**Test 3.4: Create Multiple Pending for Same Note**
- **Action**: Create 2 pending transactions for same note
- **Expected**:
  - Both should succeed
  - Each gets unique transaction ID
  - Note can have multiple pending transactions

---

### Test Suite 4: Transaction Submission (IVAN)

**Test 4.1: Submit Transaction with Valid Hash**
- **Prerequisites**: Pending transaction exists (id=1)
- **API**: `PUT /api/blockchain/transactions/1/submit`
- **Request Body**:
  ```json
  {
    "txHash": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd"
  }
  ```
- **Expected**:
  - Status: 200 OK
  - Transaction updated:
    - `status`: "MEMPOOL"
    - `txHash`: updated to real hash
  - Note updated:
    - `onChain`: true
    - `latestTxHash`: matches transaction hash

**Test 4.2: Submit with Invalid Hash Format**
- **Action**: Use hash with wrong length (not 64 chars)
- **Request**:
  ```json
  {
    "txHash": "abc123"
  }
  ```
- **Expected**:
  - Status: 400 Bad Request
  - Error: "Invalid transaction hash format. Must be 64 hex characters."

**Test 4.3: Submit Non-Hex Characters**
- **Action**: Use hash with non-hex characters
- **Request**:
  ```json
  {
    "txHash": "gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg"
  }
  ```
- **Expected**:
  - Status: 400 Bad Request
  - Error: "Transaction hash must contain only hexadecimal characters"

**Test 4.4: Submit Already Confirmed Transaction**
- **Action**: Try to submit transaction that's already CONFIRMED
- **Expected**:
  - Status: 409 Conflict
  - Error: "Can only update transactions with PENDING status. Current status: CONFIRMED"

**Test 4.5: Submit Duplicate Transaction Hash**
- **Action**: 
  1. Submit transaction 1 with hash A
  2. Try to submit transaction 2 with same hash A
- **Expected**:
  - Second submission fails
  - Error: "Transaction hash already exists"

---

### Test Suite 5: Transaction History (GARING)

**Test 5.1: Get Transaction History for Note**
- **Prerequisites**: Note has blockchain transactions
- **API**: `GET /api/blockchain/transactions/note/1`
- **Expected**:
  - Status: 200 OK
  - Returns array of transactions
  - Ordered by blockTime (newest first)
  - Each includes: id, txHash, type, status, confirmations

**Test 5.2: Get History for Note with No Transactions**
- **Action**: Query note that was never synced to blockchain
- **Expected**:
  - Status: 200 OK
  - Returns empty array: `{"result":"SUCCESS", "data":[]}`

**Test 5.3: Get Wallet Transactions**
- **API**: `GET /api/blockchain/transactions/wallet/{address}`
- **Expected**:
  - Returns all transactions for this wallet
  - Includes transactions from all notes

---

### Test Suite 6: Transaction Status Polling (GARING)

**Test 6.1: Poll Pending Transaction**
- **Setup**: Create and submit transaction
- **Action**: Poll `/api/blockchain/transactions/{txHash}` every 10 seconds
- **Expected**:
  - Initially: `status: "MEMPOOL"`
  - After indexer runs: `status: "CONFIRMED"`
  - `confirmations` increases over time

**Test 6.2: Transaction Not Found**
- **Action**: Query non-existent transaction hash
- **Expected**:
  - Status: 404 Not Found
  - Error: "Transaction not found"

---

## 📮 POSTMAN COLLECTION

### Import Instructions

1. Open Postman
2. Click "Import"
3. Paste JSON below
4. Set variables: `baseUrl`, `walletAddress`

### Collection JSON

```json
{
  "info": {
    "name": "NotesApp - Blockchain Integration",
    "description": "Complete API collection for wallet integration testing",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health & Status",
      "item": [
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/blockchain/health",
              "host": ["{{baseUrl}}"],
              "path": ["api", "blockchain", "health"]
            }
          }
        },
        {
          "name": "Indexer Status",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/blockchain/indexer/status",
              "host": ["{{baseUrl}}"],
              "path": ["api", "blockchain", "indexer", "status"]
            }
          }
        }
      ]
    },
    {
      "name": "Notes Management",
      "item": [
        {
          "name": "Create Note",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 201) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('noteId', response.id);",
                  "    pm.environment.set('noteTitle', response.title);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"Test Note {{$timestamp}}\",\n  \"content\": \"This is a test note created via Postman\",\n  \"category\": \"Testing\",\n  \"isPinned\": false,\n  \"createdByWallet\": \"{{walletAddress}}\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/notes",
              "host": ["{{baseUrl}}"],
              "path": ["api", "notes"]
            }
          }
        },
        {
          "name": "Get Notes by Wallet",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/notes/wallet/{{walletAddress}}",
              "host": ["{{baseUrl}}"],
              "path": ["api", "notes", "wallet", "{{walletAddress}}"]
            }
          }
        },
        {
          "name": "Get On-Chain Notes by Wallet",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/notes/wallet/{{walletAddress}}/on-chain",
              "host": ["{{baseUrl}}"],
              "path": ["api", "notes", "wallet", "{{walletAddress}}", "on-chain"]
            }
          }
        }
      ]
    },
    {
      "name": "Blockchain Transactions",
      "item": [
        {
          "name": "Create Pending Transaction",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 201) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('transactionId', response.data.id);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"noteId\": {{noteId}},\n  \"type\": \"CREATE\",\n  \"walletAddress\": \"{{walletAddress}}\",\n  \"metadata\": \"{\\\"title\\\":\\\"{{noteTitle}}\\\",\\\"content\\\":\\\"Test content\\\"}\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/blockchain/transactions/pending",
              "host": ["{{baseUrl}}"],
              "path": ["api", "blockchain", "transactions", "pending"]
            }
          }
        },
        {
          "name": "Submit Transaction",
          "request": {
            "method": "PUT",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"txHash\": \"a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/blockchain/transactions/{{transactionId}}/submit",
              "host": ["{{baseUrl}}"],
              "path": ["api", "blockchain", "transactions", "{{transactionId}}", "submit"]
            }
          }
        },
        {
          "name": "Get Transaction by Hash",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/blockchain/transactions/{{txHash}}",
              "host": ["{{baseUrl}}"],
              "path": ["api", "blockchain", "transactions", "{{txHash}}"]
            }
          }
        },
        {
          "name": "Get Note Transaction History",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/blockchain/transactions/note/{{noteId}}",
              "host": ["{{baseUrl}}"],
              "path": ["api", "blockchain", "transactions", "note", "{{noteId}}"]
            }
          }
        },
        {
          "name": "Get Wallet Transactions",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/blockchain/transactions/wallet/{{walletAddress}}",
              "host": ["{{baseUrl}}"],
              "path": ["api", "blockchain", "transactions", "wallet", "{{walletAddress}}"]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:8080",
      "type": "string"
    },
    {
      "key": "walletAddress",
      "value": "addr_test1qvq9prvx8ufwutkwxx9cmmuuajaqmjqwujqlp9d8pvg6gupcldkz3kvxqcdxqylqjp7fzswyj9l7crr2s4x4uffqk9nsg4frrq",
      "type": "string"
    },
    {
      "key": "noteId",
      "value": "",
      "type": "string"
    },
    {
      "key": "transactionId",
      "value": "",
      "type": "string"
    },
    {
      "key": "txHash",
      "value": "",
      "type": "string"
    }
  ]
}
```

### Postman Test Scripts

Add these to request "Tests" tab for automated assertions:

**For Create Note**:
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Note has ID", function () {
    const response = pm.response.json();
    pm.expect(response.id).to.exist;
    pm.environment.set('noteId', response.id);
});

pm.test("Note has wallet address", function () {
    const response = pm.response.json();
    pm.expect(response.createdByWallet).to.equal(pm.environment.get('walletAddress'));
});
```

**For Create Pending Transaction**:
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Transaction is PENDING", function () {
    const response = pm.response.json();
    pm.expect(response.data.status).to.equal("PENDING");
    pm.environment.set('transactionId', response.data.id);
});
```

---

## 💻 cURL COMMANDS

### Quick Testing Commands

**1. Health Check**
```bash
curl http://localhost:8080/api/blockchain/health
```

**2. Create Note**
```bash
curl -X POST http://localhost:8080/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Note",
    "content": "Testing via cURL",
    "category": "Testing",
    "isPinned": false,
    "createdByWallet": "addr_test1qvq9prvx8ufwutkwxx9cmmuuajaqmjqwujqlp9d8pvg6gupcldkz3kvxqcdxqylqjp7fzswyj9l7crr2s4x4uffqk9nsg4frrq"
  }'
```

**3. Get Notes by Wallet**
```bash
curl http://localhost:8080/api/notes/wallet/addr_test1qvq9prvx8ufwutkwxx9cmmuuajaqmjqwujqlp9d8pvg6gupcldkz3kvxqcdxqylqjp7fzswyj9l7crr2s4x4uffqk9nsg4frrq
```

**4. Create Pending Transaction**
```bash
curl -X POST http://localhost:8080/api/blockchain/transactions/pending \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": 1,
    "type": "CREATE",
    "walletAddress": "addr_test1qvq9prvx8ufwutkwxx9cmmuuajaqmjqwujqlp9d8pvg6gupcldkz3kvxqcdxqylqjp7fzswyj9l7crr2s4x4uffqk9nsg4frrq",
    "metadata": "{\"title\":\"Test\",\"content\":\"Content\"}"
  }'
```

**5. Submit Transaction**
```bash
curl -X PUT http://localhost:8080/api/blockchain/transactions/1/submit \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd"
  }'
```

**6. Get Transaction History**
```bash
curl http://localhost:8080/api/blockchain/transactions/note/1
```

---

## 🌐 FRONTEND INTEGRATION TESTS

### Test Script for Browser Console

```javascript
// ========== COMPLETE INTEGRATION TEST ==========
// Run this in browser console after loading app

async function testCompleteWorkflow() {
  console.log('🧪 Starting Integration Test...');
  
  // Test 1: Connect Wallet (AL PRINCE)
  console.log('\n1️⃣ Testing Wallet Connection...');
  if (!window.cardano || !window.cardano.lace) {
    console.error('❌ Lace wallet not found');
    return;
  }
  
  const walletAddress = await window.cardano.lace.enable();
  console.log('✅ Wallet connected:', walletAddress.substring(0, 20) + '...');
  
  // Test 2: Create Note (GARING)
  console.log('\n2️⃣ Testing Note Creation...');
  const createResponse = await fetch('http://localhost:8080/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Integration Test Note',
      content: 'Created by integration test',
      category: 'Testing',
      isPinned: false,
      createdByWallet: walletAddress
    })
  });
  const note = await createResponse.json();
  console.log('✅ Note created:', note.id);
  
  // Test 3: Get Notes by Wallet (GARING)
  console.log('\n3️⃣ Testing Wallet Filtering...');
  const notesResponse = await fetch(
    `http://localhost:8080/api/notes/wallet/${walletAddress}`
  );
  const notesData = await notesResponse.json();
  console.log('✅ Retrieved', notesData.data.length, 'notes for wallet');
  
  // Test 4: Create Pending Transaction (YONG)
  console.log('\n4️⃣ Testing Pending Transaction...');
  const pendingResponse = await fetch(
    'http://localhost:8080/api/blockchain/transactions/pending',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        noteId: note.id,
        type: 'CREATE',
        walletAddress: walletAddress,
        metadata: JSON.stringify({
          title: note.title,
          content: note.content
        })
      })
    }
  );
  const pendingData = await pendingResponse.json();
  const transactionId = pendingData.data.id;
  console.log('✅ Pending transaction created:', transactionId);
  
  // Test 5: Mock Transaction Submission (IVAN - simulated)
  console.log('\n5️⃣ Testing Transaction Submission (simulated)...');
  const mockTxHash = 'a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd';
  const submitResponse = await fetch(
    `http://localhost:8080/api/blockchain/transactions/${transactionId}/submit`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txHash: mockTxHash })
    }
  );
  const submitData = await submitResponse.json();
  console.log('✅ Transaction submitted:', submitData.data.txHash);
  
  // Test 6: Get Transaction History (GARING)
  console.log('\n6️⃣ Testing Transaction History...');
  const historyResponse = await fetch(
    `http://localhost:8080/api/blockchain/transactions/note/${note.id}`
  );
  const historyData = await historyResponse.json();
  console.log('✅ Retrieved', historyData.data.length, 'transactions for note');
  
  console.log('\n🎉 All tests passed!');
  return {
    walletAddress,
    noteId: note.id,
    transactionId,
    txHash: mockTxHash
  };
}

// Run test
testCompleteWorkflow().then(result => {
  console.log('\n📊 Test Results:', result);
}).catch(error => {
  console.error('\n❌ Test failed:', error);
});
```

---

## 🔄 END-TO-END WORKFLOW TESTS

### E2E Test 1: Complete User Journey

**Scenario**: User connects wallet, creates note, syncs to blockchain

1. **Step 1: Connect Wallet**
   - Open app in browser
   - Click "Connect Lace Wallet"
   - Approve in Lace popup
   - ✅ Verify: Wallet address displays

2. **Step 2: Create Note**
   - Click "New Note"
   - Enter title: "E2E Test Note"
   - Enter content: "Testing complete workflow"
   - Click "Save"
   - ✅ Verify: Note appears in list

3. **Step 3: Sync to Blockchain**
   - Click "Sync to Blockchain" on note
   - Wait for transaction builder (YONG)
   - ✅ Verify: Shows "Preparing transaction..."
   - ✅ Verify: Backend creates pending transaction

4. **Step 4: Sign Transaction**
   - Lace popup appears with transaction details
   - Click "Confirm" in Lace
   - ✅ Verify: Transaction signed
   - ✅ Verify: Transaction submitted to blockchain

5. **Step 5: Update Backend**
   - Frontend calls submit endpoint with txHash
   - ✅ Verify: Backend updates transaction status to MEMPOOL
   - ✅ Verify: Note's `onChain` flag set to true

6. **Step 6: Wait for Confirmation**
   - Frontend polls transaction status
   - Wait ~30-60 seconds
   - ✅ Verify: Status changes from MEMPOOL to CONFIRMED
   - ✅ Verify: Confirmations increase

7. **Step 7: View Transaction History**
   - Click "Transaction History" on note
   - ✅ Verify: Shows CREATE transaction
   - ✅ Verify: Status is CONFIRMED
   - ✅ Verify: Link to CardanoScan works

### E2E Test 2: Multi-Note Management

**Scenario**: User creates multiple notes, syncs some, verifies filtering

1. Create 5 notes with different categories
2. Sync 3 notes to blockchain
3. Leave 2 notes local-only
4. Verify "On-Chain" filter shows only 3 notes
5. Verify "All" view shows all 5 notes
6. Disconnect and reconnect wallet
7. Verify notes still filtered correctly

---

## ❌ ERROR SCENARIO TESTS

### Error Test 1: User Rejects Transaction

1. Create note and initiate sync
2. When Lace popup appears, click "Reject"
3. ✅ Verify: Shows error "Transaction cancelled by user"
4. ✅ Verify: Transaction remains PENDING in backend
5. ✅ Verify: User can retry

### Error Test 2: Insufficient Funds

1. Use wallet with < 2 ADA
2. Try to sync note to blockchain
3. ✅ Verify: Lace shows "Insufficient funds" error
4. ✅ Verify: Frontend shows helpful error message
5. ✅ Verify: Links to testnet faucet

### Error Test 3: Network Timeout

1. Disconnect internet
2. Try to create pending transaction
3. ✅ Verify: Shows "Network error"
4. ✅ Verify: Transaction not created
5. ✅ Verify: User can retry after reconnecting

### Error Test 4: Invalid Wallet Address

1. Manually craft request with invalid address
2. ✅ Verify: Backend returns 400 Bad Request
3. ✅ Verify: Error message is clear

### Error Test 5: Concurrent Submissions

1. Create pending transaction
2. Submit with txHash A (should succeed)
3. Try to submit same transaction with txHash B
4. ✅ Verify: Second submission fails
5. ✅ Verify: Error: "Can only update PENDING transactions"

---

## ⚡ PERFORMANCE TESTS

### Performance Test 1: Wallet Filtering Speed

**Test**: Query notes for wallet with 100+ notes
- **Expected**: Response < 500ms
- **Monitor**: Database query performance
- **Check**: Indexes on `created_by_wallet` column

### Performance Test 2: Transaction History Load Time

**Test**: Get transaction history for note with 50+ transactions
- **Expected**: Response < 300ms
- **Monitor**: Join query performance
- **Check**: Indexes on foreign keys

### Performance Test 3: Concurrent Pending Creations

**Test**: Create 10 pending transactions simultaneously
- **Expected**: All succeed within 5 seconds
- **Monitor**: Database connection pool
- **Check**: No deadlocks

---

## 📊 TEST RESULTS TEMPLATE

### Test Report Format

```markdown
# Test Execution Report
Date: November 17, 2025
Tester: [Your Name]
Environment: [Dev/Staging/Prod]

## Summary
- Total Tests: 50
- Passed: 48
- Failed: 2
- Skipped: 0

## Failed Tests
1. **Test 4.5: Submit Duplicate Transaction Hash**
   - Expected: 409 Conflict
   - Actual: 500 Internal Server Error
   - Root Cause: Missing unique constraint check
   - Action: Fix database constraint

## Performance Metrics
- Avg API Response Time: 150ms
- Max API Response Time: 450ms
- Wallet Filtering (100 notes): 120ms
- Transaction History (50 tx): 80ms

## Recommendations
- Add rate limiting for pending transaction creation
- Implement caching for wallet note queries
- Add WebSocket for real-time status updates
```

---

## ✅ TESTING CHECKLIST

### Pre-Integration Checklist

- [ ] Backend server running
- [ ] Database migrations applied
- [ ] Lace wallet installed and funded
- [ ] Testnet selected (Preview/Preprod)
- [ ] Postman collection imported

### AL PRINCE Tests

- [ ] Wallet connection works
- [ ] Wallet disconnection works
- [ ] Auto-reconnect works
- [ ] Install prompt shows if no Lace
- [ ] Wallet address stored in state

### GARING Tests

- [ ] Notes filtered by wallet
- [ ] Privacy maintained (no other users' notes)
- [ ] On-chain filter works
- [ ] Transaction history modal works
- [ ] Status badges display correctly
- [ ] Polling updates status

### YONG Tests

- [ ] Transaction builder creates valid tx
- [ ] Pending transaction saved to backend
- [ ] Transaction ID returned
- [ ] Metadata formatted correctly
- [ ] CREATE/UPDATE/DELETE all work

### IVAN Tests

- [ ] Lace signing integration works
- [ ] Transaction submission to Cardano works
- [ ] Backend update with txHash works
- [ ] User rejection handled gracefully
- [ ] Network errors handled
- [ ] Insufficient funds handled

### Integration Tests

- [ ] Complete E2E workflow works
- [ ] All team components work together
- [ ] Data flows correctly between components
- [ ] Error handling works end-to-end

---

## 🎓 SUMMARY

### Testing Flow

```
1. Setup (Backend + Wallet)
2. Manual Testing (Each endpoint)
3. Postman Testing (Automated)
4. Frontend Integration
5. E2E Testing
6. Error Scenarios
7. Performance Testing
8. Report & Fix Issues
9. Retest
10. Production Readiness
```

### Key Metrics

- **Test Coverage**: Aim for 90%+
- **API Response Time**: < 500ms
- **E2E Workflow Success**: 100%
- **Error Handling**: All scenarios covered

### Next Steps After Testing

1. Document any issues found
2. Fix critical bugs
3. Optimize performance bottlenecks
4. Update documentation
5. Prepare for production deployment

---

**Document Version**: 1.0  
**Last Updated**: November 17, 2025  
**Status**: ✅ Ready for Testing  
**Maintained By**: BRETT (Backend Developer)

