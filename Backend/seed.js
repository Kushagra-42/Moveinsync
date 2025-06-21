// backend/seed.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import Vendor from './src/models/Vendor.js';
import User from './src/models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

// If necessary, explicitly set working directory for dotenv:
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

// Debug: print URI
console.log('Seeding: MONGODB_URI =', process.env.MONGODB_URI);

async function seed() {
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
    console.log('Connected to DB for seeding. DB name:', mongoose.connection.name);

    // 1. Create or update root SuperVendor vendor
    const vendorName = 'Root Super Vendor';
    // Full permissions including canManageFleet
    const defaultFullPermissions = {
      canCreateSubVendor: true,
      canDeleteSubVendor: true,
      canAddDriver: true,
      canEditDriver: true,
      canRemoveDriver: true,
      canAddVehicle: true,
      canEditVehicle: true,
      canRemoveVehicle: true,
      canVerifyDocuments: true,
      canViewAnalytics: true,
      canEditPermissions: true,
      canManageFleet: true, // New permission granted at root
    };    let superVendor = await Vendor.findOne({ name: vendorName });
    if (superVendor) {
      console.log(`Vendor "${vendorName}" already exists with _id: ${superVendor._id}. Updating permissions.`);
      superVendor.permissions = defaultFullPermissions;
      superVendor.level = 'SuperVendor';
      superVendor.levelValue = 1; // Adding levelValue for SuperVendor
      superVendor.parentVendorId = null;
      // ancestors should already be [], but ensure:
      superVendor.ancestors = [];
      await superVendor.save();
    } else {
      superVendor = await Vendor.create({
        name: vendorName,
        level: 'SuperVendor',
        levelValue: 1, // Adding levelValue for SuperVendor
        parentVendorId: null,
        permissions: defaultFullPermissions,
      });
      console.log('Created Vendor:', superVendor._id);
    }// 2. Create or update test users for different roles
    const password = 'password'; // Simple password for testing
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create test users for each role
    const testUsers = [
      { email: 'super@example.com', role: 'SuperVendor', vendorId: superVendor._id },
      { email: 'regional@example.com', role: 'RegionalVendor', vendorId: superVendor._id },
      { email: 'city@example.com', role: 'CityVendor', vendorId: superVendor._id },
      { email: 'driver@example.com', role: 'Driver', vendorId: superVendor._id }
    ];
    
    for (const userData of testUsers) {
      let existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User "${userData.email}" already exists, updating role and vendor.`);
        existingUser.role = userData.role;
        existingUser.vendorId = userData.vendorId;
        await existingUser.save();
      } else {
        const user = await User.create({
          email: userData.email,
          passwordHash,
          role: userData.role,
          vendorId: userData.vendorId,
        });
        console.log(`Created ${userData.role} user:`, user.email);
      }
    }    // 3. Create test vendors for each level if they don't exist
    // Regional Vendor
    let regionalVendor = await Vendor.findOne({ name: 'Test Regional Vendor' });
    if (!regionalVendor) {
      regionalVendor = await Vendor.create({
        name: 'Test Regional Vendor',
        level: 'RegionalVendor',
        levelValue: 2,
        parentVendorId: superVendor._id,
        region: 'North',
        permissions: {
          ...defaultFullPermissions,
          canDeleteSubVendor: false,
          canEditPermissions: false
        }
      });
      console.log('Created Regional Vendor:', regionalVendor._id);
    }
    
    // City Vendor
    let cityVendor = await Vendor.findOne({ name: 'Test City Vendor' });
    if (!cityVendor) {
      cityVendor = await Vendor.create({
        name: 'Test City Vendor',
        level: 'CityVendor',
        levelValue: 3,
        parentVendorId: regionalVendor._id,
        region: 'North',
        city: 'Delhi',
        permissions: {
          canAddDriver: true,
          canEditDriver: true,
          canRemoveDriver: true,
          canAddVehicle: true,
          canEditVehicle: true,
          canRemoveVehicle: true,
          canVerifyDocuments: true,
          canUploadDocuments: true,
          canViewFleet: true
        }
      });
      console.log('Created City Vendor:', cityVendor._id);
    }
    
    // Update users with correct vendorIds
    const regionalUser = await User.findOne({ email: 'regional@example.com' });
    if (regionalUser) {
      regionalUser.vendorId = regionalVendor._id;
      await regionalUser.save();
    }
    
    const cityUser = await User.findOne({ email: 'city@example.com' });
    if (cityUser) {
      cityUser.vendorId = cityVendor._id;
      await cityUser.save();
    }
    
    // List all users for confirmation
    const allUsers = await User.find().select('email role vendorId').lean();
    console.log('All users in DB:', allUsers);
    
    // List all vendors for confirmation
    const allVendors = await Vendor.find().select('name level levelValue parentVendorId').lean();
    console.log('All vendors in DB:', allVendors);

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
