import { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
      
      // Check if wallet is connected
      if (!walletApi || !walletAddress) {
        throw new Error("Please connect your wallet before creating a note.");
      }
      
      console.log("🔗 Wallet connected:", walletAddress);
      
      // Step 1: Build and submit blockchain transaction FIRST
      const projectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
      if (projectId) {
        try {
          const provider = new Blockfrost({ 
            network: BLOCKCHAIN_CONFIG.NETWORK, 
            projectId 
          });
          const wallet = new WebWallet(walletApi);
          const blaze = await Blaze.from(provider, wallet);

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
          // ACTION
          metadatumMap.insert(
            Core.Metadatum.newText("action"),
            Core.Metadatum.newText("CREATE")
          );

          // TITLE (with chunking support)
          const formatContent = (content) => {
            if (!content || content.length <= BLOCKCHAIN_CONFIG.MAX_METADATA_CHUNK_SIZE) {
              return Core.Metadatum.newText(content || "");
            }
            const chunkSize = BLOCKCHAIN_CONFIG.MAX_METADATA_CHUNK_SIZE;
            const chunks = content.match(new RegExp(`.{1,${chunkSize}}`, 'g')) || [];
            const list = new Core.MetadatumList();
            chunks.forEach(chunk => {
              list.add(Core.Metadatum.newText(chunk));
            });
            return Core.Metadatum.newList(list);
          };

          metadatumMap.insert(
            Core.Metadatum.newText("action"),
            Core.Metadatum.newText(TRANSACTION_OPERATIONS.CREATE)
          );

          // CONTENT (with chunking support)
          metadatumMap.insert(
            Core.Metadatum.newText("content"),
            formatContent(noteData.content || "")
          );

          // CATEGORY
          metadatumMap.insert(
            Core.Metadatum.newText("category"),
            Core.Metadatum.newText(noteData.category || "Personal")
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

          // BUILD, SIGN, AND SUBMIT THE TRANSACTION (following instructor's pattern)
          const completedTx = await tx.complete();
          const signedTx = await blaze.signTransaction(completedTx);
          txHash = await blaze.provider.postTransactionToChain(signedTx);
          
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

      // Update local state
      setNotes(prev => [createdNote, ...prev]);
      addHistory("CREATED", createdNote);
      
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
    }
  };

  // UPDATE NOTE
  const updateNote = async (id, noteData) => {
    if (!id) return null;

    let txHash = null;
    let metadataJson = null;

    try {
      setLoading(true);
      
      // Step 1: Build and submit blockchain transaction FIRST (if wallet connected)
      if (walletApi && walletAddress) {
        const projectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
        if (projectId) {
          try {
            const provider = new Blockfrost({ 
              network: BLOCKCHAIN_CONFIG.NETWORK, 
              projectId 
            });
            const wallet = new WebWallet(walletApi);
            const blaze = await Blaze.from(provider, wallet);

            // Build chunked metadata
            const chunkedMetadata = chunkMetadata({
              id,
              title: noteData.title,
              content: noteData.content,
              category: noteData.category,
              isPinned: noteData.isPinned
            }, TRANSACTION_OPERATIONS.UPDATE);
            
            validateChunkedMetadata(chunkedMetadata);
            metadataJson = JSON.stringify(chunkedMetadata);

            // Build transaction - send to own wallet address
            let txBuilder = blaze
              .newTransaction()
              .payLovelace(Core.Address.fromBech32(walletAddress), 1000000n);

            if (txBuilder.addMetadata) {
              txBuilder = txBuilder.addMetadata({ 1: chunkedMetadata });
            } else if (txBuilder.withMetadata) {
              txBuilder = txBuilder.withMetadata({ 1: chunkedMetadata });
            }

            const builtTx = await txBuilder.complete();
            const result = await signAndSubmitTransaction(builtTx, walletApi);
            txHash = result.txHash;
            
            console.log("Transaction submitted:", txHash);
          } catch (blockchainErr) {
            logTransactionError(blockchainErr, { 
              operation: TRANSACTION_OPERATIONS.UPDATE,
              noteId: id,
              walletAddress 
            });
            console.error("Blockchain transaction failed:", handleTransactionError(blockchainErr, 'UPDATE'));
          }
        }
      }

      // Step 2: Update in backend
      const response = await axios.put(`${API_URL}/${id}`, {
        title: noteData.title,
        content: noteData.content,
        category: noteData.category,
        isPinned: noteData.isPinned,
        txHash: txHash || null,
        walletAddress: walletAddress || null,
        metadataJson: metadataJson || null
      });

      setNotes(prev => prev.map(n => n.id === id ? response.data : n));
      addHistory("UPDATED", response.data);

      return response.data;
    } catch (err) {
      setError("Failed to update note.");
      return null;
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
      
      // Step 1: Build and submit blockchain transaction FIRST (if wallet connected)
      if (walletApi && walletAddress && existingNote) {
        const projectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
        if (projectId) {
          try {
            const provider = new Blockfrost({ 
              network: BLOCKCHAIN_CONFIG.NETWORK, 
              projectId 
            });
            const wallet = new WebWallet(walletApi);
            const blaze = await Blaze.from(provider, wallet);

            // Build chunked metadata
            const chunkedMetadata = chunkMetadata(existingNote, TRANSACTION_OPERATIONS.DELETE);
            validateChunkedMetadata(chunkedMetadata);
            metadataJson = JSON.stringify(chunkedMetadata);

            // Build transaction - send to own wallet address
            let txBuilder = blaze
              .newTransaction()
              .payLovelace(Core.Address.fromBech32(walletAddress), 1000000n);

            if (txBuilder.addMetadata) {
              txBuilder = txBuilder.addMetadata({ 1: chunkedMetadata });
            } else if (txBuilder.withMetadata) {
              txBuilder = txBuilder.withMetadata({ 1: chunkedMetadata });
            }

            const builtTx = await txBuilder.complete();
            const result = await signAndSubmitTransaction(builtTx, walletApi);
            txHash = result.txHash;
            
            console.log("Transaction submitted:", txHash);
          } catch (blockchainErr) {
            logTransactionError(blockchainErr, { 
              operation: TRANSACTION_OPERATIONS.DELETE,
              noteId: id,
              walletAddress 
            });
            console.error("Blockchain transaction failed:", handleTransactionError(blockchainErr, 'DELETE'));
          }
        }
      }

      // Step 2: Delete from backend
      await axios.delete(`${API_URL}/${id}`, {
        data: {
          txHash: txHash || null,
          walletAddress: walletAddress || null,
          metadataJson: metadataJson || null
        }
      });

      setNotes(prev => prev.filter(n => n.id !== id));
      addHistory("DELETED", existingNote);

      return true;
    } catch (err) {
      setError("Failed to delete note.");
      return false;
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

  const value = useMemo(() => ({
    notes,
    history,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    getNoteById,
    searchNotes,
  }), [notes, history, loading, error]);

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
