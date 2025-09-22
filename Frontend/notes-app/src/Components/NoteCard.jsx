import { useState } from 'react';
import { Star, Trash2, Edit3, X } from 'lucide-react';

const NoteCard = ({ 
  note, 
  onTogglePin, 
  onEdit, 
  onDelete, 
  formatDate 
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  const closePreview = (e) => {
    e.stopPropagation(); // Prevent triggering card click
    setShowPreview(false);
  };

  // Prevent click events on action buttons from toggling preview
  const handleActionClick = (e) => {
    e.stopPropagation();
  };

  return (
    <>
      <div 
        onClick={togglePreview}
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300 cursor-pointer"
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 pr-2">
            {note.title}
          </h3>
          <div className="flex gap-1 opacity-60 hover:opacity-100 transition-opacity" onClick={handleActionClick}>
            <button
              onClick={() => onTogglePin(note.id)}
              className={`p-2 rounded-lg transition-colors ${
                note.pinned 
                  ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' 
                  : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
              }`}
            >
              <Star size={16} fill={note.pinned ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => onEdit(note)}
              className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
          {note.content}
        </p>
        
        <div className="flex justify-between items-center text-xs">
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
            {note.category}
          </span>
          <span className="text-gray-400">
            {formatDate(note.updatedAt)}
          </span>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closePreview}>
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Preview Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {note.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(note.updatedAt)} • {note.category}
                </p>
              </div>
              <button 
                onClick={closePreview}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Preview Body */}
            <div className="p-6">
              <div className="text-gray-700 prose max-w-none whitespace-pre-wrap">
                {note.content}
              </div>
            </div>
            
            {/* Preview Footer */}
            <div className="flex justify-between items-center p-6 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 ${note.pinned 
                  ? 'bg-amber-50 text-amber-600' 
                  : 'bg-gray-100 text-gray-600'} rounded-full text-xs font-medium flex items-center gap-1`}>
                  {note.pinned && <Star size={12} fill="currentColor" />}
                  {note.pinned ? 'Pinned' : note.category}
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    closePreview(e);
                    onEdit(note);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1 text-sm font-medium"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NoteCard;