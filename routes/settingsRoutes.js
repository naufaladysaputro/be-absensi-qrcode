import express from 'express';
import settingsController from '../controllers/settingsController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';
import handleUpload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Get settings
router.get('/', authMiddleware, settingsController.getSettings);

// Create settings (admin only)
router.post('/', 
  authMiddleware, 
  roleMiddleware(['admin']),
  settingsController.createSettings
);

// Update settings (admin only)
router.put('/:id', 
  authMiddleware, 
  roleMiddleware(['admin']),
  settingsController.updateSettings
);

// Upload logo (admin only)
router.post('/logo/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  handleUpload,
  settingsController.uploadLogo
);

// Update logo (admin only)
router.put('/logo/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  handleUpload,
  settingsController.uploadLogo
);

export default router;