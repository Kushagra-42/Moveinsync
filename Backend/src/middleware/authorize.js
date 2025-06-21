// backend/src/middleware/authorize.js
import Vendor from '../models/Vendor.js';

export function authorize(actionKey) {
  return async (req, res, next) => {
    // Check if permissions were already loaded in the authentication middleware
    if (req.user && req.user.permissions && req.user.permissions[actionKey]) {
      return next();
    }
    
    // If not found in req.user, fetch from database as a fallback
    const { vendorId } = req.user; // the vendor of the logged-in user
    // Fetch current user's Vendor record
    const userVendor = await Vendor.findById(vendorId).select('permissions');
    if (!userVendor) {
      return res.status(403).json({ message: 'Vendor not found for user' });
    }
    if (!userVendor.permissions[actionKey]) {
      return res.status(403).json({ 
        message: `Forbidden: You do not have permission to ${actionKey.replace('can', '').toLowerCase()}`,
        requiredPermission: actionKey
      });
    }
    
    // Update req.user.permissions for future use
    if (!req.user.permissions) {
      req.user.permissions = {};
    }
    req.user.permissions[actionKey] = true;
    
    next();
  };
}

// Optionally export a helper to check subtree in routes, e.g.:
// async function isInSubtree(userVendorId, targetVendorId) {
//   if (userVendorId.toString() === targetVendorId.toString()) return true;
//   const target = await Vendor.findById(targetVendorId).select('ancestors');
//   if (!target) return false;
//   return target.ancestors.map(id => id.toString()).includes(userVendorId.toString());
// }
// export { isInSubtree };
