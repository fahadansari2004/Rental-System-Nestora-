const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getAllProperties,
  getPendingProperties,
  approveProperty,
  rejectProperty,
  deactivateProperty,
  getFlaggedContent,
  flagProperty,
  updateUserRole,
  deleteUser,
  deleteProperty,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// All routes are strictly protected for Admin role only
router.use(protect);
router.use(authorizeRoles('Admin'));

// Metrics and Statistics
router.get('/stats', getDashboardStats);
router.get('/dashboard', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

// Property Listing Management & Moderation
router.get('/properties', getAllProperties);
router.get('/properties/pending', getPendingProperties);
router.patch('/properties/:id/approve', approveProperty);
router.patch('/properties/:id/reject', rejectProperty);
router.patch('/properties/:id/deactivate', deactivateProperty);
router.patch('/properties/:id/toggle-active', deactivateProperty);
router.delete('/properties/:id', deleteProperty);

// Flagged / Reported Content
router.get('/flagged', getFlaggedContent);
router.patch('/properties/:id/flag', flagProperty);

module.exports = router;
