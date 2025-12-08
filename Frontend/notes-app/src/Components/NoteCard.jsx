import { useState } from 'react';
import { Star, Trash2, Edit3, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getStatusColor, getStatusText } from '../config/blockchain';

const NoteCard = ({ 
  note, 
  onTogglePin, 
  onEdit, 
  onDelete, 
  formatDate,
  onOpen,
  isNewest = false,
}) => {
  const [hovered, setHovered] = useState(false);
  
  // Get blockchain status from note object (comes from backend)
  const blockchainStatus = note.status?.toLowerCase() || "none";

  return (
    <>
      <div 
        onClick={() => onOpen?.(note)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300 cursor-pointer relative overflow-visible"
      >
        {/* NEW Badge - Enhanced Starburst Style - Absolutely positioned at top right */}
        {isNewest && (
          <div className="absolute -top-8 -right-8 z-30 transform -rotate-12">
              <div className="relative animate-pulse">
                {/* Outer glow */}
                <div className="absolute inset-0 bg-red-400 rounded-full blur-xl opacity-50 animate-pulse scale-150"></div>
                
                <svg viewBox="0 0 120 120" className="w-20 h-20 drop-shadow-2xl relative">
                  <defs>
                    <filter id="newBadgeShadow">
                      <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.5"/>
                    </filter>
                    <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#DC2626', stopOpacity: 1 }} />
                      <stop offset="50%" style={{ stopColor: '#EF4444', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#F87171', stopOpacity: 1 }} />
                    </linearGradient>
                    <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.4 }} />
                      <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  
                  {/* Enhanced 16-point starburst */}
                  <path
                    d="M60,8 L64,38 L80,15 L72,45 L98,35 L78,58 L105,60 L78,62 L98,85 L72,75 L80,105 L64,82 L60,112 L56,82 L40,105 L48,75 L22,85 L42,62 L15,60 L42,58 L22,35 L48,45 L40,15 L56,38 Z"
                    fill="url(#redGradient)"
                    filter="url(#newBadgeShadow)"
                    stroke="#991B1B"
                    strokeWidth="1.5"
                  />
                  
                  {/* Shine overlay */}
                  <path
                    d="M60,8 L64,38 L80,15 L72,45 L98,35 L78,58 L105,60 L78,62 L98,85 L72,75 L80,105 L64,82 L60,112 L56,82 L40,105 L48,75 L22,85 L42,62 L15,60 L42,58 L22,35 L48,45 L40,15 L56,38 Z"
                    fill="url(#shine)"
                    opacity="0.5"
                  />
                  
                  {/* Text with enhanced styling */}
                  <text
                    x="60"
                    y="67"
                    textAnchor="middle"
                    fill="white"
                    fontSize="22"
                    fontWeight="900"
                    letterSpacing="2"
                    className="font-black select-none"
                    style={{ 
                      textShadow: '0 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3)',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  >
                    NEW
                  </text>
                  
                  {/* Animated sparkles */}
                  <circle cx="95" cy="25" r="2.5" fill="white" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.5s" repeatCount="indefinite"/>
                    <animate attributeName="r" values="2.5;3;2.5" dur="1.5s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="25" cy="95" r="2.5" fill="white" opacity="0.9">
                    <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.5s" repeatCount="indefinite"/>
                    <animate attributeName="r" values="2.5;3;2.5" dur="1.5s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="105" cy="60" r="2" fill="white" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2s" repeatCount="indefinite"/>
                  </circle>
                </svg>
              </div>
            </div>
        )}
        
        {/* Note ID Badge - Top Right Corner */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
          <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold border-2 border-blue-300 shadow-sm">
            ID: {note.id}
          </div>
          
          {/* Action Buttons Below ID */}
          <div className={`flex gap-1 ${hovered ? 'opacity-100' : 'opacity-60'} transition-opacity`} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onTogglePin(note.id)}
              className={`p-2 rounded-lg transition-colors ${
                note.pinned 
                  ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' 
                  : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
              }`}
              title="Pin note"
            >
              <Star size={16} fill={note.pinned ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={() => onEdit(note)}
              className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
              title="Edit note"
            >
              <Edit3 size={16} />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete note"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="flex justify-between items-start mb-3 pr-32">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight line-clamp-2">
            {note.title}
          </h3>
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
                <span className={`flex items-center gap-1 px-2 py-1 rounded-full ${getStatusColor(blockchainStatus)}`}>
                  {blockchainStatus === "pending" && <Clock size={12} className="animate-pulse" />}
                  {blockchainStatus === "confirmed" && <CheckCircle size={12} />}
                  {blockchainStatus === "failed" && <AlertCircle size={12} />}
                  <span>{getStatusText(blockchainStatus)}</span>
                </span>
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