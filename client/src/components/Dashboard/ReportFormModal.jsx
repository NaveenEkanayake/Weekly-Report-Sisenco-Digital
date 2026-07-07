import React, { useState, useEffect } from 'react';

const ReportFormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  projects, 
  editingReport, 
  isDark 
}) => {
  const [formData, setFormData] = useState({
    weekStartDate: '',
    weekEndDate: '',
    project: '',
    tasksCompleted: '',
    tasksPlanned: '',
    blockers: '',
    hoursWorked: '',
    notes: '',
  });

  useEffect(() => {
    if (editingReport) {
      setFormData({
        weekStartDate: editingReport.weekStartDate ? editingReport.weekStartDate.split('T')[0] : '',
        weekEndDate: editingReport.weekEndDate ? editingReport.weekEndDate.split('T')[0] : '',
        project: editingReport.project?._id || editingReport.project || '',
        tasksCompleted: editingReport.tasksCompleted || '',
        tasksPlanned: editingReport.tasksPlanned || '',
        blockers: editingReport.blockers || '',
        hoursWorked: editingReport.hoursWorked || '',
        notes: editingReport.notes || '',
      });
    } else {
      setFormData({
        weekStartDate: '',
        weekEndDate: '',
        project: '',
        tasksCompleted: '',
        tasksPlanned: '',
        blockers: '',
        hoursWorked: '',
        notes: '',
      });
    }
  }, [editingReport, isOpen]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormSubmit = (e, status) => {
    e.preventDefault();
    onSubmit(formData, status);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border shadow-2xl transition-all duration-300 ${
        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
      }`}>
        <div className={`p-6 border-b flex justify-between items-center ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}>
          <h2 className="text-base font-bold">
            {editingReport ? 'Edit Weekly Report' : 'Create Weekly Report'}
          </h2>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-350 cursor-pointer text-xl"
          >
            &times;
          </button>
        </div>
        
        <form className="p-6 space-y-4">
          {/* Week dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Week Start Date *
              </label>
              <input
                type="date"
                name="weekStartDate"
                value={formData.weekStartDate}
                onChange={handleChange}
                required
                className={`w-full input-base ${isDark ? 'input-field-dark' : 'input-field-light'}`}
              />
            </div>
            <div>
              <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Week End Date *
              </label>
              <input
                type="date"
                name="weekEndDate"
                value={formData.weekEndDate}
                onChange={handleChange}
                required
                className={`w-full input-base ${isDark ? 'input-field-dark' : 'input-field-light'}`}
              />
            </div>
          </div>

          {/* Project Select */}
          <div>
            <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Project *
            </label>
            <select
              name="project"
              value={formData.project}
              onChange={handleChange}
              required
              className={`w-full input-base cursor-pointer ${isDark ? 'input-field-dark' : 'input-field-light'}`}
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tasks Completed */}
          <div>
            <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Tasks Completed *
            </label>
            <textarea
              name="tasksCompleted"
              value={formData.tasksCompleted}
              onChange={handleChange}
              required
              rows={3}
              className={`w-full input-base ${isDark ? 'input-field-dark' : 'input-field-light'}`}
              placeholder="Detail the work you successfully completed this week..."
            />
          </div>

          {/* Tasks Planned */}
          <div>
            <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Tasks Planned for Next Week *
            </label>
            <textarea
              name="tasksPlanned"
              value={formData.tasksPlanned}
              onChange={handleChange}
              required
              rows={3}
              className={`w-full input-base ${isDark ? 'input-field-dark' : 'input-field-light'}`}
              placeholder="Detail your goals for next week..."
            />
          </div>

          {/* Blockers */}
          <div>
            <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Blockers / Challenges
            </label>
            <textarea
              name="blockers"
              value={formData.blockers}
              onChange={handleChange}
              rows={2}
              className={`w-full input-base ${isDark ? 'input-field-dark' : 'input-field-light'}`}
              placeholder="List any blockers or speed bumps you are facing (if any)..."
            />
          </div>

          {/* Hours Worked */}
          <div>
            <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Hours Worked
            </label>
            <input
              type="number"
              name="hoursWorked"
              value={formData.hoursWorked}
              onChange={handleChange}
              min="0"
              max="168"
              className={`w-full input-base ${isDark ? 'input-field-dark' : 'input-field-light'}`}
              placeholder="e.g. 40"
            />
          </div>

          {/* Notes */}
          <div>
            <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Notes / Links
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className={`w-full input-base ${isDark ? 'input-field-dark' : 'input-field-light'}`}
              placeholder="Optional notes or web links (PRs, documentation, designs)..."
            />
          </div>

          {/* Action Buttons */}
          <div className={`flex flex-wrap justify-end gap-3 pt-4 border-t ${
            isDark ? 'border-zinc-800' : 'border-zinc-200'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={isDark ? 'btn-secondary-zinc' : 'btn-secondary-light'}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleFormSubmit(e, 'Draft')}
              className={`btn-base border ${
                isDark
                  ? 'bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-650 border-zinc-250'
              }`}
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={(e) => handleFormSubmit(e, 'Submitted')}
              className="btn-primary-glow"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportFormModal;
