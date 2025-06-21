// backend/src/controllers/vendorController.js
import Vendor from '../models/Vendor.js';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import bcrypt from 'bcrypt';
import { getSubtreeVendorIds, getSubtreeStructured } from '../utils/subtree.js';
import mongoose from 'mongoose';

// Get vendor by ID
export const getVendor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if vendor exists and is in user's subtree
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    const userVendorId = req.user.vendorId;
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    
    if (!vendorIds.map(id => id.toString()).includes(vendor._id.toString())) {
      return res.status(403).json({ message: 'Forbidden: Vendor not in your subtree' });
    }
    
    res.json(vendor);
  } catch (err) {
    console.error('Error in getVendor:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get vendor subtree (flat structure)
export const getVendorSubtree = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if vendor exists and is in user's subtree
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    const userVendorId = req.user.vendorId;
    const userSubtree = await getSubtreeVendorIds(userVendorId);
    
    if (!userSubtree.map(id => id.toString()).includes(vendor._id.toString())) {
      return res.status(403).json({ message: 'Forbidden: Vendor not in your subtree' });
    }
    
    // Get the vendor subtree (as vendor objects, not just IDs)
    const vendorIds = await getSubtreeVendorIds(id);
    const vendors = await Vendor.find({ _id: { $in: vendorIds } });
    
    res.json({
      root: id,
      tree: vendors
    });
  } catch (err) {
    console.error('Error in getVendorSubtree:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get vendor direct children
export const getVendorChildren = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if vendor exists and is in user's subtree
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    const userVendorId = req.user.vendorId;
    const userSubtree = await getSubtreeVendorIds(userVendorId);
    
    if (!userSubtree.map(id => id.toString()).includes(vendor._id.toString())) {
      return res.status(403).json({ message: 'Forbidden: Vendor not in your subtree' });
    }
    
    // Get direct children
    const children = await Vendor.find({ parentVendorId: id });
    
    res.json(children);
  } catch (err) {
    console.error('Error in getVendorChildren:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new sub-vendor
export const createSubVendor = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
    try {
    const { id: parentVendorId } = req.params;
    const { name, level, region, city, email, password } = req.body;
    
    console.log('Creating sub-vendor with data:', { 
      parentVendorId,
      name,
      level, 
      region,
      city,
      email,
      passwordProvided: !!password 
    });
    
    // Validate required fields
    if (!name || !email || !password || !level) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        details: { 
          name: !name ? 'required' : 'provided', 
          email: !email ? 'required' : 'provided', 
          password: !password ? 'required' : 'provided',
          level: !level ? 'required' : 'provided'
        }
      });
    }
    
    // Check if parent vendor exists and is in user's subtree
    const parentVendor = await Vendor.findById(parentVendorId);
    if (!parentVendor) {
      return res.status(404).json({ message: 'Parent vendor not found' });
    }
    
    const userVendorId = req.user.vendorId;
    const userSubtree = await getSubtreeVendorIds(userVendorId);
    
    if (!userSubtree.map(id => id.toString()).includes(parentVendor._id.toString())) {
      return res.status(403).json({ message: 'Forbidden: Parent vendor not in your subtree' });
    }
    
    // Check if user has permission to create sub-vendor
    if (!req.user.permissions?.canCreateSubVendor) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to create sub-vendors' });
    }
    
    // Calculate levelValue based on parent's levelValue
    const parentLevelValue = parentVendor.levelValue || 1; // Default to 1 if not set
    const newLevelValue = parentLevelValue + 1;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
      // Define default permissions based on level
    const defaultPermissions = {
        // Set default permissions based on level
        canCreateSubVendor: newLevelValue < 3, // Super and Regional vendors can create sub-vendors
        canEditSubVendor: newLevelValue < 3,
        canDeleteSubVendor: newLevelValue < 2, // Only Super vendors can delete
        canEditPermissions: newLevelValue < 2, // Only Super vendors can edit permissions
        canManageFleet: newLevelValue < 3,
        canViewFleet: newLevelValue < 4,
        canAddDriver: newLevelValue < 4,
        canEditDriver: newLevelValue < 4,
        canRemoveDriver: newLevelValue < 3,
        canAssignDrivers: newLevelValue < 4,
        canAddVehicle: newLevelValue < 4,
        canEditVehicle: newLevelValue < 4,
        canRemoveVehicle: newLevelValue < 3,
        canAssignVehicles: newLevelValue < 4,
        canUploadDocuments: true,
        canVerifyDocuments: newLevelValue < 2,
        canViewAnalytics: newLevelValue < 3
    };
    
    // Create the vendor
    const newVendor = new Vendor({
      name,
      level: level || `Level${newLevelValue}`,
      levelValue: newLevelValue,
      region,
      city,
      parentVendorId: parentVendor._id,
      permissions: defaultPermissions
    });
      await newVendor.save({ session });    
    
    // Create user account for vendor
    try {
      console.log('Hashing password...');
      // Hash the password since there's no pre-save hook
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, 10);
      console.log('Password hashed successfully');
      
      const newUser = new User({
        email,
        passwordHash, // Directly set the hashed password
        vendorId: newVendor._id,
        role: level || `Level${newLevelValue}`
      });
        console.log('User document created with fields:', {
        email,
        hasPasswordHash: !!passwordHash,
        vendorId: newVendor._id,
        role: level || `Level${newLevelValue}`
      });
        await newUser.save({ session });
    } catch (hashError) {
      console.error('Error hashing password or creating user:', hashError);
      throw new Error(`User creation failed: ${hashError.message}`);
    }
    
    await session.commitTransaction();
    
    res.status(201).json({
      vendor: newVendor,
      message: 'Sub-vendor created successfully'
    });
      } catch (err) {
    await session.abortTransaction();
    console.error('Error in createSubVendor:', err);
    
    // Provide more detailed error message
    let errorMessage = 'Server error';
    let statusCode = 500;
    
    if (err.message && err.message.includes('User creation failed')) {
      errorMessage = 'Failed to create user account: ' + err.message;
      statusCode = 400;
    } else if (err.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + err.message;
      statusCode = 400;
    } else if (err.code === 11000) { // Duplicate key error
      errorMessage = 'Email already exists';
      statusCode = 409;
    }
    
    res.status(statusCode).json({ 
      message: errorMessage,
      details: err.message
    });
  } finally {
    session.endSession();
  }
};

// Update vendor
export const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, region, city } = req.body;
    
    // Check if vendor exists and is in user's subtree
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    const userVendorId = req.user.vendorId;
    const userSubtree = await getSubtreeVendorIds(userVendorId);
    
    if (!userSubtree.map(id => id.toString()).includes(vendor._id.toString())) {
      return res.status(403).json({ message: 'Forbidden: Vendor not in your subtree' });
    }
    
    // Check if user has permission to edit vendor
    if (!req.user.permissions?.canEditSubVendor) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to edit vendors' });
    }
    
    // Update vendor
    vendor.name = name || vendor.name;
    vendor.region = region !== undefined ? region : vendor.region;
    vendor.city = city !== undefined ? city : vendor.city;
    
    await vendor.save();
    
    res.json({
      vendor,
      message: 'Vendor updated successfully'
    });
    
  } catch (err) {
    console.error('Error in updateVendor:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete vendor
export const deleteVendor = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    
    // Check if vendor exists and is in user's subtree
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    const userVendorId = req.user.vendorId;
    const userSubtree = await getSubtreeVendorIds(userVendorId);
    
    if (!userSubtree.map(id => id.toString()).includes(vendor._id.toString())) {
      return res.status(403).json({ message: 'Forbidden: Vendor not in your subtree' });
    }
    
    // Check if user has permission to delete vendor
    if (!req.user.permissions?.canDeleteSubVendor) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete vendors' });
    }
    
    // Can't delete root vendor
    if (!vendor.parentVendorId) {
      return res.status(400).json({ message: 'Cannot delete root vendor' });
    }
    
    // Get vendor subtree
    const subtreeIds = await getSubtreeVendorIds(id);
    
    // Reassign all child vendors to parent vendor
    await Vendor.updateMany(
      { parentVendorId: id },
      { parentVendorId: vendor.parentVendorId },
      { session }
    );
    
    // Reassign all drivers to parent vendor
    await Driver.updateMany(
      { vendorId: { $in: subtreeIds } },
      { vendorId: vendor.parentVendorId },
      { session }
    );
    
    // Reassign all vehicles to parent vendor
    await Vehicle.updateMany(
      { vendorId: { $in: subtreeIds } },
      { vendorId: vendor.parentVendorId },
      { session }
    );
    
    // Delete users associated with deleted vendors
    await User.deleteMany({ vendorId: { $in: subtreeIds } }, { session });
    
    // Delete all vendors in subtree except the target vendor
    if (subtreeIds.length > 1) {
      const otherSubtreeIds = subtreeIds.filter(subId => subId.toString() !== id.toString());
      await Vendor.deleteMany({ _id: { $in: otherSubtreeIds } }, { session });
    }
    
    // Delete the target vendor
    await Vendor.findByIdAndDelete(id, { session });
    
    await session.commitTransaction();
    
    res.json({ message: 'Vendor deleted successfully' });
    
  } catch (err) {
    await session.abortTransaction();
    console.error('Error in deleteVendor:', err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    session.endSession();
  }
};

// Get vendor permissions
export const getVendorPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if vendor exists and is in user's subtree
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    const userVendorId = req.user.vendorId;
    const userSubtree = await getSubtreeVendorIds(userVendorId);
    
    if (!userSubtree.map(id => id.toString()).includes(vendor._id.toString())) {
      return res.status(403).json({ message: 'Forbidden: Vendor not in your subtree' });
    }
    
    // Get the user associated with the vendor
    const user = await User.findOne({ vendorId: id });
    if (!user) {
      return res.status(404).json({ message: 'User not found for this vendor' });
    }
    
    res.json({
      vendorId: id,
      permissions: user.permissions || {}
    });
    
  } catch (err) {
    console.error('Error in getVendorPermissions:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update vendor permissions
export const updateVendorPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    
    if (!permissions) {
      return res.status(400).json({ message: 'Permissions object is required' });
    }
    
    // Check if the vendor to update exists
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    // Check if the vendor to update is in the user's subtree
    const userVendorId = req.user.vendorId;
    const userVendor = await Vendor.findById(userVendorId);
    
    // Check if user has permission to edit permissions
    if (!userVendor.permissions.canEditPermissions) {
      return res.status(403).json({ message: 'You do not have permission to modify vendor permissions' });
    }
    
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    if (!vendorIds.map(id => id.toString()).includes(vendor._id.toString())) {
      return res.status(403).json({ message: 'Forbidden: Vendor not in your subtree' });
    }
    
    // Super Vendor cannot have its permissions modified
    if (vendor.level === 'SuperVendor' && vendor._id.toString() !== userVendorId.toString()) {
      return res.status(403).json({ message: 'Cannot modify super vendor permissions' });
    }
    
    // Update permissions
    vendor.permissions = { ...vendor.permissions, ...permissions };
    await vendor.save();
    
    res.json({ 
      message: 'Vendor permissions updated successfully', 
      vendor: {
        _id: vendor._id,
        name: vendor.name,
        level: vendor.level,
        permissions: vendor.permissions
      }
    });
  } catch (err) {
    console.error('Error in updateVendorPermissions:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get vendor stats
export const getVendorStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if vendor exists and is in user's subtree
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    const userVendorId = req.user.vendorId;
    const userSubtree = await getSubtreeVendorIds(userVendorId);
    
    if (!userSubtree.map(id => id.toString()).includes(vendor._id.toString())) {
      return res.status(403).json({ message: 'Forbidden: Vendor not in your subtree' });
    }
    
    // Get vendor subtree
    const subtreeIds = await getSubtreeVendorIds(id);
    
    // Count vendors by level
    const vendorsByLevel = await Vendor.aggregate([
      { $match: { _id: { $in: subtreeIds } } },
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]);
    
    // Count drivers
    const [
      totalDrivers,
      activeDrivers,
      inactiveDrivers
    ] = await Promise.all([
      Driver.countDocuments({ vendorId: { $in: subtreeIds } }),
      Driver.countDocuments({ vendorId: { $in: subtreeIds }, status: 'Active' }),
      Driver.countDocuments({ vendorId: { $in: subtreeIds }, status: { $ne: 'Active' } })
    ]);
    
    // Count vehicles by status
    const [
      totalVehicles,
      activeVehicles,
      maintenanceVehicles,
      unassignedVehicles
    ] = await Promise.all([
      Vehicle.countDocuments({ vendorId: { $in: subtreeIds } }),
      Vehicle.countDocuments({ vendorId: { $in: subtreeIds }, status: 'Active' }),
      Vehicle.countDocuments({ vendorId: { $in: subtreeIds }, status: 'Maintenance' }),
      Vehicle.countDocuments({ vendorId: { $in: subtreeIds }, driverId: null })
    ]);
    
    // Count compliant vehicles
    const compliantVehicles = await Vehicle.countDocuments({ 
      vendorId: { $in: subtreeIds },
      'complianceStatus.overall.compliant': true
    });
    
    // Count documents
    const validDocuments = await Vehicle.countDocuments({ 
      vendorId: { $in: subtreeIds },
      'complianceStatus.overall.compliant': true
    });
    
    const expiredDocuments = await Vehicle.countDocuments({ 
      vendorId: { $in: subtreeIds },
      'complianceStatus.overall.compliant': false
    });
    
    // Format vendor counts
    let superVendors = 0;
    let regionalVendors = 0;
    let cityVendors = 0;
    
    vendorsByLevel.forEach(v => {
      if (v._id === 'SuperVendor') superVendors = v.count;
      if (v._id === 'RegionalVendor') regionalVendors = v.count;
      if (v._id === 'CityVendor') cityVendors = v.count;
    });
    
    // Get direct sub-vendors
    const directSubvendors = await Vendor.find({ parentVendorId: id });
    
    res.json({
      vendor: {
        _id: vendor._id,
        name: vendor.name,
        level: vendor.level,
        levelValue: vendor.levelValue,
        region: vendor.region,
        city: vendor.city
      },
      counts: {
        subvendors: subtreeIds.length - 1, // Exclude self
        superVendors,
        regionalVendors,
        cityVendors,
        drivers: totalDrivers,
        activeDrivers,
        inactiveDrivers,
        vehicles: totalVehicles,
        activeVehicles,
        maintenanceVehicles,
        unassignedVehicles,
        compliantVehicles,
        validDocuments,
        expiredDocuments
      },
      directSubvendors: directSubvendors
    });
    
  } catch (err) {
    console.error('Error in getVendorStats:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// List vendors for dropdown (filtered)
export const listVendors = async (req, res) => {
  try {
    const { level, region, city } = req.query;
    
    // Build filter
    const filter = {};
    if (level) filter.level = level;
    if (region) filter.region = region;
    if (city) filter.city = city;
    
    // Add subtree restriction
    const userVendorId = req.user.vendorId;
    const userSubtree = await getSubtreeVendorIds(userVendorId);
    filter._id = { $in: userSubtree };
    
    // Fetch vendors
    const vendors = await Vendor.find(filter).select('_id name level region city parentVendorId');
    
    res.json(vendors);
  } catch (err) {
    console.error('Error in listVendors:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get vendors under the current user
export const getVendorsUnderUser = async (req, res) => {
  try {
    const userVendorId = req.user.vendorId;
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    
    // Get all vendors in the subtree
    const vendors = await Vendor.find({ _id: { $in: vendorIds } })
      .select('name parentId level region city')
      .lean();
    
    res.json(vendors);
  } catch (err) {
    console.error('Error in getVendorsUnderUser:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
