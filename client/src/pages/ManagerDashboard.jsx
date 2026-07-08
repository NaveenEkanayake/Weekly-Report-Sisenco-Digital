import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Common/Navbar';
import Sidebar from '../components/Common/Sidebar';
import Toast from '../components/Common/Toast';
import StatsGrid from '../components/Dashboard/StatsGrid';
import ReportTable from '../components/Dashboard/ReportTable';
import ProjectList from '../components/Dashboard/ProjectList';
import FilterBar from '../components/Dashboard/FilterBar';
import SubmissionCompliance from '../components/Dashboard/SubmissionCompliance';
import ReportDetailModal from '../components/Dashboard/ReportDetailModal';
import ProjectFormModal from '../components/Dashboard/ProjectFormModal';
import AnalyticsCharts from '../components/Charts/AnalyticsCharts';
import ChatAssistant from '../components/Common/ChatAssistant';
import { StatsGridSkeleton, TableSkeleton, ChartSkeleton } from '../components/Common/LoadingSkeleton';
import reportService from '../services/reportService';
import authService from '../services/authService';
import { BookOpen, RefreshCw } from 'lucide-react';

// Helper to get date ranges based on time period
const getDateRange = (period) => {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case 'week': {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'quarter': {
      const qMonth = Math.floor(start.getMonth() / 3) * 3;
      start.setMonth(qMonth, 1);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    default: // 'all' - no date filter
      return { startDate: null, endDate: null };
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
  };
};

const ManagerDashboard = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [timePeriod, setTimePeriod] = useState('week');
  const [filters, setFilters] = useState({
    user: '',
    project: '',
    startDate: '',
    endDate: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedReport, setSelectedReport] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [analyticsKey, setAnalyticsKey] = useState(0);

  const isDark = theme === 'dark';
  const pollingRef = useRef(null);
  const timePeriodRef = useRef(timePeriod);
  const filtersRef = useRef(filters);

  // Keep refs in sync with state to avoid stale closures in polling
  useEffect(() => { timePeriodRef.current = timePeriod; }, [timePeriod]);
  useEffect(() => { filtersRef.current = filters; }, [filters]);

  // Real-time auto-polling: refresh data every 10 seconds
  // and also refresh when tab regains focus
  useEffect(() => {
    const startPolling = () => {
      pollingRef.current = setInterval(async () => {
        try {
          const currentPeriod = timePeriodRef.current;
          const currentFilters = filtersRef.current;
          const dateRange = getDateRange(currentPeriod);
          const analyticsFilters = dateRange.startDate
            ? { startDate: dateRange.startDate, endDate: dateRange.endDate }
            : {};

          const [analyticsRes, reportsRes, projectsRes, usersRes] = await Promise.all([
            reportService.getDashboardAnalytics(analyticsFilters),
            reportService.getReports({ ...currentFilters, ...analyticsFilters }),
            reportService.getProjects(),
            authService.getAllUsers(),
          ]);

          setAnalytics(analyticsRes.data);
          setAnalyticsKey(prev => prev + 1);
          setReports(reportsRes.data || []);
          setProjects(projectsRes.data || []);
          setUsers(usersRes.data || []);
          setLastUpdated(new Date());
        } catch (err) {
          console.debug('Auto-refresh polling failed:', err.message);
        }
      }, 10000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startPolling();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [timePeriod, filters]);

  // Fetch dashboard data with current filters and period
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Apply time period to date filters for analytics
      const dateRange = getDateRange(timePeriod);
      const analyticsFilters = dateRange.startDate ? {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      } : {};

      const [analyticsRes, reportsRes, projectsRes, usersRes] = await Promise.all([
        reportService.getDashboardAnalytics(analyticsFilters),
        reportService.getReports({ ...filters, ...analyticsFilters }),
        reportService.getProjects(),
        authService.getAllUsers(),
      ]);

      setAnalytics(analyticsRes.data);
      setAnalyticsKey(prev => prev + 1);
      setReports(reportsRes.data || []);
      setProjects(projectsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timePeriod, filters]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Re-fetch when time period changes
  useEffect(() => {
    if (!loading) fetchDashboardData(true);
  }, [timePeriod]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.className = theme;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  const handleTimePeriodChange = (period) => {
    setTimePeriod(period);
    // Reset custom date filters when using presets
    if (period !== 'all') {
      const dateRange = getDateRange(period);
      setFilters(prev => ({ ...prev, startDate: dateRange.startDate || '', endDate: dateRange.endDate || '' }));
    } else {
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
    }
  };

  const handleFilterChange = async (e) => {
    const newFilters = { ...filters, [e.target.name]: e.target.value };
    setFilters(newFilters);
    try {
      const dateRange = getDateRange(timePeriod);
      const analyticsFilters = dateRange.startDate ? { startDate: dateRange.startDate, endDate: dateRange.endDate } : {};
      const [reportsRes, analyticsRes] = await Promise.all([
        reportService.getReports({ ...newFilters, ...analyticsFilters }),
        reportService.getDashboardAnalytics(analyticsFilters),
      ]);
      setReports(reportsRes.data || []);
      setAnalytics(analyticsRes.data);
      setAnalyticsKey(prev => prev + 1);
    } catch (err) {
      console.error('Error filtering reports:', err);
    }
  };

  const resetFilters = async () => {
    const defaultFilters = { user: '', project: '', startDate: '', endDate: '' };
    setFilters(defaultFilters);
    setTimePeriod('week');
    const dateRange = getDateRange('week');
    const analyticsFilters = { startDate: dateRange.startDate, endDate: dateRange.endDate };
    try {
      const [reportsRes, analyticsRes] = await Promise.all([
        reportService.getReports({ ...defaultFilters, ...analyticsFilters }),
        reportService.getDashboardAnalytics(analyticsFilters),
      ]);
      setReports(reportsRes.data || []);
      setAnalytics(analyticsRes.data);
      setAnalyticsKey(prev => prev + 1);
    } catch (err) {
      console.error('Error resetting filters:', err);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Filter reports by search query (client-side)
  const filteredReports = searchQuery
    ? reports.filter(r =>
        r.tasksCompleted?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tasksPlanned?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.blockers?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : reports;

  const openCreateProjectModal = () => {
    setEditingProject(null);
    setShowProjectModal(true);
  };

  const openEditProjectModal = (project) => {
    setEditingProject(project);
    setShowProjectModal(true);
  };

  const handleProjectSubmit = async (formData) => {
    try {
      if (editingProject) {
        await reportService.updateProject(editingProject._id, formData);
        showToast('Project updated successfully!', 'success');
      } else {
        await reportService.createProject(formData);
        showToast('Project created successfully!', 'success');
      }
      setTimeout(() => {
        fetchDashboardData(true);
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
        fetchDashboardData(true);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete project', 'error');
      }
    }
  };

  const handleReviewReport = async (id) => {
    try {
      await reportService.updateReport(id, { status: 'Reviewed' });
      showToast('Report marked as Reviewed successfully!', 'success');
      fetchDashboardData(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to review report', 'error');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      <Navbar theme={theme} toggleTheme={toggleTheme} onSearch={handleSearch} />
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />
      <div className="flex flex-1">
        <Sidebar theme={theme} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-28 md:pb-8">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="w-full md:w-auto">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
                  {/* Live indicator */}
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-900/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                    <span>LIVE</span>
                  </div>
                  {lastUpdated && (
                    <span className={`text-[10px] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      {lastUpdated.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Monitor team activity, track submission compliance, and manage projects.
                </p>
              </div>
              {/* Refresh Button */}
              <button
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex-shrink-0 ${
                  isDark
                    ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                } ${refreshing ? 'opacity-50' : ''}`}
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>

            {/* Stats Grid */}
            {loading ? (
              <StatsGridSkeleton isDark={isDark} count={5} />
            ) : analytics?.summary ? (
              <StatsGrid
                totalReports={analytics.summary.totalReports || 0}
                submittedCount={analytics.summary.submittedCount || 0}
                draftsCount={analytics.summary.draftCount || 0}
                lateCount={analytics.summary.lateCount || 0}
                openBlockersCount={analytics.summary.activeBlockers || 0}
                complianceRate={analytics.summary.complianceRate || 0}
                isDark={isDark}
              />
            ) : null}

            {/* Analytics Charts */}
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartSkeleton isDark={isDark} />
                <ChartSkeleton isDark={isDark} />
                <ChartSkeleton isDark={isDark} />
                <ChartSkeleton isDark={isDark} />
              </div>
            ) : analytics ? (
              <AnalyticsCharts key={analyticsKey} data={analytics} theme={theme} />
            ) : null}

            {/* Submission Compliance */}
            {loading ? (
              <div className={`rounded-xl border ${isDark ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className={`px-6 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                  <div className={`h-4 w-48 animate-pulse rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                </div>
              </div>
            ) : analytics?.submissionCompliance ? (
              <SubmissionCompliance data={analytics.submissionCompliance} isDark={isDark} />
            ) : null}

            {/* Projects List */}
            <ProjectList
              projects={projects}
              onAdd={openCreateProjectModal}
              onEdit={openEditProjectModal}
              onDelete={handleDeleteProject}
              isDark={isDark}
            />

            {/* Team Reports Feed with Filters */}
            <div className={`rounded-xl border ${isDark ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <div className={`px-6 py-5 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
                  <BookOpen size={16} className="text-indigo-500" />
                  <span>Team Reports Feed</span>
                  {searchQuery && (
                    <span className="ml-2 text-[10px] text-indigo-500 font-normal">
                      Filtered by: "{searchQuery}"
                    </span>
                  )}
                </h2>
                <FilterBar
                  filters={filters}
                  users={users}
                  projects={projects}
                  isDark={isDark}
                  onFilterChange={handleFilterChange}
                  onReset={resetFilters}
                  timePeriod={timePeriod}
                  onTimePeriodChange={handleTimePeriodChange}
                />
              </div>

              {loading ? (
                <TableSkeleton isDark={isDark} rows={5} columns={8} />
              ) : (
                <ReportTable
                  reports={filteredReports}
                  role="Manager"
                  onEdit={setSelectedReport}
                  onReview={handleReviewReport}
                  isDark={isDark}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      <ChatAssistant theme={theme} />

      {/* Report Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        isDark={isDark}
      />

      {/* Project Form Modal */}
      <ProjectFormModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSubmit={handleProjectSubmit}
        editingProject={editingProject}
        isDark={isDark}
        allUsers={users}
      />
    </div>
  );
};

export default ManagerDashboard;
