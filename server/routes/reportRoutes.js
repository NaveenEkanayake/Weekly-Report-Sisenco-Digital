import express from 'express';
import { body } from 'express-validator';
import {
  getReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  getDashboardAnalytics,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules
const reportValidation = [
  body('weekStartDate').notEmpty().isISO8601().withMessage('Valid week start date is required'),
  body('weekEndDate').notEmpty().isISO8601().withMessage('Valid week end date is required'),
  body('project').notEmpty().withMessage('Project is required'),
  body('tasksCompleted').trim().notEmpty().withMessage('Tasks completed is required'),
  body('tasksPlanned').trim().notEmpty().withMessage('Tasks planned is required'),
  body('hoursWorked').optional().isNumeric().withMessage('Hours worked must be a number'),
];

// All routes require authentication
router.use(protect);

// Analytics route (Manager only)
router.get('/analytics/dashboard', authorize('Manager'), getDashboardAnalytics);

// CRUD routes
router.route('/')
  .get(getReports)
  .post(reportValidation, createReport);

router.route('/:id')
  .get(getReport)
  .put(updateReport)
  .delete(deleteReport);

export default router;
