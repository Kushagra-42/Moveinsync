// backend/src/routes/vehicles.js
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  assignDriverToVehicle
} from '../controllers/vehicleController.js';

const router = express.Router();

// GET /api/vehicles?vendorId=<id>
router.get('/', authenticate, authorize('canAddVehicle'), listVehicles);

// POST /api/vehicles
router.post('/', authenticate, authorize('canAddVehicle'), createVehicle);

// PUT /api/vehicles/:id
router.put('/:id', authenticate, authorize('canEditVehicle'), updateVehicle);

// DELETE /api/vehicles/:id
router.delete('/:id', authenticate, authorize('canRemoveVehicle'), deleteVehicle);

// PATCH /api/vehicles/:id/status
router.patch('/:id/status', authenticate, authorize('canEditVehicle'), updateVehicleStatus);

// PATCH /api/vehicles/:id/assign-driver
router.patch('/:id/assign-driver', authenticate, authorize('canEditVehicle'), assignDriverToVehicle);

export default router;
