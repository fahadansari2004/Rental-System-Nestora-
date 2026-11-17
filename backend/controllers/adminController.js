const User = require('../models/User');
const Property = require('../models/Property');
const Booking = require('../models/Booking');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get complete administrative dashboard analytics from MongoDB
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalOwners,
      totalRenters,
      totalProperties,
      activeProperties,
      pendingProperties,
      approvedProperties,
      flaggedProperties,
      totalBookings,
      confirmedBookings,
      revenueResult,
      recentUsers,
      recentProperties,
      recentBookings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'Owner' }),
      User.countDocuments({ role: 'Renter' }),
      Property.countDocuments(),
      Property.countDocuments({ isActive: true, approvalStatus: 'approved' }),
      Property.countDocuments({ approvalStatus: 'pending' }),
      Property.countDocuments({ approvalStatus: 'approved' }),
      Property.countDocuments({ isFlagged: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
      ]),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role phone createdAt avatar'),
      Property.find().sort({ createdAt: -1 }).limit(5).populate('owner', 'name email'),
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('property', 'title rentPerMonth images')
        .populate('renter', 'name email')
        .populate('owner', 'name email'),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          totalUsers,
          activeListings: activeProperties,
          totalBookings,
          flaggedContent: flaggedProperties,
          stats: {
            users: {
              total: totalUsers,
              owners: totalOwners,
              renters: totalRenters,
            },
            properties: {
              total: totalProperties,
              active: activeProperties,
              pending: pendingProperties,
              approved: approvedProperties,
              flagged: flaggedProperties,
            },
            bookings: {
              total: totalBookings,
              confirmed: confirmedBookings,
            },
            financials: {
              totalRevenue,
            },
          },
          recentActivity: {
            users: recentUsers,
            properties: recentProperties,
            bookings: recentBookings,
          },
        },
        'Admin dashboard analytics retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with search and role filter (Admin)
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by role
    if (req.query.role && req.query.role !== 'All') {
      const normalizedRole = req.query.role.toLowerCase();
      if (normalizedRole === 'admin') query.role = 'Admin';
      else if (normalizedRole === 'owner' || normalizedRole === 'host') query.role = 'Owner';
      else if (normalizedRole === 'renter') query.role = 'Renter';
    }

    // Search by name, email, or phone
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password'),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          users,
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
        'Users retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all property listings with search & filter (Admin)
// @route   GET /api/admin/properties
// @access  Private (Admin only)
const getAllProperties = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by approval status
    if (req.query.approvalStatus && req.query.approvalStatus !== 'all') {
      query.approvalStatus = req.query.approvalStatus;
    }

    // Filter by active status
    if (req.query.isActive !== undefined && req.query.isActive !== 'all') {
      query.isActive = req.query.isActive === 'true' || req.query.isActive === true;
    }

    // Filter by flagged status
    if (req.query.isFlagged !== undefined) {
      query.isFlagged = req.query.isFlagged === 'true' || req.query.isFlagged === true;
    }

    // Search keyword across title, description, and city
    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'address.city': searchRegex },
        { 'address.street': searchRegex },
        { propertyType: searchRegex },
      ];
    }

    const [total, properties] = await Promise.all([
      Property.countDocuments(query),
      Property.find(query)
        .populate('owner', 'name email phone avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          properties,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
        'Properties retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending property submissions awaiting approval
// @route   GET /api/admin/properties/pending
// @access  Private (Admin only)
const getPendingProperties = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [total, properties] = await Promise.all([
      Property.countDocuments({ approvalStatus: 'pending' }),
      Property.find({ approvalStatus: 'pending' })
        .populate('owner', 'name email phone avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          properties,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
        'Pending properties retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Approve property listing
// @route   PATCH /api/admin/properties/:id/approve
// @access  Private (Admin only)
const approveProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return next(new ApiError(404, 'Property not found in database'));
    }

    property.approvalStatus = 'approved';
    property.isActive = true;
    await property.save();

    await property.populate('owner', 'name email phone avatar');

    res.status(200).json(new ApiResponse(200, { property }, 'Property listing approved successfully'));
  } catch (error) {
    next(error);
  }
};

// @desc    Reject property listing
// @route   PATCH /api/admin/properties/:id/reject
// @access  Private (Admin only)
const rejectProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return next(new ApiError(404, 'Property not found in database'));
    }

    property.approvalStatus = 'rejected';
    property.isActive = false;
    await property.save();

    await property.populate('owner', 'name email phone avatar');

    res.status(200).json(new ApiResponse(200, { property }, 'Property listing rejected'));
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate or toggle property listing active status
// @route   PATCH /api/admin/properties/:id/deactivate
// @access  Private (Admin only)
const deactivateProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return next(new ApiError(404, 'Property not found in database'));
    }

    const nextActive = req.body.isActive !== undefined ? Boolean(req.body.isActive) : !property.isActive;
    property.isActive = nextActive;
    await property.save();

    await property.populate('owner', 'name email phone avatar');

    res.status(200).json(
      new ApiResponse(
        200,
        { property },
        `Property listing ${nextActive ? 'activated' : 'deactivated'} successfully`
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get reported or flagged content (Admin)
// @route   GET /api/admin/flagged
// @access  Private (Admin only)
const getFlaggedContent = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [total, properties] = await Promise.all([
      Property.countDocuments({ isFlagged: true }),
      Property.find({ isFlagged: true })
        .populate('owner', 'name email phone avatar')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          flaggedProperties: properties,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
        'Flagged content retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Flag or unflag a property listing
// @route   PATCH /api/admin/properties/:id/flag
// @access  Private (Admin only)
const flagProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return next(new ApiError(404, 'Property not found in database'));
    }

    const isFlagged = req.body.isFlagged !== undefined ? Boolean(req.body.isFlagged) : !property.isFlagged;
    property.isFlagged = isFlagged;
    if (isFlagged) {
      property.flagReason = req.body.flagReason || 'Flagged for moderation review';
      property.flaggedAt = new Date();
    } else {
      property.flagReason = '';
      property.flaggedAt = null;
    }

    await property.save();
    await property.populate('owner', 'name email phone avatar');

    res.status(200).json(
      new ApiResponse(
        200,
        { property },
        `Property ${isFlagged ? 'flagged for moderation' : 'unflagged'}`
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (Admin)
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin only)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) {
      return next(new ApiError(400, 'Please specify the new role'));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ApiError(404, 'User not found in database'));
    }

    user.role = role;
    await user.save();

    res.status(200).json(new ApiResponse(200, { user }, `User role updated to ${user.role}`));
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account (Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ApiError(404, 'User not found in database'));
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json(new ApiResponse(200, null, 'User deleted successfully from database'));
  } catch (error) {
    next(error);
  }
};

// @desc    Permanently delete property listing (Admin)
// @route   DELETE /api/admin/properties/:id
// @access  Private (Admin only)
const deleteProperty = async (req, res, next) => {
  try {
    const propertyId = req.params.id;
    const mongoose = require('mongoose');

    if (mongoose.Types.ObjectId.isValid(propertyId)) {
      await Property.findByIdAndDelete(propertyId);
    } else {
      await Property.deleteMany({
        $or: [{ customId: propertyId }, { title: propertyId }],
      }).catch(() => null);
    }

    res.status(200).json(
      new ApiResponse(200, { deletedId: propertyId }, 'Property listing deleted permanently by administrator')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
