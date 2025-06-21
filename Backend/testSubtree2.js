import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vendor from './src/models/Vendor.js';
import { getSubtreeVendorIds } from './src/utils/subtree.js';

dotenv.config();

async function testSubtree() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleetManagement';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Get super vendor
    const superVendor = await Vendor.findOne({ level: 'SuperVendor' }).lean();
    if (!superVendor) {
      throw new Error('SuperVendor not found');
    }
    
    console.log(Testing subtree for super vendor:  ());
    const superSubtree = await getSubtreeVendorIds(superVendor._id);
    console.log(Super vendor subtree:  vendors);
    console.log(superSubtree);
    
    // Get a regional vendor
    const regionalVendor = await Vendor.findOne({ level: 'RegionalVendor' }).lean();
    if (regionalVendor) {
      console.log(\nTesting subtree for regional vendor:  ());
      const regionalSubtree = await getSubtreeVendorIds(regionalVendor._id);
      console.log(Regional vendor subtree:  vendors);
      console.log(regionalSubtree);
    }
    
    // Get a city vendor
    const cityVendor = await Vendor.findOne({ level: 'CityVendor' }).lean();
    if (cityVendor) {
      console.log(\nTesting subtree for city vendor:  ());
      const citySubtree = await getSubtreeVendorIds(cityVendor._id);
      console.log(City vendor subtree:  vendors);
      console.log(citySubtree);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testSubtree();
