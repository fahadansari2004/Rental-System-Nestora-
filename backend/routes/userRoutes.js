const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { getDashboardStats } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Legacy routes for backward compatibility
router.get('/admin-stats', protect, authorizeRoles('Admin'), getDashboardStats);
router.get('/host-stats', protect, authorizeRoles('Owner', 'Admin'), getDashboardStats);

// User management endpoints
router.get('/', protect, authorizeRoles('Admin'), getUsers);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, authorizeRoles('Admin'), deleteUser);

module.exports = router;
