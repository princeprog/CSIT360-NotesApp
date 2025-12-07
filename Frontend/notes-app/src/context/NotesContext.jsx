import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { Blockfrost, WebWallet, Blaze, Core } from "@blaze-cardano/sdk";
import { useWallet } from './WalletContext';
import { chunkMetadata, validateChunkedMetadata } from '../utils/chunkingUtils';
import { 
  BLOCKCHAIN_CONFIG, 
  TRANSACTION_STATUS, 
  TRANSACTION_OPERATIONS 
} from '../config/blockchain';
import { 
  handleTransactionError, 
  logTransactionError 
} from '../utils/errorHandling';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/notes';
const NotesContext = createContext(null);

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Transaction progress tracking state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [currentTxHash, setCurrentTxHash] = useState(null);
  
  const { walletApi, walletAddress } = useWallet();

  // ✅ Add History Entry
  const addHistory = (action, note) => {
    const entry = {
      id: Date.now(),
      action,
      noteTitle: note?.title || "(Untitled)",
      category: note?.category || "Uncategorized",
      timestamp: new Date().toISOString()
    };

    setHistory(prev => [entry, ...prev]);
  };

  // Helper function to sign + submit
  const signAndSubmitTransaction = async (builtTx, api) => {
    if (!builtTx || !api) {
      throw new Error("Built transaction and wallet API are required");
    }

    try {
      const txCbor = builtTx.toCbor();
      const witnessSet = await api.signTx(txCbor, true);

      const signedTx = Core.Transaction.fromCbor(Core.HexBlob(txCbor));
      const witnesses = Core.TransactionWitnessSet.fromCbor(Core.HexBlob(witnessSet));
      signedTx.setWitnessSet(witnesses);

      const signedTxCbor = signedTx.toCbor();
      const txHash = await api.submitTx(signedTxCbor);
      
      return { success: true, txHash };
    } catch (err) {
      console.error("Error signing/submitting transaction:", err);
      throw err;
    }
  };

  // Initial load
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const response = await axios.get(API_URL);
        setNotes(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch notes.");
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  // CREATE NOTE
  const createNote = async (noteData) => {
    let txHash = null;
    let metadataJson = null;
    
    try {
      setLoading(true);
      setError(null);
      setIsProcessing(true);
      setCurrentStep(1); // Step 1: Validating wallet
      setCurrentTxHash(null);
      
      // Check if wallet is connected with detailed logging
      console.log('🔍 Wallet check - API:', !!walletApi, 'Address:', walletAddress);
      if (!walletApi || !walletAddress) {
        const missingItems = [];
        if (!walletApi) missingItems.push('wallet API');
        if (!walletAddress) missingItems.push('wallet address');
        throw new Error(`Please connect your wallet before creating a note. Missing: ${missingItems.join(', ')}`);
      }
      
      console.log("🔗 Wallet connected:", walletAddress);
      
      setCurrentStep(2); // Step 2: Connecting to blockchain
      
      // Step 1: Build and submit blockchain transaction FIRST
      const projectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
      if (projectId) {
        try {
          console.log('🔗 Initializing Blockfrost provider...');
          console.log('📍 Network:', BLOCKCHAIN_CONFIG.NETWORK);
          console.log('🔑 Project ID:', projectId.substring(0, 10) + '...');
          
          // Blockfrost expects format 'cardano-preview', not just 'preview'
          const networkName = BLOCKCHAIN_CONFIG.NETWORK.startsWith('cardano-') 
            ? BLOCKCHAIN_CONFIG.NETWORK 
            : `cardano-${BLOCKCHAIN_CONFIG.NETWORK}`;
          
          console.log('🌐 Using Blockfrost network:', networkName);
          
          const provider = new Blockfrost({ 
            network: networkName, 
            projectId 
          });
          
          const wallet = new WebWallet(walletApi);
          console.log('🔗 Connecting to Blaze with Blockfrost...');
          console.log('⏳ This may take a few seconds...');
          
          // Add timeout to detect hanging requests
          const blazePromise = Blaze.from(provider, wallet);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Blockfrost connection timeout after 30 seconds')), 30000)
          );
          
          const blaze = await Promise.race([blazePromise, timeoutPromise]);
          console.log('✅ Blaze initialized successfully');

          setCurrentStep(3); // Step 3: Building transaction
          setCurrentStep(4); // Step 4: Preparing metadata

          // Build chunked metadata for backend storage
          const chunkedMetadata = chunkMetadata({
            title: noteData.title.trim(),
            content: noteData.content || '',
            category: noteData.category || 'Personal',
            isPinned: false
          }, TRANSACTION_OPERATIONS.CREATE);
          
          // Validate chunks
          validateChunkedMetadata(chunkedMetadata);
          metadataJson = JSON.stringify(chunkedMetadata);

          // --- METADATA CONSTRUCTION FOR BLOCKCHAIN TRANSACTION ---
          // STEP 1: INITIALIZE THE TOP-LEVEL CONTAINER
          const metadata = new Map();
          const label = BLOCKCHAIN_CONFIG.METADATA_LABEL;

          // STEP 2: CREATE THE INNER DATA STRUCTURE (MetadatumMap)
          const metadatumMap = new Core.MetadatumMap();

          // STEP 3: INSERT KEY-VALUE PAIRS
          
          // Helper to format content (handles both strings and arrays)
          const formatContent = (content) => {
            // If content is already chunked (array), create a list
            if (Array.isArray(content)) {
              const list = new Core.MetadatumList();
              content.forEach(chunk => {
                list.add(Core.Metadatum.newText(chunk));
              });
              return Core.Metadatum.newList(list);
            }
            // If content is a string, use it directly
            return Core.Metadatum.newText(content || "");
          };

          // ACTION
          metadatumMap.insert(
            Core.Metadatum.newText("action"),
            Core.Metadatum.newText(TRANSACTION_OPERATIONS.CREATE)
          );

          // TITLE (use chunked version)
          metadatumMap.insert(
            Core.Metadatum.newText("title"),
            formatContent(chunkedMetadata.title)
          );

          // CONTENT (use chunked version)
          metadatumMap.insert(
            Core.Metadatum.newText("content"),
            formatContent(chunkedMetadata.content)
          );

          // CATEGORY (use chunked version)
          metadatumMap.insert(
            Core.Metadatum.newText("category"),
            formatContent(chunkedMetadata.category)
          );

          // TIMESTAMP
          metadatumMap.insert(
            Core.Metadatum.newText("created_at"),
            Core.Metadatum.newText(new Date().toISOString())
          );

          // APP NAME
          metadatumMap.insert(
            Core.Metadatum.newText("app"),
            Core.Metadatum.newText(BLOCKCHAIN_CONFIG.APP_NAME)
          );

          // STEP 4: WRAP THE INNER MAP INTO A METADATUM OBJECT
          const metadatum = Core.Metadatum.newMap(metadatumMap);

          // STEP 5: ASSIGN TO LABEL
          metadata.set(label, metadatum);

          // STEP 6: CONVERT TO FINAL METADATA TYPE
          const finalMetadata = new Core.Metadata(metadata);

          // Build transaction - send to own wallet address
          let tx = blaze
            .newTransaction()
            .payLovelace(Core.Address.fromBech32(walletAddress), 1000000n);

          // STEP 7: ATTACH METADATA TO TRANSACTION
          tx.setMetadata(finalMetadata);

          setCurrentStep(5); // Step 5: Calculating fees
          // BUILD, SIGN, AND SUBMIT THE TRANSACTION (following instructor's pattern)
          const completedTx = await tx.complete();
          
          setCurrentStep(6); // Step 6: Signing transaction
          const signedTx = await blaze.signTransaction(completedTx);
          
          setCurrentStep(7); // Step 7: Submitting to blockchain
          txHash = await blaze.provider.postTransactionToChain(signedTx);
          setCurrentTxHash(txHash);
          
          console.log("✅ Transaction submitted:", txHash);
        } catch (blockchainErr) {
          logTransactionError(blockchainErr, { 
            operation: TRANSACTION_OPERATIONS.CREATE,
            walletAddress,
            metadata: metadataJson 
          });
          const errorMsg = handleTransactionError(blockchainErr, 'CREATE');
          throw new Error(errorMsg);
        }
      } else {
        throw new Error("Blockfrost project ID not configured. Please set VITE_BLOCKFROST_PROJECT_ID in your .env file.");
      }
      
      setCurrentStep(8); // Step 8: Saving to database
      
      // Step 2: Save to backend with transaction hash
      const noteToCreate = {
        title: noteData.title.trim(),
        content: noteData.content || '',
        category: noteData.category || 'Personal',
        isPinned: false,
        txHash: txHash,
        walletAddress: walletAddress,
        metadataJson: metadataJson
      };
      
      console.log('📝 Creating note with request:', noteToCreate);
      
      const response = await axios.post(API_URL, noteToCreate);
      const createdNote = response.data;

      setCurrentStep(9); // Step 9: Monitoring confirmation
      
      // Update local state
      setNotes(prev => [createdNote, ...prev]);
      addHistory("CREATED", createdNote);
      
      setCurrentStep(10); // Step 10: Complete
      
      return createdNote;
    } catch (err) {
      logTransactionError(err, { 
        operation: TRANSACTION_OPERATIONS.CREATE,
        walletAddress 
      });
      const errorMsg = err.message || handleTransactionError(err, 'CREATE');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
      setIsProcessing(false);
      // Reset progress after a short delay to allow users to see "Complete"
      setTimeout(() => {
        setCurrentStep(null);
        setCurrentTxHash(null);
      }, 2000);
    }
  };

  // UPDATE NOTE
  const updateNote = async (id, noteData) => {
    if (!id) return null;

    let txHash = null;
    let metadataJson = null;

    try {
      setLoading(true);
      setError(null);
      
      // Check if wallet is connected with detailed logging
      console.log('🔍 UPDATE - Wallet check - API:', !!walletApi, 'Address:', walletAddress);
      if (!walletApi || !walletAddress) {
        const missingItems = [];
        if (!walletApi) missingItems.push('wallet API');
        if (!walletAddress) missingItems.push('wallet address');
        throw new Error(`Please connect your wallet before updating a note. Missing: ${missingItems.join(', ')}`);
      }
      
      console.log("🔗 UPDATE - Wallet connected:", walletAddress);
      
      // Step 1: Build and submit blockchain transaction FIRST
      const projectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
      if (!projectId) {
        throw new Error('Blockfrost project ID not configured.');
      }
      
      try {
        console.log('🔗 Initializing Blockfrost for UPDATE...');
        const networkName = BLOCKCHAIN_CONFIG.NETWORK.startsWith('cardano-') 
          ? BLOCKCHAIN_CONFIG.NETWORK 
          : `cardano-${BLOCKCHAIN_CONFIG.NETWORK}`;
        
        const provider = new Blockfrost({ 
          network: networkName, 
          projectId 
        });
        const wallet = new WebWallet(walletApi);
        const blaze = await Blaze.from(provider, wallet);

            // Build chunked metadata for backend storage
            const chunkedMetadata = chunkMetadata({
              id,
              title: noteData.title,
              content: noteData.content,
              category: noteData.category,
              isPinned: noteData.isPinned
            }, TRANSACTION_OPERATIONS.UPDATE);
            
            validateChunkedMetadata(chunkedMetadata);
            metadataJson = JSON.stringify(chunkedMetadata);

            // --- BUILD BLOCKCHAIN METADATA (SAME AS CREATE) ---
            const metadata = new Map();
            const label = BLOCKCHAIN_CONFIG.METADATA_LABEL;
            const metadatumMap = new Core.MetadatumMap();

            // Helper to format content (handles both strings and arrays)
            const formatContent = (content) => {
              // If content is already chunked (array), create a list
              if (Array.isArray(content)) {
                const list = new Core.MetadatumList();
                content.forEach(chunk => {
                  list.add(Core.Metadatum.newText(chunk));
                });
                return Core.Metadatum.newList(list);
              }
              // If content is a string, use it directly
              return Core.Metadatum.newText(content || "");
            };

            // ACTION
            metadatumMap.insert(
              Core.Metadatum.newText("action"),
              Core.Metadatum.newText(TRANSACTION_OPERATIONS.UPDATE)
            );

            // NOTE ID
            metadatumMap.insert(
              Core.Metadatum.newText("noteId"),
              Core.Metadatum.newText(String(id))
            );

            // TITLE (use chunked version)
            metadatumMap.insert(
              Core.Metadatum.newText("title"),
              formatContent(chunkedMetadata.title)
            );

            // CONTENT (use chunked version)
            metadatumMap.insert(
              Core.Metadatum.newText("content"),
              formatContent(chunkedMetadata.content)
            );

            // CATEGORY (use chunked version)
            metadatumMap.insert(
              Core.Metadatum.newText("category"),
              formatContent(chunkedMetadata.category)
            );

            // TIMESTAMP
            metadatumMap.insert(
              Core.Metadatum.newText("timestamp"),
              Core.Metadatum.newText(new Date().toISOString())
            );

            const finalMetadata = Core.Metadatum.newMap(metadatumMap);
            metadata.set(label, finalMetadata);

            // CONVERT TO FINAL METADATA TYPE
            const wrappedMetadata = new Core.Metadata(metadata);

            // BUILD TRANSACTION
            const tx = blaze.newTransaction()
              .payLovelace(Core.Address.fromBech32(walletAddress), 1000000n);

            tx.setMetadata(wrappedMetadata);

        const completedTx = await tx.complete();
        const signedTx = await blaze.signTransaction(completedTx);
        txHash = await blaze.provider.postTransactionToChain(signedTx);
        
        console.log("✅ UPDATE Transaction submitted:", txHash);
      } catch (blockchainErr) {
        logTransactionError(blockchainErr, { 
          operation: TRANSACTION_OPERATIONS.UPDATE,
          noteId: id,
          walletAddress 
        });
        const errorMsg = handleTransactionError(blockchainErr, 'UPDATE');
        throw new Error(errorMsg);
      }

      // Step 2: Update in backend (only if blockchain transaction succeeded)
      console.log('📝 Updating note with request:', {
        id,
        title: noteData.title,
        txHash,
        walletAddress
      });
      
      if (!txHash || !walletAddress || !metadataJson) {
        throw new Error('Missing required fields: txHash, walletAddress, or metadataJson');
      }
      
      const response = await axios.put(`${API_URL}/${id}`, {
        title: noteData.title,
        content: noteData.content,
        category: noteData.category,
        isPinned: noteData.isPinned,
        txHash: txHash,
        walletAddress: walletAddress,
        metadataJson: metadataJson
      });

      setNotes(prev => prev.map(n => n.id === id ? response.data : n));
      addHistory("UPDATED", response.data);

      return response.data;
    } catch (err) {
      logTransactionError(err, { 
        operation: TRANSACTION_OPERATIONS.UPDATE,
        noteId: id,
        walletAddress 
      });
      const errorMsg = err.message || handleTransactionError(err, 'UPDATE');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // DELETE NOTE
  const deleteNote = async (id) => {
    if (!id) return false;

    const existingNote = notes.find(n => n.id === id);
    let txHash = null;
    let metadataJson = null;

    try {
      setLoading(true);
      setError(null);
      
      // Check if wallet is connected with detailed logging
      console.log('🔍 DELETE - Wallet check - API:', !!walletApi, 'Address:', walletAddress);
      if (!walletApi || !walletAddress) {
        const missingItems = [];
        if (!walletApi) missingItems.push('wallet API');
        if (!walletAddress) missingItems.push('wallet address');
        throw new Error(`Please connect your wallet before deleting a note. Missing: ${missingItems.join(', ')}`);
      }
      
      console.log("🔗 DELETE - Wallet connected:", walletAddress);
      
      if (!existingNote) {
        throw new Error('Note not found.');
      }
      
      // Step 1: Build and submit blockchain transaction FIRST
      const projectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
      if (!projectId) {
        throw new Error('Blockfrost project ID not configured.');
      }
      
      try {
        console.log('🔗 Initializing Blockfrost for DELETE...');
        const networkName = BLOCKCHAIN_CONFIG.NETWORK.startsWith('cardano-') 
          ? BLOCKCHAIN_CONFIG.NETWORK 
          : `cardano-${BLOCKCHAIN_CONFIG.NETWORK}`;
        
        const provider = new Blockfrost({ 
          network: networkName, 
          projectId 
        });
        const wallet = new WebWallet(walletApi);
        const blaze = await Blaze.from(provider, wallet);

            // Build chunked metadata for backend storage
            const chunkedMetadata = chunkMetadata(existingNote, TRANSACTION_OPERATIONS.DELETE);
            validateChunkedMetadata(chunkedMetadata);
            metadataJson = JSON.stringify(chunkedMetadata);

            // --- BUILD BLOCKCHAIN METADATA (SAME AS CREATE) ---
            const metadata = new Map();
            const label = BLOCKCHAIN_CONFIG.METADATA_LABEL;
            const metadatumMap = new Core.MetadatumMap();

            // Helper to format content (handles both strings and arrays)
            const formatContent = (content) => {
              // If content is already chunked (array), create a list
              if (Array.isArray(content)) {
                const list = new Core.MetadatumList();
                content.forEach(chunk => {
                  list.add(Core.Metadatum.newText(chunk));
                });
                return Core.Metadatum.newList(list);
              }
              // If content is a string, use it directly
              return Core.Metadatum.newText(content || "");
            };

            // ACTION
            metadatumMap.insert(
              Core.Metadatum.newText("action"),
              Core.Metadatum.newText(TRANSACTION_OPERATIONS.DELETE)
            );

            // NOTE ID
            metadatumMap.insert(
              Core.Metadatum.newText("noteId"),
              Core.Metadatum.newText(String(id))
            );

            // TITLE (use chunked version - of deleted note for reference)
            metadatumMap.insert(
              Core.Metadatum.newText("title"),
              formatContent(chunkedMetadata.title)
            );

            // CATEGORY (use chunked version)
            metadatumMap.insert(
              Core.Metadatum.newText("category"),
              formatContent(chunkedMetadata.category)
            );

            // TIMESTAMP
            metadatumMap.insert(
              Core.Metadatum.newText("timestamp"),
              Core.Metadatum.newText(new Date().toISOString())
            );

            const finalMetadata = Core.Metadatum.newMap(metadatumMap);
            metadata.set(label, finalMetadata);

            // CONVERT TO FINAL METADATA TYPE
            const wrappedMetadata = new Core.Metadata(metadata);

            // BUILD TRANSACTION
            const tx = blaze.newTransaction()
              .payLovelace(Core.Address.fromBech32(walletAddress), 1000000n);

            tx.setMetadata(wrappedMetadata);

        const completedTx = await tx.complete();
        const signedTx = await blaze.signTransaction(completedTx);
        txHash = await blaze.provider.postTransactionToChain(signedTx);
        
        console.log("✅ DELETE Transaction submitted:", txHash);
      } catch (blockchainErr) {
        logTransactionError(blockchainErr, { 
          operation: TRANSACTION_OPERATIONS.DELETE,
          noteId: id,
          walletAddress 
        });
        const errorMsg = handleTransactionError(blockchainErr, 'DELETE');
        throw new Error(errorMsg);
      }

      // Step 2: Delete from backend (only if blockchain transaction succeeded)
      console.log('🗑️ Deleting note with request:', {
        id,
        txHash,
        walletAddress
      });
      
      if (!txHash || !walletAddress || !metadataJson) {
        throw new Error('Missing required fields: txHash, walletAddress, or metadataJson');
      }
      
      await axios.delete(`${API_URL}/${id}`, {
        data: {
          txHash: txHash,
          walletAddress: walletAddress,
          metadataJson: metadataJson
        }
      });

      setNotes(prev => prev.filter(n => n.id !== id));
      addHistory("DELETED", existingNote);

      return true;
    } catch (err) {
      logTransactionError(err, { 
        operation: TRANSACTION_OPERATIONS.DELETE,
        noteId: id,
        walletAddress 
      });
      const errorMsg = err.message || handleTransactionError(err, 'DELETE');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // PIN / UNPIN NOTE
  const togglePin = async (id) => {
    try {
      setLoading(true);
      const response = await axios.patch(`${API_URL}/${id}/toggle-pin`);

      setNotes(prev => prev.map(n => n.id === id ? response.data : n));

      addHistory(response.data.isPinned ? "PINNED" : "UNPINNED", response.data);

      return true;
    } catch {
      setError("Failed to toggle pin.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getNoteById = async (id) => {
    if (!id) return null;
    const existing = notes.find(n => n.id === id);
    if (existing) return existing;

    try {
      const res = await axios.get(`${API_URL}/${id}`);
      return res.data;
    } catch {
      return null;
    }
  };

  const searchNotes = async (keyword) => {
    if (!keyword) return notes;

    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/search?keyword=${keyword}`);
      return res.data;
    } catch {
      setError("Failed to search notes.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Refresh notes from backend - wrap in useCallback to prevent recreating polling interval
  const refreshNotes = useCallback(async () => {
    try {
      console.log('🔄 Refreshing notes from backend...');
      const response = await axios.get(API_URL);
      console.log('✅ Notes refreshed, total:', response.data.length);
      
      // Log status breakdown
      const statusCount = response.data.reduce((acc, note) => {
        acc[note.status || 'NO_STATUS'] = (acc[note.status || 'NO_STATUS'] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 Status breakdown:', statusCount);
      
      setNotes(response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to refresh notes:', error);
      return []; // Return empty array if refresh fails
    }
  }, []); // Empty deps - only uses setNotes which is stable

  // Get notes by status
  const getNotesByStatus = async (status) => {
    try {
      const res = await axios.get(`${API_URL}/status/${status}`);
      return res.data;
    } catch (error) {
      console.error(`Failed to get notes by status ${status}:`, error);
      return [];
    }
  };

  // Get all pending notes
  const getPendingNotes = async () => {
    try {
      const res = await axios.get(`${API_URL}/pending`);
      return res.data;
    } catch (error) {
      console.error('Failed to get pending notes:', error);
      return [];
    }
  };

  // Get transaction status for a specific note
  const getTransactionStatus = async (noteId) => {
    try {
      const res = await axios.get(`${API_URL}/${noteId}/status`);
      const statusData = res.data;
      
      // If status is confirmed, update local state immediately
      if (statusData && statusData.status === 'CONFIRMED') {
        setNotes(prev => prev.map(n => 
          n.id === noteId 
            ? { ...n, status: 'CONFIRMED', confirmed: true }
            : n
        ));
      }
      
      return statusData;
    } catch (error) {
      console.error(`Failed to get transaction status for note ${noteId}:`, error);
      return null;
    }
  };

  // Get transaction history
  const getTransactionHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/transactions/history`);
      return res.data;
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  };

  // Retry failed transaction
  const retryFailedTransaction = async (noteId) => {
    try {
      const res = await axios.post(`${API_URL}/${noteId}/retry`);
      
      if (res.data.success) {
        // Update note with new transaction hash
        setNotes(prev => prev.map(n => 
          n.id === noteId 
            ? { ...n, txHash: res.data.newTxHash, status: 'PENDING' }
            : n
        ));
      }
      
      return res.data;
    } catch (error) {
      console.error(`Failed to retry transaction for note ${noteId}:`, error);
      return { success: false, error: error.message };
    }
  };


  const value = useMemo(() => ({
    notes,
    history,
    loading,
    error,
    isProcessing,
    currentStep,
    currentTxHash,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    getNoteById,
    searchNotes,
    refreshNotes,
    getNotesByStatus,
    getPendingNotes,
    getTransactionStatus,
    getTransactionHistory,
    retryFailedTransaction,
  }), [notes, history, loading, error, isProcessing, currentStep, currentTxHash, walletApi, walletAddress]);

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
};
