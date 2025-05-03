import express from 'express';
import classesController from '../controllers/classesController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all classes (public)
router.get('/', classesController.getAllClasses);

// Get class by ID (public)
router.get('/:id', classesController.getClassById);

// Create new class (admin only)
router.post('/', authMiddleware, roleMiddleware(['admin']), classesController.createClass);

// Update class (admin only)
router.put('/:id', authMiddleware, roleMiddleware(['admin']), classesController.updateClass);

// Delete class (admin only)
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), classesController.deleteClass);

export default router;