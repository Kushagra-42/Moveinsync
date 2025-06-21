// backend/src/routes/drivers.js
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import {
  listDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  updateDriverStatus,
  assignVehicleToDriver
} from '../controllers/driverController.js';

const router = express.Router();

// GET /api/drivers?vendorId=<id>
router.get('/', authenticate, authorize('canAddDriver'), listDrivers);

// POST /api/drivers
router.post('/', authenticate, authorize('canAddDriver'), createDriver);

// PUT /api/drivers/:id
router.put('/:id', authenticate, authorize('canEditDriver'), updateDriver);

// DELETE /api/drivers/:id
router.delete('/:id', authenticate, authorize('canRemoveDriver'), deleteDriver);

// PATCH /api/drivers/:id/status
router.patch('/:id/status', authenticate, authorize('canEditDriver'), updateDriverStatus);

// PATCH /api/drivers/:id/assign-vehicle
router.patch('/:id/assign-vehicle', authenticate, authorize('canEditDriver'), assignVehicleToDriver);

export default router;
