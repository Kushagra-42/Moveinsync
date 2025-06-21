// backend/src/utils/subtree.js
import mongoose from 'mongoose';
import Vendor from '../models/Vendor.js';
import Driver from '../models/Driver.js';

export async function getSubtreeVendorIds(rootVendorId) {
  try {
    const vendors = await Vendor.find({
      $or: [
        { _id: rootVendorId },
        { ancestors: rootVendorId }
      ]
    }).lean();
    
    return vendors.map(v => v._id);
  } catch (err) {
    console.error('Error in getSubtreeVendorIds:', err);
    return [rootVendorId];
  }
}

// Placeholder function to prevent import errors
export async function getSubtreeStructured(rootVendorId) {
  // This function just delegates to getSubtreeVendorIds for now
  return getSubtreeVendorIds(rootVendorId);
}

// Helper function to build a complete vendor tree including drivers
export async function buildVendorTree(rootVendorId, includeDrivers = false) {
  try {
    // Get all vendors in the subtree
    const vendors = await Vendor.find({
      $or: [
        { _id: rootVendorId },
        { ancestors: rootVendorId }
      ]
    })
    .select('name level region city parentVendorId ancestors permissions')
    .sort({ level: 1, name: 1 })
    .lean();

    // Create a map for quick lookup
    const vendorMap = new Map(vendors.map(v => [v._id.toString(), { ...v, children: [], drivers: [] }]));
    
    // If includeDrivers is true, fetch all drivers in the subtree
    if (includeDrivers) {
      const vendorIds = vendors.map(v => v._id);
      const drivers = await Driver.find({ vendorId: { $in: vendorIds } })
        .select('name phone email vendorId')
        .sort({ name: 1 })
        .lean();
      
      // Add drivers to their respective vendor's drivers array
      drivers.forEach(driver => {
        const vendorId = driver.vendorId.toString();
        if (vendorMap.has(vendorId)) {
          vendorMap.get(vendorId).drivers.push({
            ...driver,
            _id: driver._id.toString(),
            level: 'Driver'
          });
        }
      });
    }
    
    // Build the tree structure
    const tree = [];
    
    vendors.forEach(vendor => {
      const vendorWithChildren = vendorMap.get(vendor._id.toString());
      
      if (vendor._id.toString() === rootVendorId.toString()) {
        // This is the root node
        tree.push(vendorWithChildren);
      } else if (vendor.parentVendorId) {
        // Add as child to parent
        const parent = vendorMap.get(vendor.parentVendorId.toString());
        if (parent) {
          parent.children.push(vendorWithChildren);
        } else {
          // If parent not found (might be deleted), try to find an ancestor in the map
          const ancestorId = vendor.ancestors.find(aid => 
            aid.toString() !== vendor.parentVendorId.toString() && 
            vendorMap.has(aid.toString())
          );
          
          if (ancestorId) {
            vendorMap.get(ancestorId.toString()).children.push(vendorWithChildren);
          } else {
            // No valid ancestor found, add to root
            tree.push(vendorWithChildren);
          }
        }
      }
    });

    // Sort children by level and name at each level
    const sortChildren = (node) => {
      if (node.children && node.children.length > 0) {
        node.children.sort((a, b) => {
          if (a.level === b.level) {
            return a.name.localeCompare(b.name);
          }
          const levelOrder = { 'SuperVendor': 0, 'RegionalVendor': 1, 'CityVendor': 2 };
          return levelOrder[a.level] - levelOrder[b.level];
        });
        node.children.forEach(sortChildren);
      }
      return node;
    };

    return tree.map(sortChildren);
  } catch (err) {
    console.error('Error building vendor tree:', err);
    return [];
  }
}

// Get the full tree including drivers for a nice hierarchical view
export async function getFullHierarchy(rootVendorId) {
  return buildVendorTree(rootVendorId, true);
}
