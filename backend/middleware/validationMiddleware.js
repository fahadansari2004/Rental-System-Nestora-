const { check, validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

// Middleware to extract validation results and format error response
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages = errors.array().map((err) => `${err.path}: ${err.msg}`);
    return next(new ApiError(400, 'Validation Error', errorMessages));
  };
};

// Register validation rules
const registerValidation = [
  check('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters'),
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address'),
  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  check('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  check('role')
    .optional()
    .custom((val) => {
      const lower = val ? val.toString().trim().toLowerCase() : '';
      if (lower === 'admin') {
        throw new Error('Public registration for Admin role is strictly forbidden. Admin accounts cannot be created publicly.');
      }
      const allowed = ['owner', 'renter', 'host'];
      if (lower && !allowed.includes(lower)) {
        throw new Error('Role must be Owner or Renter');
      }
      return true;
    }),
];

// Login validation rules
const loginValidation = [
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address'),
  check('password').notEmpty().withMessage('Password is required'),
];

// Property creation/update validation rules
const propertyValidation = [
  check('title')
    .trim()
    .notEmpty()
    .withMessage('Property title is required')
    .isLength({ max: 140 })
    .withMessage('Title cannot exceed 140 characters'),
  check('description')
    .trim()
    .notEmpty()
    .withMessage('Property description is required'),
  check('rentPerMonth')
    .optional()
    .isNumeric()
    .withMessage('Monthly rent must be a number')
    .custom((val) => val > 0)
    .withMessage('Rent must be greater than zero'),
  check('price')
    .optional()
    .isNumeric()
    .withMessage('Price must be a number')
    .custom((val) => val > 0)
    .withMessage('Price must be greater than zero'),
  check('propertyType')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Property type cannot be empty'),
];

// Booking creation validation rules
const bookingValidation = [
  check('property')
    .trim()
    .notEmpty()
    .withMessage('Property ID is required'),
  check('moveInDate')
    .optional()
    .isISO8601()
    .withMessage('Move-in date must be a valid ISO date'),
  check('checkIn')
    .optional()
    .isISO8601()
    .withMessage('Check-in date must be a valid ISO date'),
  check('duration')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Duration must be between 1 and 60 months'),
];

// Booking status update validation
const bookingStatusValidation = [
  check('status')
    .notEmpty()
    .withMessage('Status is required')
    .customSanitizer((val) => (typeof val === 'string' ? val.toLowerCase() : val))
    .isIn(['pending', 'confirmed', 'rejected', 'cancelled', 'completed'])
    .withMessage('Status must be pending, confirmed, rejected, cancelled, or completed'),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  propertyValidation,
  bookingValidation,
  bookingStatusValidation,
};
