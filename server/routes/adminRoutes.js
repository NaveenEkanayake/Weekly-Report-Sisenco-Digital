import express from 'express';
import {
  getReports,
  getDashboardAnalytics,
  getMetricsCharts,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes require Manager role
router.use(protect);
router.use(authorize('Manager'));

// Unified metrics + charts endpoint (with query params: member, project, startDate, endDate)
router.get('/metrics-charts', getMetricsCharts);

// Aliases to match spec
router.get('/reports', getReports);
router.get('/metrics', getDashboardAnalytics);
router.get('/charts', getDashboardAnalytics);

export default router;
