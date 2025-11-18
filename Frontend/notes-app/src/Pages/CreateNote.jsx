import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes } from '../context/NotesContext';
import { ArrowLeft } from 'lucide-react';

function CreateNote() {
  const navigate = useNavigate();
  const { createNote } = useNotes();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Personal'
  });
  const [categories] = useState(['Personal', 'Work', 'Study']);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Only use local submission state for form disabling
  const loading = isSubmitting;

  // Clear error when user starts typing
  useEffect(() => {
    if (error && (formData.title || formData.content)) {
      setError(null);
    }
  }, [formData.title, formData.content, error]);

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
    
    // Store the current form data to prevent it from being lost
    const currentFormData = { ...formData };
    
    try {
      setError(null); // Clear any previous errors
      setIsSubmitting(true); // Set local loading state
      
      const newNote = await createNote(currentFormData);
      
      if (newNote && newNote.id) {
        // Only navigate on success
        navigate(`/notes/${newNote.id}`);
      } else {
        // If no error was thrown but we didn't get a note back
        setError("Failed to create note. Please try again.");
      }
    } catch (err) {
      console.error("Error creating note:", err);
      setError(err.message || "Failed to create note. Please try again.");
      // Form data is preserved because we're not navigating away
    } finally {
      setIsSubmitting(false); // Always reset submission state
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate('/notes')}
          className="flex items-center text-gray-600 hover:text-blue-600 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" /> Back to notes
        </button>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Note</h1>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/notes')}
                  className="mr-4 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Note'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateNote;