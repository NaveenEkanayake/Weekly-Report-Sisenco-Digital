import api from './api';

const reportService = {
  // Get all reports with filters
  getReports: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/reports?${params.toString()}`);
    return response.data;
  },

  // Get single report
  getReport: async (id) => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  // Create new report
  createReport: async (reportData) => {
    const response = await api.post('/reports', reportData);
    return response.data;
  },

  // Update report
  updateReport: async (id, reportData) => {
    const response = await api.put(`/reports/${id}`, reportData);
    return response.data;
  },

  // Delete report
  deleteReport: async (id) => {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },

  // Get dashboard analytics (Manager only)
  getDashboardAnalytics: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/reports/analytics/dashboard?${params.toString()}`);
    return response.data;
  },

  // Get projects
  getProjects: async () => {
    const response = await api.get('/projects');
    return response.data;
  },

  // Create project (Manager only)
  createProject: async (projectData) => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },

  // Update project (Manager only)
  updateProject: async (id, projectData) => {
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },

  // Delete project (Manager only)
  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  // ── Notifications ──
  getNotifications: async (unreadOnly = false) => {
    const params = unreadOnly ? '?unreadOnly=true' : '';
    const response = await api.get(`/notifications${params}`);
    return response.data;
  },

  markNotificationRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllNotificationsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Assign member to project (Manager only)
  assignMember: async (projectId, userId) => {
    const response = await api.post(`/projects/${projectId}/assign/${userId}`);
    return response.data;
  },

  // Remove member from project (Manager only)
  removeMember: async (projectId, userId) => {
    const response = await api.delete(`/projects/${projectId}/assign/${userId}`);
    return response.data;
  },

  // Get only projects assigned to the current team member
  getMyProjects: async () => {
    const response = await api.get('/projects');
    return response.data;
  },
};

export default reportService;
