import { createContext, useContext, useMemo, useState } from 'react';

const NotesContext = createContext(null);

export const NotesProvider = ({ children }) => {
  const [notes, setNotes] = useState([
    { 
      id: 1, 
      title: 'Project Planning', 
      content: 'Review project requirements and create timeline for Q4 deliverables. Schedule team meetings and allocate resources accordingly.', 
      category: 'Work', 
      pinned: true, 
      createdAt: new Date('2024-09-20'),
      updatedAt: new Date('2024-09-20')
    },
    { 
      id: 2, 
      title: 'Shopping List', 
      content: 'Weekly groceries: Organic vegetables, fresh fruits, whole grain bread, almond milk, Greek yogurt', 
      category: 'Personal', 
      pinned: false, 
      createdAt: new Date('2024-09-19'),
      updatedAt: new Date('2024-09-19')
    },
    { 
      id: 3, 
      title: 'Reading List', 
      content: 'Books to read: "Atomic Habits" by James Clear, "The Design of Everyday Things" by Don Norman', 
      category: 'Personal', 
      pinned: false, 
      createdAt: new Date('2024-09-18'),
      updatedAt: new Date('2024-09-18')
    },
  ]);

  const createNote = (noteData) => {
    const now = new Date();
    const newNote = {
      id: Date.now(),
      title: noteData.title,
      content: noteData.content,
      category: noteData.category || 'Personal',
      pinned: false,
      createdAt: now,
      updatedAt: now
    };
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const updateNote = (id, noteData) => {
    const now = new Date();
    setNotes(prev => prev.map(n => n.id === id ? {
      ...n,
      title: noteData.title,
      content: noteData.content,
      category: noteData.category || n.category,
      updatedAt: now
    } : n));
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const togglePin = (id) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const getNoteById = (id) => notes.find(n => n.id === id);

  const value = useMemo(() => ({
    notes,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    getNoteById,
  }), [notes]);

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


