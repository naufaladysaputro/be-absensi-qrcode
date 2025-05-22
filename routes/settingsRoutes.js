import express from 'express';
import settingsController from '../controllers/settingsController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Upload middleware khusus logo (folder: uploads/logos, field: logo)
const logoUpload = upload('logo').single('logo');

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
  (req, res, next) => {
    logoUpload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          status: 'error',
          message: err.message || 'Terjadi kesalahan saat upload logo'
        });
      }
      next();
    });
  },
  settingsController.uploadLogo
);

// Update logo (admin only)
router.put('/logo/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  (req, res, next) => {
    logoUpload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          status: 'error',
          message: err.message || 'Terjadi kesalahan saat upload logo'
        });
      }
      next();
    });
  },
  settingsController.uploadLogo
);

export default router;
