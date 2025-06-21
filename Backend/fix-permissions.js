// backend/fix-permissions.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vendor from './src/models/Vendor.js';
import User from './src/models/User.js';

dotenv.config();

async function fixPermissions() {
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
    console.log('Connected to DB. Database name:', mongoose.connection.name);

    // 1. Find super@example.com user
    const superUser = await User.findOne({ email: 'super@example.com' });
    if (!superUser) {
      console.error('Super user not found!');
      process.exit(1);
    }

    console.log('Found super user:', superUser.email);

    // 2. Find the vendor linked to this user
    const superVendor = await Vendor.findById(superUser.vendorId);
    if (!superVendor) {
      console.error('Super vendor not found!');
      process.exit(1);
    }

    console.log('Found super vendor:', superVendor.name);    // 3. Update the vendor permissions
    const fullPermissions = {
      canCreateSubVendor: true,
      canDeleteSubVendor: true,
      canEditSubVendor: true,
      canViewVendors: true,
      canAddDriver: true,
      canEditDriver: true,
      canRemoveDriver: true,
      canAssignDrivers: true,
      canAddVehicle: true,
      canEditVehicle: true,
      canRemoveVehicle: true,
      canAssignVehicles: true,
      canVerifyDocuments: true, 
      canUploadDocuments: true,
      canViewAnalytics: true,
      canEditPermissions: true,
      canManageFleet: true,
      canManageVendors: true,
      canViewFleet: true
    };

    superVendor.permissions = fullPermissions;
    await superVendor.save();

    console.log('✅ Super vendor permissions updated successfully');
    console.log('Updated permissions:', fullPermissions);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing permissions:', error);
    process.exit(1);
  }
}

fixPermissions();
