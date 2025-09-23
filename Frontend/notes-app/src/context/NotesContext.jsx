import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

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
      });
      
      setNotes(prev => prev.map(n => n.id === parseInt(id) ? response.data : n));
      setError(null);
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

    try {
      setLoading(true);
      await axios.delete(`${API_URL}/${id}`);
      setNotes(prev => prev.filter(n => n.id !== parseInt(id)));
      setError(null);
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
    // Validate ID before making API call
    if (!id || isNaN(parseInt(id))) {
      setError("Invalid note ID");
      return null;
    }
    
    const numericId = parseInt(id);
    
    // First check if we already have the note in state
    const existingNote = notes.find(n => n.id === numericId);
    if (existingNote) return existingNote;
    
    // If not, fetch it from the API
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/${numericId}`);
      setError(null);
      return response.data;
    } catch (err) {
      console.error(`Error fetching note with ID ${id}:`, err);
      setError("Failed to fetch the note. Please try again later.");
      return null;
    } finally {
      setLoading(false);
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