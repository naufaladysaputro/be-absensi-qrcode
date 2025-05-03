import express from 'express';
import selectionsController from '../controllers/selectionsController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all selections (public)
router.get('/', selectionsController.getAllSelections);

// Get selection by ID (public)
router.get('/:id', selectionsController.getSelectionById);

// Create new selection (admin only)
router.post('/', authMiddleware, roleMiddleware(['admin']), selectionsController.createSelection);

// Update selection (admin only)
router.put('/:id', authMiddleware, roleMiddleware(['admin']), selectionsController.updateSelection);

// Delete selection (admin only)
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), selectionsController.deleteSelection);

export default router;