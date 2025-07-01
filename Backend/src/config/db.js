// backend/src/config/db.js
import mongoose from 'mongoose';

export async function connectDB() {
  // Try first with environment variable
  const uri = process.env.MONGODB_URI;
  
  // Fallback to local MongoDB if the connection fails
  const localUri = 'mongodb://127.0.0.1:27017/fleetManager';
  
  if (!uri) {
    console.log('MONGODB_URI not defined, using local MongoDB instead');
  }
  
  try {
    // First try the configured URI
    if (uri) {
      try {
        await mongoose.connect(uri);
        console.log('MongoDB connected to cloud database:', mongoose.connection.name);
        return;
      } catch (cloudErr) {
        console.warn('Could not connect to cloud database, trying local:', cloudErr.message);
      }
    }

    // If cloud connection fails, try local
    await mongoose.connect(localUri);
    console.log('MongoDB connected to local database');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}
