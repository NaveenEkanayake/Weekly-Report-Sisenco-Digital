import express from 'express';
import { chatWithAssistant } from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// AI routes require authentication + Manager role
router.use(protect);
router.post('/chat', authorize('Manager'), chatWithAssistant);

export default router;
