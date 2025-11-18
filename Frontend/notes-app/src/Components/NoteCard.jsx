import { useState } from 'react';
import { Star, Trash2, Edit3, Clock, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { useNotes } from '../context/NotesContext';

const NoteCard = ({ 
  note, 
  onTogglePin, 
  onEdit, 
  onDelete, 
  formatDate,
  onOpen,
}) => {
  const [hovered, setHovered] = useState(false);
  const { getNoteBlockchainStatus } = useNotes();
  
  // Get blockchain status for this note
  const blockchainStatus = getNoteBlockchainStatus(note.id);

  return (
    <>
      <div 
        onClick={() => onOpen?.(note)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300 cursor-pointer"
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2 pr-2">
            {note.title}
          </h3>
          <div className={`flex gap-1 ${hovered ? 'opacity-100' : 'opacity-60'} transition-opacity`} onClick={(e) => e.stopPropagation()}>
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
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
              {note.category}
            </span>
            {/* Blockchain Status Indicator */}
            {blockchainStatus !== "none" && (
              <div className="flex items-center gap-1">
                {blockchainStatus === "pending" && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-600 rounded-full">
                    <Clock size={12} className="animate-pulse" />
                    <span>Pending</span>
                  </span>
                )}
                {blockchainStatus === "confirmed" && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-600 rounded-full">
                    <CheckCircle size={12} />
                    <span>Confirmed</span>
                  </span>
                )}
                {blockchainStatus === "failed" && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full">
                    <AlertCircle size={12} />
                    <span>Failed</span>
                  </span>
                )}
              </div>
            )}
          </div>
          <span className="text-gray-400">
            {formatDate(note.updatedAt)}
          </span>
        </div>
      </div>
    </>
  );
};

export default NoteCard;