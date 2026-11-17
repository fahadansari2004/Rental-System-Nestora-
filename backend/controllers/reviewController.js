const Review = require('../models/Review');
const Property = require('../models/Property');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// @desc    Create a new review for a property in MongoDB
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res, next) => {
  try {
    const { property: propertyId, rating, comment } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return next(new ApiError(404, 'Property not found in database'));
    }

    const ownerId = property.owner || property.host;
    if (ownerId && ownerId.toString() === req.user._id.toString()) {
      return next(new ApiError(400, 'Owners cannot review their own property'));
    }

    const existingReview = await Review.findOne({
      property: propertyId,
      user: req.user._id,
    });

    if (existingReview) {
      return next(new ApiError(400, 'You have already reviewed this property'));
    }

    const review = await Review.create({
      property: propertyId,
      user: req.user._id,
      rating: Number(rating),
      comment,
    });

    await review.populate('user', 'name avatar');

    // Recalculate average rating for property
    const propReviews = await Review.find({ property: propertyId });
    if (propReviews.length > 0) {
      const avg = propReviews.reduce((sum, r) => sum + r.rating, 0) / propReviews.length;
      property.averageRating = Math.round(avg * 10) / 10;
      property.numReviews = propReviews.length;
      await property.save();
    }

    return res.status(201).json(new ApiResponse(201, { review }, 'Review submitted successfully'));
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for a property from MongoDB
// @route   GET /api/reviews/property/:propertyId
// @access  Public
const getPropertyReviews = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    const reviews = await Review.find({ property: propertyId })
      .populate('user', 'name avatar role')
      .sort({ createdAt: -1 });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          reviews,
          count: reviews.length,
        },
        'Reviews retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return next(new ApiError(404, 'Review not found in database'));
    }

    const isAuthor = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    if (!isAuthor && !isAdmin) {
      return next(new ApiError(403, 'Not authorized to delete this review'));
    }

    const propertyId = review.property;
    await Review.findByIdAndDelete(req.params.id);

    // Recalculate property ratings
    const remaining = await Review.find({ property: propertyId });
    const property = await Property.findById(propertyId);
    if (property) {
      if (remaining.length > 0) {
        const avg = remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length;
        property.averageRating = Math.round(avg * 10) / 10;
        property.numReviews = remaining.length;
      } else {
        property.averageRating = 0;
        property.numReviews = 0;
      }
      await property.save();
    }

    res.status(200).json(new ApiResponse(200, null, 'Review deleted successfully from database'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getPropertyReviews,
  deleteReview,
};
