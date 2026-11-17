/**
 * Nestora Property Search & Discovery Query Tests
 */
const assert = require('assert');

// Simulate the query builder logic from propertyController.js
function buildSearchQuery(params = {}) {
  const query = {};

  // Public visibility enforcement: only approved and active
  if (params.approvalStatus) {
    query.approvalStatus = params.approvalStatus;
  } else {
    query.approvalStatus = 'approved';
  }

  if (params.isActive !== undefined) {
    query.isActive = params.isActive === 'true' || params.isActive === true;
  } else {
    query.isActive = true;
  }

  const categoryMap = {
    'residential': ['Apartment', 'Flat', 'Villa', 'Independent House', 'Studio Apartment'],
    'rooms & pg': ['Single Room', 'Shared Room', 'Paying Guest', 'Hostel Room'],
    'commercial': ['Retail Shop', 'Showroom', 'Office Space', 'Commercial Building', 'Warehouse', 'Commercial Floor']
  };

  if (params.propertyType && params.propertyType !== 'All') {
    query.propertyType = new RegExp(`^${params.propertyType.trim()}$`, 'i');
  } else if (params.category && params.category !== 'All') {
    const catLower = params.category.toLowerCase().trim();
    if (categoryMap[catLower]) {
      query.propertyType = { $in: categoryMap[catLower].map(t => new RegExp(`^${t}$`, 'i')) };
    } else {
      query.propertyType = new RegExp(params.category.trim(), 'i');
    }
  }

  if (params.city && params.city !== 'All') {
    query['address.city'] = new RegExp(params.city.trim(), 'i');
  }

  const minPrice = Number(params.minPrice);
  const maxPrice = Number(params.maxPrice);
  if (!isNaN(minPrice) || !isNaN(maxPrice)) {
    query.rentPerMonth = {};
    if (!isNaN(minPrice) && minPrice > 0) query.rentPerMonth.$gte = minPrice;
    if (!isNaN(maxPrice) && maxPrice > 0) query.rentPerMonth.$lte = maxPrice;
  }

  const bedQuery = params.bedrooms || params.minBedrooms || params.bhk;
  if (bedQuery) {
    const beds = parseInt(bedQuery, 10);
    if (!isNaN(beds) && beds > 0) {
      query['specifications.bedrooms'] = { $gte: beds };
    }
  }

  const bathQuery = params.bathrooms || params.minBathrooms;
  if (bathQuery) {
    const baths = parseInt(bathQuery, 10);
    if (!isNaN(baths) && baths > 0) {
      query['specifications.bathrooms'] = { $gte: baths };
    }
  }

  const search = params.search || params.keyword;
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

  return query;
}

function runTests() {
  console.log('🧪 Starting Nestora Property Search & Discovery Query Tests...\n');

  // Test 1: Public visibility default enforcement
  const q1 = buildSearchQuery();
  assert.strictEqual(q1.approvalStatus, 'approved');
  assert.strictEqual(q1.isActive, true);
  console.log('  ✅ PASS: Default query enforces approved & active status');

  // Test 2: City search
  const q2 = buildSearchQuery({ city: 'Kochi' });
  assert.ok(q2['address.city'] instanceof RegExp);
  assert.ok(q2['address.city'].test('Kochi'));
  assert.ok(q2['address.city'].test('kochi'));
  console.log('  ✅ PASS: City filter regex works case-insensitively');

  // Test 3: Price range filter (minPrice, maxPrice)
  const q3 = buildSearchQuery({ minPrice: '15000', maxPrice: '50000' });
  assert.strictEqual(q3.rentPerMonth.$gte, 15000);
  assert.strictEqual(q3.rentPerMonth.$lte, 50000);
  console.log('  ✅ PASS: Price range (minPrice, maxPrice in INR) correctly set');

  // Test 4: Category mapping to property types
  const q4 = buildSearchQuery({ category: 'Residential' });
  assert.ok(q4.propertyType.$in.length === 5);
  console.log('  ✅ PASS: Category "Residential" expands to residential property types');

  // Test 5: Specific property type filter overrides category
  const q5 = buildSearchQuery({ category: 'Residential', propertyType: 'Villa' });
  assert.ok(q5.propertyType instanceof RegExp);
  assert.ok(q5.propertyType.test('Villa'));
  console.log('  ✅ PASS: Specific propertyType takes precedence over general category');

  // Test 6: Bedrooms & Bathrooms filtering
  const q6 = buildSearchQuery({ bedrooms: '3', bathrooms: '2' });
  assert.strictEqual(q6['specifications.bedrooms'].$gte, 3);
  assert.strictEqual(q6['specifications.bathrooms'].$gte, 2);
  console.log('  ✅ PASS: Bedrooms and Bathrooms filters correctly constructed');

  // Test 7: BHK alias maps to bedrooms
  const q7 = buildSearchQuery({ bhk: '2 BHK' });
  assert.strictEqual(q7['specifications.bedrooms'].$gte, 2);
  console.log('  ✅ PASS: BHK parameter parses to minimum bedrooms count');

  // Test 8: Keyword search $or fields
  const q8 = buildSearchQuery({ search: 'marine drive' });
  assert.ok(Array.isArray(q8.$or));
  assert.strictEqual(q8.$or.length, 7);
  console.log('  ✅ PASS: Free-text search builds $or regex across title, desc, and address');

  // Test 9: Combined multi-criteria search
  const q9 = buildSearchQuery({
    city: 'Kakkanad',
    category: 'Rooms & PG',
    propertyType: 'Single Room',
    minPrice: '7000',
    maxPrice: '15000',
    search: 'Infopark'
  });
  assert.strictEqual(q9.approvalStatus, 'approved');
  assert.strictEqual(q9.isActive, true);
  assert.ok(q9['address.city'].test('Kakkanad'));
  assert.ok(q9.propertyType.test('Single Room'));
  assert.strictEqual(q9.rentPerMonth.$gte, 7000);
  assert.strictEqual(q9.rentPerMonth.$lte, 15000);
  assert.ok(q9.$or.length > 0);
  console.log('  ✅ PASS: Combined multi-criteria search applies AND logic across all parameters');

  console.log('\n=================================================');
  console.log('📊 Test Results: 9/9 passed (100%)');
  console.log('🎉 ALL SEARCH & DISCOVERY QUERY TESTS PASSED!\n');
}

runTests();
