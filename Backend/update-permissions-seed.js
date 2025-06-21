// backend/update-permissions-seed.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vendor from './src/models/Vendor.js';

dotenv.config();

async function updatePermissions() {
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
    console.log('Connected to DB for updating permissions. DB name:', mongoose.connection.name);
    
    // 1. Update Super Vendor with all permissions
    const superVendorName = 'Root Super Vendor';
    const superVendor = await Vendor.findOne({ name: superVendorName });
    
    if (!superVendor) {
      console.error(`Super vendor "${superVendorName}" not found. Please run seed.js first.`);
      process.exit(1);
    }
    
    // Full set of permissions for super vendor
    const fullPermissions = {
      // Vendor management
      canCreateSubVendor: true,
      canDeleteSubVendor: true,
      canEditSubVendor: true,
      canEditPermissions: true,
      
      // Fleet management
      canManageFleet: true,
      canViewFleet: true,
      
      // Driver management
      canAddDriver: true,
      canEditDriver: true,
      canRemoveDriver: true,
      canAssignDrivers: true,
      
      // Vehicle management
      canAddVehicle: true,
      canEditVehicle: true,
      canRemoveVehicle: true,
      canAssignVehicles: true,
      
      // Document and compliance
      canVerifyDocuments: true,
      canUploadDocuments: true,
      
      // Analytics
      canViewAnalytics: true
    };
    
    // Update super vendor permissions
    superVendor.permissions = fullPermissions;
    await superVendor.save();
    console.log(`Updated permissions for "${superVendorName}"`);
    
    // 2. Update Regional Vendor permissions
    const regionalVendor = await Vendor.findOne({ name: 'Test Regional Vendor' });
    if (regionalVendor) {
      // Regional vendor should have all permissions except editing permissions of others
      regionalVendor.permissions = {
        ...fullPermissions,
        canEditPermissions: false,
        canDeleteSubVendor: false
      };
      await regionalVendor.save();
      console.log('Updated permissions for Test Regional Vendor');
    }
    
    // 3. Update City Vendor permissions
    const cityVendor = await Vendor.findOne({ name: 'Test City Vendor' });
    if (cityVendor) {
      // City vendor has limited permissions
      cityVendor.permissions = {
        canAddDriver: true,
        canEditDriver: true,
        canRemoveDriver: false,
        canAddVehicle: true,
        canEditVehicle: true,
        canRemoveVehicle: false,
        canVerifyDocuments: true,
        canUploadDocuments: true,
        canViewFleet: true,
        canManageFleet: false,
        canCreateSubVendor: false,
        canDeleteSubVendor: false,
        canEditSubVendor: false,
        canEditPermissions: false,
        canAssignDrivers: true,
        canAssignVehicles: true,
        canViewAnalytics: true
      };
      await cityVendor.save();
      console.log('Updated permissions for Test City Vendor');
    }
    
    console.log('All vendor permissions updated successfully!');
    
  } catch (err) {
    console.error('Error updating permissions:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

updatePermissions();
