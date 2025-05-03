import express from 'express';
import studentsController from '../controllers/studentsController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all students (public)
router.get('/', studentsController.getAllStudents);

// Get student by ID (public)
router.get('/:id', studentsController.getStudentById);

// Create new student (admin only)
router.post('/', authMiddleware, roleMiddleware(['admin']), studentsController.createStudent);

// Update student (admin only)
router.put('/:id', authMiddleware, roleMiddleware(['admin']), studentsController.updateStudent);

// Delete student (admin only)
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), studentsController.deleteStudent);

export default router;