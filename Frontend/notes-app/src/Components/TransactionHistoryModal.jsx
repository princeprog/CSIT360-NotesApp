import { useState } from 'react';
import { X, ExternalLink, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getStatusColor, getStatusText, getExplorerUrl } from '../config/blockchain';

const TransactionHistoryModal = ({ isOpen, onClose, transactionHistory = [] }) => {
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'confirmed', 'failed'

  if (!isOpen) return null;

  const filteredTransactions = filter === 'all' 
    ? transactionHistory 
    : transactionHistory.filter(tx => tx.status === filter);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="text-amber-500" />;
      case 'confirmed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'confirmed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateHash = (hash) => {
    if (!hash) return '';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Transaction History</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'all' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                filter === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-700'
              }`}
            >
              <Clock size={16} />
              Pending
            </button>
            <button 
              onClick={() => setFilter('confirmed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                filter === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
              }`}
            >
              <CheckCircle size={16} />
              Confirmed
            </button>
            <button 
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                filter === 'failed' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
              }`}
            >
              <AlertCircle size={16} />
              Failed
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((tx) => (
                <div 
                  key={tx.txHash} 
                  className={`border rounded-lg p-4 ${getStatusClass(tx.status)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tx.status)}
                      <span className="font-semibold">
                        {tx.action} Note
                      </span>
                    </div>
                    <span className="text-sm">
                      {formatDate(tx.timestamp)}
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Transaction:</span>
                      <span className="font-mono">{truncateHash(tx.txHash)}</span>
                      <a 
                        href={getExplorerUrl(tx.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                        title="View on CardanoScan"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Note ID:</span> {tx.noteId}
                    </div>
                  </div>
                  
                  <div className="text-xs mt-2 flex items-center gap-1">
                    <span className={`px-2 py-1 rounded-full ${
                      tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      tx.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                    
                    {tx.status === 'confirmed' && tx.confirmedAt && (
                      <span className="text-gray-500">
                        Confirmed at {formatDate(tx.confirmedAt)}
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
};

export default TransactionHistoryModal;
