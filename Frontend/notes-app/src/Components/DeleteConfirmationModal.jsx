import { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  noteTitle
}) => {
  const [confirmText, setConfirmText] = useState('');
  const isConfirmDisabled = confirmText !== 'delete';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isConfirmDisabled) {
      onConfirm();
      setConfirmText('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <form onSubmit={handleSubmit}>
          {/* Modal Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle size={20} />
              <h2 className="text-xl font-semibold">Delete Note</h2>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Modal Body */}
          <div className="p-6 space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete <span className="font-semibold">"{noteTitle}"</span>? This action cannot be undone.
            </p>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <p className="text-red-600 mb-2 font-medium">Confirmation required</p>
              <p className="text-sm text-gray-700 mb-3">
                Please type <span className="font-mono bg-gray-100 px-2 py-1 rounded text-red-500">delete</span> to confirm:
              </p>
              <input
                type="text"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                placeholder="Type 'delete' to confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isConfirmDisabled}
              className={`px-6 py-3 rounded-xl flex items-center gap-2 font-semibold ${
                isConfirmDisabled 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              <Trash2 size={18} />
              Delete Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
