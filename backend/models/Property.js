const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
      maxlength: [140, 'Title cannot exceed 140 characters'],
    },
    description: {
      type: String,
      required: [true, 'Property description is required'],
      trim: true,
    },
    address: {
      street: {
        type: String,
        trim: true,
        default: '',
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
      },
      country: {
        type: String,
        trim: true,
        default: 'India',
      },
      zipCode: {
        type: String,
        trim: true,
        default: '',
      },
      formattedAddress: {
        type: String,
        trim: true,
        default: '',
      },
    },
    geolocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        default: [76.2673, 9.9312], // Kochi coordinates by default
      },
    },
    rentPerMonth: {
      type: Number,
      required: [true, 'Monthly rent is required'],
      min: [1, 'Monthly rent must be at least 1'],
    },
    amenities: {
      type: [String],
      default: [],
    },
    propertyType: {
      type: String,
      required: [true, 'Property type is required'],
      trim: true,
      default: 'Apartment',
    },
    availabilityDates: {
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: {
        type: Date,
        default: null,
      },
    },
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'A property must have at least one image',
      },
    },
    category: {
      type: String,
      default: 'Residential',
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      required: [true, 'Owner reference is required'],
    },
    approvalStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: 'Approval status must be pending, approved, or rejected',
      },
      default: 'pending',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: '',
    },
    flaggedAt: {
      type: Date,
    },
    // Supporting specifications for UI convenience
    specifications: {
      bedrooms: {
        type: Number,
        default: 1,
        min: 0,
      },
      bathrooms: {
        type: Number,
        default: 1,
        min: 0,
      },
      areaSqFt: {
        type: Number,
        default: 750,
      },
    },
    averageRating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field compatibility for existing frontend consumption
propertySchema.virtual('price').get(function () {
  return this.rentPerMonth;
});

propertySchema.virtual('host').get(function () {
  return this.owner;
});

propertySchema.virtual('featuredImage').get(function () {
  return this.images && this.images.length > 0 ? this.images[0] : '';
});

// Format address pre-save hook
propertySchema.pre('validate', function (next) {
  if (this.address) {
    if (!this.address.formattedAddress) {
      const parts = [this.address.street, this.address.city, this.address.state, this.address.country].filter(Boolean);
      this.address.formattedAddress = parts.join(', ');
    }
  }
  next();
});

// Database indexes
propertySchema.index({
  title: 'text',
  description: 'text',
  'address.city': 'text',
  'address.state': 'text',
  'address.street': 'text',
  'address.formattedAddress': 'text',
});

propertySchema.index({ geolocation: '2dsphere' });
propertySchema.index({ approvalStatus: 1, isActive: 1, rentPerMonth: 1 });
propertySchema.index({ owner: 1, createdAt: -1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ 'address.city': 1 });
propertySchema.index({ isFlagged: 1 });

const Property = mongoose.model('Property', propertySchema);
module.exports = Property;
