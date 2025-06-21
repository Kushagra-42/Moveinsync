// createSampleHierarchy.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vendor from './src/models/Vendor.js';
import User from './src/models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function createSampleHierarchy() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleetManagement';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get the super vendor
    const superVendor = await Vendor.findOne({ level: 'SuperVendor' });
    if (!superVendor) {
      throw new Error('No super vendor found in the database');
    }
    
    console.log(`Found super vendor: ${superVendor.name} (${superVendor._id})`);
    
    // Create regional vendors
    const regional1 = new Vendor({
      name: 'North Region',
      level: 'RegionalVendor',
      region: 'North',
      parentVendorId: superVendor._id,
      ancestors: [superVendor._id],
      permissions: {
        canCreateSubVendor: true,
        canManageFleet: true,
        canAddDriver: true,
        canEditDriver: true,
        canAddVehicle: true,
        canEditVehicle: true,
        canUploadDocuments: true,
        canVerifyDocuments: true
      }
    });
    
    const regional2 = new Vendor({
      name: 'South Region',
      level: 'RegionalVendor',
      region: 'South',
      parentVendorId: superVendor._id,
      ancestors: [superVendor._id],
      permissions: {
        canCreateSubVendor: true,
        canManageFleet: true,
        canAddDriver: true,
        canEditDriver: true,
        canAddVehicle: true,
        canEditVehicle: true,
        canUploadDocuments: true,
        canVerifyDocuments: true
      }
    });
    
    await regional1.save();
    await regional2.save();
    
    console.log(`Created regional vendors: ${regional1.name}, ${regional2.name}`);
    
    // Create city vendors under regional1
    const city1 = new Vendor({
      name: 'Delhi City',
      level: 'CityVendor',
      region: 'North',
      city: 'Delhi',
      parentVendorId: regional1._id,
      ancestors: [superVendor._id, regional1._id],
      permissions: {
        canManageFleet: true,
        canAddDriver: true,
        canEditDriver: true,
        canAddVehicle: true,
        canEditVehicle: true,
        canUploadDocuments: true
      }
    });
    
    const city2 = new Vendor({
      name: 'Mumbai City',
      level: 'CityVendor',
      region: 'North',
      city: 'Mumbai',
      parentVendorId: regional1._id,
      ancestors: [superVendor._id, regional1._id],
      permissions: {
        canManageFleet: true,
        canAddDriver: true,
        canEditDriver: true,
        canAddVehicle: true,
        canEditVehicle: true,
        canUploadDocuments: true
      }
    });
    
    await city1.save();
    await city2.save();
    
    console.log(`Created city vendors under ${regional1.name}: ${city1.name}, ${city2.name}`);
    
    // Create city vendors under regional2
    const city3 = new Vendor({
      name: 'Chennai City',
      level: 'CityVendor',
      region: 'South',
      city: 'Chennai',
      parentVendorId: regional2._id,
      ancestors: [superVendor._id, regional2._id],
      permissions: {
        canManageFleet: true,
        canAddDriver: true,
        canEditDriver: true,
        canAddVehicle: true,
        canEditVehicle: true,
        canUploadDocuments: true
      }
    });
    
    const city4 = new Vendor({
      name: 'Bangalore City',
      level: 'CityVendor',
      region: 'South',
      city: 'Bangalore',
      parentVendorId: regional2._id,
      ancestors: [superVendor._id, regional2._id],
      permissions: {
        canManageFleet: true,
        canAddDriver: true,
        canEditDriver: true,
        canAddVehicle: true,
        canEditVehicle: true,
        canUploadDocuments: true
      }
    });
    
    await city3.save();
    await city4.save();
    
    console.log(`Created city vendors under ${regional2.name}: ${city3.name}, ${city4.name}`);
    
    // Create sample users for each vendor
    // First, check if users already exist
    const existingUsers = await User.find({ 
      email: { 
        $in: [
          'regional1@example.com',
          'regional2@example.com',
          'city1@example.com',
          'city2@example.com',
          'city3@example.com',
          'city4@example.com'
        ]
      }
    });
    
    if (existingUsers.length > 0) {
      console.log('Some test users already exist. Skipping user creation.');
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('password123', salt);
        // Create users for each vendor
      const users = [
        {
          name: 'Regional 1 Manager',
          email: 'regional1@example.com',
          passwordHash,
          role: 'RegionalVendor',
          vendorId: regional1._id
        },
        {
          name: 'Regional 2 Manager',
          email: 'regional2@example.com',
          passwordHash,
          role: 'RegionalVendor',
          vendorId: regional2._id
        },
        {
          name: 'Delhi City Manager',
          email: 'city1@example.com',
          passwordHash,
          role: 'CityVendor',
          vendorId: city1._id
        },
        {
          name: 'Mumbai City Manager',
          email: 'city2@example.com',
          passwordHash,
          role: 'CityVendor',
          vendorId: city2._id
        },
        {
          name: 'Chennai City Manager',
          email: 'city3@example.com',
          passwordHash,
          role: 'CityVendor',
          vendorId: city3._id
        },
        {
          name: 'Bangalore City Manager',
          email: 'city4@example.com',
          passwordHash,
          role: 'CityVendor',
          vendorId: city4._id
        }
      ];
      
      await User.insertMany(users);
      console.log('Created users for each vendor');
    }
    
    console.log('Sample hierarchy created successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createSampleHierarchy();
