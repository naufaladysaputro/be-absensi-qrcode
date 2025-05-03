import express from 'express';
import reportController from '../controllers/reportController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate attendance report (requires authentication)
router.get('/attendance', authMiddleware, reportController.generateReport);

export default router;