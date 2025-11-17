import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Blockfrost, WebWallet, Blaze, Core } from "@blaze-cardano/sdk"; // <-- added

const API_URL = 'http://localhost:8080/api/notes';
const NotesContext = createContext(null);

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all notes on component mount
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const response = await axios.get(API_URL);
        setNotes(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching notes:", err);
        setError("Failed to fetch notes. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const createNote = async (noteData) => {
    try {
      setLoading(true);
      const response = await axios.post(API_URL, {
        title: noteData.title,
        content: noteData.content,
        category: noteData.category || 'Personal',
        pinned: false,
      });
      
      setNotes(prev => [response.data, ...prev]);
      setError(null);

      // --- BUILD TX: try to build a transaction including the created note as metadata ---
      // Hardcoded recipient and amount per request
      const PRESET_RECIPIENT = 'addr_test1vr02t0ctx9qpja5s67e5qzzqyee98qazut2zl89yxn24a0ccz4cvy';
      const PRESET_AMOUNT = 1000000n; // lovelaces

      const buildTxForNote = async (note) => {
        const projectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
        if (!projectId) {
          console.warn("Blockfrost project ID missing; skipping tx build.");
          return;
        }

        // try to enable the last connected wallet (WalletProvider saves it to localStorage)
        const lastConnected = localStorage.getItem("connectedWallet");
        if (!lastConnected || !window.cardano?.[lastConnected]) {
          console.warn("No connected wallet available to enable; skipping tx build.");
          return;
        }

        let api;
        try {
          api = await window.cardano[lastConnected].enable();
        } catch (err) {
          console.warn("Failed to enable wallet for tx build:", err);
          return;
        }

        // create provider + blaze instance
        const provider = new Blockfrost({ network: 'cardano-preview', projectId });
        const wallet = new WebWallet(api);
        let blaze;
        try {
          blaze = await Blaze.from(provider, wallet);
        } catch (err) {
          console.warn("Failed to create Blaze instance for tx build:", err);
          return;
        }

        // prepare metadata (label 1)
        const metadata = {
          1: {
            noteId: String(note.id),
            title: note.title || "",
            content: note.content || "",
            category: note.category || ""
          }
        };

        try {
          let txBuilder = blaze
            .newTransaction()
            .payLovelace(Core.Address.fromBech32(PRESET_RECIPIENT), PRESET_AMOUNT);

          if (metadata) {
            if (typeof txBuilder.addMetadata === "function") {
              txBuilder = txBuilder.addMetadata(metadata);
            } else if (typeof txBuilder.withMetadata === "function") {
              txBuilder = txBuilder.withMetadata(metadata);
            } else {
              console.warn("Blaze builder does not support attaching metadata directly; metadata will be logged as fallback.");
            }
          }

          const builtTx = await txBuilder.complete();
          const txCbor = builtTx.toCbor();
          console.log("Built transaction CBOR (from createNote):", txCbor);
          console.log("Metadata attached/used for tx build:", metadata);
        } catch (err) {
          console.warn("Error building transaction for note:", err);
        }
      };

      // await build so build is prioritized; errors are handled inside the function
      await buildTxForNote(response.data);

      return response.data;
    } catch (err) {
      console.error("Error creating note:", err);
      setError("Failed to create note. Please try again later.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async (id, noteData) => {
    if (!id || isNaN(parseInt(id))) {
      setError("Invalid note ID");
      return null;
    }

    try {
      setLoading(true);
      const response = await axios.put(`${API_URL}/${id}`, {
        title: noteData.title,
        content: noteData.content,
        category: noteData.category,

        pinned: noteData.pinned,

      });
      
      setNotes(prev => prev.map(n => n.id === parseInt(id) ? response.data : n));
      setError(null);

      // --- BUILD UPDATE TX: send a new tx describing the update (build-only) ---
      const PRESET_RECIPIENT = 'addr_test1vr02t0ctx9qpja5s67e5qzzqyee98qazut2zl89yxn24a0ccz4cvy';
      const PRESET_AMOUNT = 1000000n; // lovelaces

      const buildUpdateTx = async (updatedNote) => {
        const projectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
        if (!projectId) {
          console.warn("Blockfrost project ID missing; skipping tx build for update.");
          return;
        }

        const lastConnected = localStorage.getItem("connectedWallet");
        if (!lastConnected || !window.cardano?.[lastConnected]) {
          console.warn("No connected wallet available to enable; skipping tx build for update.");
          return;
        }

        let api;
        try {
          api = await window.cardano[lastConnected].enable();
        } catch (err) {
          console.warn("Failed to enable wallet for tx build (update):", err);
          return;
        }

        const provider = new Blockfrost({ network: 'cardano-preview', projectId });
        const wallet = new WebWallet(api);
        let blaze;
        try {
          blaze = await Blaze.from(provider, wallet);
        } catch (err) {
          console.warn("Failed to create Blaze instance for update tx build:", err);
          return;
        }

        // metadata describing the update action
        const metadata = {
          1: {
            action: "Updated",
            noteId: String(updatedNote.id),
            title: updatedNote.title || "",
            content: updatedNote.content || "",
            category: updatedNote.category || ""
          }
        };

        try {
          let txBuilder = blaze
            .newTransaction()
            .payLovelace(Core.Address.fromBech32(PRESET_RECIPIENT), PRESET_AMOUNT);

          if (typeof txBuilder.addMetadata === "function") {
            txBuilder = txBuilder.addMetadata(metadata);
          } else if (typeof txBuilder.withMetadata === "function") {
            txBuilder = txBuilder.withMetadata(metadata);
          } else {
            console.warn("Blaze builder does not support attaching metadata directly; metadata will be logged as fallback.");
          }

          const builtTx = await txBuilder.complete();
          const txCbor = builtTx.toCbor();
          console.log("Built UPDATE transaction CBOR (from updateNote):", txCbor);
          console.log("Update metadata used for tx build:", metadata);
        } catch (err) {
          console.warn("Error building UPDATE transaction for note:", err);
        }
      };

      // prioritize build (await) but do not fail update if build fails
      await buildUpdateTx(response.data);

      return response.data;
    } catch (err) {
      console.error("Error updating note:", err);
      setError("Failed to update note. Please try again later.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (id) => {
    if (!id || isNaN(parseInt(id))) {
      setError("Invalid note ID");
      return false;
    }

    // capture existing note from state (if present) so we can include info in metadata
    const existingNote = notes.find(n => n.id === parseInt(id));

    try {
      setLoading(true);
      await axios.delete(`${API_URL}/${id}`);
      setNotes(prev => prev.filter(n => n.id !== parseInt(id)));
      setError(null);

      // --- BUILD DELETE TX: log a tx that records the deletion action (build-only) ---
      const PRESET_RECIPIENT = 'addr_test1vr02t0ctx9qpja5s67e5qzzqyee98qazut2zl89yxn24a0ccz4cvy';
      const PRESET_AMOUNT = 1000000n; // lovelaces

      const buildDeleteTx = async (noteForMeta) => {
        const projectId = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
        if (!projectId) {
          console.warn("Blockfrost project ID missing; skipping tx build for delete.");
          return;
        }

        const lastConnected = localStorage.getItem("connectedWallet");
        if (!lastConnected || !window.cardano?.[lastConnected]) {
          console.warn("No connected wallet available to enable; skipping tx build for delete.");
          return;
        }

        let api;
        try {
          api = await window.cardano[lastConnected].enable();
        } catch (err) {
          console.warn("Failed to enable wallet for tx build (delete):", err);
          return;
        }

        const provider = new Blockfrost({ network: 'cardano-preview', projectId });
        const wallet = new WebWallet(api);
        let blaze;
        try {
          blaze = await Blaze.from(provider, wallet);
        } catch (err) {
          console.warn("Failed to create Blaze instance for delete tx build:", err);
          return;
        }

        // metadata describing the delete action
        const metadata = {
          1: {
            action: "Deleted",
            noteId: String(id),
            // include optional fields from captured note if available
            title: noteForMeta?.title || "",
            content: noteForMeta?.content || "",
            category: noteForMeta?.category || ""
          }
        };

        try {
          let txBuilder = blaze
            .newTransaction()
            .payLovelace(Core.Address.fromBech32(PRESET_RECIPIENT), PRESET_AMOUNT);

          if (typeof txBuilder.addMetadata === "function") {
            txBuilder = txBuilder.addMetadata(metadata);
          } else if (typeof txBuilder.withMetadata === "function") {
            txBuilder = txBuilder.withMetadata(metadata);
          } else {
            console.warn("Blaze builder does not support attaching metadata directly; metadata will be logged as fallback.");
          }

          const builtTx = await txBuilder.complete();
          const txCbor = builtTx.toCbor();
          console.log("Built DELETE transaction CBOR (from deleteNote):", txCbor);
          console.log("Delete metadata used for tx build:", metadata);
        } catch (err) {
          console.warn("Error building DELETE transaction for note:", err);
        }
      };

      // await build so build is prioritized but do not fail delete if build fails
      await buildDeleteTx(existingNote);

      return true;
    } catch (err) {
      console.error("Error deleting note:", err);
      setError("Failed to delete note. Please try again later.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async (id) => {
    if (!id || isNaN(parseInt(id))) {
      setError("Invalid note ID");
      return false;
    }

    try {
      setLoading(true);
      // Use the dedicated endpoint with PATCH method instead of PUT with full update
      const response = await axios.patch(`${API_URL}/${id}/toggle-pin`);
      
      // Update the note in the state with the response data
      setNotes(prev => prev.map(n => n.id === parseInt(id) ? response.data : n));
      setError(null);
      return true;
    } catch (err) {
      console.error("Error toggling pin status:", err);
      setError("Failed to update pin status. Please try again later.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getNoteById = async (id) => {
    // If no id provided, just return null (don't set global error)
    if (id === undefined || id === null || id === '') {
      return null;
    }

    // Normalize id to string and try to find in current state first
    const idStr = String(id);
    const existingNote = notes.find(n => String(n.id) === idStr);
    if (existingNote) return existingNote;

    // If not in state, attempt to fetch from backend.
    // Do NOT flip the global loading flag here to avoid UI-wide "loading" states.
    try {
      const response = await axios.get(`${API_URL}/${encodeURIComponent(idStr)}`);
      return response.data;
    } catch (err) {
      // Log for debugging but avoid setting a global error that breaks the page view
      console.error(`Error fetching note with ID ${id}:`, err);
      return null;
    }
  };

  const searchNotes = async (keyword) => {
    if (!keyword || typeof keyword !== 'string') {
      return notes; // Return all notes if no valid keyword
    }
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/search?keyword=${encodeURIComponent(keyword)}`);
      setError(null);
      return response.data;
    } catch (err) {
      console.error("Error searching notes:", err);
      setError("Failed to search notes. Please try again later.");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    getNoteById,
    searchNotes,
  }), [notes, loading, error]);

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