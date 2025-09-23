import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Save, ArrowLeft } from 'lucide-react';
import { useNotes } from '../context/NotesContext.jsx';

function CreateNote() {
  const navigate = useNavigate();
  const { createNote } = useNotes();
  const [formData, setFormData] = useState({ title: '', content: '', category: 'Personal' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.trim() === '') return;
    const note = createNote(formData);
    navigate(`/notes/${note.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/notes')}
            className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium"
          >
            <ArrowLeft size={16} className="inline mr-2" /> Back to notes
          </button>
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-2xl border border-gray-200">
          <form onSubmit={handleSubmit}>
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Note
              </h2>
              <button 
                type="button"
                onClick={() => navigate('/notes')}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <input
                type="text"
                name="title"
                placeholder="Note title..."
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-lg font-medium placeholder-gray-400"
                value={formData.title}
                onChange={handleChange}
              />
              
              <textarea
                name="content"
                placeholder="Start writing your notes..."
                className="w-full p-4 border border-gray-200 rounded-xl h-48 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 resize-none text-gray-700 leading-relaxed placeholder-gray-400"
                value={formData.content}
                onChange={handleChange}
              />
              
              <select 
                name="category"
                className="p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-white text-gray-700 font-medium w-full"
                value={formData.category}
                onChange={handleChange}
              >
                {['Work', 'Personal', 'Ideas'].map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/notes')}
                className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 font-semibold"
              >
                <Save size={18} />
                Create Note
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateNote;


