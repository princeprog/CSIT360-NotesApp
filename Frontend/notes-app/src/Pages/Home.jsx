import { useState, useEffect } from 'react';
import NoteCard from '../Components/NoteCard';
import NoteForm from '../Components/NoteForm';
import DeleteConfirmationModal from '../Components/DeleteConfirmationModal';
import { Search, Plus, Menu, Star, Trash2, Edit3, X, ChevronRight, Settings, Save } from 'lucide-react';

function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All Notes');
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

  const categories = ['All Notes', 'Work', 'Personal', 'Ideas'];
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  // NoteForm manages its own form data
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredNotes = notes.filter(note => 
    (activeCategory === 'All Notes' || note.category === activeCategory) &&
    (note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
     note.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const pinnedNotes = filteredNotes.filter(note => note.pinned);
  const unpinnedNotes = filteredNotes.filter(note => !note.pinned);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: new Date(date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const openCreateModal = () => {
    setEditingNote(null);
    setIsModalOpen(true);
  };

  const openEditModal = (note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleSubmit = (noteData) => {
    if (noteData.title.trim() === '') return;
    
    const now = new Date();
    
    if (editingNote) {
      // Update existing note
      setNotes(notes.map(note => 
        note.id === editingNote.id 
          ? { 
              ...note, 
              title: noteData.title,
              content: noteData.content,
              category: noteData.category,
              updatedAt: now
            }
          : note
      ));
    } else {
      // Create new note
      const newNote = {
        id: Date.now(),
        title: noteData.title,
        content: noteData.content,
        category: noteData.category,
        pinned: false,
        createdAt: now,
        updatedAt: now
      };
      setNotes([newNote, ...notes]);
    }
    
    closeModal();
  };

  const confirmDelete = (id) => {
    const note = notes.find(note => note.id === id);
    if (note) {
      setNoteToDelete(note);
      setDeleteModalOpen(true);
    }
  };

  const deleteNote = () => {
    if (noteToDelete) {
      setNotes(notes.filter(note => note.id !== noteToDelete.id));
      setNoteToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setNoteToDelete(null);
  };

  const togglePin = (id) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, pinned: !note.pinned } : note
    ));
  };

  // NoteCard component has been moved to its own file

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transform transition-transform duration-300 ease-in-out fixed md:relative bg-white h-full shadow-xl z-50 w-80 md:w-72 md:translate-x-0 border-r border-gray-200`}>
        
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Edit3 size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Notes</h1>
            </div>
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          {/* New Note Button */}
          <button 
            onClick={openCreateModal}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl py-4 mb-8 flex items-center justify-center gap-2 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            <Plus size={20} />
            New Note
          </button>
          
          {/* Categories */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 px-2">
              Categories
            </h3>
            <div className="space-y-1">
              {categories.map(category => {
                const count = category === 'All Notes' 
                  ? notes.length 
                  : notes.filter(note => note.category === category).length;
                
                return (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveCategory(category);
                      if (isMobile) setSidebarOpen(false);
                    }}
                    className={`w-full text-left py-3 px-4 rounded-xl flex items-center justify-between transition-all ${
                      activeCategory === category 
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' 
                        : 'hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <span>{category}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        activeCategory === category 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {count}
                      </span>
                      {activeCategory === category && <ChevronRight size={16} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Settings */}
          <div className="mt-auto pt-6 border-t border-gray-100">
            <button className="w-full text-left py-3 px-4 rounded-xl flex items-center gap-3 hover:bg-gray-50 text-gray-600 transition-colors">
              <Settings size={18} />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 md:hidden transition-colors"
              >
                <Menu size={24} />
              </button>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search notes..."
                  className="pl-10 pr-4 py-3 rounded-xl bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all w-64 md:w-80 border-0 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 hidden sm:block">
                {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold text-sm">
                JD
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Edit3 size={32} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                {searchTerm ? 'No notes found' : 'Start writing'}
              </h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                {searchTerm 
                  ? 'Try adjusting your search terms to find what you\'re looking for.' 
                  : 'Capture your thoughts, ideas, and reminders in one place. Create your first note to get started.'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={openCreateModal}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 font-semibold"
                >
                  <Plus size={20} />
                  Create your first note
                </button>
              )}
            </div>
          ) : (
            <div className="max-w-6xl mx-auto">
              {/* Pinned Notes */}
              {pinnedNotes.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-sm font-semibold text-gray-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <Star className="text-amber-500" size={16} fill="currentColor" />
                    Pinned Notes
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pinnedNotes.map(note => (
                      <NoteCard 
                        key={note.id} 
                        note={note} 
                        onTogglePin={togglePin}
                        onEdit={openEditModal}
                        onDelete={confirmDelete}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Notes */}
              <div>
                <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                  {activeCategory === 'All Notes' ? 'All Notes' : activeCategory}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {unpinnedNotes.map(note => (
                    <NoteCard 
                      key={note.id} 
                      note={note} 
                      onTogglePin={togglePin}
                      onEdit={openEditModal}
                      onDelete={confirmDelete}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Note Form Modal */}
      <NoteForm 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initialData={editingNote || { title: '', content: '', category: 'Personal' }}
        categories={categories.filter(cat => cat !== 'All Notes')}
        isEditing={!!editingNote}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteNote}
        noteTitle={noteToDelete?.title || ''}
      />
    </div>
  );
}

export default Home;