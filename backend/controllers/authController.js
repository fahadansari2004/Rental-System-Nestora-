const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user in MongoDB
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, bio } = req.body;
    const lowerEmail = (email || '').toLowerCase().trim();

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      return next(new ApiError(400, 'A user with this email address already exists'));
    }

    // Security: Strictly forbid public registration with Admin role
    const requestedRole = (role || '').toString().trim().toLowerCase();
    if (requestedRole === 'admin') {
      return next(
        new ApiError(
          403,
          'Public registration for Admin role is strictly forbidden. Admin accounts cannot be created publicly.'
        )
      );
    }

    // Assign sanitized role: Only Owner or Renter are allowed for public registration
    const assignedRole = requestedRole === 'owner' || requestedRole === 'host' ? 'Owner' : 'Renter';

    // Create user document in MongoDB
    const user = await User.create({
      name,
      email: lowerEmail,
      password,
      role: assignedRole,
      phone: phone || '',
      bio: bio || undefined,
    });

    const token = generateToken({ id: user._id, role: user.role });

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          user,
          token,
        },
        'User registered successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token from MongoDB
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const lowerEmail = (email || '').toLowerCase().trim();

    // Query user with password from MongoDB
    const user = await User.findOne({ email: lowerEmail }).select('+password');
    if (!user) {
      return next(new ApiError(401, 'Invalid email or password credentials'));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid email or password credentials'));
    }

    const token = generateToken({ id: user._id, role: user.role });
    const sanitizedUser = user.toJSON();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user: sanitizedUser,
          token,
        },
        'Logged in successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user profile from MongoDB
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedProperties',
      select: 'title rentPerMonth address images propertyType averageRating',
    });

    if (!user) {
      return next(new ApiError(404, 'User not found in database'));
    }

    res.status(200).json(new ApiResponse(200, { user }, 'User profile retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile details in MongoDB
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, bio, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new ApiError(404, 'User not found in database'));
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (avatar) user.avatar = avatar;

    await user.save();

    res.status(200).json(new ApiResponse(200, { user }, 'Profile updated successfully'));
  } catch (error) {
    next(error);
  }
};

// @desc    Update user password in MongoDB
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new ApiError(400, 'Please provide both current and new passwords'));
    }

    if (newPassword.length < 6) {
      return next(new ApiError(400, 'New password must be at least 6 characters'));
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return next(new ApiError(404, 'User not found in database'));
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ApiError(401, 'Current password is incorrect'));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json(new ApiResponse(200, null, 'Password updated successfully'));
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & invalidate session
// @route   POST /api/auth/logout
// @access  Public / Private
const logout = async (req, res, next) => {
  try {
    res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
};
