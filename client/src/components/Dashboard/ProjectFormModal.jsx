import React, { useState, useEffect } from 'react';

const ProjectFormModal = ({ isOpen, onClose, onSubmit, editingProject, isDark, allUsers = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Other',
    status: 'Active',
    startDate: '',
    endDate: '',
    assignedMembers: [],
  });

  useEffect(() => {
    if (editingProject) {
      setFormData({
        name: editingProject.name,
        description: editingProject.description || '',
        category: editingProject.category,
        status: editingProject.status,
        startDate: editingProject.startDate ? editingProject.startDate.split('T')[0] : '',
        endDate: editingProject.endDate ? editingProject.endDate.split('T')[0] : '',
        assignedMembers: editingProject.assignedMembers?.map(m => m._id || m) || [],
      });
    } else {
      setFormData({ name: '', description: '', category: 'Other', status: 'Active', startDate: '', endDate: '', assignedMembers: [] });
    }
  }, [editingProject, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMemberToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignedMembers: prev.assignedMembers.includes(userId)
        ? prev.assignedMembers.filter(id => id !== userId)
        : [...prev.assignedMembers, userId],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Filter to only show Team Members
  const teamMembers = allUsers.filter(u => u.role === 'Team Member');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`rounded-xl max-w-lg w-full border shadow-2xl ${
        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
      }`}>
        <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <h2 className="text-xs font-bold">{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 cursor-pointer text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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
              rows={2}
              className={`w-full ${isDark ? 'input-field-dark' : 'input-field-light'}`}
            />
          </div>

          {/* Project Timeline Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full ${isDark ? 'input-field-dark' : 'input-field-light'}`}
              />
            </div>
            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`w-full ${isDark ? 'input-field-dark' : 'input-field-light'}`}
              />
            </div>
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

          {/* Team Member Assignment */}
          <div>
            <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Assign Team Members
            </label>
            <div className={`rounded-lg border max-h-40 overflow-y-auto p-2 ${
              isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-50'
            }`}>
              {teamMembers.length === 0 ? (
                <p className={`text-xs text-center py-3 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  No team members registered yet. Users must register first.
                </p>
              ) : (
                teamMembers.map((member) => (
                  <label
                    key={member._id}
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedMembers.includes(member._id)}
                      onChange={() => handleMemberToggle(member._id)}
                      className="accent-indigo-600 w-3.5 h-3.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{member.name}</p>
                      <p className={`text-[9px] truncate ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {member.email} {member.department ? `· ${member.department}` : ''}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
            {formData.assignedMembers.length > 0 && (
              <p className={`text-[9px] mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {formData.assignedMembers.length} member(s) assigned
              </p>
            )}
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
