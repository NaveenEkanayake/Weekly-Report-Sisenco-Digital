import express from 'express';
import { body } from 'express-validator';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  assignMember,
  removeMember,
} from '../controllers/projectController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules
const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('category')
    .optional()
    .isIn(['Client Work', 'Internal Tooling', 'R&D', 'Marketing', 'Operations', 'Other'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['Active', 'On Hold', 'Completed', 'Archived'])
    .withMessage('Invalid status'),
];

// All routes require authentication
router.use(protect);

// Member assignment routes (Manager only)
router.post('/:id/assign/:userId', authorize('Manager'), assignMember);
router.delete('/:id/assign/:userId', authorize('Manager'), removeMember);

router.route('/')
  .get(getProjects)
  .post(authorize('Manager'), projectValidation, createProject);

router.route('/:id')
  .get(getProject)
  .put(authorize('Manager'), updateProject)
  .delete(authorize('Manager'), deleteProject);

export default router;
