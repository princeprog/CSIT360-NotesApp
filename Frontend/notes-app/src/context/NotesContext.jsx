import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Blockfrost, WebWallet, Blaze, Core } from "@blaze-cardano/sdk";
import { useBlockchain } from './BlockchainContext';

const API_URL = 'http://localhost:8080/api/notes';
const NotesContext = createContext(null);

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [history, setHistory] = useState([]); // ✅ NEW
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { trackTransaction, getNoteBlockchainStatus } = useBlockchain();

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
  const signAndSubmitTransaction = async (builtTx, walletApi, noteId, action) => {
    if (!builtTx || !walletApi) {
      throw new Error("Built transaction and wallet API are required");
    }

    try {
      const txCbor = builtTx.toCbor();
      const witnessSet = await walletApi.signTx(txCbor, true);

      const signedTx = Core.Transaction.fromCbor(Core.HexBlob(txCbor));
      const witnesses = Core.TransactionWitnessSet.fromCbor(Core.HexBlob(witnessSet));
      signedTx.setWitnessSet(witnesses);

      const signedTxCbor = signedTx.toCbor();
      const txHash = await walletApi.submitTx(signedTxCbor);
      
      // Track the transaction in blockchain context
      if (noteId) {
        trackTransaction(txHash, noteId, action);
      }
      
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
    let createdNote = null;
    
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Make a copy of the note data to prevent any reference issues
      const noteToCreate = {
        title: noteData.title.trim(),
        content: noteData.content || '', // Ensure content is never null
        category: noteData.category || 'Personal',
        pinned: false,
      };
      
      // API call to create the note
      const response = await axios.post(API_URL, noteToCreate);
      createdNote = response.data;

      // Update local state only after successful API call
      setNotes(prev => [createdNote, ...prev]);
      addHistory("CREATED", createdNote); // ✅ history

      // CARDANO TX (UNCHANGED)
      const PRESET_RECIPIENT = 'addr_test1vr02t0ctx9qpja5s67e5qzzqyee98qazut2zl89yxn24a0ccz4cvy';
      const PRESET_AMOUNT = 1000000n;

      const buildTxForNote = async (note) => {
        const projectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
        if (!projectId) return;

        const lastConnected = localStorage.getItem("connectedWallet");
        if (!lastConnected || !window.cardano?.[lastConnected]) return;

        let api;
        try { api = await window.cardano[lastConnected].enable(); }
        catch { return; }

        const provider = new Blockfrost({ network: 'cardano-preview', projectId });
        const wallet = new WebWallet(api);
        let blaze;

        try { blaze = await Blaze.from(provider, wallet); }
        catch { return; }

        const metadata = {
          1: {
            noteId: String(note.id),
            title: note.title,
            content: note.content,
            category: note.category
          }
        };

        try {
          let txBuilder = blaze
            .newTransaction()
            .payLovelace(Core.Address.fromBech32(PRESET_RECIPIENT), PRESET_AMOUNT);

          if (txBuilder.addMetadata) txBuilder = txBuilder.addMetadata(metadata);
          else if (txBuilder.withMetadata) txBuilder = txBuilder.withMetadata(metadata);

          const builtTx = await txBuilder.complete();
          await signAndSubmitTransaction(builtTx, api, createdNote.id, "CREATE");
        } catch (txErr) {
          console.error("Error in blockchain transaction:", txErr);
          // Don't fail the whole operation if blockchain part fails
        }
      };

      // Only attempt blockchain transaction if note was created successfully
      if (createdNote && createdNote.id) {
        try {
          await buildTxForNote(createdNote);
        } catch (blockchainErr) {
          console.error("Blockchain transaction failed:", blockchainErr);
          // Note is still created even if blockchain part fails
        }
      }
      
      return createdNote;
    } catch (err) {
      console.error("Error creating note:", err);
      const errorMsg = err.response?.data?.message || "Failed to create note. Please try again.";
      setError(errorMsg);
      throw new Error(errorMsg); // Throw a cleaner error for the component to catch
    } finally {
      setLoading(false);
    }
  };

  // UPDATE NOTE
  const updateNote = async (id, noteData) => {
    if (!id) return null;

    try {
      setLoading(true);
      const response = await axios.put(`${API_URL}/${id}`, {
        title: noteData.title,
        content: noteData.content,
        category: noteData.category,
        pinned: noteData.pinned,
      });

      setNotes(prev => prev.map(n => n.id === id ? response.data : n));
      addHistory("UPDATED", response.data); // ✅ history

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

    try {
      setLoading(true);
      await axios.delete(`${API_URL}/${id}`);

      setNotes(prev => prev.filter(n => n.id !== id));
      addHistory("DELETED", existingNote); // ✅ history

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

      addHistory(response.data.pinned ? "PINNED" : "UNPINNED", response.data); // ✅ history

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
    history,      // ✅ EXPOSED to UI
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    getNoteById,
    searchNotes,
    getNoteBlockchainStatus, // Expose blockchain status function
  }), [notes, history, loading, error, getNoteBlockchainStatus]);

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
