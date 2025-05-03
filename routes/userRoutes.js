import express from 'express';
import userController from '../controllers/userController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/users/test-auth
 * @desc    Test authentication only
 * @access  Private (any authenticated user)
 */
router.get('/test-auth', authMiddleware, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Authentication successful',
    user: req.user
  });
});

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/', authMiddleware, roleMiddleware(['admin']), userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin or same user)
 */
router.get('/:id', authMiddleware, userController.getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin or same user)
 */
router.put('/:id', authMiddleware, userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), userController.deleteUser);

export default router; 