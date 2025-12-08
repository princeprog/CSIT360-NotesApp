import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Menu, Star, ChevronRight, Settings, Edit3, X, RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import NoteCard from '../Components/NoteCard';
import DeleteConfirmationModal from '../Components/DeleteConfirmationModal';
import { useNotes } from '../context/NotesContext.jsx';

function NotesList() {
  const navigate = useNavigate();
  const { notes, togglePin, deleteNote, refreshNotes } = useNotes();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All Notes');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const categories = useMemo(() => ['All Notes', 'Work', 'Personal', 'Ideas'], []);

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

  const filteredNotes = useMemo(() => {
    let filtered = notes.filter(note => 
      (activeCategory === 'All Notes' || note.category === activeCategory) &&
      (note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
       note.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(note => {
        const status = note.status?.toUpperCase() || 'NONE';
        return status === statusFilter.toUpperCase();
      });
    }

    return filtered;
  }, [notes, activeCategory, searchTerm, statusFilter]);

  // Group notes by status
  const groupedNotes = useMemo(() => {
    const pending = filteredNotes.filter(note => note.status?.toUpperCase() === 'PENDING');
    const confirmed = filteredNotes.filter(note => note.status?.toUpperCase() === 'CONFIRMED');
    const failed = filteredNotes.filter(note => note.status?.toUpperCase() === 'FAILED');
    const other = filteredNotes.filter(note => !note.status || !['PENDING', 'CONFIRMED', 'FAILED'].includes(note.status?.toUpperCase()));

    return { pending, confirmed, failed, other };
  }, [filteredNotes]);

  // Status counts
  const statusCounts = useMemo(() => {
    const pending = notes.filter(note => note.status?.toUpperCase() === 'PENDING').length;
    const confirmed = notes.filter(note => note.status?.toUpperCase() === 'CONFIRMED').length;
    const failed = notes.filter(note => note.status?.toUpperCase() === 'FAILED').length;
    
    return { pending, confirmed, failed };
  }, [notes]);

  const pinnedNotes = filteredNotes.filter(note => note.pinned);
  const unpinnedNotes = filteredNotes.filter(note => !note.pinned);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: new Date(date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const confirmDelete = (id) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      setNoteToDelete(note);
      setDeleteModalOpen(true);
    }
  };

  const handleDelete = () => {
    if (noteToDelete) {
      deleteNote(noteToDelete.id);
      setNoteToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setNoteToDelete(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshNotes();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
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
            onClick={() => navigate('/create')}
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
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
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
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh notes"
                >
                  <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                
                <div className="text-sm text-gray-600 hidden sm:block">
                  {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold text-sm">
                  JD
                </div>
              </div>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setStatusFilter('All')}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  statusFilter === 'All'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              
              <button
                onClick={() => setStatusFilter('Pending')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  statusFilter === 'Pending'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <Clock size={14} />
                Pending
                {statusCounts.pending > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    statusFilter === 'Pending'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-200 text-amber-800'
                  }`}>
                    {statusCounts.pending}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setStatusFilter('Confirmed')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  statusFilter === 'Confirmed'
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                <CheckCircle size={14} />
                Confirmed
                {statusCounts.confirmed > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    statusFilter === 'Confirmed'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-200 text-green-800'
                  }`}>
                    {statusCounts.confirmed}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setStatusFilter('Failed')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  statusFilter === 'Failed'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                <AlertCircle size={14} />
                Failed
                {statusCounts.failed > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    statusFilter === 'Failed'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-200 text-red-800'
                  }`}>
                    {statusCounts.failed}
                  </span>
                )}
              </button>
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
                  onClick={() => navigate('/create')}
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
              {pinnedNotes.length > 0 && statusFilter === 'All' && (
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
                        onEdit={(n) => navigate(`/edit/${n.id}`)}
                        onDelete={(id) => confirmDelete(id)}
                        formatDate={formatDate}
                        onOpen={(n) => navigate(`/notes/${n.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Grouped by Status (when All is selected and notes exist) */}
              {statusFilter === 'All' ? (
                <>
                  {/* Pending Notes - Always at top */}
                  {groupedNotes.pending.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-sm font-semibold text-amber-700 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <Clock size={16} className="animate-pulse" />
                        Pending Transactions ({groupedNotes.pending.length})
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupedNotes.pending.map(note => (
                          <NoteCard 
                            key={note.id} 
                            note={note} 
                            onTogglePin={togglePin}
                            onEdit={(n) => navigate(`/edit/${n.id}`)}
                            onDelete={(id) => confirmDelete(id)}
                            formatDate={formatDate}
                            onOpen={(n) => navigate(`/notes/${n.id}`)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failed Notes */}
                  {groupedNotes.failed.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-sm font-semibold text-red-700 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <AlertCircle size={16} />
                        Failed Transactions ({groupedNotes.failed.length})
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupedNotes.failed.map(note => (
                          <NoteCard 
                            key={note.id} 
                            note={note} 
                            onTogglePin={togglePin}
                            onEdit={(n) => navigate(`/edit/${n.id}`)}
                            onDelete={(id) => confirmDelete(id)}
                            formatDate={formatDate}
                            onOpen={(n) => navigate(`/notes/${n.id}`)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confirmed Notes */}
                  {groupedNotes.confirmed.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-sm font-semibold text-green-700 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <CheckCircle size={16} />
                        Confirmed on Blockchain ({groupedNotes.confirmed.length})
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupedNotes.confirmed.map(note => (
                          <NoteCard 
                            key={note.id} 
                            note={note} 
                            onTogglePin={togglePin}
                            onEdit={(n) => navigate(`/edit/${n.id}`)}
                            onDelete={(id) => confirmDelete(id)}
                            formatDate={formatDate}
                            onOpen={(n) => navigate(`/notes/${n.id}`)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Notes (no blockchain status) */}
                  {groupedNotes.other.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                        {activeCategory === 'All Notes' ? 'Other Notes' : activeCategory}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groupedNotes.other.map(note => (
                          <NoteCard 
                            key={note.id} 
                            note={note} 
                            onTogglePin={togglePin}
                            onEdit={(n) => navigate(`/edit/${n.id}`)}
                            onDelete={(id) => confirmDelete(id)}
                            formatDate={formatDate}
                            onOpen={(n) => navigate(`/notes/${n.id}`)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Filtered view (single status selected)
                <div>
                  <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                    {statusFilter} Notes ({filteredNotes.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredNotes.map(note => (
                      <NoteCard 
                        key={note.id} 
                        note={note} 
                        onTogglePin={togglePin}
                        onEdit={(n) => navigate(`/edit/${n.id}`)}
                        onDelete={(id) => confirmDelete(id)}
                        formatDate={formatDate}
                        onOpen={(n) => navigate(`/notes/${n.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        noteTitle={noteToDelete?.title || ''}
      />
    </div>
  );
}

export default NotesList;


