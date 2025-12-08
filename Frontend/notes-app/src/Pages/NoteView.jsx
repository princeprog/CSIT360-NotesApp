import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotes } from '../context/NotesContext';
import { ArrowLeft, Edit, Trash2, Star, Calendar, Clock, CheckCircle, AlertCircle, History, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import TransactionHistoryModal from '../Components/TransactionHistoryModal';
import DeleteConfirmationModal from '../Components/DeleteConfirmationModal';

function NoteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    getNoteById, 
    deleteNote, 
    togglePin, 
    loading, 
    error, 
    getNoteBlockchainStatus,
    getTransactionStatus,
    retryFailedTransaction 
  } = useNotes();
  const [note, setNote] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingNote, setLoadingNote] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState("none");
  const [transactionData, setTransactionData] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

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
        
        // Get transaction data if note has a transaction
        if (fetchedNote.id) {
          const txData = await getTransactionStatus(fetchedNote.id);
          setTransactionData(txData);
        }
      } else {
        setLoadingError("Could not find the requested note");
      }
      
      setLoadingNote(false);
    };

    fetchNote();
  }, [id, getNoteById, getTransactionStatus, getNoteBlockchainStatus]);

  // Auto-refresh for pending transactions
  useEffect(() => {
    let intervalId;
    
    if (blockchainStatus === 'pending' && note?.id) {
      intervalId = setInterval(async () => {
        const txData = await getTransactionStatus(note.id);
        setTransactionData(txData);
        
        if (txData?.status === 'CONFIRMED' || txData?.status === 'FAILED') {
          const status = await getNoteBlockchainStatus(note.id);
          setBlockchainStatus(status);
          
          // Refresh the note to get updated data
          const updatedNote = await getNoteById(id);
          if (updatedNote) {
            setNote(updatedNote);
          }
        }
      }, 10000); // Poll every 10 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [blockchainStatus, note?.id, getTransactionStatus, getNoteBlockchainStatus, getNoteById, id]);

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

  const handleCopyTxHash = async (txHash) => {
    try {
      await navigator.clipboard.writeText(txHash);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRetryTransaction = async () => {
    if (!note?.id) return;
    
    setIsRetrying(true);
    try {
      const result = await retryFailedTransaction(note.id);
      
      if (result.success) {
        // Refresh transaction data
        const txData = await getTransactionStatus(note.id);
        setTransactionData(txData);
        
        const status = await getNoteBlockchainStatus(note.id);
        setBlockchainStatus(status);
        
        // Refresh the note
        const updatedNote = await getNoteById(id);
        if (updatedNote) {
          setNote(updatedNote);
        }
      }
    } catch (err) {
      console.error('Failed to retry transaction:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const getTxExplorerUrl = (txHash) => {
    return `https://preview.cardanoscan.io/transaction/${txHash}`;
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

            {/* Transaction Details Section */}
            {(note.txHash || note.latestTxHash || transactionData) && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Transaction Details</h3>
                
                {/* Transaction Hash */}
                {(note.txHash || note.latestTxHash || transactionData?.txHash) && (
                  <div className="mb-3">
                    <label className="text-xs text-gray-600 block mb-1">Transaction Hash</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white px-3 py-2 rounded border border-gray-300 font-mono break-all">
                        {note.latestTxHash || note.txHash || transactionData?.txHash}
                      </code>
                      <button
                        onClick={() => handleCopyTxHash(note.latestTxHash || note.txHash || transactionData?.txHash)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded transition-colors"
                        title="Copy transaction hash"
                      >
                        <Copy size={16} />
                      </button>
                      <a
                        href={getTxExplorerUrl(note.latestTxHash || note.txHash || transactionData?.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded transition-colors"
                        title="View on Cardano Explorer"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                    {copySuccess && (
                      <span className="text-xs text-green-600 mt-1 block">Copied to clipboard!</span>
                    )}
                  </div>
                )}

                {/* Transaction Status with Actions */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Status</label>
                    <div className="flex items-center gap-2">
                      {blockchainStatus === 'pending' && (
                        <span className="flex items-center gap-1 text-sm text-amber-700">
                          <Clock size={14} className="animate-pulse" />
                          Pending Confirmation
                          <span className="text-xs text-gray-500 ml-1">(Auto-refreshing...)</span>
                        </span>
                      )}
                      {blockchainStatus === 'confirmed' && (
                        <span className="flex items-center gap-1 text-sm text-green-700">
                          <CheckCircle size={14} />
                          Confirmed on Blockchain
                        </span>
                      )}
                      {blockchainStatus === 'failed' && (
                        <span className="flex items-center gap-1 text-sm text-red-700">
                          <AlertCircle size={14} />
                          Transaction Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {blockchainStatus === 'failed' && (
                      <button
                        onClick={handleRetryTransaction}
                        disabled={isRetrying}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
                        {isRetrying ? 'Retrying...' : 'Retry Transaction'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowTransactionHistory(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                    >
                      <History size={14} />
                      View History
                    </button>
                  </div>
                </div>

                {/* Additional Transaction Info */}
                {transactionData && (
                  <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
                    {transactionData.blockHeight && (
                      <div>
                        <span className="text-gray-600">Block Height:</span>
                        <span className="ml-1 font-mono">{transactionData.blockHeight}</span>
                      </div>
                    )}
                    {transactionData.confirmedAt && (
                      <div>
                        <span className="text-gray-600">Confirmed:</span>
                        <span className="ml-1">{formatDate(transactionData.confirmedAt)}</span>
                      </div>
                    )}
                    {transactionData.retryCount > 0 && (
                      <div>
                        <span className="text-gray-600">Retry Count:</span>
                        <span className="ml-1">{transactionData.retryCount}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
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