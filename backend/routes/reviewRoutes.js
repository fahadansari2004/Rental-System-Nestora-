const express = require('express');
const router = express.Router();
const {
  createReview,
  getPropertyReviews,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { validate, reviewValidation } = require('../middleware/validationMiddleware');

router.post('/', protect, validate(reviewValidation), createReview);
router.get('/property/:propertyId', getPropertyReviews);
router.delete('/:id', protect, deleteReview);

module.exports = router;

