import { useNotes } from "../context/NotesContext";
import { Clock, CheckCircle, AlertCircle, ExternalLink, Download, ChevronLeft, ChevronRight, Calendar, Filter, BarChart3, X, Edit3, Plus, Menu, Trash2, FilePlus, FileEdit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useWallet } from "../context/WalletContext";
import { getStatusColor, getStatusText, getExplorerUrl } from "../config/blockchain";
import WalletConnect from "../Components/WalletConnect";
import TransactionHistoryModal from "../Components/TransactionHistoryModal";

function History() {
  const navigate = useNavigate();
  const { notes, history } = useNotes();
  const { walletAddress } = useWallet();
  const [transactionHistory, setTransactionHistory] = useState([]);
  
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [categories, setCategories] = useState(["All Notes"]);
  
  // Transaction History Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Detail Modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTxDetail, setSelectedTxDetail] = useState(null);
  const [noteContent, setNoteContent] = useState(null);
  const [loadingNote, setLoadingNote] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Filter states
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [operationFilter, setOperationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Handle responsive sidebar
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
  
  // Get categories from notes
  useEffect(() => {
    if (notes && notes.length > 0) {
      const uniqueCategories = [...new Set(notes.map((note) => note.category))];
      setCategories(["All Notes", ...uniqueCategories]);
    }
  }, [notes]);
  
  // Fetch transaction history from backend and merge with local delete transactions
  useEffect(() => {
    const fetchTransactionHistory = async () => {
      if (!walletAddress) return;
      
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
        const response = await axios.get(`${apiUrl}/transactions/wallet/${walletAddress}`);
        const apiTransactions = response.data.content || response.data || [];
        
        // Get delete transactions from localStorage
        const localDeletes = JSON.parse(localStorage.getItem('deleteTransactions') || '[]');
        
        // Filter local deletes for current wallet
        const walletDeletes = localDeletes.filter(tx => tx.walletAddress === walletAddress);
        
        // Check if any local delete transactions are now confirmed on blockchain
        // by checking if the txHash exists in Cardano explorer (we'll mark them as confirmed after some time)
        const updatedDeletes = walletDeletes.map(tx => {
          // If transaction is older than 5 minutes, assume it's confirmed
          const txTime = new Date(tx.createdAt).getTime();
          const now = Date.now();
          const fiveMinutes = 5 * 60 * 1000;
          
          if (now - txTime > fiveMinutes && tx.status === 'PENDING') {
            return { ...tx, status: 'CONFIRMED', confirmedAt: new Date(txTime + fiveMinutes).toISOString() };
          }
          return tx;
        });
        
        // Update localStorage with confirmed statuses
        const allDeletes = JSON.parse(localStorage.getItem('deleteTransactions') || '[]');
        const updatedAllDeletes = allDeletes.map(tx => {
          const updated = updatedDeletes.find(u => u.txHash === tx.txHash);
          return updated || tx;
        });
        localStorage.setItem('deleteTransactions', JSON.stringify(updatedAllDeletes));
        
        // Merge API transactions with local delete transactions
        // Avoid duplicates by checking txHash
        const apiTxHashes = new Set(apiTransactions.map(tx => tx.txHash));
        const uniqueDeletes = updatedDeletes.filter(tx => !apiTxHashes.has(tx.txHash));
        
        // Combine and sort by createdAt descending
        const allTransactions = [...apiTransactions, ...uniqueDeletes].sort((a, b) => {
          const dateA = new Date(a.createdAt || a.timestamp);
          const dateB = new Date(b.createdAt || b.timestamp);
          return dateB - dateA;
        });
        
        setTransactionHistory(allTransactions);
      } catch (err) {
        console.error("Failed to fetch transaction history:", err);
        
        // Even if API fails, show local delete transactions
        const localDeletes = JSON.parse(localStorage.getItem('deleteTransactions') || '[]');
        const walletDeletes = localDeletes.filter(tx => tx.walletAddress === walletAddress);
        setTransactionHistory(walletDeletes);
      }
    };
    
    fetchTransactionHistory();
  }, [walletAddress]);
  
  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactionHistory.filter(tx => {
      // Date range filter
      if (dateRange.start) {
        const txDate = new Date(tx.createdAt || tx.timestamp);
        const startDate = new Date(dateRange.start);
        if (txDate < startDate) return false;
      }
      if (dateRange.end) {
        const txDate = new Date(tx.createdAt || tx.timestamp);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (txDate > endDate) return false;
      }
      
      // Operation type filter
      if (operationFilter !== 'all') {
        const operation = (tx.operationType || tx.operation || tx.action || '').toUpperCase();
        // Handle UPDATE/EDIT as the same
        if (operationFilter === 'UPDATE') {
          if (operation !== 'UPDATE' && operation !== 'EDIT') return false;
        } else {
          if (operation !== operationFilter) return false;
        }
      }
      
      // Status filter
      if (statusFilter !== 'all') {
        const status = (tx.status || '').toLowerCase();
        if (status !== statusFilter.toLowerCase()) return false;
      }
      
      return true;
    });
  }, [transactionHistory, dateRange, operationFilter, statusFilter]);
  
  // Calculate statistics
  const statistics = useMemo(() => {
    const total = filteredTransactions.length;
    const confirmed = filteredTransactions.filter(tx => 
      (tx.status || '').toLowerCase() === 'confirmed'
    ).length;
    const failed = filteredTransactions.filter(tx => 
      (tx.status || '').toLowerCase() === 'failed'
    ).length;
    const pending = filteredTransactions.filter(tx => 
      (tx.status || '').toLowerCase() === 'pending'
    ).length;
    
    const successRate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : 0;
    
    // Calculate average confirmation time
    const confirmedTxs = filteredTransactions.filter(tx => 
      (tx.status || '').toLowerCase() === 'confirmed' && tx.confirmedAt && tx.createdAt
    );
    
    let avgConfirmationTime = 0;
    if (confirmedTxs.length > 0) {
      const totalTime = confirmedTxs.reduce((sum, tx) => {
        const created = new Date(tx.createdAt || tx.timestamp);
        const confirmed = new Date(tx.confirmedAt);
        return sum + (confirmed - created);
      }, 0);
      avgConfirmationTime = Math.round(totalTime / confirmedTxs.length / 1000); // in seconds
    }
    
    return { total, confirmed, failed, pending, successRate, avgConfirmationTime };
  }, [filteredTransactions]);
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, operationFilter, statusFilter]);
  
  // Fixed operation types for filtering
  const operationTypes = ['all', 'CREATE', 'UPDATE', 'DELETE'];
  
  // Export functions
  const exportToCSV = () => {
    const headers = ['Transaction Hash', 'Operation', 'Status', 'Note ID', 'Created At', 'Confirmed At'];
    const rows = filteredTransactions.map(tx => [
      tx.txHash || '',
      tx.operation || tx.action || '',
      tx.status || '',
      tx.noteId || '',
      tx.createdAt || tx.timestamp || '',
      tx.confirmedAt || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    downloadFile(csvContent, 'transaction-history.csv', 'text/csv');
  };
  
  const exportToJSON = () => {
    const jsonContent = JSON.stringify(filteredTransactions, null, 2);
    downloadFile(jsonContent, 'transaction-history.json', 'application/json');
  };
  
  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
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
  
  const getOperationInfo = (operation) => {
    const op = (operation || '').toUpperCase();
    switch (op) {
      case 'CREATE':
        return {
          icon: <FilePlus size={18} className="text-green-600" />,
          label: 'Create Note',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      case 'UPDATE':
      case 'EDIT':
        return {
          icon: <FileEdit size={18} className="text-blue-600" />,
          label: 'Edit Note',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        };
      case 'DELETE':
        return {
          icon: <Trash2 size={18} className="text-red-600" />,
          label: 'Delete Note',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200'
        };
      case 'UNKNOWN':
      default:
        return {
          icon: <AlertCircle size={18} className="text-gray-600" />,
          label: 'Unknown Operation',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200'
        };
    }
  };
  
  const formatConfirmationTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };
  
  const clearFilters = () => {
    setDateRange({ start: '', end: '' });
    setOperationFilter('all');
    setStatusFilter('all');
  };
  
  const hasActiveFilters = dateRange.start || dateRange.end || operationFilter !== 'all' || statusFilter !== 'all';

  // Open transaction detail modal and fetch note content
  const openTransactionDetail = async (tx) => {
    setSelectedTxDetail(tx);
    setIsDetailModalOpen(true);
    setLoadingNote(true);
    setNoteContent(null);
    
    // Try to find the note in the current notes list
    const noteFromContext = notes.find(n => n.id === tx.noteId);
    if (noteFromContext) {
      setNoteContent(noteFromContext);
      setLoadingNote(false);
      return;
    }
    
    // If not found, try to fetch from API
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
      const response = await axios.get(`${apiUrl}/notes/${tx.noteId}`);
      setNoteContent(response.data);
    } catch (err) {
      console.error("Failed to fetch note:", err);
      setNoteContent(null);
    } finally {
      setLoadingNote(false);
    }
  };
  
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTxDetail(null);
    setNoteContent(null);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
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
            onClick={() => navigate('/notes')}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3.5 flex items-center justify-center gap-2.5 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 font-semibold text-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={20} strokeWidth={2.5} />
            Create Note
          </button>
        </div>

        {/* Categories Section */}
        <div className="px-4 py-6">
          <div className="mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3 px-3">
              Navigation
            </h3>
            <div className="space-y-1">
              {["All Notes", ...categories.filter(c => c !== "All Notes")].map(
                (category) => {
                  const count =
                    category === "All Notes"
                      ? notes.length
                      : notes.filter((note) => note.category === category).length;
                  
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        navigate('/notes');
                        if (isMobile) setSidebarOpen(false);
                      }}
                      className="group w-full text-left py-2.5 px-4 rounded-xl flex items-center justify-between transition-all duration-200 hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                    >
                      <span className="text-sm font-medium">
                        {category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold min-w-[24px] text-center transition-colors bg-slate-200 text-slate-600 group-hover:bg-slate-300">
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                }
              )}
              {/* History Navigation Button - Active */}
              <button
                className="group w-full text-left py-2.5 px-4 rounded-xl flex items-center justify-between transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
              >
                <span className="text-sm font-semibold">History</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold min-w-[24px] text-center transition-colors bg-white/20 text-white">
                    {transactionHistory.length}
                  </span>
                  <ChevronRight size={16} className="text-white" strokeWidth={2.5} />
                </div>
              </button>
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
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Menu size={24} />
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-800">Activity History</h1>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Blockchain Transactions */}
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Blockchain Transactions</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View Full History
            </button>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 shadow border-l-4 border-blue-500">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <BarChart3 size={14} />
                Total
              </div>
              <p className="text-xl font-bold text-blue-600">{statistics.total}</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow border-l-4 border-green-500">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <CheckCircle size={14} />
                Success Rate
              </div>
              <p className="text-xl font-bold text-green-600">{statistics.successRate}%</p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow border-l-4 border-amber-500">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <Clock size={14} />
                Avg Confirm
              </div>
              <p className="text-xl font-bold text-amber-600">
                {formatConfirmationTime(statistics.avgConfirmationTime)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 shadow border-l-4 border-red-500">
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                <AlertCircle size={14} />
                Failed
              </div>
              <p className="text-xl font-bold text-red-600">{statistics.failed}</p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="bg-white rounded-lg p-4 shadow mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-gray-700 font-medium">
                <Filter size={16} />
                Filters
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
                >
                  <X size={14} />
                  Clear all
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Date Range */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  <Calendar size={12} className="inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  <Calendar size={12} className="inline mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Operation Type Filter */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Operation Type</label>
                <select
                  value={operationFilter}
                  onChange={(e) => setOperationFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Operations</option>
                  <option value="CREATE">Create Note</option>
                  <option value="UPDATE">Edit Note</option>
                  <option value="DELETE">Delete Note</option>
                </select>
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Export Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={exportToCSV}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={exportToJSON}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Download size={16} />
              Export JSON
            </button>
          </div>
          
          {/* Transaction List */}
          {filteredTransactions.length === 0 ? (
            <p className="text-gray-500">No blockchain transactions found.</p>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedTransactions.map((tx) => {
                  const operationInfo = getOperationInfo(tx.operationType || tx.operation || tx.action);
                  return (
                  <div
                    key={tx.txHash || tx.id}
                    className={`p-4 bg-white rounded-xl shadow border-l-4 cursor-pointer hover:shadow-md transition-shadow ${tx.status === 'PENDING' || tx.status === 'pending' ? 'border-amber-400' : tx.status === 'CONFIRMED' || tx.status === 'confirmed' ? 'border-green-400' : 'border-red-400'}`}
                    onClick={() => openTransactionDetail(tx)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Operation Badge */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${operationInfo.bgColor} ${operationInfo.borderColor}`}>
                          {operationInfo.icon}
                          <span className={`font-semibold text-sm ${operationInfo.textColor}`}>
                            {operationInfo.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(tx.status?.toLowerCase())}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          (tx.status || '').toLowerCase() === 'confirmed' 
                            ? 'bg-green-100 text-green-700' 
                            : (tx.status || '').toLowerCase() === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {(tx.status || '').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-sm mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Transaction:</span>
                        <span className="font-mono text-gray-700">{truncateHash(tx.txHash)}</span>
                        <a
                          href={getExplorerUrl(tx.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                          title="View on CardanoScan"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                      <div>
                        <span className="text-gray-500">Note ID:</span> <span className="text-gray-700">{tx.noteId}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {formatDate(tx.createdAt || tx.timestamp)}
                      {(tx.status === 'CONFIRMED' || tx.status === 'confirmed') && tx.confirmedAt && (
                        <span className="ml-2">
                          • Confirmed at {formatDate(tx.confirmedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 bg-white rounded-lg p-3 shadow">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>
      
      {/* Transaction Detail Modal */}
      {isDetailModalOpen && selectedTxDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div>
                <h2 className="text-xl font-bold">Transaction Details</h2>
                <p className="text-blue-100 text-sm">{selectedTxDetail.operationType || selectedTxDetail.operation || selectedTxDetail.action || 'Unknown'} Note</p>
              </div>
              <button 
                onClick={closeDetailModal}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Transaction Info */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Transaction Information</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      (selectedTxDetail.status || '').toLowerCase() === 'confirmed' 
                        ? 'bg-green-100 text-green-700' 
                        : (selectedTxDetail.status || '').toLowerCase() === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {(selectedTxDetail.status || '').toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500 text-sm">Transaction Hash</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-gray-200 px-3 py-2 rounded-lg text-sm font-mono break-all flex-1">
                        {selectedTxDetail.txHash}
                      </code>
                      <a
                        href={getExplorerUrl(selectedTxDetail.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="View on CardanoScan"
                      >
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500 text-sm">Created At</span>
                      <p className="font-medium">{formatDate(selectedTxDetail.createdAt || selectedTxDetail.timestamp)}</p>
                    </div>
                    {selectedTxDetail.confirmedAt && (
                      <div>
                        <span className="text-gray-500 text-sm">Confirmed At</span>
                        <p className="font-medium">{formatDate(selectedTxDetail.confirmedAt)}</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <span className="text-gray-500 text-sm">Note ID</span>
                    <p className="font-mono text-sm bg-gray-200 px-3 py-2 rounded-lg mt-1">{selectedTxDetail.noteId}</p>
                  </div>
                </div>
              </div>
              
              {/* Note Content */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Note Content</h3>
                {loadingNote ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : noteContent ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">{noteContent.title}</h4>
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mt-1">
                          {noteContent.category}
                        </span>
                      </div>
                      {noteContent.pinned && (
                        <span className="text-amber-500">★</span>
                      )}
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-600 whitespace-pre-wrap">{noteContent.content}</p>
                    </div>
                    {noteContent.updatedAt && (
                      <p className="text-xs text-gray-400 mt-4">
                        Last updated: {formatDate(noteContent.updatedAt)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-6 text-center">
                    <AlertCircle size={32} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Note content deleted from Database</p>
                    <p className="text-gray-400 text-sm">To see what note is deleted check Cardano Scan for the metadata.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={closeDetailModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
              {noteContent && (
                <button
                  onClick={() => {
                    const exportData = {
                      transaction: {
                        txHash: selectedTxDetail.txHash,
                        operation: selectedTxDetail.operationType || selectedTxDetail.operation || selectedTxDetail.action,
                        status: selectedTxDetail.status,
                        createdAt: selectedTxDetail.createdAt || selectedTxDetail.timestamp,
                        confirmedAt: selectedTxDetail.confirmedAt || null
                      },
                      note: {
                        id: noteContent.id,
                        title: noteContent.title,
                        content: noteContent.content,
                        category: noteContent.category,
                        pinned: noteContent.pinned || false,
                        createdAt: noteContent.createdAt,
                        updatedAt: noteContent.updatedAt
                      }
                    };
                    const jsonContent = JSON.stringify(exportData, null, 2);
                    const blob = new Blob([jsonContent], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `note-${noteContent.id}-transaction.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  <Download size={16} />
                  Export JSON
                </button>
              )}
              <a
                href={getExplorerUrl(selectedTxDetail.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                <ExternalLink size={16} />
                View on Cardano Scan
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* Transaction History Modal */}
      <TransactionHistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transactionHistory={transactionHistory.map(tx => ({
          ...tx,
          status: (tx.status || '').toLowerCase(),
          action: tx.operation || tx.action,
          timestamp: tx.createdAt || tx.timestamp
        }))}
      />
    </div>
  );
}

export default History;
