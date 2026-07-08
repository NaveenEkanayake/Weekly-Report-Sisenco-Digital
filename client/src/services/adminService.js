import api from './api';

const adminService = {
  // GET /api/admin/reports — all team reports with optional filters
  getAllReports: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    const response = await api.get(`/admin/reports?${params.toString()}`);
    return response.data;
  },

  // GET /api/admin/metrics — summary metrics (total submitted, compliance rate, open blockers)
  getMetrics: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    const response = await api.get(`/admin/metrics?${params.toString()}`);
    return response.data;
  },

  // GET /api/admin/charts — aggregated chart data (trends, distributions, workload)
  getCharts: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    const response = await api.get(`/admin/charts?${params.toString()}`);
    return response.data;
  },

  // GET /api/admin/metrics-charts — unified metrics + chart data (member, project, startDate, endDate)
  getMetricsCharts: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val) params.append(key, val);
    });
    const response = await api.get(`/admin/metrics-charts?${params.toString()}`);
    return response.data;
  },
};

export default adminService;
