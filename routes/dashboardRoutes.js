import express from 'express';
import dashboardController from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get dashboard data
router.get('/', authMiddleware, dashboardController.getDashboard);

export default router;