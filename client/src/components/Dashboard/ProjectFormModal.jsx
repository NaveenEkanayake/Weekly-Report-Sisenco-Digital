import React, { useState, useEffect } from 'react';

const ProjectFormModal = ({ isOpen, onClose, onSubmit, editingProject, isDark }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Other',
    status: 'Active',
  });

  useEffect(() => {
    if (editingProject) {
      setFormData({
        name: editingProject.name,
        description: editingProject.description || '',
        category: editingProject.category,
        status: editingProject.status,
      });
    } else {
      setFormData({ name: '', description: '', category: 'Other', status: 'Active' });
    }
  }, [editingProject, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`rounded-xl max-w-md w-full border shadow-2xl ${
        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
      }`}>
        <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h2 className="text-xs font-bold">{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 cursor-pointer text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Project Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`w-full ${isDark ? 'input-field-dark' : 'input-field-light'}`}
            />
          </div>
          <div>
            <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={`w-full ${isDark ? 'input-field-dark' : 'input-field-light'}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className={`w-full cursor-pointer ${isDark ? 'input-field-dark' : 'input-field-light'}`}
              >
                <option value="Client Work">Client Work</option>
                <option value="Internal Tooling">Internal Tooling</option>
                <option value="R&D">R&D</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className={`w-full cursor-pointer ${isDark ? 'input-field-dark' : 'input-field-light'}`}
              >
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>
          <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <button type="button" onClick={onClose} className={isDark ? 'btn-secondary-zinc' : 'btn-secondary-light'}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-glow">
              {editingProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectFormModal;
