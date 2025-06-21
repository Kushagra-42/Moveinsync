// backend/src/routes/documents.js
import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import {
  driverStorage, 
  vehicleStorage, 
  fileFilter, 
  validateDriverDocType, 
  validateVehicleDocType,
  uploadDriverDocument,
  uploadVehicleDocument,
  getDriverDocuments,
  getVehicleDocuments,
  verifyDriverDocument,
  verifyVehicleDocument,
  getComplianceSummary,
  getExpiringDocuments
} from '../controllers/documentController.js';

const router = express.Router();

// Configure multer for driver documents
const driverUpload = multer({ 
  storage: driverStorage, 
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Configure multer for vehicle documents
const vehicleUpload = multer({ 
  storage: vehicleStorage, 
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Driver document routes
router.post('/drivers/:id/documents/:docType', 
  authenticate, 
  authorize('canAddDriver'), 
  validateDriverDocType, 
  driverUpload.single('file'),
  uploadDriverDocument
);

router.get('/drivers/:id/documents', 
  authenticate, 
  authorize('canAddDriver'),
  getDriverDocuments
);

router.patch('/drivers/:id/documents/:docType/verify',
  authenticate,
  authorize('canVerifyDocuments'),
  validateDriverDocType,
  verifyDriverDocument
);

// Vehicle document routes
router.post('/vehicles/:id/documents/:docType',
  authenticate,
  authorize('canAddVehicle'),
  validateVehicleDocType,
  vehicleUpload.single('file'),
  uploadVehicleDocument
);

router.get('/vehicles/:id/documents',
  authenticate,
  authorize('canAddVehicle'),
  getVehicleDocuments
);

router.patch('/vehicles/:id/documents/:docType/verify',
  authenticate,
  authorize('canVerifyDocuments'),
  validateVehicleDocType,
  verifyVehicleDocument
);

// Compliance dashboard summary
router.get('/compliance/summary',
  authenticate,
  authorize('canViewAnalytics'),
  getComplianceSummary
);

// Expiring documents
router.get('/compliance/expiring',
  authenticate,
  authorize('canViewAnalytics'),
  getExpiringDocuments
);

export default router;
