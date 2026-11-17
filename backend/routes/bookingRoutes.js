const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  getMyBookings,
  getHostBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validate, bookingValidation, bookingStatusValidation } = require('../middleware/validationMiddleware');

router.post('/', protect, validate(bookingValidation), createBooking);
router.get('/', protect, getBookings);
router.get('/my-bookings', protect, getMyBookings);
router.get('/host-bookings', protect, authorizeRoles('Owner', 'Admin'), getHostBookings);
router.get('/:id', protect, getBookingById);
router.patch('/:id/status', protect, validate(bookingStatusValidation), updateBookingStatus);
router.put('/:id/status', protect, validate(bookingStatusValidation), updateBookingStatus);
router.put('/:id/cancel', protect, cancelBooking);
router.delete('/:id', protect, deleteBooking);

module.exports = router;
