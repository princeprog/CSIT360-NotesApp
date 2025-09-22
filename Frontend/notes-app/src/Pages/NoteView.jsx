import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Star } from 'lucide-react';
import { useNotes } from '../context/NotesContext.jsx';

function NoteView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const numericId = Number(id);
  const { getNoteById, togglePin } = useNotes();
  const note = getNoteById(numericId);

  const formatDate = (date) => new Date(date).toLocaleString();

  const header = useMemo(() => (
    <div className="flex items-center justify-between">
      <button
        onClick={() => navigate('/notes')}
        className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium"
      >
        <ArrowLeft size={16} className="inline mr-2" /> Back to notes
      </button>
      {note && (
        <div className="flex gap-2">
          <button 
            onClick={() => navigate(`/edit/${note.id}`)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <Edit3 size={14} />
            Edit
          </button>
          <button
            onClick={() => togglePin(note.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${note.pinned ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <Star size={14} className={note.pinned ? 'fill-current' : ''} />
            {note.pinned ? 'Pinned' : 'Pin'}
          </button>
        </div>
      )}
    </div>
  ), [navigate, note, togglePin]);

  if (!note) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto p-6">
          {header}
          <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <h1 className="text-xl font-semibold text-gray-800 mb-2">Note not found</h1>
            <p className="text-gray-600">The note you are looking for may have been deleted.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        {header}
        <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-semibold text-gray-900">{note.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{formatDate(note.updatedAt)} • {note.category}</p>
          </div>
          <div className="p-6">
            <div className="text-gray-700 prose max-w-none whitespace-pre-wrap">
              {note.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteView;


