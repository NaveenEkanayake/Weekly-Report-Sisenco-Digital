import express from 'express';
import { chatWithAssistant } from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// AI routes require authentication (both roles can chat — controller scopes data by role)
router.use(protect);
router.post('/chat', chatWithAssistant);

export default router;
