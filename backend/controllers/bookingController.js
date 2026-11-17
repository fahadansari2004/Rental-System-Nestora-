const Booking = require('../models/Booking');
const Property = require('../models/Property');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// @desc    Create a new lease booking in MongoDB
// @route   POST /api/bookings
// @access  Private (Renter, Owner, Admin)
const createBooking = async (req, res, next) => {
  try {
    const { property: propertyId, moveInDate, checkIn, duration, nights, specialRequests, propertyData } = req.body;

    let property = null;
    try {
      property = await Property.findById(propertyId);
    } catch {}
    if (!property) {
      property = await Property.findOne({
        $or: [{ customId: propertyId }, { _id: propertyId }, { title: propertyId }],
      });
    }

    // Fall back to provided propertyData if property not in MongoDB yet
    if (!property && propertyData) {
      property = propertyData;
    }

    if (!property) {
      return next(new ApiError(404, 'Property not found in database'));
    }

    if (property.isActive === false || (property.approvalStatus && property.approvalStatus !== 'approved')) {
      return next(new ApiError(400, 'This property is currently not available for rental booking'));
    }

    // Prevent owners from booking their own property
    const ownerId = (property.owner?._id || property.owner || property.host?._id || property.host || '').toString();
    const currentUserId = (req.user._id || '').toString();
    const currentUserEmail = (req.user.email || '').toLowerCase().trim();
    const ownerEmail = (property.owner?.email || property.host?.email || '').toLowerCase().trim();

    if ((ownerId && ownerId === currentUserId) || (currentUserEmail && ownerEmail && currentUserEmail === ownerEmail)) {
      return next(new ApiError(400, 'You cannot book your own property listing'));
    }

    // Validate move-in date
    const rawDate = moveInDate || checkIn;
    if (!rawDate) {
      return next(new ApiError(400, 'Move-in date is required'));
    }

    const startDate = new Date(rawDate);
    if (isNaN(startDate.getTime())) {
      return next(new ApiError(400, 'Invalid move-in date format'));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDate < today) {
      return next(new ApiError(400, 'Move-in date cannot be in the past'));
    }

    // Validate rental duration
    const leaseMonths = parseInt(duration || nights || 1, 10);
    if (isNaN(leaseMonths) || leaseMonths < 1 || leaseMonths > 60) {
      return next(new ApiError(400, 'Rental duration must be between 1 and 60 months'));
    }

    // Prevent conflicting confirmed bookings for the same property and period
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + leaseMonths);

    const conflictingBookings = await Booking.find({
      property: property._id,
      status: 'confirmed',
    });

    const hasConflict = conflictingBookings.some((b) => {
      const bStart = new Date(b.moveInDate);
      const bEnd = new Date(bStart);
      bEnd.setMonth(bEnd.getMonth() + (b.duration || 1));
      return startDate < bEnd && endDate > bStart;
    });

    if (hasConflict) {
      return next(
        new ApiError(
          409,
          'This property already has a confirmed booking for the selected rental dates'
        )
      );
    }

    // Calculate total amount based on property rentPerMonth
    const totalAmount = property.rentPerMonth * leaseMonths;

    // Resolve owner reference accurately (preserves admin / owner ownership)
    const ownerRef =
      property.owner?._id ||
      property.owner ||
      property.host?._id ||
      property.host ||
      req.body.owner ||
      req.body.propertyData?.owner;

    // Create booking in MongoDB
    const booking = await Booking.create({
      property: property._id || propertyId,
      renter: req.user._id,
      owner: ownerRef,
      moveInDate: startDate,
      duration: leaseMonths,
      totalAmount,
      status: 'pending',
      specialRequests: specialRequests || '',
    });

    try {
      await booking.populate([
        { path: 'property', select: 'title rentPerMonth address images propertyType owner host' },
        { path: 'renter', select: 'name email phone avatar' },
        { path: 'owner', select: 'name email phone avatar' },
      ]);
    } catch {}

    const bookingObj = booking.toObject ? booking.toObject() : { ...booking };
    if (!bookingObj.owner || typeof bookingObj.owner !== 'object' || !bookingObj.owner.email) {
      const pOwner = property.owner && typeof property.owner === 'object' ? property.owner : property.host;
      bookingObj.owner = (typeof pOwner === 'object' && pOwner?.email) ? pOwner : {
        _id: ownerRef || 'usr_owner_01',
        name: property.owner?.name || property.host?.name || 'Verified Landlord',
        email: property.owner?.email || property.host?.email || 'owner@nestora.com',
        phone: property.owner?.phone || property.host?.phone || '+91 98470 12345',
      };
    }
    if (!bookingObj.property || typeof bookingObj.property !== 'object' || !bookingObj.property.title) {
      bookingObj.property = {
        _id: property._id || propertyId,
        title: property.title || 'Nestora Residence',
        rentPerMonth: property.rentPerMonth,
        address: property.address,
        images: property.images,
        owner: bookingObj.owner,
      };
    }

    res.status(201).json(new ApiResponse(201, { booking: bookingObj }, 'Booking created successfully in database'));
  } catch (error) {
    next(error);
  }
};

// @desc    Get user bookings (role-based: Renter gets their rentals, Owner gets their incoming leases, Admin gets all)
// @route   GET /api/bookings
// @access  Private
const getBookings = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    // Role-based visibility
    if (req.user.role === 'Admin') {
      // Admin can view all or filter by renter / owner
      if (req.query.renter) query.renter = req.query.renter;
      if (req.query.owner) query.owner = req.query.owner;
    } else if (req.user.role === 'Owner') {
      const ownerIds = [req.user._id];
      if (req.user.email) {
        const dbUser = await User.findOne({ email: req.user.email.toLowerCase().trim() }).select('_id');
        if (dbUser) ownerIds.push(dbUser._id);
      }
      query.$or = [
        { owner: { $in: ownerIds } },
        { 'owner.email': req.user.email },
        { 'owner._id': req.user._id },
        { owner: req.user.email },
      ];
    } else {
      const renterIds = [req.user._id];
      if (req.user.email) {
        const dbUser = await User.findOne({ email: req.user.email.toLowerCase().trim() }).select('_id');
        if (dbUser) renterIds.push(dbUser._id);
      }
      query.$or = [
        { renter: { $in: renterIds } },
        { 'renter.email': req.user.email },
        { 'renter._id': req.user._id },
        { renter: req.user.email },
      ];
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const [total, bookings] = await Promise.all([
      Booking.countDocuments(query),
      Booking.find(query)
        .populate({ path: 'property', select: 'title rentPerMonth address images propertyType' })
        .populate({ path: 'renter', select: 'name email phone avatar' })
        .populate({ path: 'owner', select: 'name email phone avatar' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          bookings,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
        'Bookings retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({ path: 'property', select: 'title rentPerMonth address images propertyType specifications' })
      .populate({ path: 'renter', select: 'name email phone avatar bio' })
      .populate({ path: 'owner', select: 'name email phone avatar bio' });

    if (!booking) {
      return next(new ApiError(404, 'Booking not found in database'));
    }

    const isRenter = booking.renter._id.toString() === req.user._id.toString();
    const isOwner = booking.owner._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isRenter && !isOwner && !isAdmin) {
      return next(new ApiError(403, 'Not authorized to view this booking'));
    }

    res.status(200).json(new ApiResponse(200, { booking }, 'Booking retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (Confirm/Approve, Reject, Cancel, Complete)
// @route   PATCH /api/bookings/:id/status
// @access  Private (Owner, Renter, Admin)
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    let booking = null;
    try {
      booking = await Booking.findById(req.params.id);
    } catch {}
    if (!booking) {
      booking = await Booking.findOne({
        $or: [{ customId: req.params.id }, { _id: req.params.id }],
      });
    }

    if (!booking) {
      return next(new ApiError(404, 'Booking not found in database'));
    }

    const renterIdStr = (booking.renter?._id || booking.renter || '').toString();
    const ownerIdStr = (booking.owner?._id || booking.owner || '').toString();
    const currentUserIdStr = (req.user._id || '').toString();
    const currentUserEmail = (req.user.email || '').toLowerCase().trim();

    const isRenter = renterIdStr === currentUserIdStr || (currentUserEmail && booking.renter?.email === currentUserEmail);
    const isOwner = ownerIdStr === currentUserIdStr || (currentUserEmail && booking.owner?.email === currentUserEmail);
    const isAdmin = req.user.role === 'Admin';

    if (!isRenter && !isOwner && !isAdmin) {
      return next(new ApiError(403, 'Not authorized to update this booking'));
    }

    const normalizedStatus = (status || '').toLowerCase().trim();

    // Renter permissions: Can only cancel their own bookings
    if (isRenter && !isAdmin && !isOwner) {
      if (normalizedStatus !== 'cancelled') {
        return next(new ApiError(403, 'Renters can only cancel bookings'));
      }
      if (booking.status === 'completed') {
        return next(new ApiError(400, 'Cannot cancel an already completed booking'));
      }
    }

    // Owner permissions: Can approve (confirm), reject, or cancel bookings for their own properties
    if (isOwner && !isAdmin) {
      if (!['confirmed', 'rejected', 'cancelled'].includes(normalizedStatus)) {
        return next(new ApiError(400, 'Owners can only approve (confirm), reject, or cancel bookings'));
      }
    }

    // Prevent conflicting confirmed bookings for the same property and period
    if (normalizedStatus === 'confirmed') {
      const startA = new Date(booking.moveInDate);
      const endA = new Date(startA);
      endA.setMonth(endA.getMonth() + (booking.duration || 1));

      // Find other confirmed bookings for this property
      const otherConfirmed = await Booking.find({
        property: booking.property,
        _id: { $ne: booking._id },
        status: 'confirmed',
      });

      const hasConflict = otherConfirmed.some((b) => {
        const startB = new Date(b.moveInDate);
        const endB = new Date(startB);
        endB.setMonth(endB.getMonth() + (b.duration || 1));
        return startA < endB && endA > startB;
      });

      if (hasConflict) {
        return next(
          new ApiError(
            409,
            'Cannot approve booking: This property already has a confirmed booking for the selected rental period'
          )
        );
      }
    }

    booking.status = normalizedStatus;
    await booking.save();

    try {
      await booking.populate([
        { path: 'property', select: 'title rentPerMonth address images propertyType' },
        { path: 'renter', select: 'name email phone avatar' },
        { path: 'owner', select: 'name email phone avatar' },
      ]);
    } catch {}

    res.status(200).json(new ApiResponse(200, { booking }, `Booking status updated to ${normalizedStatus}`));
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel booking
// @route   DELETE /api/bookings/:id
// @access  Private (Renter, Admin)
const deleteBooking = async (req, res, next) => {
  try {
    let booking = null;
    try {
      booking = await Booking.findById(req.params.id);
    } catch {}
    if (!booking) {
      booking = await Booking.findOne({
        $or: [{ customId: req.params.id }, { _id: req.params.id }],
      });
    }
    if (!booking) {
      return next(new ApiError(404, 'Booking not found in database'));
    }

    const renterIdStr = (booking.renter?._id || booking.renter || '').toString();
    const currentUserIdStr = (req.user._id || '').toString();
    const currentUserEmail = (req.user.email || '').toLowerCase().trim();
    const isRenter = renterIdStr === currentUserIdStr || (currentUserEmail && booking.renter?.email === currentUserEmail);
    const isAdmin = req.user.role === 'Admin';

    if (!isRenter && !isAdmin) {
      return next(new ApiError(403, 'Not authorized to delete this booking'));
    }

    await Booking.deleteOne({ _id: booking._id });

    res.status(200).json(new ApiResponse(200, null, 'Booking deleted successfully from database'));
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's personal rental bookings as a tenant
// @route   GET /api/bookings/my-bookings
// @access  Private
const getMyBookings = async (req, res, next) => {
  try {
    const renterIds = [req.user._id];
    if (req.user.email) {
      const dbUser = await User.findOne({ email: req.user.email.toLowerCase().trim() }).select('_id');
      if (dbUser) renterIds.push(dbUser._id);
    }
    const query = {
      $or: [
        { renter: { $in: renterIds } },
        { 'renter.email': req.user.email },
        { 'renter._id': req.user._id },
        { renter: req.user.email },
      ],
    };
    if (req.query.status) query.status = req.query.status;

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('property', 'title rentPerMonth address images propertyType')
      .populate('owner', 'name email phone avatar');

    res.status(200).json(new ApiResponse(200, { bookings, total: bookings.length }, 'Tenant bookings retrieved'));
  } catch (error) {
    next(error);
  }
};

// @desc    Get incoming tenant bookings on properties owned/managed by the current user
// @route   GET /api/bookings/host-bookings
// @access  Private
const getHostBookings = async (req, res, next) => {
  try {
    const ownerIds = [req.user._id];
    if (req.user.email) {
      const dbUser = await User.findOne({ email: req.user.email.toLowerCase().trim() }).select('_id');
      if (dbUser) ownerIds.push(dbUser._id);
    }

    // 1. Identify all properties owned by this user
    let allPropIds = [];
    try {
      const hostProperties = await Property.find({
        $or: [
          { owner: { $in: ownerIds } },
          { 'owner.email': req.user.email },
          { 'owner._id': req.user._id },
          { owner: req.user.email },
          { 'host.email': req.user.email },
          { 'host._id': req.user._id },
          { host: { $in: ownerIds } },
        ],
      }).select('_id customId');

      const hostPropIds = hostProperties.map((p) => p._id);
      const hostCustomIds = hostProperties.map((p) => p.customId).filter(Boolean);
      allPropIds = [...hostPropIds, ...hostCustomIds];
    } catch {}

    const query = {
      $or: [
        { owner: { $in: ownerIds } },
        { 'owner.email': req.user.email },
        { 'owner._id': req.user._id },
        { owner: req.user.email },
        ...(allPropIds.length > 0 ? [{ property: { $in: allPropIds } }] : []),
      ],
    };
    if (req.query.status) query.status = req.query.status;

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('property', 'title rentPerMonth address images propertyType owner host')
      .populate('renter', 'name email phone avatar')
      .populate('owner', 'name email phone avatar');

    res.status(200).json(new ApiResponse(200, { bookings, total: bookings.length }, 'Host incoming bookings retrieved'));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getMyBookings,
  getHostBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking: (req, res, next) => {
    req.body.status = 'cancelled';
    return updateBookingStatus(req, res, next);
  },
  deleteBooking,
};
