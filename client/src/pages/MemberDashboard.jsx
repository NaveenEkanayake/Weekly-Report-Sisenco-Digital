import React, { useState, useEffect } from 'react';
import Navbar from '../components/Common/Navbar';
import Sidebar from '../components/Common/Sidebar';
import Toast from '../components/Common/Toast';
import StatsGrid from '../components/Dashboard/StatsGrid';
import ReportFormModal from '../components/Dashboard/ReportFormModal';
import ReportTable from '../components/Dashboard/ReportTable';
import ChatAssistant from '../components/Common/ChatAssistant';
import reportService from '../services/reportService';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';
import { StatsGridSkeleton, TableSkeleton } from '../components/Common/LoadingSkeleton';

const MemberDashboard = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notification states
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const { user } = useAuth();
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchReports();
    fetchProjects();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await reportService.getReports();
      setReports(response.data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await reportService.getProjects();
      setProjects(response.data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  const handleOpenCreateModal = () => {
    setEditingReport(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (report) => {
    setEditingReport(report);
    setShowModal(true);
  };

  const handleSubmit = async (formData, targetStatus) => {
    const payload = {
      ...formData,
      status: targetStatus
    };

    try {
      if (editingReport) {
        await reportService.updateReport(editingReport._id, payload);
        showToast(`Report updated as ${targetStatus.toLowerCase()} successfully!`, 'success');
      } else {
        await reportService.createReport(payload);
        showToast(`Report submitted as ${targetStatus.toLowerCase()} successfully!`, 'success');
      }
      
      // Delay closing modal and updating list to let user read the top-right toast!
      setTimeout(() => {
        fetchReports();
        setShowModal(false);
      }, 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save report. Please check if a report already exists for this week.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await reportService.deleteReport(id);
        showToast('Report deleted successfully!', 'success');
        fetchReports();
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete report', 'error');
      }
    }
  };

  // Filter reports by search query
  const filteredReports = searchQuery
    ? reports.filter(r =>
        r.tasksCompleted?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tasksPlanned?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.blockers?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.project?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : reports;

  const totalReports = reports.length;
  const submittedCount = reports.filter(r => r.status === 'Submitted').length;
  const draftsCount = reports.filter(r => r.status === 'Draft').length;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'
    }`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} onSearch={setSearchQuery} />
      
      {/* Toast Notification at top right */}
      <Toast 
        message={toastMessage} 
        type={toastType} 
        onClose={() => setToastMessage('')} 
      />

      <div className="flex flex-1">
        <Sidebar theme={theme} />
        
        <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Hero / Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Welcome back, <span className="text-indigo-500">{user?.name}</span>!
                </h1>
                <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Manage your structured weekly reports and collaborate with your team.
                </p>
              </div>
              <button
                onClick={handleOpenCreateModal}
                className="btn-primary-glow text-xs flex items-center gap-1.5"
              >
                <Plus size={16} />
                <span>Create Weekly Report</span>
              </button>
            </div>

            {/* Stats Grid */}
            {loading ? (
              <StatsGridSkeleton isDark={isDark} count={3} />
            ) : (
              <StatsGrid 
                totalReports={totalReports} 
                submittedCount={submittedCount} 
                draftsCount={draftsCount} 
                isDark={isDark} 
              />
            )}

            {/* Reports List */}
            <div className={`rounded-xl border ${
              isDark ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              
              {loading ? (
                <TableSkeleton isDark={isDark} rows={5} columns={7} />
              ) : (
                <ReportTable 
                  reports={filteredReports} 
                  role="Team Member" 
                  onEdit={handleOpenEditModal} 
                  onDelete={handleDelete} 
                  isDark={isDark} 
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Report Edit/Create Modal Form */}
      <ReportFormModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onSubmit={handleSubmit} 
        projects={projects} 
        editingReport={editingReport} 
        isDark={isDark} 
      />

      {/* Floating Gemini AI Assistant (Visible for Team Members too) */}
      <ChatAssistant theme={theme} />
    </div>
  );
};

export default MemberDashboard;
