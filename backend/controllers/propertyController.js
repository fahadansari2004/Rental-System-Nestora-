const Property = require('../models/Property');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get all properties with advanced search, filtering, and pagination
// @route   GET /api/properties
// @access  Public
const getProperties = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 9));
    const skip = (page - 1) * limit;

    const query = {};

    // Only approved and active properties by default for public users
    if (req.query.approvalStatus) {
      query.approvalStatus = req.query.approvalStatus;
    } else {
      query.approvalStatus = 'approved';
    }

    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true' || req.query.isActive === true;
    } else {
      query.isActive = true;
    }

    // Property Type / Category filter
    const categoryMap = {
      'residential': ['Apartment', 'Flat', 'Villa', 'Independent House', 'Studio Apartment'],
      'rooms & pg': ['Single Room', 'Shared Room', 'Paying Guest', 'Hostel Room'],
      'commercial': ['Retail Shop', 'Showroom', 'Office Space', 'Commercial Building', 'Warehouse', 'Commercial Floor']
    };

    if (req.query.propertyType && req.query.propertyType !== 'All') {
      query.propertyType = new RegExp(`^${req.query.propertyType.trim()}$`, 'i');
    } else if (req.query.category && req.query.category !== 'All') {
      const catLower = req.query.category.toLowerCase().trim();
      if (categoryMap[catLower]) {
        query.propertyType = { $in: categoryMap[catLower].map(t => new RegExp(`^${t}$`, 'i')) };
      } else {
        query.propertyType = new RegExp(req.query.category.trim(), 'i');
      }
    }

    // Specific City filter
    if (req.query.city && req.query.city !== 'All') {
      query['address.city'] = new RegExp(req.query.city.trim(), 'i');
    }

    // Rent / Price Range filter
    const minPrice = Number(req.query.minPrice);
    const maxPrice = Number(req.query.maxPrice);
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      query.rentPerMonth = {};
      if (!isNaN(minPrice) && minPrice > 0) query.rentPerMonth.$gte = minPrice;
      if (!isNaN(maxPrice) && maxPrice > 0) query.rentPerMonth.$lte = maxPrice;
    }

    // Bedrooms filter (supports bedrooms, minBedrooms, or bhk like "2 BHK")
    const bedQuery = req.query.bedrooms || req.query.minBedrooms || req.query.bhk;
    if (bedQuery) {
      const beds = parseInt(bedQuery, 10);
      if (!isNaN(beds) && beds > 0) {
        query['specifications.bedrooms'] = { $gte: beds };
      }
    }

    // Bathrooms filter
    const bathQuery = req.query.bathrooms || req.query.minBathrooms;
    if (bathQuery) {
      const baths = parseInt(bathQuery, 10);
      if (!isNaN(baths) && baths > 0) {
        query['specifications.bathrooms'] = { $gte: baths };
      }
    }

    // Owner filter
    if (req.query.owner || req.query.host) {
      query.owner = req.query.owner || req.query.host;
    }

    // Free-text keyword search across title, description, and location
    const search = req.query.search || req.query.keyword;
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'address.city': searchRegex },
        { 'address.state': searchRegex },
        { 'address.street': searchRegex },
        { 'address.formattedAddress': searchRegex },
        { propertyType: searchRegex },
      ];
    }

    // Geolocation radius search (if lat, lng, radiusKm provided)
    if (req.query.lat && req.query.lng) {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      const radiusKm = parseFloat(req.query.radius) || 25;
      const radiusInRadians = radiusKm / 6378.1; // Earth's radius in km

      query.geolocation = {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians],
        },
      };
    }

    // Sorting
    let sort = { createdAt: -1 };
    if (req.query.sortBy === 'price-asc' || req.query.sortBy === 'rent-asc' || req.query.sortBy === 'price_asc') {
      sort = { rentPerMonth: 1 };
    } else if (req.query.sortBy === 'price-desc' || req.query.sortBy === 'rent-desc' || req.query.sortBy === 'price_desc') {
      sort = { rentPerMonth: -1 };
    } else if (req.query.sortBy === 'rating') {
      sort = { averageRating: -1, numReviews: -1 };
    } else if (req.query.sortBy === 'oldest') {
      sort = { createdAt: 1 };
    }

    // Query MongoDB
    const [total, properties] = await Promise.all([
      Property.countDocuments(query),
      Property.find(query)
        .populate('owner', 'name email phone avatar role')
        .sort(sort)
        .skip(skip)
        .limit(limit),
    ]);

    res.status(200).json(
      new ApiResponse(
        200,
        {
          properties,
          total,
          count: properties.length,
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

// @desc    Get single property by ID
// @route   GET /api/properties/:id
// @access  Public
const getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      'owner',
      'name email phone avatar role bio'
    );

    if (!property) {
      return next(new ApiError(404, 'Property not found in database'));
    }

    res.status(200).json(new ApiResponse(200, { property }, 'Property retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new rental property
// @route   POST /api/properties
// @access  Private (Owner, Admin)
const createProperty = async (req, res, next) => {
  try {
    const {
      title,
      description,
      address,
      rentPerMonth,
      price,
      amenities,
      propertyType,
      category,
      availabilityDates,
      images,
      specifications,
      geolocation,
    } = req.body;

    // Normalizing address object
    let formattedAddrObj = {
      street: '',
      city: 'Kochi',
      state: 'Kerala',
      country: 'India',
      zipCode: '',
      formattedAddress: '',
    };

    if (typeof address === 'string') {
      formattedAddrObj.street = address;
      formattedAddrObj.formattedAddress = address;
    } else if (typeof address === 'object' && address !== null) {
      formattedAddrObj = {
        street: address.street || address.address || '',
        city: address.city || 'Kochi',
        state: address.state || 'Kerala',
        country: address.country || 'India',
        zipCode: address.zipCode || address.postalCode || '',
        formattedAddress: [address.street, address.city, address.state].filter(Boolean).join(', '),
      };
    }

    // Default images if none provided
    const propertyImages =
      Array.isArray(images) && images.length > 0
        ? images
        : ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'];

    // Normalize geolocation coordinates [longitude, latitude]
    let geo = {
      type: 'Point',
      coordinates: [76.2673, 9.9312], // Default Kochi coords
    };
    if (geolocation?.coordinates && Array.isArray(geolocation.coordinates) && geolocation.coordinates.length === 2) {
      geo.coordinates = [Number(geolocation.coordinates[0]), Number(geolocation.coordinates[1])];
    } else if (geolocation?.latitude !== undefined && geolocation?.longitude !== undefined) {
      geo.coordinates = [Number(geolocation.longitude), Number(geolocation.latitude)];
    } else if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
      geo.coordinates = [Number(req.body.longitude), Number(req.body.latitude)];
    }

    // Normalize availability dates
    let dates = {
      startDate: new Date(),
      endDate: null,
    };
    if (availabilityDates) {
      if (availabilityDates.startDate) dates.startDate = new Date(availabilityDates.startDate);
      if (availabilityDates.endDate) dates.endDate = new Date(availabilityDates.endDate);
    } else if (req.body.availableFrom) {
      dates.startDate = new Date(req.body.availableFrom);
    }

    // Construct property payload
    let ownerRef = req.user._id;
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(ownerRef) && req.user.email) {
      const dbUser = await User.findOne({ email: req.user.email.toLowerCase().trim() }).select('_id');
      if (dbUser) ownerRef = dbUser._id;
    }

    // Auto-promote Renter to Owner upon listing their first property
    if (req.user.role === 'Renter' || (req.user.role || '').toLowerCase() === 'renter') {
      req.user.role = 'Owner';
      if (mongoose.Types.ObjectId.isValid(req.user._id)) {
        await User.findByIdAndUpdate(req.user._id, { role: 'Owner' }).catch(() => null);
      }
    }

    const isAdmin = req.user.role === 'Admin' || (req.user.role || '').toLowerCase() === 'admin';

    const propertyData = {
      title,
      description,
      address: formattedAddrObj,
      rentPerMonth: Number(rentPerMonth || price || 25000),
      amenities: Array.isArray(amenities) ? amenities : ['High-Speed WiFi', 'Furnished', 'Air Conditioning'],
      category: category || 'Residential',
      propertyType: propertyType || category || 'Apartment',
      availabilityDates: dates,
      images: propertyImages,
      owner: ownerRef,
      approvalStatus: isAdmin ? 'approved' : 'pending',
      isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : true,
      specifications: specifications || { bedrooms: 2, bathrooms: 2, areaSqFt: 1100 },
      geolocation: geo,
    };

    const property = await Property.create(propertyData);
    if (mongoose.Types.ObjectId.isValid(property.owner)) {
      await property.populate('owner', 'name email phone avatar role').catch(() => null);
    }

    res.status(201).json(new ApiResponse(201, { property }, 'Property created successfully in database'));
  } catch (error) {
    next(error);
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private (Owner of property or Admin)
const updateProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return next(new ApiError(404, 'Property not found in database'));
    }

    const isOwner = property.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';
    if (!isOwner && !isAdmin) {
      return next(new ApiError(403, 'Not authorized to modify this property'));
    }

    // If regular owner updates key fields, re-queue for approval
    const updates = { ...req.body };
    if (!isAdmin && (updates.title || updates.rentPerMonth || updates.address)) {
      updates.approvalStatus = 'pending';
    }

    // Geolocation update normalization
    if (updates.latitude !== undefined && updates.longitude !== undefined) {
      updates.geolocation = {
        type: 'Point',
        coordinates: [Number(updates.longitude), Number(updates.latitude)],
      };
    } else if (updates.geolocation?.latitude !== undefined && updates.geolocation?.longitude !== undefined) {
      updates.geolocation = {
        type: 'Point',
        coordinates: [Number(updates.geolocation.longitude), Number(updates.geolocation.latitude)],
      };
    }

    // Availability dates normalization
    if (updates.availableFrom) {
      updates.availabilityDates = {
        startDate: new Date(updates.availableFrom),
        endDate: updates.availableUntil ? new Date(updates.availableUntil) : null,
      };
    }

    if (updates.price && !updates.rentPerMonth) {
      updates.rentPerMonth = updates.price;
    }
    if (updates.category && !updates.propertyType) {
      updates.propertyType = updates.category;
    }

    const updated = await Property.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate('owner', 'name email phone avatar role');

    res.status(200).json(new ApiResponse(200, { property: updated }, 'Property updated successfully'));
  } catch (error) {
    next(error);
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private (Owner of property or Admin)
const deleteProperty = async (req, res, next) => {
  try {
    const propertyId = req.params.id;
    const mongoose = require('mongoose');

    let property = null;
    if (mongoose.Types.ObjectId.isValid(propertyId)) {
      property = await Property.findById(propertyId);
    }
    if (!property) {
      property = await Property.findOne({
        $or: [{ customId: propertyId }, { title: propertyId }],
      }).catch(() => null);
    }

    if (property) {
      const isOwner = property.owner && property.owner.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'Admin' || (req.user.role || '').toLowerCase() === 'admin';
      if (!isOwner && !isAdmin) {
        return next(new ApiError(403, 'Not authorized to delete this property'));
      }
      await Property.findByIdAndDelete(property._id);
    }

    res.status(200).json(new ApiResponse(200, { deletedId: propertyId }, 'Property deleted successfully from database'));
  } catch (error) {
    next(error);
  }
};

// @desc    Get properties owned by the current authenticated user
// @route   GET /api/properties/my-properties
// @access  Private (Owner, Admin)
const getMyProperties = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const mongoose = require('mongoose');
    let ownerIds = [req.user._id];
    if (req.user.email) {
      const realUser = await User.findOne({ email: req.user.email.toLowerCase().trim() }).select('_id');
      if (realUser) ownerIds.push(realUser._id);
    }
    const query = {
      $or: [
        { owner: { $in: ownerIds } },
        { 'owner.email': req.user.email },
        { 'owner._id': req.user._id },
        { owner: req.user.email },
      ],
    };

    const [total, properties] = await Promise.all([
      Property.countDocuments(query),
      Property.find(query)
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
        'My properties retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle favorite saved property for user
// @route   POST /api/properties/:id/favorite
// @access  Private
const toggleFavorite = async (req, res, next) => {
  try {
    const propertyId = req.params.id;
    const property = await Property.findById(propertyId);
    if (!property) {
      return next(new ApiError(404, 'Property not found in database'));
    }

    const user = await User.findById(req.user._id);
    const isSaved = user.savedProperties.some((id) => id.toString() === propertyId);

    if (isSaved) {
      user.savedProperties = user.savedProperties.filter((id) => id.toString() !== propertyId);
    } else {
      user.savedProperties.push(propertyId);
    }

    await user.save();

    res.status(200).json(
      new ApiResponse(
        200,
        {
          isFavorite: !isSaved,
          savedCount: user.savedProperties.length,
        },
        isSaved ? 'Property removed from saved favorites' : 'Property added to saved favorites'
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
  toggleFavorite,
};
