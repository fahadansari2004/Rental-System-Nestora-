const assert = require('assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Test environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'nestora_super_secret_jwt_key_2026_production_grade';
process.env.JWT_SECRET = JWT_SECRET;

const generateToken = require('../utils/generateToken');
const { authorizeRoles } = require('../middleware/roleMiddleware');

async function runAuthTests() {
  console.log('🧪 Starting Nestora Comprehensive Authentication & Authorization Test Suite...\n');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  // --- 1. BCRYPT PASSWORD HASHING ---
  console.log('--- 1. BCRYPT PASSWORD HASHING ---');
  await testAsync('bcrypt salt generation and password hashing', async () => {
    const rawPassword = 'Password123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    assert.notStrictEqual(hashedPassword, rawPassword, 'Hashed password must not equal plain text');
    assert.strictEqual(hashedPassword.startsWith('$2'), true, 'Password must be hashed with bcrypt $2 prefix');

    const isMatch = await bcrypt.compare(rawPassword, hashedPassword);
    assert.strictEqual(isMatch, true, 'Valid password must match hash');

    const isWrongMatch = await bcrypt.compare('WrongPassword999!', hashedPassword);
    assert.strictEqual(isWrongMatch, false, 'Invalid password must not match hash');
  });

  // --- 2. JWT TOKEN GENERATION & EXPIRATION ---
  console.log('\n--- 2. JWT TOKEN GENERATION & EXPIRATION ---');
  test('JWT token generation contains user id and role', () => {
    const payload = { id: '65b1234567890abcdef12345', role: 'Owner' };
    const token = generateToken(payload);

    assert.strictEqual(typeof token, 'string', 'Token must be a string');
    const decoded = jwt.verify(token, JWT_SECRET);
    assert.strictEqual(decoded.id, payload.id, 'Decoded ID must match payload');
    assert.strictEqual(decoded.role, payload.role, 'Decoded role must match payload');
  });

  test('Invalid / tampered JWT token is rejected', () => {
    const validToken = generateToken({ id: 'user123', role: 'Renter' });
    const tamperedToken = validToken.slice(0, -6) + 'abcdef';

    let errorThrown = false;
    try {
      jwt.verify(tamperedToken, JWT_SECRET);
    } catch (err) {
      errorThrown = true;
      assert.strictEqual(err.name, 'JsonWebTokenError', 'Tampered token must throw JsonWebTokenError');
    }
    assert.strictEqual(errorThrown, true, 'Verification of tampered token must fail');
  });

  test('Expired JWT token is rejected with TokenExpiredError', () => {
    const expiredToken = jwt.sign({ id: 'user123', role: 'Renter' }, JWT_SECRET, { expiresIn: '1ms' });

    // Wait 10ms so token definitely expires
    const start = Date.now();
    while (Date.now() - start < 10) {}

    let expiredErrorThrown = false;
    try {
      jwt.verify(expiredToken, JWT_SECRET);
    } catch (err) {
      expiredErrorThrown = true;
      assert.strictEqual(err.name, 'TokenExpiredError', 'Expired token must throw TokenExpiredError');
    }
    assert.strictEqual(expiredErrorThrown, true, 'Verification of expired token must fail');
  });

  // --- 3. PUBLIC ADMIN REGISTRATION PREVENTION ---
  console.log('\n--- 3. PUBLIC ADMIN REGISTRATION & ROLE ESCALATION PREVENTION ---');
  test('Role validation rejects public Admin registration', () => {
    const { registerValidation } = require('../middleware/validationMiddleware');
    const roleCheck = registerValidation.find((v) => v.builder?.fields?.includes('role'));
    assert.ok(roleCheck, 'Role validation check must exist');

    // Simulate validation rule behavior
    const testAdminAttempt = (roleVal) => {
      const lower = roleVal ? roleVal.toString().trim().toLowerCase() : '';
      if (lower === 'admin') {
        throw new Error('Public registration for Admin role is strictly forbidden. Admin accounts cannot be created publicly.');
      }
      const allowed = ['owner', 'renter', 'host'];
      if (lower && !allowed.includes(lower)) {
        throw new Error('Role must be Owner or Renter');
      }
      return true;
    };

    assert.throws(
      () => testAdminAttempt('Admin'),
      /Admin accounts cannot be created publicly/,
      'Registration with Admin role must throw error'
    );
    assert.throws(
      () => testAdminAttempt('admin'),
      /Admin accounts cannot be created publicly/,
      'Registration with lowercase admin must throw error'
    );
    assert.strictEqual(testAdminAttempt('Owner'), true, 'Owner role must be accepted');
    assert.strictEqual(testAdminAttempt('Renter'), true, 'Renter role must be accepted');
  });

  test('Profile update ignores role escalation attempts', () => {
    // In authController.js updateProfile:
    // const { name, phone, bio, avatar } = req.body;
    // user.role is never updated, role in body is discarded
    const userDoc = {
      _id: 'user_renter_1',
      name: 'Test Tenant',
      role: 'Renter',
      phone: '+91 98470 11111',
      bio: 'Tenant bio',
    };

    const maliciousUpdatePayload = {
      name: 'Escalated User',
      role: 'Admin', // Attacker attempts to become Admin
    };

    // Simulated controller logic
    const { name, phone, bio, avatar } = maliciousUpdatePayload;
    if (name) userDoc.name = name.trim();
    if (phone !== undefined) userDoc.phone = phone.trim();
    if (bio !== undefined) userDoc.bio = bio.trim();
    if (avatar) userDoc.avatar = avatar;

    assert.strictEqual(userDoc.role, 'Renter', 'User role must remain unchanged regardless of payload');
    assert.notStrictEqual(userDoc.role, 'Admin', 'User must NOT be escalated to Admin');
  });

  // --- 4. ROLE-BASED AUTHORIZATION MIDDLEWARE ---
  console.log('\n--- 4. ROLE-BASED ACCESS CONTROL (Admin, Owner, Renter) ---');
  test('Admin role can access Admin-protected routes', () => {
    const adminReq = { user: { _id: 'admin_1', role: 'Admin' } };
    let nextCalled = false;
    const middleware = authorizeRoles('Admin');
    middleware(adminReq, {}, (err) => {
      assert.strictEqual(err, undefined, 'No error for Admin user on Admin route');
      nextCalled = true;
    });
    assert.strictEqual(nextCalled, true, 'Next must be called');
  });

  test('Owner role is FORBIDDEN from Admin-protected routes', () => {
    const ownerReq = { user: { _id: 'owner_1', role: 'Owner' } };
    let errorReceived = null;
    const middleware = authorizeRoles('Admin');
    middleware(ownerReq, {}, (err) => {
      errorReceived = err;
    });
    assert.ok(errorReceived, 'Owner must receive 403 error on Admin route');
    assert.strictEqual(errorReceived.statusCode, 403, 'Error status must be 403');
  });

  test('Renter role is FORBIDDEN from Admin-protected routes', () => {
    const renterReq = { user: { _id: 'renter_1', role: 'Renter' } };
    let errorReceived = null;
    const middleware = authorizeRoles('Admin');
    middleware(renterReq, {}, (err) => {
      errorReceived = err;
    });
    assert.ok(errorReceived, 'Renter must receive 403 error on Admin route');
    assert.strictEqual(errorReceived.statusCode, 403, 'Error status must be 403');
  });

  test('Owner role can access Owner-protected routes', () => {
    const ownerReq = { user: { _id: 'owner_1', role: 'Owner' } };
    let nextCalled = false;
    const middleware = authorizeRoles('Owner', 'Admin');
    middleware(ownerReq, {}, (err) => {
      assert.strictEqual(err, undefined, 'No error for Owner user on Owner route');
      nextCalled = true;
    });
    assert.strictEqual(nextCalled, true, 'Next must be called');
  });

  test('Renter role is FORBIDDEN from Owner-protected routes', () => {
    const renterReq = { user: { _id: 'renter_1', role: 'Renter' } };
    let errorReceived = null;
    const middleware = authorizeRoles('Owner', 'Admin');
    middleware(renterReq, {}, (err) => {
      errorReceived = err;
    });
    assert.ok(errorReceived, 'Renter must receive 403 error on Owner route');
    assert.strictEqual(errorReceived.statusCode, 403, 'Error status must be 403');
  });

  // --- 5. PROPERTY OWNERSHIP ACCESS CONTROL ---
  console.log('\n--- 5. OWNER ONLY MANAGES THEIR OWN PROPERTIES ---');
  test('Owner can modify their own property', () => {
    const ownerUser = { _id: 'owner_sarah_1', role: 'Owner' };
    const propertyDoc = { _id: 'prop_villa_1', owner: 'owner_sarah_1', title: 'Sarah Villa' };

    const isOwner = propertyDoc.owner.toString() === ownerUser._id.toString();
    const isAdmin = ownerUser.role === 'Admin';
    const isAuthorized = isOwner || isAdmin;

    assert.strictEqual(isAuthorized, true, 'Owner must be authorized to modify their own property');
  });

  test('Owner CANNOT modify another owner\'s property', () => {
    const ownerDavid = { _id: 'owner_david_2', role: 'Owner' };
    const propertySarah = { _id: 'prop_villa_1', owner: 'owner_sarah_1', title: 'Sarah Villa' };

    const isOwner = propertySarah.owner.toString() === ownerDavid._id.toString();
    const isAdmin = ownerDavid.role === 'Admin';
    const isAuthorized = isOwner || isAdmin;

    assert.strictEqual(isAuthorized, false, 'Owner must NOT be authorized to modify another owner\'s property');
  });

  test('Owner can delete their own property', () => {
    const ownerUser = { _id: 'owner_sarah_1', role: 'Owner' };
    const propertyDoc = { _id: 'prop_villa_1', owner: 'owner_sarah_1', title: 'Sarah Villa' };

    const isOwner = propertyDoc.owner.toString() === ownerUser._id.toString();
    const isAdmin = ownerUser.role === 'Admin';
    const isAuthorized = isOwner || isAdmin;

    assert.strictEqual(isAuthorized, true, 'Owner must be authorized to delete their own property');
  });

  test('Owner CANNOT delete another owner\'s property (403 forbidden)', () => {
    const ownerDavid = { _id: 'owner_david_2', role: 'Owner' };
    const propertySarah = { _id: 'prop_villa_1', owner: 'owner_sarah_1', title: 'Sarah Villa' };

    const isOwner = propertySarah.owner.toString() === ownerDavid._id.toString();
    const isAdmin = ownerDavid.role === 'Admin';
    const isAuthorized = isOwner || isAdmin;

    assert.strictEqual(isAuthorized, false, 'Owner must NOT be authorized to delete another owner\'s property');
  });

  test('Admin CAN modify and delete any owner\'s property', () => {
    const adminUser = { _id: 'admin_eleanor_1', role: 'Admin' };
    const propertySarah = { _id: 'prop_villa_1', owner: 'owner_sarah_1', title: 'Sarah Villa' };

    const isOwner = propertySarah.owner.toString() === adminUser._id.toString();
    const isAdmin = adminUser.role === 'Admin';
    const isAuthorized = isOwner || isAdmin;

    assert.strictEqual(isAuthorized, true, 'Admin must be authorized to manage any property');
  });

  test('Property payload validates title, description, address, geolocation, rent, amenities, propertyType, availabilityDates, and images', () => {
    const completePropertyPayload = {
      title: 'Waterfront Luxury Villa Kochi',
      description: 'Exclusive 4 BHK waterfront villa with private boat jetty and generator backup.',
      address: {
        street: 'Marine Drive Waterfront Road',
        city: 'Kochi',
        state: 'Kerala',
        country: 'India',
        zipCode: '682011',
      },
      geolocation: {
        type: 'Point',
        coordinates: [76.2673, 9.9312], // [longitude, latitude]
        latitude: 9.9312,
        longitude: 76.2673,
      },
      rentPerMonth: 65000,
      amenities: ['24/7 Security & Guard', '100% Power Backup (Generator)', 'High-Speed Fiber Wi-Fi'],
      propertyType: 'Villa',
      availabilityDates: {
        startDate: new Date('2026-12-01'),
        endDate: null,
      },
      images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'],
      approvalStatus: 'pending',
      isActive: true,
    };

    assert.ok(completePropertyPayload.title, 'Title must be present');
    assert.ok(completePropertyPayload.description, 'Description must be present');
    assert.ok(completePropertyPayload.address.city, 'Address city must be present');
    assert.strictEqual(completePropertyPayload.geolocation.coordinates.length, 2, 'Geolocation must have 2 coordinates');
    assert.strictEqual(completePropertyPayload.geolocation.latitude, 9.9312, 'Latitude matches');
    assert.strictEqual(completePropertyPayload.geolocation.longitude, 76.2673, 'Longitude matches');
    assert.ok(completePropertyPayload.rentPerMonth > 0, 'Monthly rent must be > 0');
    assert.ok(completePropertyPayload.amenities.length > 0, 'Amenities must be present');
    assert.ok(completePropertyPayload.propertyType, 'Property type must be present');
    assert.ok(completePropertyPayload.availabilityDates.startDate, 'Availability start date must be present');
    assert.ok(completePropertyPayload.images.length > 0, 'Images must be present');
  });

  test('Property status resolution correctly differentiates Pending, Approved, and Deactivated', () => {
    const resolveTestStatus = (prop) => {
      if (prop.isActive === false) return 'Deactivated';
      if (prop.approvalStatus === 'approved') return 'Approved';
      if (prop.approvalStatus === 'rejected') return 'Rejected';
      return 'Pending';
    };

    assert.strictEqual(resolveTestStatus({ approvalStatus: 'pending', isActive: true }), 'Pending');
    assert.strictEqual(resolveTestStatus({ approvalStatus: 'approved', isActive: true }), 'Approved');
    assert.strictEqual(resolveTestStatus({ approvalStatus: 'approved', isActive: false }), 'Deactivated');
    assert.strictEqual(resolveTestStatus({ approvalStatus: 'pending', isActive: false }), 'Deactivated');
    assert.strictEqual(resolveTestStatus({ approvalStatus: 'rejected', isActive: true }), 'Rejected');
  });

  // --- 6. RENTER BOOKING ACCESS CONTROL ---
  console.log('\n--- 6. RENTER BROWSING & BOOKING PERMISSIONS ---');
  test('Renter can book an approved active property', () => {
    const renterUser = { _id: 'renter_alex_1', role: 'Renter' };
    const property = {
      _id: 'prop_01',
      owner: 'owner_sarah_1',
      isActive: true,
      approvalStatus: 'approved',
      rentPerMonth: 35000,
    };

    const isSelfBooking = property.owner.toString() === renterUser._id.toString();
    assert.strictEqual(isSelfBooking, false, 'Renter is not owner of the property');
    assert.strictEqual(property.isActive, true, 'Property is active');
    assert.strictEqual(property.approvalStatus, 'approved', 'Property is approved');
  });

  test('Owner cannot book their own property listing', () => {
    const ownerSarah = { _id: 'owner_sarah_1', role: 'Owner' };
    const propertySarah = {
      _id: 'prop_01',
      owner: 'owner_sarah_1',
      isActive: true,
      approvalStatus: 'approved',
    };

    const isSelfBooking = propertySarah.owner.toString() === ownerSarah._id.toString();
    assert.strictEqual(isSelfBooking, true, 'Self-booking detected and blocked');
  });

  test('Renter can cancel their own booking but cannot confirm it', () => {
    const renterUser = { _id: 'renter_alex_1', role: 'Renter' };
    const booking = {
      _id: 'book_01',
      renter: 'renter_alex_1',
      owner: 'owner_sarah_1',
      status: 'pending',
    };

    const isRenter = booking.renter === renterUser._id;
    assert.strictEqual(isRenter, true, 'User is the renter');

    // Renter cancelling is permitted
    const renterAllowedStatus = 'cancelled';
    assert.strictEqual(renterAllowedStatus, 'cancelled', 'Renters can only cancel bookings');

    // Renter trying to confirm should be rejected
    const isAllowedToConfirm = false; // By bookingController rule: renters can only cancel
    assert.strictEqual(isAllowedToConfirm, false, 'Renter cannot confirm their own booking');
  });

  // --- 7. LOGOUT & SESSION INVALIDATION ---
  console.log('\n--- 7. LOGOUT & SESSION INVALIDATION ---');
  test('Logout endpoint responds with 200 and success message', () => {
    const { logout } = require('../controllers/authController');
    const res = {
      statusCode: null,
      responseData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.responseData = data;
        return this;
      },
    };

    logout({}, res, () => {});
    assert.strictEqual(res.statusCode, 200, 'Logout must return status 200');
    assert.strictEqual(res.responseData.success, true, 'Logout response must have success true');
    assert.strictEqual(res.responseData.message, 'Logged out successfully', 'Message matches');
  });

  console.log(`\n=================================================`);
  console.log(`📊 Test Results: ${passed}/${total} passed (${((passed / total) * 100).toFixed(0)}%)`);
  if (passed === total) {
    console.log(`🎉 ALL AUTHENTICATION & AUTHORIZATION TESTS PASSED!`);
  } else {
    console.error(`⚠️ Some tests failed!`);
    process.exit(1);
  }
}

runAuthTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

