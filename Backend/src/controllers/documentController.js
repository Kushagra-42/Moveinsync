// backend/src/controllers/documentController.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import { getSubtreeVendorIds } from '../utils/subtree.js';

// Configure storage for driver documents
export const driverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const driverId = req.params.id;
    const dir = path.join('uploads', 'drivers', driverId);
    fs.mkdirSync(dir, { recursive: true }); // Create dir if not exists
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const docType = req.params.docType;
    const ext = path.extname(file.originalname);
    cb(null, `${docType}${ext}`);
  }
});

// Configure storage for vehicle documents
export const vehicleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const vehicleId = req.params.id;
    const dir = path.join('uploads', 'vehicles', vehicleId);
    fs.mkdirSync(dir, { recursive: true }); // Create dir if not exists
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const docType = req.params.docType;
    const ext = path.extname(file.originalname);
    cb(null, `${docType}${ext}`);
  }
});

// File filter to validate file types
export const fileFilter = (req, file, cb) => {
  // Allow only certain file types
  const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    return cb(null, true);
  }
  
  cb(new Error('Invalid file type. Only PDF and image files are allowed.'));
};

// Validate document type for driver
export const validateDriverDocType = (req, res, next) => {
  const { docType } = req.params;
  const validTypes = ['drivingLicense', 'permit', 'pollutionCertificate'];
  
  if (!validTypes.includes(docType)) {
    return res.status(400).json({ message: `Invalid document type. Must be one of: ${validTypes.join(', ')}` });
  }
  
  next();
};

// Validate document type for vehicle
export const validateVehicleDocType = (req, res, next) => {
  const { docType } = req.params;
  const validTypes = ['registrationCertificate', 'insurance', 'permit', 'pollutionCertificate'];
  
  if (!validTypes.includes(docType)) {
    return res.status(400).json({ message: `Invalid document type. Must be one of: ${validTypes.join(', ')}` });
  }
  
  next();
};

// Upload driver document
export async function uploadDriverDocument(req, res) {
  try {
    const { id, docType } = req.params;
    const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    
    // Check if driver exists and belongs to subtree
    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    const userVendorId = req.user.vendorId;
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    if (!vendorIds.map(id => id.toString()).includes(driver.vendorId.toString())) {
      return res.status(403).json({ message: 'Forbidden: Driver not in your subtree' });
    }
    
    // Set document path and metadata
    const filePath = `/uploads/drivers/${id}/${docType}${path.extname(req.file.filename)}`;
    
    // Update driver document info
    driver.documents[docType] = {
      url: filePath,
      uploadedAt: new Date(),
      expiresAt: expiresAt
    };
    
    // Reset verification status
    driver.complianceStatus[docType] = {
      verified: false,
      verifiedBy: null,
      verifiedAt: null,
      notes: null
    };
    
    // Update overall compliance status
    driver.checkCompliance();
    await driver.save();
    
    res.json({ 
      message: 'Document uploaded successfully',
      documentUrl: filePath,
      expiresAt: expiresAt
    });
    
  } catch (err) {
    console.error('uploadDriverDocument error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Upload vehicle document
export async function uploadVehicleDocument(req, res) {
  try {
    const { id, docType } = req.params;
    const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    
    // Check if vehicle exists and belongs to subtree
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    const userVendorId = req.user.vendorId;
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    if (!vendorIds.map(id => id.toString()).includes(vehicle.vendorId.toString())) {
      return res.status(403).json({ message: 'Forbidden: Vehicle not in your subtree' });
    }
    
    // Set document path and metadata
    const filePath = `/uploads/vehicles/${id}/${docType}${path.extname(req.file.filename)}`;
    
    // Update vehicle document info
    vehicle.documents[docType] = {
      url: filePath,
      uploadedAt: new Date(),
      expiresAt: expiresAt
    };
    
    // Reset verification status
    vehicle.complianceStatus[docType] = {
      verified: false,
      verifiedBy: null,
      verifiedAt: null,
      notes: null
    };
    
    // Update overall compliance status
    vehicle.checkCompliance();
    await vehicle.save();
    
    res.json({ 
      message: 'Document uploaded successfully',
      documentUrl: filePath,
      expiresAt: expiresAt
    });
    
  } catch (err) {
    console.error('uploadVehicleDocument error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get driver documents
export async function getDriverDocuments(req, res) {
  try {
    const { id } = req.params;
      // Check if driver exists and belongs to subtree
    const driver = await Driver.findById(id)
      .select('documents complianceStatus vendorId name contact') // Added more fields
      .populate('complianceStatus.drivingLicense.verifiedBy', 'email')
      .populate('complianceStatus.permit.verifiedBy', 'email')
      .populate('complianceStatus.pollutionCertificate.verifiedBy', 'email');
      
    if (!driver) {
      console.error(`Driver not found with ID: ${id}`);
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    const userVendorId = req.user.vendorId;
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    if (!vendorIds.map(id => id.toString()).includes(driver.vendorId.toString())) {
      console.error(`Permission denied: User vendor ${userVendorId} trying to access driver with vendor ${driver.vendorId}`);
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Initialize documents and complianceStatus if they're undefined
    if (!driver.documents) {
      driver.documents = {};
    }
    
    if (!driver.complianceStatus) {
      driver.complianceStatus = {
        overall: { compliant: false, lastChecked: new Date() }
      };
    }
    
    res.json({
      documents: driver.documents,
      complianceStatus: driver.complianceStatus
    });
    
  } catch (err) {
    console.error('getDriverDocuments error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get vehicle documents
export async function getVehicleDocuments(req, res) {
  try {
    const { id } = req.params;
      // Check if vehicle exists and belongs to subtree
    const vehicle = await Vehicle.findById(id)
      .select('documents complianceStatus vendorId') // Added vendorId to the select query
      .populate('complianceStatus.registrationCertificate.verifiedBy', 'email')
      .populate('complianceStatus.insurance.verifiedBy', 'email')
      .populate('complianceStatus.permit.verifiedBy', 'email')
      .populate('complianceStatus.pollutionCertificate.verifiedBy', 'email');
      
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    const userVendorId = req.user.vendorId;
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    if (!vendorIds.map(id => id.toString()).includes(vehicle.vendorId.toString())) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    res.json({
      documents: vehicle.documents,
      complianceStatus: vehicle.complianceStatus
    });
    
  } catch (err) {
    console.error('getVehicleDocuments error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Verify driver document
export async function verifyDriverDocument(req, res) {
  try {
    const { id, docType } = req.params;
    const { verified, notes } = req.body;
    
    if (typeof verified !== 'boolean') {
      return res.status(400).json({ message: 'Verified status must be true or false' });
    }
    
    // Check if driver exists and belongs to subtree
    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    const userVendorId = req.user.vendorId;
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    if (!vendorIds.map(id => id.toString()).includes(driver.vendorId.toString())) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Check if document exists
    if (!driver.documents[docType] || !driver.documents[docType].url) {
      return res.status(400).json({ message: `No ${docType} document found` });
    }
    
    // Update verification status
    driver.complianceStatus[docType] = {
      verified,
      verifiedBy: req.user.userId,
      verifiedAt: new Date(),
      notes: notes || ''
    };
    
    // Update overall compliance
    driver.checkCompliance();
    await driver.save();
    
    res.json({
      message: `Document ${verified ? 'verified' : 'rejected'}`,
      complianceStatus: driver.complianceStatus
    });
    
  } catch (err) {
    console.error('verifyDriverDocument error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Verify vehicle document
export async function verifyVehicleDocument(req, res) {
  try {
    const { id, docType } = req.params;
    const { verified, notes } = req.body;
    
    if (typeof verified !== 'boolean') {
      return res.status(400).json({ message: 'Verified status must be true or false' });
    }
    
    // Check if vehicle exists and belongs to subtree
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    const userVendorId = req.user.vendorId;
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    if (!vendorIds.map(id => id.toString()).includes(vehicle.vendorId.toString())) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Check if document exists
    if (!vehicle.documents[docType] || !vehicle.documents[docType].url) {
      return res.status(400).json({ message: `No ${docType} document found` });
    }
    
    // Update verification status
    vehicle.complianceStatus[docType] = {
      verified,
      verifiedBy: req.user.userId,
      verifiedAt: new Date(),
      notes: notes || ''
    };
    
    // Update overall compliance
    vehicle.checkCompliance();
    await vehicle.save();
    
    res.json({
      message: `Document ${verified ? 'verified' : 'rejected'}`,
      complianceStatus: vehicle.complianceStatus
    });
    
  } catch (err) {
    console.error('verifyVehicleDocument error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get compliance summary 
export async function getComplianceSummary(req, res) {
  try {
    const userVendorId = req.user.vendorId;
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    
    // Count drivers with pending documents (uploaded but not verified)
    const pendingDriverDocsCount = await Driver.countDocuments({
      vendorId: { $in: vendorIds },
      $or: [
        { 'documents.drivingLicense.url': { $exists: true }, 'complianceStatus.drivingLicense.verified': false },
        { 'documents.permit.url': { $exists: true }, 'complianceStatus.permit.verified': false },
        { 'documents.pollutionCertificate.url': { $exists: true }, 'complianceStatus.pollutionCertificate.verified': false }
      ]
    });
    
    // Count vehicles with pending documents
    const pendingVehicleDocsCount = await Vehicle.countDocuments({
      vendorId: { $in: vendorIds },
      $or: [
        { 'documents.registrationCertificate.url': { $exists: true }, 'complianceStatus.registrationCertificate.verified': false },
        { 'documents.insurance.url': { $exists: true }, 'complianceStatus.insurance.verified': false },
        { 'documents.permit.url': { $exists: true }, 'complianceStatus.permit.verified': false },
        { 'documents.pollutionCertificate.url': { $exists: true }, 'complianceStatus.pollutionCertificate.verified': false }
      ]
    });
    
    // Count non-compliant drivers and vehicles
    const nonCompliantDriversCount = await Driver.countDocuments({
      vendorId: { $in: vendorIds },
      'complianceStatus.overall.compliant': false
    });
    
    const nonCompliantVehiclesCount = await Vehicle.countDocuments({
      vendorId: { $in: vendorIds },
      'complianceStatus.overall.compliant': false
    });
    
    // Get upcoming expiring documents (within next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringDriverDocs = await Driver.find({
      vendorId: { $in: vendorIds },
      $or: [
        { 'documents.drivingLicense.expiresAt': { $lte: thirtyDaysFromNow, $gte: new Date() } },
        { 'documents.permit.expiresAt': { $lte: thirtyDaysFromNow, $gte: new Date() } },
        { 'documents.pollutionCertificate.expiresAt': { $lte: thirtyDaysFromNow, $gte: new Date() } }
      ]
    }).select('name documents').limit(10);
    
    const expiringVehicleDocs = await Vehicle.find({
      vendorId: { $in: vendorIds },
      $or: [
        { 'documents.registrationCertificate.expiresAt': { $lte: thirtyDaysFromNow, $gte: new Date() } },
        { 'documents.insurance.expiresAt': { $lte: thirtyDaysFromNow, $gte: new Date() } },
        { 'documents.permit.expiresAt': { $lte: thirtyDaysFromNow, $gte: new Date() } },
        { 'documents.pollutionCertificate.expiresAt': { $lte: thirtyDaysFromNow, $gte: new Date() } }
      ]
    }).select('regNumber documents').limit(10);
    
    res.json({
      summary: {
        pendingDriverDocsCount,
        pendingVehicleDocsCount,
        nonCompliantDriversCount,
        nonCompliantVehiclesCount
      },
      expiringDocuments: {
        drivers: expiringDriverDocs,
        vehicles: expiringVehicleDocs
      }
    });
    
  } catch (err) {
    console.error('getComplianceSummary error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Get soon to expire documents
export async function getExpiringDocuments(req, res) {
  try {
    const userVendorId = req.user.vendorId;
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    
    // Default to 30 days or use query parameter
    const days = parseInt(req.query.days) || 30;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    const expiringDriverDocs = await Driver.find({
      vendorId: { $in: vendorIds },
      $or: [
        { 'documents.drivingLicense.expiresAt': { $lte: futureDate, $gte: new Date() } },
        { 'documents.permit.expiresAt': { $lte: futureDate, $gte: new Date() } },
        { 'documents.pollutionCertificate.expiresAt': { $lte: futureDate, $gte: new Date() } }
      ]
    }).select('name documents');
    
    const expiringVehicleDocs = await Vehicle.find({
      vendorId: { $in: vendorIds },
      $or: [
        { 'documents.registrationCertificate.expiresAt': { $lte: futureDate, $gte: new Date() } },
        { 'documents.insurance.expiresAt': { $lte: futureDate, $gte: new Date() } },
        { 'documents.permit.expiresAt': { $lte: futureDate, $gte: new Date() } },
        { 'documents.pollutionCertificate.expiresAt': { $lte: futureDate, $gte: new Date() } }
      ]
    }).select('regNumber documents');
    
    res.json({
      days,
      expiringDocuments: {
        drivers: expiringDriverDocs.map(d => ({
          _id: d._id,
          name: d.name,
          documents: {
            drivingLicense: d.documents.drivingLicense?.expiresAt && d.documents.drivingLicense.expiresAt <= futureDate ? {
              expiresAt: d.documents.drivingLicense.expiresAt,
              daysRemaining: Math.ceil((d.documents.drivingLicense.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
            } : null,
            permit: d.documents.permit?.expiresAt && d.documents.permit.expiresAt <= futureDate ? {
              expiresAt: d.documents.permit.expiresAt,
              daysRemaining: Math.ceil((d.documents.permit.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
            } : null,
            pollutionCertificate: d.documents.pollutionCertificate?.expiresAt && d.documents.pollutionCertificate.expiresAt <= futureDate ? {
              expiresAt: d.documents.pollutionCertificate.expiresAt,
              daysRemaining: Math.ceil((d.documents.pollutionCertificate.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
            } : null,
          }
        })),
        vehicles: expiringVehicleDocs.map(v => ({
          _id: v._id,
          regNumber: v.regNumber,
          documents: {
            registrationCertificate: v.documents.registrationCertificate?.expiresAt && v.documents.registrationCertificate.expiresAt <= futureDate ? {
              expiresAt: v.documents.registrationCertificate.expiresAt,
              daysRemaining: Math.ceil((v.documents.registrationCertificate.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
            } : null,
            insurance: v.documents.insurance?.expiresAt && v.documents.insurance.expiresAt <= futureDate ? {
              expiresAt: v.documents.insurance.expiresAt,
              daysRemaining: Math.ceil((v.documents.insurance.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
            } : null,
            permit: v.documents.permit?.expiresAt && v.documents.permit.expiresAt <= futureDate ? {
              expiresAt: v.documents.permit.expiresAt,
              daysRemaining: Math.ceil((v.documents.permit.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
            } : null,
            pollutionCertificate: v.documents.pollutionCertificate?.expiresAt && v.documents.pollutionCertificate.expiresAt <= futureDate ? {
              expiresAt: v.documents.pollutionCertificate.expiresAt,
              daysRemaining: Math.ceil((v.documents.pollutionCertificate.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
            } : null,
          }
        }))
      }
    });
    
  } catch (err) {
    console.error('getExpiringDocuments error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
