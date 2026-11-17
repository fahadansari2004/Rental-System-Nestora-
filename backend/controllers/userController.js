const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get all users with pagination and search (Admin)
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by role if provided
    if (req.query.role) {
      const normalizedRole = req.query.role.toLowerCase();
      if (normalizedRole === 'admin') query.role = 'Admin';
      else if (normalizedRole === 'owner' || normalizedRole === 'host') query.role = 'Owner';
      else if (normalizedRole === 'renter') query.role = 'Renter';
    }

    // Search by name or email
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
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

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin or Self)
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ApiError(404, 'User not found in database'));
    }

    // Ensure only self or admin can access detailed profile
    const isSelf = req.user._id.toString() === user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    if (!isSelf && !isAdmin) {
      return next(new ApiError(403, 'Not authorized to view this user profile'));
    }

    res.status(200).json(new ApiResponse(200, { user }, 'User retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private (Admin or Self)
const updateUser = async (req, res, next) => {
  try {
    const isSelf = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === 'Admin';

    if (!isSelf && !isAdmin) {
      return next(new ApiError(403, 'Not authorized to update this user'));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new ApiError(404, 'User not found in database'));
    }

    const { name, phone, bio, avatar, role } = req.body;

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar) user.avatar = avatar;

    // Only admin can change roles
    if (role && isAdmin) {
      user.role = role;
    }

    await user.save();

    res.status(200).json(new ApiResponse(200, { user }, 'User updated successfully'));
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
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

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
