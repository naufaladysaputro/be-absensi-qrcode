import express from 'express';
import multer from 'multer';
import scheduleController from '../controllers/scheduleController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Configure upload middleware for schedules
const scheduleUpload = upload('schedules');

// Get all schedules
router.get('/', scheduleController.getAllSchedules);

// Get schedule by ID
router.get('/:id', scheduleController.getScheduleById);

// Create new schedule
router.post('/', (req, res, next) => {
    scheduleUpload.single('schedule')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                status: 'error',
                message: 'Error saat upload file: ' + err.message
            });
        } else if (err) {
            return res.status(400).json({
                status: 'error',
                message: err.message || 'Terjadi kesalahan saat upload file'
            });
        }
        next();
    });
}, scheduleController.createSchedule);

// Update schedule
router.put('/:id', (req, res, next) => {
    scheduleUpload.single('schedule')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                status: 'error',
                message: 'Error saat upload file: ' + err.message
            });
        } else if (err) {
            return res.status(400).json({
                status: 'error',
                message: err.message || 'Terjadi kesalahan saat upload file'
            });
        }
        next();
    });
}, scheduleController.updateSchedule);

// Upsert schedule (create or update based on classes_id)
router.post('/upsert', (req, res, next) => {
    scheduleUpload.single('schedule')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                status: 'error',
                message: 'Error saat upload file: ' + err.message
            });
        } else if (err) {
            return res.status(400).json({
                status: 'error',
                message: err.message || 'Terjadi kesalahan saat upload file'
            });
        }
        next();
    });
}, scheduleController.upsertSchedule);

// Delete schedule
router.delete('/:id', scheduleController.deleteSchedule);

export default router;
