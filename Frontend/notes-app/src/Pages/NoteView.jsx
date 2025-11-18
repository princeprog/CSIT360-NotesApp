import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotes } from '../context/NotesContext';
import { ArrowLeft, Edit, Trash2, Star, Calendar, Clock, CheckCircle, AlertCircle, History } from 'lucide-react';
import TransactionHistoryModal from '../Components/TransactionHistoryModal';
import DeleteConfirmationModal from '../Components/DeleteConfirmationModal';

function NoteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getNoteById, deleteNote, togglePin, loading, error, getNoteBlockchainStatus } = useNotes();
  const [note, setNote] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingNote, setLoadingNote] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState("none");

  useEffect(() => {
    const fetchNote = async () => {
      setLoadingNote(true);
      setLoadingError(null);

      // Validate ID before fetching
      if (!id || isNaN(parseInt(id))) {
        setLoadingError("Invalid note ID");
        setLoadingNote(false);
        return;
      }

      const fetchedNote = await getNoteById(id);
      
      if (fetchedNote) {
        setNote(fetchedNote);
        // Get blockchain status
        const status = await getNoteBlockchainStatus(fetchedNote.id);
        setBlockchainStatus(status);
      } else {
        setLoadingError("Could not find the requested note");
      }
      
      setLoadingNote(false);
    };

    fetchNote();
  }, [id, getNoteById]);

  const handleDelete = async () => {
    const success = await deleteNote(id);
    if (success) {
      navigate('/notes');
    }
    setIsDeleting(false);
  };

  const handlePin = async () => {
    if (note) {
      await togglePin(note.id);
      // Update local note state to reflect the change
      setNote(prev => prev ? { ...prev, pinned: !prev.pinned } : null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loadingNote || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (loadingError || error || !note) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-8">
          <button 
            onClick={() => navigate('/notes')}
            className="flex items-center text-gray-600 hover:text-blue-600 mb-6"
          >
            <ArrowLeft size={20} className="mr-2" /> Back to notes
          </button>
          
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-red-500 mb-4">
              {loadingError || error || "Note not found"}
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't find the note you're looking for.
            </p>
            <button
              onClick={() => navigate('/notes')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Return to Notes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigate('/notes')}
              className="flex items-center text-gray-600 hover:text-blue-600"
            >
              <ArrowLeft size={20} className="mr-2" /> Back to notes
            </button>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={handlePin} 
                className={`p-2 rounded-full ${note.pinned ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
                title={note.pinned ? "Unpin note" : "Pin note"}
              >
                <Star size={20} fill={note.pinned ? "currentColor" : "none"} />
              </button>
              
              <button 
                onClick={() => navigate(`/edit/${note.id}`)}
                className="p-2 rounded-full text-gray-400 hover:text-blue-500"
                title="Edit note"
              >
                <Edit size={20} />
              </button>
              
              <button 
                onClick={() => setIsDeleting(true)}
                className="p-2 rounded-full text-gray-400 hover:text-red-500"
                title="Delete note"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                {note.category}
              </span>
              
              {/* Blockchain Status Badge */}
              {blockchainStatus !== "none" && (
                <div className="flex items-center gap-2">
                  {blockchainStatus === "pending" && (
                    <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                      <Clock size={14} className="animate-pulse" />
                      Pending on Blockchain
                    </span>
                  )}
                  {blockchainStatus === "confirmed" && (
                    <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      <CheckCircle size={14} />
                      Confirmed on Blockchain
                    </span>
                  )}
                  {blockchainStatus === "failed" && (
                    <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      <AlertCircle size={14} />
                      Failed on Blockchain
                    </span>
                  )}
                  
                  <button 
                    onClick={() => setShowTransactionHistory(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <History size={14} />
                    View Transactions
                  </button>
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{note.title}</h1>
            
            <div className="flex items-center text-gray-500 text-sm mb-6">
              <Calendar size={16} className="mr-1" />
              <span>{formatDate(note.updatedAt || note.createdAt)}</span>
            </div>
            
            <div className="prose prose-lg max-w-none">
              {note.content.split('\n').map((paragraph, idx) => (
                paragraph ? <p key={idx}>{paragraph}</p> : <br key={idx} />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <DeleteConfirmationModal
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={handleDelete}
        noteTitle={note.title}
      />
      
      {/* Transaction History Modal */}
      <TransactionHistoryModal
        isOpen={showTransactionHistory}
        onClose={() => setShowTransactionHistory(false)}
      />
    </div>
  );
}

export default NoteView;