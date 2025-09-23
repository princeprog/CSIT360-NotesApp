import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotes } from '../context/NotesContext';
import { ArrowLeft } from 'lucide-react';

function EditNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getNoteById, updateNote, loading, error } = useNotes();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',

    category: 'Personal',
    pinned: false

  });
  const [loadingNote, setLoadingNote] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [categories, setCategories] = useState(['Personal', 'Work', 'Study']);

  useEffect(() => {
    const fetchNote = async () => {
      setLoadingNote(true);
      
      // Validate ID before fetching
      if (!id || isNaN(parseInt(id))) {
        setLoadingError("Invalid note ID");
        setLoadingNote(false);
        return;
      }
      
      const note = await getNoteById(id);
      
      if (note) {
        setFormData({
          title: note.title,
          content: note.content,

          category: note.category,
          pinned: note.pinned || false

        });
        
        // Get unique categories from existing notes
        if (note.category && !categories.includes(note.category)) {
          setCategories(prev => [...prev, note.category]);
        }
      } else {
        setLoadingError("Could not find the requested note");
      }
      
      setLoadingNote(false);
    };

    fetchNote();
  }, [id, getNoteById, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert("Title cannot be empty");
      return;
    }
    
    const updatedNote = await updateNote(id, formData);
    if (updatedNote) {
      navigate(`/notes/${id}`);
    }
  };

  if (loadingNote || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (loadingError || error) {
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
              {loadingError || error}
            </h2>
            <p className="text-gray-600 mb-6">
              We couldn't find the note you're trying to edit.
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
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(`/notes/${id}`)}
          className="flex items-center text-gray-600 hover:text-blue-600 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" /> Back to note
        </button>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">

            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Note</h1>

            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  placeholder="Enter note title"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="category" className="block text-gray-700 font-medium mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-8">
                <label htmlFor="content" className="block text-gray-700 font-medium mb-2">
                  Content
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 h-60"
                  placeholder="Enter note content"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate(`/notes/${id}`)}
                  className="mr-4 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditNote;