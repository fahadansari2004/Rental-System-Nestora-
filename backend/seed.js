require('dotenv').config();
const { connectDB } = require('./config/db');
const User = require('./models/User');
const Property = require('./models/Property');
const Booking = require('./models/Booking');
const { users, properties } = require('./utils/seedData');

const seedDatabase = async () => {
  try {
    const conn = await connectDB();
    if (!conn) {
      console.error('❌ Could not connect to database. Ensure MongoDB is running and MONGODB_URI is set.');
      process.exit(1);
    }

    console.log('🔄 Cleaning old collections in MongoDB...');
    await User.deleteMany({});
    await Property.deleteMany({});
    await Booking.deleteMany({});

    console.log('👥 Seeding users into MongoDB...');
    const createdUsers = [];
    for (const u of users) {
      const userDoc = new User(u);
      await userDoc.save();
      createdUsers.push(userDoc);
    }

    const ownerSarah = createdUsers.find((u) => u.email === 'owner@nestora.com') || createdUsers[0];
    const ownerDavid = createdUsers.find((u) => u.email === 'david@nestora.com') || createdUsers[1];
    const renterAlex = createdUsers.find((u) => u.email === 'renter@nestora.com') || createdUsers[2];

    console.log('🏡 Seeding properties into MongoDB...');
    const createdProperties = [];
    for (let i = 0; i < properties.length; i++) {
      const propData = properties[i];
      const owner = i % 2 === 0 ? ownerSarah : ownerDavid;
      const propDoc = await Property.create({
        ...propData,
        owner: owner._id,
      });
      createdProperties.push(propDoc);
    }

    console.log('📅 Seeding sample bookings into MongoDB...');
    if (createdProperties.length > 0 && renterAlex && ownerSarah) {
      const moveInDate = new Date();
      moveInDate.setDate(moveInDate.getDate() + 14);

      await Booking.create({
        property: createdProperties[0]._id,
        renter: renterAlex._id,
        owner: ownerSarah._id,
        moveInDate,
        duration: 6, // 6 months lease
        totalAmount: createdProperties[0].rentPerMonth * 6,
        status: 'confirmed',
        specialRequests: 'Looking forward to moving in on the 1st of next month.',
      });

      if (createdProperties.length > 1) {
        const moveInDate2 = new Date();
        moveInDate2.setDate(moveInDate2.getDate() + 30);

        await Booking.create({
          property: createdProperties[1]._id,
          renter: renterAlex._id,
          owner: ownerDavid._id,
          moveInDate: moveInDate2,
          duration: 12, // 12 months lease
          totalAmount: createdProperties[1].rentPerMonth * 12,
          status: 'pending',
          specialRequests: 'Requested parking slot allocation.',
        });
      }
    }

    console.log('✅ MongoDB database seeded successfully!');
    console.log(`- ${createdUsers.length} Users (Admin, Owner, Renter)`);
    console.log(`- ${createdProperties.length} Properties (with address, geolocation, rentPerMonth)`);
    console.log(`- Bookings populated with proper MongoDB references`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    process.exit(1);
  }
};

seedDatabase();
