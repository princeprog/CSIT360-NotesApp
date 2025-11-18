import { createContext, useContext, useState, useEffect } from "react";
import { useWallet } from "./WalletContext";
import { Blockfrost } from "@blaze-cardano/sdk";

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

  // Check transaction status on the blockchain
  const checkTransactionStatus = async (txHash) => {
    if (!txHash) return;
    
    const projectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
    if (!projectId) {
      console.error("Blockfrost project ID not found");
      return;
    }
    
    try {
      setIsLoading(true);
      const provider = new Blockfrost({ 
        network: 'cardano-preview', 
        projectId 
      });
      
      const txInfo = await provider.fetchTransaction(txHash);
      
      if (txInfo && txInfo.block) {
        // Transaction is confirmed
        updateTransactionStatus(txHash, "confirmed");
      } else {
        // Transaction is still pending
        updateTransactionStatus(txHash, "pending");
      }
    } catch (err) {
      console.error("Error checking transaction status:", err);
      updateTransactionStatus(txHash, "failed");
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
