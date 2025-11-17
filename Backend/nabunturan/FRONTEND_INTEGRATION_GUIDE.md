# 👥 FRONTEND INTEGRATION GUIDE
## Team-Specific Implementation Examples

### Last Updated
November 17, 2025

---

## 📋 TABLE OF CONTENTS

1. [AL PRINCE - Wallet Integration Lead](#al-prince)
2. [YONG - Transaction Builder Engineer](#yong)
3. [IVAN - Signing + Submission Flow Engineer](#ivan)
4. [GARING - Frontend UI + Blockchain Status](#garing)
5. [Complete Integration Example](#complete-integration)

---

## 👤 AL PRINCE - Wallet Integration Lead

### Your Responsibilities
- ✅ Implement Lace wallet connection button
- ✅ Retrieve wallet address after connecting
- ✅ Handle "Connect / Disconnect wallet" UI
- ✅ Store the connected address in the frontend state

### Backend APIs You'll Use
- **None directly** (wallet connection is frontend-only)
- But your wallet address will be used by **all other team members**

### Implementation Guide

#### 1. Connect Wallet Button (React)

```jsx
// components/WalletConnect.jsx
import { useState, useEffect } from 'react';

export const WalletConnect = ({ onConnect, onDisconnect }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Check if Lace is installed
  const isLaceInstalled = () => {
    return typeof window !== 'undefined' && window.cardano && window.cardano.lace;
  };

  // Connect to Lace wallet
  const connectWallet = async () => {
    if (!isLaceInstalled()) {
      setError('Lace wallet not found. Please install Lace extension.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request access to wallet
      const address = await window.cardano.lace.enable();
      
      setWalletAddress(address);
      localStorage.setItem('walletAddress', address);
      
      console.log('Wallet connected:', address);
      
      if (onConnect) {
        onConnect(address);
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress(null);
    localStorage.removeItem('walletAddress');
    
    if (onDisconnect) {
      onDisconnect();
    }
  };

  // Auto-connect if previously connected
  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress && isLaceInstalled()) {
      setWalletAddress(savedAddress);
      if (onConnect) {
        onConnect(savedAddress);
      }
    }
  }, []);

  return (
    <div className="wallet-connect">
      {!walletAddress ? (
        <button
          onClick={connectWallet}
          disabled={isConnecting || !isLaceInstalled()}
          className="btn btn-primary"
        >
          {isConnecting ? 'Connecting...' : 'Connect Lace Wallet'}
        </button>
      ) : (
        <div className="wallet-connected">
          <span className="wallet-address">
            {walletAddress.substring(0, 15)}...{walletAddress.substring(walletAddress.length - 10)}
          </span>
          <button onClick={disconnectWallet} className="btn btn-secondary">
            Disconnect
          </button>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      {!isLaceInstalled() && (
        <div className="install-prompt">
          <a href="https://www.lace.io/" target="_blank" rel="noopener noreferrer">
            Install Lace Wallet Extension
          </a>
        </div>
      )}
    </div>
  );
};
```

#### 2. Wallet Context Provider

```jsx
// contexts/WalletContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = (address) => {
    setWalletAddress(address);
    setIsConnected(true);
  };

  const disconnect = () => {
    setWalletAddress(null);
    setIsConnected(false);
  };

  return (
    <WalletContext.Provider value={{ 
      walletAddress, 
      isConnected, 
      connect, 
      disconnect 
    }}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook for other components to use
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
```

#### 3. Usage in Main App

```jsx
// App.jsx
import { WalletProvider } from './contexts/WalletContext';
import { WalletConnect } from './components/WalletConnect';

function App() {
  return (
    <WalletProvider>
      <div className="app">
        <header>
          <h1>NotesApp</h1>
          <WalletConnect 
            onConnect={(address) => console.log('Connected:', address)}
            onDisconnect={() => console.log('Disconnected')}
          />
        </header>
        
        {/* Rest of your app - GARING, YONG, IVAN will use wallet address */}
        <NotesList />
      </div>
    </WalletProvider>
  );
}
```

#### 4. Other Components Can Access Wallet Address

```jsx
// Any component
import { useWallet } from './contexts/WalletContext';

function SomeComponent() {
  const { walletAddress, isConnected } = useWallet();

  if (!isConnected) {
    return <div>Please connect your wallet</div>;
  }

  return <div>Your wallet: {walletAddress}</div>;
}
```

### Checklist for AL PRINCE

- [ ] Lace wallet extension detection
- [ ] Connect button UI
- [ ] Disconnect button UI
- [ ] Display connected wallet address (truncated)
- [ ] Store wallet address in context/state
- [ ] Persist connection (localStorage)
- [ ] Auto-reconnect on page reload
- [ ] Error handling for connection failures
- [ ] Install prompt if Lace not found

### Integration Points

Your wallet address will be used by:
- **GARING**: To filter and display user's notes
- **YONG**: To build transactions
- **IVAN**: To sign transactions
- **Backend**: To associate notes with wallet owner

---

## 👤 YONG - Transaction Builder Engineer

### Your Responsibilities
- ✅ Build transaction structures for Create/Update/Delete Note
- ✅ Add Cardano metadata to each transaction
- ✅ Implement "self-send" 0 ADA transactions
- ✅ Prepare unsigned transactions to be signed by Lace

### Backend APIs You'll Use
1. **POST `/api/blockchain/transactions/pending`** - Save pending transaction

### Implementation Guide

#### 1. Transaction Builder Service

```javascript
// services/transactionBuilder.js
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-browser';

export class TransactionBuilder {
  constructor(walletAddress) {
    this.walletAddress = walletAddress;
  }

  /**
   * Build a transaction for creating a note on blockchain
   */
  async buildCreateNoteTransaction(note) {
    try {
      // Get protocol parameters from wallet
      const protocolParameters = await window.cardano.lace.getProtocolParameters();
      
      // Build transaction
      const txBuilder = CardanoWasm.TransactionBuilder.new(
        CardanoWasm.TransactionBuilderConfigBuilder.new()
          .fee_algo(
            CardanoWasm.LinearFee.new(
              CardanoWasm.BigNum.from_str(protocolParameters.minFeeA.toString()),
              CardanoWasm.BigNum.from_str(protocolParameters.minFeeB.toString())
            )
          )
          .pool_deposit(CardanoWasm.BigNum.from_str(protocolParameters.poolDeposit))
          .key_deposit(CardanoWasm.BigNum.from_str(protocolParameters.keyDeposit))
          .max_value_size(protocolParameters.maxValSize)
          .max_tx_size(protocolParameters.maxTxSize)
          .coins_per_utxo_word(CardanoWasm.BigNum.from_str(protocolParameters.coinsPerUtxoWord))
          .build()
      );

      // Get UTXOs from wallet
      const utxos = await window.cardano.lace.getUtxos();
      
      // Add inputs
      const utxosList = CardanoWasm.TransactionUnspentOutputs.new();
      utxos.forEach(utxo => {
        utxosList.add(CardanoWasm.TransactionUnspentOutput.from_bytes(Buffer.from(utxo, 'hex')));
      });
      
      txBuilder.add_inputs_from(utxosList, CardanoWasm.Address.from_bech32(this.walletAddress));

      // Add metadata
      const metadata = this.buildNoteMetadata(note, 'CREATE');
      const auxData = CardanoWasm.AuxiliaryData.new();
      const generalMetadata = CardanoWasm.GeneralTransactionMetadata.new();
      generalMetadata.insert(
        CardanoWasm.BigNum.from_str('1'),
        CardanoWasm.encode_json_str_to_metadatum(JSON.stringify(metadata), CardanoWasm.MetadataJsonSchema.BasicConversions)
      );
      auxData.set_metadata(generalMetadata);
      txBuilder.set_auxiliary_data(auxData);

      // Add output (self-send with 0 ADA + min UTXO)
      const minAda = CardanoWasm.min_ada_required(
        CardanoWasm.Value.new(CardanoWasm.BigNum.from_str('0')),
        CardanoWasm.BigNum.from_str(protocolParameters.coinsPerUtxoWord)
      );
      
      txBuilder.add_output(
        CardanoWasm.TransactionOutput.new(
          CardanoWasm.Address.from_bech32(this.walletAddress),
          CardanoWasm.Value.new(minAda)
        )
      );

      // Add change address
      txBuilder.add_change_if_needed(CardanoWasm.Address.from_bech32(this.walletAddress));

      // Build transaction
      const txBody = txBuilder.build();
      const tx = CardanoWasm.Transaction.new(txBody, CardanoWasm.TransactionWitnessSet.new(), auxData);

      return tx.to_bytes();
    } catch (error) {
      console.error('Error building transaction:', error);
      throw error;
    }
  }

  /**
   * Build metadata for note transaction
   */
  buildNoteMetadata(note, action) {
    return {
      action: action, // CREATE, UPDATE, or DELETE
      noteId: note.id,
      title: note.title,
      content: note.content,
      category: note.category || null,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Build UPDATE transaction
   */
  async buildUpdateNoteTransaction(note) {
    // Similar to CREATE but with action: 'UPDATE'
    const metadata = this.buildNoteMetadata(note, 'UPDATE');
    // ... rest similar to buildCreateNoteTransaction
  }

  /**
   * Build DELETE transaction
   */
  async buildDeleteNoteTransaction(noteId) {
    const metadata = {
      action: 'DELETE',
      noteId: noteId,
      timestamp: new Date().toISOString()
    };
    // ... rest similar to buildCreateNoteTransaction
  }
}
```

#### 2. Integration with Backend

```javascript
// services/blockchainService.js
import { TransactionBuilder } from './transactionBuilder';

export class BlockchainService {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
  }

  /**
   * Prepare note for blockchain sync
   * 1. Build unsigned transaction
   * 2. Save pending transaction to backend
   * 3. Return transaction for IVAN to sign
   */
  async prepareNoteSync(note, walletAddress) {
    try {
      // Step 1: Build unsigned transaction
      const txBuilder = new TransactionBuilder(walletAddress);
      const unsignedTx = await txBuilder.buildCreateNoteTransaction(note);

      console.log('Built unsigned transaction');

      // Step 2: Save pending transaction to backend
      const response = await fetch(
        `${this.baseUrl}/api/blockchain/transactions/pending`,
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

        // Step 3: Return for IVAN to sign
        return {
          success: true,
          transactionId: transactionId,
          unsignedTx: Buffer.from(unsignedTx).toString('hex'),
          metadata: txBuilder.buildNoteMetadata(note, 'CREATE')
        };
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error preparing note sync:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
```

#### 3. Usage in Component

```jsx
// components/NoteSyncButton.jsx
import { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { BlockchainService } from '../services/blockchainService';

export const NoteSyncButton = ({ note, onSyncStart }) => {
  const { walletAddress } = useWallet();
  const [isSyncing, setIsSyncing] = useState(false);
  const blockchainService = new BlockchainService();

  const handleSync = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setIsSyncing(true);

    try {
      // YONG's work: Build transaction and save to backend
      const result = await blockchainService.prepareNoteSync(note, walletAddress);

      if (result.success) {
        console.log('Transaction prepared:', result.transactionId);
        
        // Pass to IVAN for signing
        if (onSyncStart) {
          onSyncStart({
            transactionId: result.transactionId,
            unsignedTx: result.unsignedTx
          });
        }
      } else {
        alert('Failed to prepare transaction: ' + result.error);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync note to blockchain');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing || !walletAddress}
      className="btn btn-blockchain"
    >
      {isSyncing ? 'Preparing...' : '🔗 Sync to Blockchain'}
    </button>
  );
};
```

### Checklist for YONG

- [ ] Install `@emurgo/cardano-serialization-lib-browser`
- [ ] Implement transaction builder
- [ ] Build metadata structure (label 1)
- [ ] Implement CREATE transaction
- [ ] Implement UPDATE transaction
- [ ] Implement DELETE transaction
- [ ] Integrate with backend API (save pending)
- [ ] Handle protocol parameters from wallet
- [ ] Handle UTXOs from wallet
- [ ] Test with testnet addresses

### Integration Points

You receive from:
- **AL PRINCE**: Wallet address for transaction
- **GARING**: Note data to sync

You pass to:
- **IVAN**: Unsigned transaction to sign
- **Backend**: Pending transaction record

---

## 👤 IVAN - Signing + Submission Flow Engineer

### Your Responsibilities
- ✅ Integrate with Lace CIP-30 API
- ✅ Sign transactions using Lace wallet
- ✅ Submit signed transactions to the Cardano network
- ✅ Error handling (user rejects, network error, insufficient balance)

### Backend APIs You'll Use
1. **PUT `/api/blockchain/transactions/{id}/submit`** - Update with txHash after submission

### Implementation Guide

#### 1. Transaction Signing Service

```javascript
// services/transactionSigner.js
export class TransactionSigner {
  /**
   * Sign and submit transaction to blockchain
   * @param {number} transactionId - Backend transaction ID
   * @param {string} unsignedTxHex - Unsigned transaction (hex)
   * @returns {Promise<{success: boolean, txHash?: string, error?: string}>}
   */
  async signAndSubmit(transactionId, unsignedTxHex) {
    try {
      // Check if Lace is available
      if (!window.cardano || !window.cardano.lace) {
        throw new Error('Lace wallet not found');
      }

      // Step 1: Sign transaction with Lace
      console.log('Requesting signature from Lace wallet...');
      
      const signedTxHex = await window.cardano.lace.signTx(unsignedTxHex, true);
      
      console.log('Transaction signed successfully');

      // Step 2: Submit to Cardano network
      console.log('Submitting transaction to Cardano network...');
      
      const txHash = await window.cardano.lace.submitTx(signedTxHex);
      
      console.log('Transaction submitted:', txHash);

      // Step 3: Update backend with txHash
      const result = await this.updateBackend(transactionId, txHash);

      if (result.success) {
        return {
          success: true,
          txHash: txHash,
          transaction: result.transaction
        };
      } else {
        // Transaction submitted to blockchain but backend update failed
        // This is OK - backend indexer will pick it up later
        console.warn('Transaction submitted but backend update failed:', result.error);
        return {
          success: true,
          txHash: txHash,
          warning: 'Transaction submitted but backend update failed. Indexer will pick it up.'
        };
      }

    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update backend with transaction hash
   */
  async updateBackend(transactionId, txHash) {
    try {
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
        console.log('Backend updated with transaction hash');
        return {
          success: true,
          transaction: data.data
        };
      } else {
        return {
          success: false,
          error: data.message
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle errors during signing/submission
   */
  handleError(error) {
    console.error('Transaction error:', error);

    // User rejected transaction
    if (error.code === 4 || error.message.includes('User declined')) {
      return {
        success: false,
        error: 'USER_REJECTED',
        message: 'Transaction was cancelled by user'
      };
    }

    // Insufficient funds
    if (error.message.includes('insufficient') || error.message.includes('balance')) {
      return {
        success: false,
        error: 'INSUFFICIENT_FUNDS',
        message: 'Insufficient ADA balance to complete transaction'
      };
    }

    // Network error
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection and try again.'
      };
    }

    // Generic error
    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: error.message || 'Failed to sign/submit transaction'
    };
  }
}
```

#### 2. Integration Component

```jsx
// components/TransactionSigningModal.jsx
import { useState, useEffect } from 'react';
import { TransactionSigner } from '../services/transactionSigner';

export const TransactionSigningModal = ({ 
  transaction, 
  onSuccess, 
  onError, 
  onClose 
}) => {
  const [status, setStatus] = useState('SIGNING'); // SIGNING, SUBMITTING, SUCCESS, ERROR
  const [message, setMessage] = useState('Waiting for wallet signature...');
  const [txHash, setTxHash] = useState(null);
  const signer = new TransactionSigner();

  useEffect(() => {
    if (transaction) {
      signAndSubmit();
    }
  }, [transaction]);

  const signAndSubmit = async () => {
    try {
      // Step 1: Sign
      setStatus('SIGNING');
      setMessage('Please sign the transaction in your Lace wallet...');

      // Give user time to see the message
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Submit
      const result = await signer.signAndSubmit(
        transaction.transactionId,
        transaction.unsignedTx
      );

      if (result.success) {
        // Success!
        setStatus('SUCCESS');
        setTxHash(result.txHash);
        setMessage('Transaction submitted successfully! Waiting for blockchain confirmation...');

        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        // Error
        setStatus('ERROR');
        setMessage(result.message || 'Transaction failed');

        if (onError) {
          onError(result);
        }
      }
    } catch (error) {
      setStatus('ERROR');
      setMessage('Unexpected error: ' + error.message);

      if (onError) {
        onError({ success: false, error: error.message });
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal transaction-modal">
        <div className="modal-header">
          <h2>
            {status === 'SIGNING' && '📝 Sign Transaction'}
            {status === 'SUBMITTING' && '🚀 Submitting...'}
            {status === 'SUCCESS' && '✅ Success!'}
            {status === 'ERROR' && '❌ Error'}
          </h2>
        </div>

        <div className="modal-body">
          <div className={`status-icon status-${status.toLowerCase()}`}>
            {status === 'SIGNING' && '⏳'}
            {status === 'SUBMITTING' && '🔄'}
            {status === 'SUCCESS' && '✓'}
            {status === 'ERROR' && '✗'}
          </div>

          <p className="status-message">{message}</p>

          {txHash && (
            <div className="tx-hash">
              <strong>Transaction Hash:</strong>
              <code>{txHash.substring(0, 20)}...{txHash.substring(txHash.length - 10)}</code>
              <a
                href={`https://preview.cardanoscan.io/transaction/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-link"
              >
                View on CardanoScan
              </a>
            </div>
          )}

          {status === 'SUCCESS' && (
            <div className="success-info">
              <p>Your note has been submitted to the blockchain!</p>
              <p>It will be confirmed in approximately 20-60 seconds.</p>
            </div>
          )}

          {status === 'ERROR' && (
            <div className="error-info">
              <p>Please try again or contact support if the problem persists.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {(status === 'SUCCESS' || status === 'ERROR') && (
            <button onClick={onClose} className="btn btn-primary">
              Close
            </button>
          )}
          {status === 'ERROR' && (
            <button onClick={signAndSubmit} className="btn btn-secondary">
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

#### 3. Usage Example

```jsx
// In parent component
import { useState } from 'react';
import { TransactionSigningModal } from './TransactionSigningModal';

function NoteComponent() {
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);

  const handleSyncStart = (transaction) => {
    // Received from YONG
    setPendingTransaction(transaction);
    setShowSigningModal(true);
  };

  const handleSuccess = (result) => {
    console.log('Transaction submitted:', result.txHash);
    // Update UI to show "Waiting for confirmation"
  };

  const handleError = (error) => {
    console.error('Transaction failed:', error);
    alert(error.message);
  };

  return (
    <>
      {/* Your component */}
      
      {showSigningModal && (
        <TransactionSigningModal
          transaction={pendingTransaction}
          onSuccess={handleSuccess}
          onError={handleError}
          onClose={() => setShowSigningModal(false)}
        />
      )}
    </>
  );
}
```

### Checklist for IVAN

- [ ] Implement Lace CIP-30 API integration
- [ ] Handle transaction signing
- [ ] Handle transaction submission
- [ ] Update backend with txHash
- [ ] Error handling (user rejection)
- [ ] Error handling (insufficient funds)
- [ ] Error handling (network errors)
- [ ] Success notification
- [ ] Link to blockchain explorer
- [ ] Retry mechanism for failures

### Integration Points

You receive from:
- **YONG**: Transaction ID and unsigned transaction

You send to:
- **Backend**: Transaction hash after submission
- **GARING**: Success/failure status for UI updates

---

## 👤 GARING - Frontend UI + Blockchain Status

### Your Responsibilities
- ✅ Update existing Notes UI to call blockchain functions
- ✅ Add loading states (e.g., "Waiting for transaction…")
- ✅ Add transaction history modal
- ✅ Add status indicators for each note (pending/confirmed)

### Backend APIs You'll Use
1. **GET `/api/notes/wallet/{address}`** - Get user's notes
2. **GET `/api/blockchain/transactions/note/{noteId}`** - Get transaction history
3. **GET `/api/blockchain/transactions/wallet/{address}`** - Get wallet transactions

### Implementation Guide

#### 1. Notes List with Wallet Filter

```jsx
// components/NotesList.jsx
import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { NoteCard } from './NoteCard';

export const NotesList = () => {
  const { walletAddress, isConnected } = useWallet();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch notes when wallet connects
  useEffect(() => {
    if (isConnected && walletAddress) {
      fetchUserNotes();
    }
  }, [isConnected, walletAddress]);

  const fetchUserNotes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8080/api/notes/wallet/${walletAddress}`
      );
      const data = await response.json();

      if (data.result === 'SUCCESS') {
        setNotes(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load notes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="notes-empty">
        <h3>Welcome to NotesApp!</h3>
        <p>Please connect your Lace wallet to view your notes.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="notes-loading">Loading your notes...</div>;
  }

  if (error) {
    return <div className="notes-error">Error: {error}</div>;
  }

  if (notes.length === 0) {
    return (
      <div className="notes-empty">
        <h3>No notes yet</h3>
        <p>Create your first note to get started!</p>
      </div>
    );
  }

  return (
    <div className="notes-list">
      {notes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onUpdate={fetchUserNotes}
        />
      ))}
    </div>
  );
};
```

#### 2. Note Card with Blockchain Status

```jsx
// components/NoteCard.jsx
import { useState } from 'react';
import { BlockchainStatus } from './BlockchainStatus';
import { TransactionHistoryModal } from './TransactionHistoryModal';

export const NoteCard = ({ note, onUpdate }) => {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="note-card">
      <div className="note-header">
        <h3>{note.title}</h3>
        <BlockchainStatus note={note} />
      </div>

      <div className="note-content">
        <p>{note.content}</p>
      </div>

      <div className="note-footer">
        <span className="note-category">{note.category}</span>
        <span className="note-date">
          {new Date(note.updatedAt).toLocaleDateString()}
        </span>

        {note.onChain && (
          <button
            onClick={() => setShowHistory(true)}
            className="btn-link"
          >
            📜 Transaction History
          </button>
        )}
      </div>

      {showHistory && (
        <TransactionHistoryModal
          noteId={note.id}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};
```

#### 3. Blockchain Status Indicator

```jsx
// components/BlockchainStatus.jsx
import { useState, useEffect } from 'react';

export const BlockchainStatus = ({ note }) => {
  const [status, setStatus] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (note.onChain && note.latestTxHash) {
      checkTransactionStatus();
    }
  }, [note]);

  const checkTransactionStatus = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/blockchain/transactions/${note.latestTxHash}`
      );
      const data = await response.json();

      if (data.result === 'SUCCESS') {
        setStatus(data.data.status);

        // If MEMPOOL, poll for confirmation
        if (data.data.status === 'MEMPOOL' && !isPolling) {
          startPolling();
        }
      }
    } catch (error) {
      console.error('Failed to check transaction status:', error);
    }
  };

  const startPolling = () => {
    setIsPolling(true);

    const interval = setInterval(async () => {
      await checkTransactionStatus();

      // Stop polling if confirmed
      if (status === 'CONFIRMED') {
        clearInterval(interval);
        setIsPolling(false);
      }
    }, 10000); // Poll every 10 seconds

    // Stop after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      setIsPolling(false);
    }, 300000);
  };

  if (!note.onChain) {
    return <span className="status-badge status-local">📝 Local Only</span>;
  }

  if (status === 'PENDING') {
    return <span className="status-badge status-pending">⏳ Pending</span>;
  }

  if (status === 'MEMPOOL') {
    return (
      <span className="status-badge status-mempool">
        🔄 Waiting for Confirmation...
      </span>
    );
  }

  if (status === 'CONFIRMED') {
    return (
      <span className="status-badge status-confirmed">
        ✓ Confirmed on Blockchain
      </span>
    );
  }

  if (status === 'FAILED') {
    return <span className="status-badge status-failed">✗ Failed</span>;
  }

  return <span className="status-badge status-unknown">⛓️ On Chain</span>;
};
```

#### 4. Transaction History Modal

```jsx
// components/TransactionHistoryModal.jsx
import { useState, useEffect } from 'react';

export const TransactionHistoryModal = ({ noteId, onClose }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactionHistory();
  }, [noteId]);

  const fetchTransactionHistory = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/blockchain/transactions/note/${noteId}`
      );
      const data = await response.json();

      if (data.result === 'SUCCESS') {
        setTransactions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Transaction History</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div>Loading history...</div>
          ) : transactions.length === 0 ? (
            <div>No blockchain transactions yet</div>
          ) : (
            <div className="transaction-list">
              {transactions.map((tx, index) => (
                <div key={tx.id} className="transaction-item">
                  <div className="tx-header">
                    <span className={`tx-type tx-${tx.type.toLowerCase()}`}>
                      {tx.type}
                    </span>
                    <span className={`tx-status tx-${tx.status.toLowerCase()}`}>
                      {tx.status}
                    </span>
                  </div>

                  <div className="tx-details">
                    <div className="tx-hash">
                      <strong>Hash:</strong>
                      <code>{tx.txHash.substring(0, 20)}...</code>
                      <a
                        href={`https://preview.cardanoscan.io/transaction/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        🔗
                      </a>
                    </div>

                    <div className="tx-time">
                      <strong>Time:</strong>
                      {new Date(tx.blockTime).toLocaleString()}
                    </div>

                    {tx.confirmations > 0 && (
                      <div className="tx-confirmations">
                        <strong>Confirmations:</strong> {tx.confirmations}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Checklist for GARING

- [ ] Fetch notes by wallet address (not all notes!)
- [ ] Display blockchain status badges
- [ ] Show loading states during sync
- [ ] Poll for transaction confirmation
- [ ] Transaction history modal
- [ ] Link to blockchain explorer
- [ ] Handle empty states
- [ ] Handle error states
- [ ] Refresh notes after confirmation

### Integration Points

You use data from:
- **AL PRINCE**: Wallet address for filtering
- **Backend**: Notes and transaction data
- **IVAN**: Transaction success/failure events

---

## 🔗 COMPLETE INTEGRATION

### End-to-End Workflow

```jsx
// Complete example showing all team integration
import { useState } from 'react';
import { WalletProvider, useWallet } from './contexts/WalletContext';
import { WalletConnect } from './components/WalletConnect'; // AL PRINCE
import { NotesList } from './components/NotesList'; // GARING
import { NoteSyncButton } from './components/NoteSyncButton'; // YONG
import { TransactionSigningModal } from './components/TransactionSigningModal'; // IVAN

function App() {
  return (
    <WalletProvider>
      <MainApp />
    </WalletProvider>
  );
}

function MainApp() {
  const { walletAddress, isConnected } = useWallet();
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);

  // YONG's work: Prepare transaction
  const handleSyncStart = (transaction) => {
    setPendingTransaction(transaction);
    setShowSigningModal(true);
  };

  // IVAN's work result
  const handleTransactionSuccess = (result) => {
    console.log('Transaction submitted:', result.txHash);
    setShowSigningModal(false);
    // GARING: Show success notification
    alert('Transaction submitted! Waiting for blockchain confirmation...');
  };

  const handleTransactionError = (error) => {
    console.error('Transaction failed:', error);
    setShowSigningModal(false);
    // GARING: Show error notification
    alert('Transaction failed: ' + error.message);
  };

  return (
    <div className="app">
      <header>
        <h1>NotesApp - Blockchain Edition</h1>
        {/* AL PRINCE's work */}
        <WalletConnect />
      </header>

      <main>
        {isConnected ? (
          <>
            {/* GARING's work: Display notes filtered by wallet */}
            <NotesList />

            {/* Transaction signing modal - IVAN's work */}
            {showSigningModal && (
              <TransactionSigningModal
                transaction={pendingTransaction}
                onSuccess={handleTransactionSuccess}
                onError={handleTransactionError}
                onClose={() => setShowSigningModal(false)}
              />
            )}
          </>
        ) : (
          <div className="connect-prompt">
            <p>Please connect your Lace wallet to get started</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
```

---

## 🎓 SUMMARY

### Team Dependencies

```
AL PRINCE (Wallet) 
    ↓ walletAddress
    ├→ GARING (Filter notes)
    ├→ YONG (Build transactions)
    └→ IVAN (Sign transactions)

GARING (UI)
    ↓ Note to sync
    └→ YONG

YONG (Transaction Builder)
    ↓ Unsigned transaction + Transaction ID
    └→ IVAN

IVAN (Signing)
    ↓ Transaction hash
    └→ Backend → BRETT (Indexer)

BRETT (Indexer)
    ↓ Confirmed transactions
    └→ GARING (Display status)
```

### Key Points

1. **AL PRINCE**: Foundation - everyone depends on wallet address
2. **YONG**: Bridges UI to blockchain - builds transactions
3. **IVAN**: Executes - signs and submits to Cardano
4. **GARING**: Orchestrates - shows status and manages UI
5. **BRETT**: Background - indexer confirms and tracks

---

**Document Version**: 1.0  
**Last Updated**: November 17, 2025  
**Status**: ✅ Ready for Integration  
**Maintained By**: BRETT (Backend Developer)

