// backend/update-password.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './src/models/User.js';

dotenv.config();

async function updateSuperUserPassword() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('ERROR: MONGODB_URI not defined in .env');
      process.exit(1);
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to DB. DB name:', mongoose.connection.name);
    
    // Find the super user
    const superUser = await User.findOne({ email: 'super@example.com' });
    
    if (!superUser) {
      console.error('Super user not found in the database.');
      process.exit(1);
    }
    
    // Update password
    const newPassword = 'password'; // Using the original password from seed.js
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    superUser.passwordHash = passwordHash;
    await superUser.save();
    
    console.log('Super user password has been updated successfully.');
    console.log('Login credentials:');
    console.log('Email: super@example.com');
    console.log('Password: password');
    
  } catch (err) {
    console.error('Error updating super user password:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
}

updateSuperUserPassword();
