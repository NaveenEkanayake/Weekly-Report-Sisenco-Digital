import React, { useState, useEffect } from 'react';
import Navbar from '../components/Common/Navbar';
import Sidebar from '../components/Common/Sidebar';
import Toast from '../components/Common/Toast';
import StatsGrid from '../components/Dashboard/StatsGrid';
import ReportTable from '../components/Dashboard/ReportTable';
import ProjectList from '../components/Dashboard/ProjectList';
import ChatAssistant from '../components/Common/ChatAssistant';
import reportService from '../services/reportService';
import authService from '../services/authService';
import { Plus, FolderKanban, BookOpen, Clock, Filter, RotateCcw } from 'lucide-react';

const ManagerDashboard = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    category: 'Other',
    status: 'Active',
  });

  const [filters, setFilters] = useState({
    user: '',
    project: '',
    startDate: '',
    endDate: '',
  });

  const [selectedReport, setSelectedReport] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const isDark = theme === 'dark';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, reportsRes, projectsRes, usersRes] = await Promise.all([
        reportService.getDashboardAnalytics(),
        reportService.getReports(filters),
        reportService.getProjects(),
        authService.getAllUsers(),
      ]);

      setAnalytics(analyticsRes.data);
      setReports(reportsRes.data || []);
      setProjects(projectsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (e) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
    try {
      const response = await reportService.getReports(newFilters);
      setReports(response.data || []);
    } catch (err) {
      console.error('Error filtering reports:', err);
    }
  };

  const resetFilters = async () => {
    const defaultFilters = { user: '', project: '', startDate: '', endDate: '' };
    setFilters(defaultFilters);
    try {
      const response = await reportService.getReports(defaultFilters);
      setReports(response.data || []);
    } catch (err) {
      console.error('Error resetting filters:', err);
    }
  };

  const openCreateProjectModal = () => {
    setEditingProject(null);
    setProjectForm({ name: '', description: '', category: 'Other', status: 'Active' });
    setShowProjectModal(true);
  };

  const openEditProjectModal = (project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || '',
      category: project.category,
      status: project.status,
    });
    setShowProjectModal(true);
  };

  const handleProjectFormChange = (e) => {
    setProjectForm({ ...projectForm, [e.target.name]: e.target.value });
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await reportService.updateProject(editingProject._id, projectForm);
        showToast('Project updated successfully!', 'success');
      } else {
        await reportService.createProject(projectForm);
        showToast('Project created successfully!', 'success');
      }
      setTimeout(() => {
        fetchDashboardData();
        setShowProjectModal(false);
      }, 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save project', 'error');
    }
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await reportService.deleteProject(id);
        showToast('Project deleted successfully!', 'success');
        fetchDashboardData();
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete project', 'error');
      }
    }
  };

  const handleReviewReport = async (id) => {
    try {
      await reportService.updateReport(id, { status: 'Reviewed' });
      showToast('Report marked as Reviewed successfully!', 'success');
      fetchDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to review report', 'error');
    }
  };

  const getComplianceDot = (status) => {
    const styles = {
      Submitted: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
      Pending: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse',
      Late: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse'
    };
    return styles[status] || 'bg-zinc-500';
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      <div className="flex flex-1">
        <Sidebar theme={theme} />
        <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Manager Dashboard</h1>
              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Monitor team activity, track weekly submission compliance, and manage active projects.
              </p>
            </div>
            {analytics && analytics.summary && (
              <StatsGrid 
                totalReports={analytics.summary.totalReports || 0} 
                submittedCount={analytics.summary.submittedCount || 0} 
                draftsCount={analytics.summary.draftCount || 0} 
                openBlockersCount={analytics.summary.activeBlockers || 0} 
                complianceRate={analytics.summary.complianceRate || 0} 
                isDark={isDark} 
              />
            )}
            {analytics && analytics.submissionCompliance && (
              <div className={`rounded-xl border ${isDark ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className={`px-6 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                  <h2 className="text-sm font-semibold">Weekly Submission Compliance Checklist</h2>
                </div>
                <div className="overflow-x-auto w-full text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b font-semibold ${isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-500 bg-zinc-50'}`}>
                        <th className="p-4">Team Member</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Submission Status</th>
                        <th className="p-4">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-zinc-800/80 text-zinc-300' : 'divide-zinc-200 text-zinc-700'}`}>
                      {analytics.submissionCompliance.length > 0 ? (
                        analytics.submissionCompliance.map((row, index) => (
                          <tr key={index} className={`transition-colors ${isDark ? 'hover:bg-zinc-900/10' : 'hover:bg-zinc-50/50'}`}>
                            <td className="p-4 font-semibold text-zinc-100">{row.user?.name}</td>
                            <td className="p-4">{row.user?.department || 'N/A'}</td>
                            <td className="p-4 flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${getComplianceDot(row.status)}`} />
                              <span className="font-semibold">{row.status}</span>
                            </td>
                            <td className="p-4 text-zinc-500 font-medium">
                              {row.user?.lastSubmittedAt ? new Date(row.user.lastSubmittedAt).toLocaleString() : 'Never'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4" className="p-8 text-center text-zinc-500">No team compliance records found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <ProjectList 
              projects={projects} 
              onAdd={openCreateProjectModal} 
              onEdit={openEditProjectModal} 
              onDelete={handleDeleteProject} 
              isDark={isDark} 
            />
            <div className={`rounded-xl border ${isDark ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <div className={`px-6 py-5 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
                  <BookOpen size={16} className="text-indigo-500" />
                  <span>Team Reports Feed</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Team Member</label>
                    <select name="user" value={filters.user} onChange={handleFilterChange} className={`w-full input-base cursor-pointer ${isDark ? 'input-field-dark' : 'input-field-light'}`}>
                      <option value="">All Members</option>
                      {users.map((user) => <option key={user._id} value={user._id}>{user.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Project</label>
                    <select name="project" value={filters.project} onChange={handleFilterChange} className={`w-full input-base cursor-pointer ${isDark ? 'input-field-dark' : 'input-field-light'}`}>
                      <option value="">All Projects</option>
                      {projects.map((proj) => <option key={proj._id} value={proj._id}>{proj.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Start Date</label>
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={`w-full input-base ${isDark ? 'input-field-dark' : 'input-field-light'}`} />
                  </div>
                  <div className="flex flex-col gap-1.5 justify-end">
                    <button onClick={resetFilters} className="w-full btn-secondary-zinc flex items-center justify-center gap-2 py-2 text-xs font-semibold">
                      <RotateCcw size={14} />
                      <span>Reset Filters</span>
                    </button>
                  </div>
                </div>
              </div>
              {loading ? (
                <div className="p-12 flex justify-center"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <ReportTable reports={reports} role="Manager" onEdit={setSelectedReport} onReview={handleReviewReport} isDark={isDark} />
              )}
            </div>
          </div>
        </main>
      </div>
      <ChatAssistant theme={theme} />
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <h2 className="text-base font-bold">Report Details</h2>
              <button onClick={() => setSelectedReport(null)} className="text-zinc-500 hover:text-zinc-350 cursor-pointer text-xl">&times;</button>
            </div>
            <div className="p-6 space-y-6 text-xs">
              <div className="flex justify-between items-start border-b border-zinc-800/80 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">{selectedReport.user?.name || 'Unknown User'}</h3>
                  <p className="text-[10px] text-zinc-500 mt-1">{selectedReport.user?.email || 'N/A'} • {selectedReport.user?.department || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 font-bold rounded-full border border-indigo-900 bg-indigo-950/40 text-indigo-400">{selectedReport.status}</span>
                  <p className="text-[10px] text-zinc-500 mt-1.5">Hours: {selectedReport.hoursWorked || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Week Duration</h4>
                  <p className="font-semibold text-zinc-200">{new Date(selectedReport.weekStartDate).toLocaleDateString()} &rarr; {new Date(selectedReport.weekEndDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Project Category</h4>
                  <p className="font-semibold text-zinc-200">{selectedReport.project?.name || selectedReport.project || 'General'}</p>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Tasks Completed This Week</h4>
                <p className="whitespace-pre-wrap leading-relaxed text-zinc-300 bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">{selectedReport.tasksCompleted}</p>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Tasks Planned for Next Week</h4>
                <p className="whitespace-pre-wrap leading-relaxed text-zinc-300 bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">{selectedReport.tasksPlanned}</p>
              </div>
              {selectedReport.blockers && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80 mb-1">Blockers / Challenges</h4>
                  <p className="whitespace-pre-wrap leading-relaxed text-amber-400/90 bg-amber-955/10 p-3 rounded-lg border border-amber-900/30">{selectedReport.blockers}</p>
                </div>
              )}
              {selectedReport.notes && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Notes & Links</h4>
                  <p className="whitespace-pre-wrap leading-relaxed text-zinc-400 bg-zinc-950/40 p-3 rounded-lg border border-zinc-850">{selectedReport.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl max-w-md w-full border shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <h2 className="text-xs font-bold">{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
              <button onClick={() => setShowProjectModal(false)} className="text-zinc-500 hover:text-zinc-350 cursor-pointer text-xl">&times;</button>
            </div>
            <form onSubmit={handleProjectSubmit} className="p-6 space-y-4">
              <div>
                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Project Name *</label>
                <input type="text" name="name" value={projectForm.name} onChange={handleProjectFormChange} required className={`w-full input-base ${isDark ? 'input-field-dark' : 'input-field-light'}`} />
              </div>
              <div>
                <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Description</label>
                <textarea name="description" value={projectForm.description} onChange={handleProjectFormChange} rows={3} className={`w-full input-base ${isDark ? 'input-field-dark' : 'input-field-light'}`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Category *</label>
                  <select name="category" value={projectForm.category} onChange={handleProjectFormChange} required className={`w-full input-base cursor-pointer ${isDark ? 'input-field-dark' : 'input-field-light'}`}>
                    <option value="Client Work">Client Work</option>
                    <option value="Internal Tooling">Internal Tooling</option>
                    <option value="R&D">R&D</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Status *</label>
                  <select name="status" value={projectForm.status} onChange={handleProjectFormChange} required className={`w-full input-base cursor-pointer ${isDark ? 'input-field-dark' : 'input-field-light'}`}>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className={`flex justify-end gap-3 pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <button type="button" onClick={() => setShowProjectModal(false)} className={isDark ? 'btn-secondary-zinc' : 'btn-secondary-light'}>Cancel</button>
                <button type="submit" className="btn-primary-glow">{editingProject ? 'Update Project' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ManagerDashboard;
