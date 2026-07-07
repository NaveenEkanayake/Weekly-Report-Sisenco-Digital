import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  getAllUsers,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['Team Member', 'Manager'])
    .withMessage('Invalid role'),
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


// Protected routes
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('Manager'), getAllUsers);

export default router;
