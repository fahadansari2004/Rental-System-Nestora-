const express = require('express');
const router = express.Router();
const {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
  toggleFavorite,
} = require('../controllers/propertyController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validate, propertyValidation } = require('../middleware/validationMiddleware');

router.get('/', getProperties);
router.get('/my-properties', protect, authorizeRoles('Owner', 'Admin'), getMyProperties);
router.get('/user/my-listings', protect, authorizeRoles('Owner', 'Admin'), getMyProperties);
router.get('/:id', getPropertyById);
router.post(
  '/',
  protect,
  validate(propertyValidation),
  createProperty
);
router.put('/:id', protect, authorizeRoles('Owner', 'Admin'), updateProperty);
router.delete('/:id', protect, authorizeRoles('Owner', 'Admin'), deleteProperty);
router.post('/:id/favorite', protect, toggleFavorite);

module.exports = router;
