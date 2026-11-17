const mongoose = require('mongoose');

// Prevent Mongoose from hanging indefinitely if MongoDB is offline
mongoose.set('bufferTimeoutMS', 1500);

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nestora';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`🌿 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn(`📍 Ensure MongoDB is running and MONGODB_URI is correctly configured in backend/.env: ${uri}`);
    return null;
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('MongoDB reconnected.');
});

const getDbStatus = () => isConnected;

module.exports = { connectDB, getDbStatus };
