import express from 'express';
import { SelectionsController } from '../controllers/gradesController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all selections (public)
router.get('/', SelectionsController.getAllSelections);

// Get selection by ID (public)
router.get('/:id', SelectionsController.getSelectionById);

// Create new selection (admin only)
router.post('/', authMiddleware, roleMiddleware(['admin']), SelectionsController.createSelection);

// Update selection (admin only)
router.put('/:id', authMiddleware, roleMiddleware(['admin']), SelectionsController.updateSelection);

// Delete selection (admin only)
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), SelectionsController.deleteSelection);

export default router;