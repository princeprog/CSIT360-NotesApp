# 🚀 API DOCUMENTATION FOR FRONTEND TEAM
## Complete Backend API Reference - Wallet Integration Ready

### Last Updated
November 17, 2025

### Base URL
```
Development: http://localhost:8080
Production: TBD
```

---

## 📋 TABLE OF CONTENTS

1. [Authentication](#authentication)
2. [Notes API](#notes-api)
3. [Blockchain API](#blockchain-api)
4. [Error Handling](#error-handling)
5. [Response Format](#response-format)
6. [Integration Examples](#integration-examples)

---

## 🔐 AUTHENTICATION

**Current Status**: No authentication required (development)

**Future**: Will use Cardano wallet signature-based authentication

**Headers**:
```
Content-Type: application/json
Accept: application/json
```

---

## 📝 NOTES API

### Base Path: `/api/notes`

---

### 1️⃣ Create Note

**Endpoint**: `POST /api/notes`

**Purpose**: Create a new note with wallet address

**Team**: AL PRINCE, GARING

**Request Body**:
```json
{
  "title": "My First Note",
  "content": "This is the content of my note",
  "category": "Personal",
  "isPinned": false,
  "createdByWallet": "addr_test1qvq9prvx8ufwutkwxx9cmmuuajaqmjqwujqlp9d8pvg6gupcldkz3kvxqcdxqylqjp7fzswyj9l7crr2s4x4uffqk9nsg4frrq"
}
```

**Response** (201 Created):
```json
{
  "id": 123,
  "title": "My First Note",
  "content": "This is the content of my note",
  "category": "Personal",
  "isPinned": false,
  "createdByWallet": "addr_test1qvq...",
  "onChain": false,
  "latestTxHash": null,
  "createdAt": "2025-11-17T10:00:00",
  "updatedAt": "2025-11-17T10:00:00"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:8080/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Note",
    "content": "Note content",
    "category": "Personal",
    "isPinned": false,
    "createdByWallet": "addr_test1qvq..."
  }'
```

---

### 2️⃣ Get All Notes (Deprecated - Use Wallet Filter Instead)

**Endpoint**: `GET /api/notes`

**⚠️ Warning**: Returns ALL notes from ALL users - privacy issue!

**Recommendation**: Use `GET /api/notes/wallet/{address}` instead

---

### 3️⃣ Get Notes by Wallet ✨ **NEW**

**Endpoint**: `GET /api/notes/wallet/{address}`

**Purpose**: Get notes created by specific wallet (privacy-safe)

**Team**: GARING (primary), AL PRINCE

**Path Parameters**:
- `address` (string, required): Cardano wallet address (bech32 format)

**Response** (200 OK):
```json
{
  "result": "SUCCESS",
  "message": "Retrieved 3 notes for wallet.",
  "data": [
    {
      "id": 123,
      "title": "My First Note",
      "content": "Note content",
      "category": "Personal",
      "isPinned": false,
      "createdByWallet": "addr_test1qvq...",
      "onChain": true,
      "latestTxHash": "a1b2c3d4e5f6...",
      "createdAt": "2025-11-17T10:00:00",
      "updatedAt": "2025-11-17T11:00:00"
    },
    {
      "id": 124,
      "title": "Second Note",
      "content": "Another note",
      "category": "Work",
      "isPinned": true,
      "createdByWallet": "addr_test1qvq...",
      "onChain": false,
      "latestTxHash": null,
      "createdAt": "2025-11-17T12:00:00",
      "updatedAt": "2025-11-17T12:00:00"
    }
  ]
}
```

**Error Response** (400 Bad Request):
```json
{
  "result": "ERROR",
  "message": "Wallet address cannot be empty.",
  "data": null
}
```

**cURL Example**:
```bash
curl http://localhost:8080/api/notes/wallet/addr_test1qvq9prvx8ufwutkwxx9cmmuuajaqmjqwujqlp9d8pvg6gupcldkz3kvxqcdxqylqjp7fzswyj9l7crr2s4x4uffqk9nsg4frrq
```

**Frontend Example (React)**:
```javascript
const fetchUserNotes = async (walletAddress) => {
  try {
    const response = await fetch(
      `http://localhost:8080/api/notes/wallet/${walletAddress}`
    );
    const data = await response.json();
    
    if (data.result === 'SUCCESS') {
      return data.data; // Array of notes
    } else {
      console.error('Error:', data.message);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return [];
  }
};

// Usage with AL PRINCE's wallet connection
const walletAddress = useWalletAddress(); // From AL PRINCE's hook
const notes = await fetchUserNotes(walletAddress);
```

---

### 4️⃣ Get On-Chain Notes by Wallet ✨ **NEW**

**Endpoint**: `GET /api/notes/wallet/{address}/on-chain`

**Purpose**: Get only blockchain-verified notes for a wallet

**Team**: GARING

**Path Parameters**:
- `address` (string, required): Cardano wallet address

**Response** (200 OK):
```json
{
  "result": "SUCCESS",
  "message": "Retrieved 1 on-chain notes for wallet.",
  "data": [
    {
      "id": 123,
      "title": "Blockchain Note",
      "content": "This note is on the blockchain",
      "onChain": true,
      "latestTxHash": "a1b2c3d4e5f6...",
      "createdByWallet": "addr_test1qvq...",
      "createdAt": "2025-11-17T10:00:00",
      "updatedAt": "2025-11-17T11:00:00"
    }
  ]
}
```

**cURL Example**:
```bash
curl http://localhost:8080/api/notes/wallet/addr_test1qvq.../on-chain
```

---

### 5️⃣ Get Note by ID

**Endpoint**: `GET /api/notes/{id}`

**Path Parameters**:
- `id` (number, required): Note ID

**Response** (200 OK): Returns full note object

**Response** (404 Not Found): Note not found

---

### 6️⃣ Update Note

**Endpoint**: `PUT /api/notes/{id}`

**Request Body**: Same as Create Note

**Response** (200 OK): Updated note object

---

### 7️⃣ Delete Note

**Endpoint**: `DELETE /api/notes/{id}`

**Response** (200 OK):
```json
"Note deleted successfully"
```

---

### 8️⃣ Search Notes

**Endpoint**: `GET /api/notes/search?keyword={keyword}`

**Query Parameters**:
- `keyword` (string, required): Search term

**Response** (200 OK): Array of matching notes

---

### 9️⃣ Toggle Pin Status

**Endpoint**: `PATCH /api/notes/{id}/toggle-pin`

**Response** (200 OK): Updated note with toggled `isPinned` value

---

## ⛓️ BLOCKCHAIN API

### Base Path: `/api/blockchain`

---

### 1️⃣ Create Pending Transaction ✨ **NEW**

**Endpoint**: `POST /api/blockchain/transactions/pending`

**Purpose**: Save transaction before blockchain submission

**Team**: YONG (primary), IVAN

**Request Body**:
```json
{
  "noteId": 123,
  "type": "CREATE",
  "walletAddress": "addr_test1qvq9prvx8ufwutkwxx9cmmuuajaqmjqwujqlp9d8pvg6gupcldkz3kvxqcdxqylqjp7fzswyj9l7crr2s4x4uffqk9nsg4frrq",
  "metadata": "{\"title\":\"My Note\",\"content\":\"Note content\",\"category\":\"Personal\"}"
}
```

**Field Descriptions**:
- `noteId` (number, required): ID of the note to sync
- `type` (string, required): Transaction type - "CREATE", "UPDATE", or "DELETE"
- `walletAddress` (string, required): Cardano wallet address
- `metadata` (string, optional): JSON string of note metadata

**Response** (201 Created):
```json
{
  "result": "SUCCESS",
  "message": "Pending transaction created successfully. Transaction ID: 456",
  "data": {
    "id": 456,
    "txHash": "pending_1731826800000",
    "blockHeight": 0,
    "blockTime": "2025-11-17T14:00:00",
    "type": "CREATE",
    "status": "PENDING",
    "walletAddress": "addr_test1qvq...",
    "metadata": "{\"title\":\"My Note\",\"content\":\"Note content\"}",
    "noteId": 123,
    "confirmations": 0
  }
}
```

**Error Responses**:

400 Bad Request (Invalid noteId):
```json
{
  "result": "ERROR",
  "message": "Invalid request: Note with ID 999 not found",
  "data": null
}
```

400 Bad Request (Invalid type):
```json
{
  "result": "ERROR",
  "message": "Invalid request: Transaction type must be CREATE, UPDATE, or DELETE",
  "data": null
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:8080/api/blockchain/transactions/pending \
  -H "Content-Type: application/json" \
  -d '{
    "noteId": 123,
    "type": "CREATE",
    "walletAddress": "addr_test1qvq...",
    "metadata": "{\"title\":\"Test Note\",\"content\":\"Testing\"}"
  }'
```

**Frontend Example (YONG)**:
```javascript
const createPendingTransaction = async (note, walletAddress, unsignedTx) => {
  try {
    const response = await fetch(
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
            content: note.content,
            category: note.category
          })
        })
      }
    );
    
    const data = await response.json();
    
    if (data.result === 'SUCCESS') {
      const transactionId = data.data.id;
      console.log('Pending transaction created:', transactionId);
      return transactionId; // Pass to IVAN for signing
    } else {
      console.error('Error:', data.message);
      return null;
    }
  } catch (error) {
    console.error('Failed to create pending transaction:', error);
    return null;
  }
};
```

---

### 2️⃣ Submit Transaction ✨ **NEW**

**Endpoint**: `PUT /api/blockchain/transactions/{id}/submit`

**Purpose**: Update transaction with blockchain hash after submission

**Team**: IVAN (primary)

**Path Parameters**:
- `id` (number, required): Transaction ID (from create pending transaction)

**Request Body**:
```json
{
  "txHash": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd"
}
```

**Field Descriptions**:
- `txHash` (string, required): Cardano transaction hash (64 hexadecimal characters)

**Response** (200 OK):
```json
{
  "result": "SUCCESS",
  "message": "Transaction submitted successfully. TxHash: a1b2c3d4e5f6...",
  "data": {
    "id": 456,
    "txHash": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd",
    "blockHeight": 0,
    "blockTime": "2025-11-17T14:01:00",
    "type": "CREATE",
    "status": "MEMPOOL",
    "walletAddress": "addr_test1qvq...",
    "metadata": "{\"title\":\"My Note\"}",
    "noteId": 123,
    "confirmations": 0
  }
}
```

**Error Responses**:

400 Bad Request (Invalid txHash format):
```json
{
  "result": "ERROR",
  "message": "Invalid request: Invalid transaction hash format. Must be 64 hex characters. Got: 32",
  "data": null
}
```

409 Conflict (Transaction not in PENDING status):
```json
{
  "result": "ERROR",
  "message": "Can only update transactions with PENDING status. Current status: CONFIRMED",
  "data": null
}
```

**cURL Example**:
```bash
curl -X PUT http://localhost:8080/api/blockchain/transactions/456/submit \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd"
  }'
```

**Frontend Example (IVAN)**:
```javascript
const signAndSubmitTransaction = async (transactionId, unsignedTx) => {
  try {
    // Step 1: Sign with Lace wallet
    const signedTx = await window.cardano.lace.signTx(unsignedTx, true);
    
    // Step 2: Submit to Cardano blockchain
    const txHash = await window.cardano.lace.submitTx(signedTx);
    
    console.log('Transaction submitted to blockchain:', txHash);
    
    // Step 3: Update backend with txHash
    const response = await fetch(
      `http://localhost:8080/api/blockchain/transactions/${transactionId}/submit`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash })
      }
    );
    
    const data = await response.json();
    
    if (data.result === 'SUCCESS') {
      console.log('Backend updated successfully');
      return {
        success: true,
        txHash: txHash,
        transaction: data.data
      };
    } else {
      console.error('Failed to update backend:', data.message);
      return { success: false, error: data.message };
    }
    
  } catch (error) {
    if (error.code === 4) {
      console.log('User rejected transaction');
      return { success: false, error: 'USER_REJECTED' };
    } else {
      console.error('Error signing/submitting transaction:', error);
      return { success: false, error: error.message };
    }
  }
};
```

---

### 3️⃣ Get Transaction by Hash

**Endpoint**: `GET /api/blockchain/transactions/{txHash}`

**Purpose**: Get transaction details by blockchain hash

**Team**: BRETT (indexer), GARING (display)

**Response** (200 OK):
```json
{
  "result": "SUCCESS",
  "message": "Transaction retrieved successfully.",
  "data": {
    "id": 456,
    "txHash": "a1b2c3d4e5f6...",
    "blockHeight": 12345,
    "blockTime": "2025-11-17T14:01:00",
    "type": "CREATE",
    "status": "CONFIRMED",
    "walletAddress": "addr_test1qvq...",
    "noteId": 123,
    "confirmations": 100
  }
}
```

---

### 4️⃣ Get Wallet Transactions

**Endpoint**: `GET /api/blockchain/transactions/wallet/{address}`

**Purpose**: Get all blockchain transactions for a wallet

**Team**: GARING (history display)

**Response** (200 OK): Array of transactions

---

### 5️⃣ Get Note Transaction History

**Endpoint**: `GET /api/blockchain/transactions/note/{noteId}`

**Purpose**: Get blockchain history for a specific note

**Team**: GARING (transaction history modal)

**Response** (200 OK):
```json
{
  "result": "SUCCESS",
  "message": "Transactions retrieved successfully.",
  "data": [
    {
      "id": 456,
      "txHash": "a1b2c3d4e5f6...",
      "type": "CREATE",
      "status": "CONFIRMED",
      "blockTime": "2025-11-17T14:01:00",
      "confirmations": 100
    },
    {
      "id": 457,
      "txHash": "f6e5d4c3b2a1...",
      "type": "UPDATE",
      "status": "CONFIRMED",
      "blockTime": "2025-11-17T15:00:00",
      "confirmations": 50
    }
  ]
}
```

**Frontend Example (GARING)**:
```javascript
const showTransactionHistory = async (noteId) => {
  try {
    const response = await fetch(
      `http://localhost:8080/api/blockchain/transactions/note/${noteId}`
    );
    const data = await response.json();
    
    if (data.result === 'SUCCESS') {
      return data.data.map(tx => ({
        hash: tx.txHash,
        type: tx.type,
        status: tx.status,
        time: new Date(tx.blockTime),
        confirmations: tx.confirmations,
        explorerUrl: `https://preview.cardanoscan.io/transaction/${tx.txHash}`
      }));
    }
  } catch (error) {
    console.error('Failed to fetch transaction history:', error);
    return [];
  }
};
```

---

### 6️⃣ Get Pending Transactions

**Endpoint**: `GET /api/blockchain/transactions/pending`

**Purpose**: Get all transactions awaiting confirmation

**Team**: GARING (display pending status)

**Response** (200 OK): Array of pending transactions

---

### 7️⃣ Check Transaction Exists

**Endpoint**: `GET /api/blockchain/transactions/{txHash}/exists`

**Purpose**: Quickly check if transaction is indexed

**Response** (200 OK):
```json
{
  "result": "SUCCESS",
  "message": "Transaction existence check completed.",
  "data": true
}
```

---

### 8️⃣ Get Indexer Status

**Endpoint**: `GET /api/blockchain/indexer/status`

**Purpose**: Check blockchain indexer health

**Team**: BRETT (monitoring)

**Response** (200 OK):
```json
{
  "result": "SUCCESS",
  "message": "Indexer status retrieved successfully.",
  "data": {
    "running": true,
    "lastIndexedBlock": 12345,
    "latestBlockchainBlock": 12350,
    "transactionsIndexed": 42,
    "lastRunTime": "2025-11-17T14:05:00",
    "network": "preview",
    "statusMessage": "Indexer operational"
  }
}
```

---

### 9️⃣ Blockchain Health Check

**Endpoint**: `GET /api/blockchain/health`

**Purpose**: Quick health check for monitoring

**Response** (200 OK):
```json
{
  "result": "SUCCESS",
  "message": "Blockchain integration is operational. Indexer is running. Network: preview. Latest block: 12345",
  "data": "OK"
}
```

---

## ❌ ERROR HANDLING

### Standard Error Response Format

All errors follow this structure:
```json
{
  "result": "ERROR",
  "message": "Description of what went wrong",
  "data": null
}
```

### HTTP Status Codes

| Status Code | Meaning | When Used |
|-------------|---------|-----------|
| 200 OK | Success | Successful GET, PUT, PATCH, DELETE |
| 201 Created | Resource Created | Successful POST (create) |
| 400 Bad Request | Invalid Input | Validation errors, malformed requests |
| 404 Not Found | Resource Not Found | Note or transaction doesn't exist |
| 409 Conflict | State Conflict | Transaction in wrong state for operation |
| 500 Internal Server Error | Server Error | Unexpected backend errors |
| 503 Service Unavailable | Service Down | Blockchain API unavailable |

### Common Error Scenarios

**Invalid Wallet Address**:
```json
{
  "result": "ERROR",
  "message": "Wallet address cannot be empty.",
  "data": null
}
```

**Note Not Found**:
```json
{
  "result": "ERROR",
  "message": "Note with ID 999 not found.",
  "data": null
}
```

**Transaction Not Found**:
```json
{
  "result": "ERROR",
  "message": "Transaction with ID 999 not found",
  "data": null
}
```

**Invalid Transaction State**:
```json
{
  "result": "ERROR",
  "message": "Can only update transactions with PENDING status. Current status: CONFIRMED",
  "data": null
}
```

**Blockfrost API Error**:
```json
{
  "result": "ERROR",
  "message": "Blockchain API error: Blockfrost API rate limit exceeded. Please try again later.",
  "data": null
}
```

### Frontend Error Handling Pattern

```javascript
const handleApiCall = async (apiFunction) => {
  try {
    const response = await apiFunction();
    const data = await response.json();
    
    if (data.result === 'SUCCESS') {
      return { success: true, data: data.data };
    } else {
      return { success: false, error: data.message };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Usage
const result = await handleApiCall(() => 
  fetch('http://localhost:8080/api/notes/wallet/addr_test1...')
);

if (result.success) {
  console.log('Data:', result.data);
} else {
  console.error('Error:', result.error);
  // Show error to user
}
```

---

## 📤 RESPONSE FORMAT

### Success Response Structure

```json
{
  "result": "SUCCESS",
  "message": "Human-readable success message",
  "data": {
    // Actual response data (object, array, or primitive)
  }
}
```

### Error Response Structure

```json
{
  "result": "ERROR",
  "message": "Human-readable error message",
  "data": null
}
```

### Response Fields

- `result` (string): Always "SUCCESS" or "ERROR"
- `message` (string): Human-readable description
- `data` (any): Response payload (null for errors)

---

## 🔗 INTEGRATION EXAMPLES

### Complete User Flow

```javascript
// ========== STEP 1: AL PRINCE - Connect Wallet ==========
const connectWallet = async () => {
  try {
    const address = await window.cardano.lace.enable();
    setWalletAddress(address);
    return address;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    return null;
  }
};

// ========== STEP 2: GARING - Load User's Notes ==========
const loadUserNotes = async (walletAddress) => {
  const response = await fetch(
    `http://localhost:8080/api/notes/wallet/${walletAddress}`
  );
  const data = await response.json();
  
  if (data.result === 'SUCCESS') {
    setNotes(data.data);
  }
};

// ========== STEP 3: User Creates Note ==========
const createNote = async (title, content, category, walletAddress) => {
  const response = await fetch('http://localhost:8080/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      content,
      category,
      isPinned: false,
      createdByWallet: walletAddress
    })
  });
  
  return await response.json();
};

// ========== STEP 4: User Syncs to Blockchain ==========
const syncToBlockchain = async (noteId, walletAddress) => {
  // YONG: Build transaction
  const unsignedTx = await buildCardanoTransaction({
    noteId,
    action: 'CREATE',
    walletAddress
  });
  
  // YONG: Save pending transaction
  const pendingResponse = await fetch(
    'http://localhost:8080/api/blockchain/transactions/pending',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        noteId,
        type: 'CREATE',
        walletAddress,
        metadata: JSON.stringify({ title: note.title, content: note.content })
      })
    }
  );
  
  const pendingData = await pendingResponse.json();
  const transactionId = pendingData.data.id;
  
  // IVAN: Sign and submit
  try {
    const signedTx = await window.cardano.lace.signTx(unsignedTx, true);
    const txHash = await window.cardano.lace.submitTx(signedTx);
    
    // IVAN: Update backend
    await fetch(
      `http://localhost:8080/api/blockchain/transactions/${transactionId}/submit`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash })
      }
    );
    
    // GARING: Show success
    showNotification('Transaction submitted! Waiting for confirmation...');
    return { success: true, txHash };
    
  } catch (error) {
    if (error.code === 4) {
      showNotification('Transaction cancelled');
    } else {
      showNotification('Transaction failed: ' + error.message);
    }
    return { success: false };
  }
};

// ========== STEP 5: GARING - Poll for Confirmation ==========
const pollTransactionStatus = async (transactionId) => {
  const interval = setInterval(async () => {
    const response = await fetch(
      `http://localhost:8080/api/blockchain/transactions/${transactionId}`
    );
    const data = await response.json();
    
    if (data.data.status === 'CONFIRMED') {
      clearInterval(interval);
      showNotification('✓ Transaction confirmed on blockchain!');
      loadUserNotes(walletAddress); // Refresh notes
    }
  }, 10000); // Poll every 10 seconds
};
```

---

## 🧪 TESTING ENDPOINTS

### Using cURL

```bash
# Test 1: Get notes by wallet
curl http://localhost:8080/api/notes/wallet/addr_test1qvq...

# Test 2: Create note
curl -X POST http://localhost:8080/api/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Content","createdByWallet":"addr_test1..."}'

# Test 3: Create pending transaction
curl -X POST http://localhost:8080/api/blockchain/transactions/pending \
  -H "Content-Type: application/json" \
  -d '{"noteId":1,"type":"CREATE","walletAddress":"addr_test1...","metadata":"{}"}'

# Test 4: Submit transaction
curl -X PUT http://localhost:8080/api/blockchain/transactions/1/submit \
  -H "Content-Type: application/json" \
  -d '{"txHash":"a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd"}'

# Test 5: Get transaction history
curl http://localhost:8080/api/blockchain/transactions/note/1

# Test 6: Check blockchain health
curl http://localhost:8080/api/blockchain/health
```

### Using Postman

Import this collection:

```json
{
  "info": {
    "name": "NotesApp Blockchain API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Notes by Wallet",
      "request": {
        "method": "GET",
        "url": "http://localhost:8080/api/notes/wallet/{{walletAddress}}"
      }
    },
    {
      "name": "Create Pending Transaction",
      "request": {
        "method": "POST",
        "url": "http://localhost:8080/api/blockchain/transactions/pending",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"noteId\": 1,\n  \"type\": \"CREATE\",\n  \"walletAddress\": \"{{walletAddress}}\",\n  \"metadata\": \"{}\"\n}"
        }
      }
    },
    {
      "name": "Submit Transaction",
      "request": {
        "method": "PUT",
        "url": "http://localhost:8080/api/blockchain/transactions/{{transactionId}}/submit",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"txHash\": \"{{txHash}}\"\n}"
        }
      }
    }
  ],
  "variable": [
    {"key": "baseUrl", "value": "http://localhost:8080"},
    {"key": "walletAddress", "value": "addr_test1qvq..."},
    {"key": "transactionId", "value": "1"},
    {"key": "txHash", "value": ""}
  ]
}
```

---

## 📞 SUPPORT

**Questions?** Contact BRETT (Backend Developer)

**Issues?** Check logs at `Backend/nabunturan/logs/`

**Documentation**: See `/Backend/nabunturan/*.md` files

---

**API Version**: 1.0  
**Last Updated**: November 17, 2025  
**Status**: ✅ Production Ready  
**Maintained By**: BRETT (Backend Developer)

