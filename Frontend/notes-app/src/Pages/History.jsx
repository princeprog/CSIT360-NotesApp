import { useNotes } from "../context/NotesContext";
import { useBlockchain } from "../context/BlockchainContext";
import { Clock, ArrowLeft, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

function History() {
  const navigate = useNavigate();
  const { history } = useNotes();
  const { transactionHistory } = useBlockchain();
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  const truncateHash = (hash) => {
    if (!hash) return '';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="text-amber-500" />;
      case 'confirmed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} />;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button 
        onClick={() => navigate('/notes')}
        className="flex items-center text-gray-600 hover:text-blue-600 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" /> Back to notes
      </button>
      
      <h1 className="text-2xl font-bold mb-6">Activity History</h1>

<<<<<<< HEAD
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Note Activity History */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Note Activities</h2>
          {history.length === 0 ? (
            <p className="text-gray-500">No note activity yet.</p>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-xl shadow flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold">{item.action}</p>
                    <p className="text-gray-600 text-sm">
                      {item.noteTitle} — {item.category}
                    </p>
                  </div>
=======
      {history.length === 0 ? (
        <p className="text-gray-500">No history.</p>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-white rounded-xl shadow flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{item.action}</p>
                <p className="text-gray-600 text-sm">
                  {item.noteTitle} — {item.category}
                </p>
              </div>
>>>>>>> ecdc479e3abe3b2994fff9157ae9b0a31b0030cb

                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Clock size={16} />
                    {formatDate(item.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Blockchain Transactions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Blockchain Transactions</h2>
          {transactionHistory.length === 0 ? (
            <p className="text-gray-500">No blockchain transactions yet.</p>
          ) : (
            <div className="space-y-4">
              {transactionHistory.map((tx) => (
                <div
                  key={tx.txHash}
                  className={`p-4 bg-white rounded-xl shadow border-l-4 ${tx.status === 'pending' ? 'border-amber-400' : tx.status === 'confirmed' ? 'border-green-400' : 'border-red-400'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tx.status)}
                      <span className="font-semibold">{tx.action} Note</span>
                    </div>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {tx.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Transaction:</span>
                      <span className="font-mono">{truncateHash(tx.txHash)}</span>
                      <a
                        href={`https://preview.cexplorer.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                    <div>
                      <span className="text-gray-500">Note ID:</span> {tx.noteId}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {formatDate(tx.timestamp)}
                    {tx.status === 'confirmed' && tx.confirmedAt && (
                      <span className="ml-2">
                        • Confirmed at {formatDate(tx.confirmedAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default History;
