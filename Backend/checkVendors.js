// checkVendors.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Vendor from './src/models/Vendor.js';

dotenv.config();

async function checkVendors() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleetManagement';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Count vendors
    const vendorCount = await Vendor.countDocuments();
    console.log(`Total vendors: ${vendorCount}`);
    
    // Get all vendors
    const vendors = await Vendor.find().lean();
    
    // Print vendor hierarchy structure
    console.log('\nVendor hierarchy structure:');
    vendors.forEach(v => {
      console.log(`- ${v.name} (${v._id})`);
      console.log(`  Level: ${v.level}`);
      console.log(`  Parent: ${v.parentVendorId || 'None'}`);
      console.log(`  Ancestors: ${v.ancestors ? v.ancestors.join(', ') : 'None'}`);
      console.log(`  Region: ${v.region || 'None'}`);
      console.log(`  City: ${v.city || 'None'}`);
      console.log('-------------------');
    });
    
    // Check for hierarchy issues
    console.log('\nChecking for hierarchy issues:');
    const superVendors = vendors.filter(v => v.level === 'SuperVendor');
    const regionalVendors = vendors.filter(v => v.level === 'RegionalVendor');
    const cityVendors = vendors.filter(v => v.level === 'CityVendor');
    
    console.log(`SuperVendors: ${superVendors.length}`);
    console.log(`RegionalVendors: ${regionalVendors.length}`);
    console.log(`CityVendors: ${cityVendors.length}`);
    
    // Check parents exist
    const vendorsWithMissingParents = vendors
      .filter(v => v.parentVendorId && !vendors.some(p => p._id.toString() === v.parentVendorId.toString()));
    
    if (vendorsWithMissingParents.length > 0) {
      console.log('\nVendors with missing parent references:');
      vendorsWithMissingParents.forEach(v => {
        console.log(`- ${v.name} (references missing parent ${v.parentVendorId})`);
      });
    } else {
      console.log('\nAll parent references are valid.');
    }
    
    // Check ancestor arrays
    const vendorsWithMissingAncestors = vendors
      .filter(v => v.ancestors && v.ancestors.some(
        aId => !vendors.some(a => a._id.toString() === aId.toString())
      ));
    
    if (vendorsWithMissingAncestors.length > 0) {
      console.log('\nVendors with missing ancestor references:');
      vendorsWithMissingAncestors.forEach(v => {
        console.log(`- ${v.name} has ancestors that don't exist`);
      });
    } else {
      console.log('\nAll ancestor references are valid.');
    }
    
    // Suggest fixes for hierarchy issues
    if (vendorsWithMissingParents.length > 0 || vendorsWithMissingAncestors.length > 0) {
      console.log('\nSuggested fix: Update ancestor arrays and parent references.');
    } else {
      console.log('\nVendor hierarchy appears to be in good shape!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkVendors();
