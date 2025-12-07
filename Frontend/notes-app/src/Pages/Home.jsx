import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Menu,
  Star,
  Edit3,
  X,
  ChevronRight,
} from "lucide-react";
import NoteCard from "../Components/NoteCard";
import NoteForm from "../Components/NoteForm";
import DeleteConfirmationModal from "../Components/DeleteConfirmationModal";
import WalletConnect from "../Components/WalletConnect";
import TransactionProgress from "../Components/TransactionProgress";
import TransactionNotifications from "../Components/TransactionNotifications";
import { useNotes } from "../context/NotesContext";
import useStatusPolling from "../hooks/useStatusPolling";

function Home() {
  const {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    searchNotes,
    history,
    isProcessing,
    currentStep,
    currentTxHash,
  } = useNotes();

  // Initialize status polling hook
  const { 
    isPolling, 
    pendingCount, 
    notifications, 
    dismissNotification 
  } = useStatusPolling();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All Notes");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [categories, setCategories] = useState(["All Notes"]);
  const [searchResults, setSearchResults] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [walletApi, setWalletApi] = useState(null);

  const handleSelectWallet = (e) => {
    setSelectedWallet(e.target.value);
    console.log("Selected wallet:", e.target.value);
  };

  const handleConnectWallet = async () => {
    if (window.cardano && selectedWallet) {
      try {
        const api = await window.cardano[selectedWallet].enable();
        setWalletApi(api);
        const addresses = await api.getUsedAddresses();
        console.log("Wallet Addresses:", addresses);
      } catch (error) {
        console.error("Error connecting to wallet:", error);
      }
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.cardano) setWallets(Object.keys(window.cardano));
  }, []);

  useEffect(() => {
    if (notes && notes.length > 0) {
      const uniqueCategories = [...new Set(notes.map((note) => note.category))];
      setCategories(["All Notes", ...uniqueCategories]);
    }
  }, [notes]);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm) searchNotes(searchTerm).then((res) => setSearchResults(res));
      else setSearchResults(null);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm, searchNotes]);

  const filteredNotes =
    searchResults ||
    notes.filter(
      (note) =>
        (activeCategory === "All Notes" || note.category === activeCategory) &&
        (note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const pinnedNotes = filteredNotes.filter((note) => note.pinned);
  const unpinnedNotes = filteredNotes.filter((note) => !note.pinned);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        new Date(date).getFullYear() !== new Date().getFullYear()
          ? "numeric"
          : undefined,
    });

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
  const handleSubmit = async (noteData) => {
    if (!noteData.title.trim()) return;
    if (editingNote) await updateNote(editingNote.id, noteData);
    else await createNote(noteData);
    closeModal();
  };

  const confirmDelete = (id) => {
    const note = notes.find((note) => note.id === id);
    if (note) {
      setNoteToDelete(note);
      setDeleteModalOpen(true);
    }
  };
  const handleDeleteNote = async () => {
    if (noteToDelete) {
      await deleteNote(noteToDelete.id);
      closeDeleteModal();
    }
  };
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setNoteToDelete(null);
  };
  const handleTogglePin = async (id) => await togglePin(id);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transform transition-transform duration-300 ease-in-out fixed md:relative bg-gradient-to-b from-slate-50 to-white h-full shadow-2xl z-50 w-[320px] md:w-[280px] md:translate-x-0 border-r border-slate-200 overflow-y-auto`}
      >
        {/* Header Section */}
        <div className="sticky top-0 z-10 p-6 bg-white/80 backdrop-blur-md border-b border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Edit3 size={22} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-bold text-slate-800 leading-tight">
                  Notes App
                </h1>
                <span className="text-[10px] text-slate-500 font-medium">
                  Powered by Cardano
                </span>
              </div>
            </div>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* New Note Button */}
          <button
            onClick={openCreateModal}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3.5 flex items-center justify-center gap-2.5 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 font-semibold text-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} strokeWidth={2.5} />
            Create Note
          </button>
        </div>

        {/* Categories Section */}
        <div className="px-4 py-6">
          {/* Categories */}
          <div className="mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3 px-3">
              Navigation
            </h3>
            <div className="space-y-1">
              {["All Notes", "History", ...categories.filter(c => c !== "All Notes")].map(
                (category) => {
                  const count =
                    category === "All Notes"
                      ? notes.length
                      : category === "History"
                      ? history.length
                      : notes.filter((note) => note.category === category).length;
                  const isActive = activeCategory === category;
                  
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        setActiveCategory(category);
                        if (isMobile) setSidebarOpen(false);
                      }}
                      className={`group w-full text-left py-2.5 px-4 rounded-xl flex items-center justify-between transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                          : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>
                        {category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-bold min-w-[24px] text-center transition-colors ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-slate-200 text-slate-600 group-hover:bg-slate-300"
                          }`}
                        >
                          {count}
                        </span>
                        {isActive && (
                          <ChevronRight size={16} className="text-white" strokeWidth={2.5} />
                        )}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* Wallet Section - Sticky at Bottom */}
        <div className="mt-auto border-t border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <div className="p-4">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3 px-2">
              Blockchain
            </h3>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <WalletConnect />
            </div>
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
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
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
              {/* Pending Transactions Indicator */}
              {pendingCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="relative">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                  <span className="text-xs font-medium text-blue-700">
                    {pendingCount} pending
                  </span>
                </div>
              )}
              
              <div className="text-sm text-gray-600 hidden sm:block">
                {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold text-sm">
                UN
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* History Section */}
          {activeCategory === "History" && (
            <div className="mb-6 max-w-6xl mx-auto">
              <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                Recent Activity
              </h2>
              {history.length === 0 ? (
                <p className="text-gray-500">No history yet.</p>
              ) : (
                <div className="space-y-2">
                  {history.slice(0, 10).map((entry, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 flex justify-between"
                    >
                      <div>
                        <span className="font-semibold">{entry.action}</span> "{entry.noteTitle}"
                      </div>
                      <div className="text-gray-400">
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes Section */}
          {activeCategory !== "History" && (
            <>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full text-red-500">
                  {error}
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Edit3 size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                    {searchTerm ? "No notes found" : "Start writing"}
                  </h3>
                  <p className="text-gray-500 mb-8 leading-relaxed">
                    {searchTerm
                      ? "Try adjusting your search terms to find what you're looking for."
                      : "Capture your thoughts, ideas, and reminders in one place. Create your first note to get started."}
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
                  {pinnedNotes.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-sm font-semibold text-gray-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <Star className="text-amber-500" size={16} fill="currentColor" />
                        Pinned Notes
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pinnedNotes.map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            onTogglePin={handleTogglePin}
                            onEdit={openEditModal}
                            onDelete={confirmDelete}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h2 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                      {activeCategory === "All Notes" ? "All Notes" : activeCategory}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {unpinnedNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onTogglePin={handleTogglePin}
                          onEdit={openEditModal}
                          onDelete={confirmDelete}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <NoteForm
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initialData={
          editingNote || {
            title: "",
            content: "",
            category: categories.length > 1 ? categories[1] : "",
          }
        }
        categories={categories.filter((cat) => cat !== "All Notes")}
        isEditing={!!editingNote}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteNote}
        noteTitle={noteToDelete?.title || ""}
      />

      {/* Transaction Progress Overlay */}
      <TransactionProgress 
        currentStep={currentStep} 
        txHash={currentTxHash} 
      />

      {/* Transaction Status Notifications */}
      <TransactionNotifications
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}

export default Home;
