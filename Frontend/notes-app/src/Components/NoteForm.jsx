import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const NoteForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = { title: '', content: '', category: 'Personal' },
  categories = ['Work', 'Personal', 'Ideas'], 
  isEditing = false 
}) => {
  const [formData, setFormData] = useState(initialData);

  // Reset form data when initialData changes (i.e., when editing a different note)
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (formData.title.trim() === '') return;
    
    // Call the parent component's submit function
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <form onSubmit={handleSubmit}>
          {/* Form Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Note' : 'Create New Note'}
            </h2>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Form Body */}
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
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          {/* Form Footer */}
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
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 font-semibold"
            >
              <Save size={18} />
              {isEditing ? 'Update Note' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteForm;