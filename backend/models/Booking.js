const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Property',
      required: [true, 'Property reference is required'],
    },
    renter: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      required: [true, 'Renter reference is required'],
    },
    owner: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'User',
      required: [true, 'Owner reference is required'],
    },
    moveInDate: {
      type: Date,
      required: [true, 'Move-in date is required'],
    },
    duration: {
      type: Number,
      required: [true, 'Lease duration (months) is required'],
      min: [1, 'Lease duration must be at least 1 month'],
      default: 1,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
        message: 'Status must be pending, confirmed, rejected, cancelled, or completed',
      },
      default: 'pending',
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total booking amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    specialRequests: {
      type: String,
      default: '',
      maxlength: [500, 'Special requests cannot exceed 500 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field compatibility for existing frontend consumption
bookingSchema.virtual('user').get(function () {
  return this.renter;
});

bookingSchema.virtual('host').get(function () {
  return this.owner;
});

bookingSchema.virtual('checkIn').get(function () {
  return this.moveInDate;
});

bookingSchema.virtual('nights').get(function () {
  return this.duration;
});

// Database indexes
bookingSchema.index({ property: 1, status: 1 });
bookingSchema.index({ renter: 1, createdAt: -1 });
bookingSchema.index({ owner: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
