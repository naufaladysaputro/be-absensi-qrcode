import express from 'express';
import qrCodesController from '../controllers/qrCodesController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all QR codes (requires authentication)
router.get('/', authMiddleware, qrCodesController.getAllQrCodes);

// Generate QR code for a student (requires authentication)
router.post('/generate/:student_id', authMiddleware, qrCodesController.generateQrCode);

// Get QR code for a student (requires authentication)
router.get('/:student_id', authMiddleware, qrCodesController.getQrCode);

// Delete QR code for a student (requires authentication)
router.delete('/:student_id', authMiddleware, qrCodesController.deleteQrCode);

export default router;