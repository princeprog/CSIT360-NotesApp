import { createContext, useContext, useState, useEffect } from "react";
import { useWallet } from "./WalletContext";

const BlockchainContext = createContext(null);

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within BlockchainProvider');
  }
  return context;
};

export const BlockchainProvider = ({ children }) => {
  const { walletApi, isConnected } = useWallet();
  const [transactions, setTransactions] = useState({});
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Status types: "pending", "confirmed", "failed", "none"
  const [noteStatus, setNoteStatus] = useState({});

  // Add a transaction to tracking
  const trackTransaction = (txHash, noteId, action) => {
    const newTx = {
      txHash,
      noteId,
      action,
      status: "pending",
      timestamp: new Date().toISOString(),
    };
    
    // Update transactions map
    setTransactions(prev => ({
      ...prev,
      [txHash]: newTx
    }));
    
    // Update note status
    setNoteStatus(prev => ({
      ...prev,
      [noteId]: "pending"
    }));
    
    // Add to history
    setTransactionHistory(prev => [newTx, ...prev]);
    
    // Return the transaction for reference
    return newTx;
  };

  // Update transaction status
  const updateTransactionStatus = (txHash, status) => {
    setTransactions(prev => {
      if (!prev[txHash]) return prev;
      
      const updatedTx = {
        ...prev[txHash],
        status,
        confirmedAt: status === "confirmed" ? new Date().toISOString() : null
      };
      
      // Update note status
      if (updatedTx.noteId) {
        setNoteStatus(prevStatus => ({
          ...prevStatus,
          [updatedTx.noteId]: status
        }));
      }
      
      // Update history
      setTransactionHistory(prevHistory => 
        prevHistory.map(tx => 
          tx.txHash === txHash ? updatedTx : tx
        )
      );
      
      return {
        ...prev,
        [txHash]: updatedTx
      };
    });
  };

  // Check transaction status on the blockchain via backend API
  const checkTransactionStatus = async (txHash) => {
    if (!txHash) return;
    
    try {
      setIsLoading(true);
      
      // Call backend API to get transaction status
      const response = await fetch(
        `http://localhost:8080/api/blockchain/transactions/${txHash}`
      );
      
      if (!response.ok) {
        // Transaction not found in backend yet (still pending)
        console.log(`Transaction ${txHash} not yet indexed by backend`);
        return;
      }
      
      const data = await response.json();
      
      if (data.result === 'SUCCESS' && data.data) {
        const txData = data.data;
        
        // Map backend status to frontend status
        let status = "pending";
        if (txData.status === "CONFIRMED") {
          status = "confirmed";
        } else if (txData.status === "FAILED") {
          status = "failed";
        } else if (txData.status === "MEMPOOL") {
          status = "pending"; // Still waiting for confirmation
        }
        
        updateTransactionStatus(txHash, status);
      }
    } catch (err) {
      console.error("Error checking transaction status:", err);
      // Don't mark as failed on network errors - might just be backend not ready
    } finally {
      setIsLoading(false);
    }
  };

  // Get status for a specific note
  const getNoteBlockchainStatus = (noteId) => {
    return noteId ? (noteStatus[noteId] || "none") : "none";
  };

  // Check all pending transactions periodically
  useEffect(() => {
    if (!isConnected) return;
    
    const checkPendingTransactions = async () => {
      const pendingTxs = Object.entries(transactions)
        .filter(([_, tx]) => tx.status === "pending")
        .map(([hash, _]) => hash);
      
      for (const hash of pendingTxs) {
        await checkTransactionStatus(hash);
      }
    };
    
    // Check immediately and then every 30 seconds
    checkPendingTransactions();
    const interval = setInterval(checkPendingTransactions, 30000);
    
    return () => clearInterval(interval);
  }, [isConnected, transactions]);

  return (
    <BlockchainContext.Provider
      value={{
        transactions,
        transactionHistory,
        isLoading,
        error,
        trackTransaction,
        updateTransactionStatus,
        checkTransactionStatus,
        getNoteBlockchainStatus,
        noteStatus
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
};
