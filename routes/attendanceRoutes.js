import express from 'express';
import attendanceController from '../controllers/attendanceController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// QR Code scanning endpoint
router.post('/scan', authMiddleware, attendanceController.scanQRCode);

// Get student attendance for a specific date
router.get('/student/:studentId', authMiddleware, attendanceController.getStudentAttendance);

// Get class attendance for a specific date
router.get('/class/:classId', authMiddleware, attendanceController.getClassAttendance);

// Update attendance
router.put('/:id', authMiddleware, attendanceController.updateAttendance);

export default router;