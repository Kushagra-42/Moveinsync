// backend/src/routes/vendors.js
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import * as vendorController from '../controllers/vendorController.js';

const router = express.Router();

// GET /api/vendors/list - List vendors for dropdown selection
router.get('/list', authenticate, vendorController.listVendors);

// GET /api/vendors/:id - Get vendor by ID
router.get('/:id', authenticate, vendorController.getVendor);

// GET /api/vendors/:id/subtree - Get vendor subtree
router.get('/:id/subtree', authenticate, vendorController.getVendorSubtree);

// GET /api/vendors/:id/children - Get vendor direct children
router.get('/:id/children', authenticate, vendorController.getVendorChildren);

// GET /api/vendors/:id/stats - Get vendor statistics
router.get('/:id/stats', authenticate, vendorController.getVendorStats);

// GET /api/vendors/:id/permissions - Get vendor permissions
router.get('/:id/permissions', authenticate, vendorController.getVendorPermissions);

// POST /api/vendors/:id/sub-vendors - Create a sub-vendor
router.post(
  '/:id/sub-vendors',
  authenticate,
  authorize('canCreateSubVendor'),
  vendorController.createSubVendor
);

// PUT /api/vendors/:id - Update a vendor
router.put(
  '/:id',
  authenticate,
  authorize('canEditSubVendor'),
  vendorController.updateVendor
);

// PUT /api/vendors/:id/permissions - Update vendor permissions
router.put(
  '/:id/permissions',
  authenticate,
  authorize('canEditPermissions'),
  vendorController.updateVendorPermissions
);

// DELETE /api/vendors/:id - Delete a vendor
router.delete(
  '/:id',
  authenticate,
  authorize('canDeleteSubVendor'),
  vendorController.deleteVendor
);

// GET /api/vendors/under-user - Get vendors under current user
router.get('/under-user', authenticate, authorize('canViewVendors'), vendorController.getVendorsUnderUser);

export default router;
