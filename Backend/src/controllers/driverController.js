// backend/src/controllers/driverController.js
import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import { getSubtreeVendorIds } from '../utils/subtree.js';
import mongoose from 'mongoose';

// List drivers under subtree
export async function listDrivers(req, res) {
  try {
    const userVendorId = req.user.vendorId;
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    const filter = { vendorId: { $in: vendorIds } };
    if (req.query.status) {
      filter.status = req.query.status;
    }
    const drivers = await Driver.find(filter)
      .populate({ path: 'vendorId', select: 'name' })
      .populate({ path: 'assignedVehicleId', select: 'regNumber make model' })
      .lean();
    
    const result = drivers.map(d => ({
      _id: d._id,
      name: d.name,
      phone: d.contact, // Map contact to phone for frontend compatibility
      email: d.contact && d.contact.includes('@') ? d.contact : undefined, // Set email if contact looks like an email
      documents: d.documents || {}, // Include documents data
      complianceStatus: d.complianceStatus || {}, // Include compliance status
      vendorId: d.vendorId._id,
      vendorName: d.vendorId.name,
      status: d.status,
      assignedVehicle: d.assignedVehicleId ? {
        _id: d.assignedVehicleId._id,
        regNumber: d.assignedVehicleId.regNumber,
        make: d.assignedVehicleId.make,
        model: d.assignedVehicleId.model
      } : null,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    }));
    
    res.json(result);
  } catch (err) {
    console.error('listDrivers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}



// Create a driver under a vendor
export async function createDriver(req, res) {
  try {
    const { name, contact, vendorId, licenseNumber, licenseExpiry, licenseUrl } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    
    // If vendorId is specified, use it; otherwise use the current user's vendorId
    const targetVendorId = vendorId || req.user.vendorId;
    
    // If vendorId is specified, verify it's in user's subtree
    if (vendorId) {
      const userVendorId = req.user.vendorId;
      const vendorIds = await getSubtreeVendorIds(userVendorId);
      if (!vendorIds.map(id => id.toString()).includes(targetVendorId.toString())) {
        return res.status(403).json({ message: 'Forbidden: Cannot create driver for vendor outside your subtree' });
      }
    }
    
    // Create driver with basic info
    const driver = new Driver({ 
      name, 
      contact, 
      vendorId: targetVendorId 
    });
    
    // Add license information if provided
    if (licenseNumber || licenseExpiry || licenseUrl) {
      // Initialize documents object if it doesn't exist
      if (!driver.documents) {
        driver.documents = {};
      }
      
      // Set driving license information
      driver.documents.drivingLicense = {
        ...(driver.documents.drivingLicense || {}),
        licenseNumber,
        url: licenseUrl,
        uploadedAt: new Date(),
        expiresAt: licenseExpiry ? new Date(licenseExpiry) : undefined
      };
    }
    
    await driver.save();
    res.status(201).json({ message: 'Driver created', driverId: driver._id });
  } catch (err) {
    console.error('createDriver error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}


// Update driver details (name/contact)
export async function updateDriver(req, res) {
  try {
    const driverId = req.params.id;
    const updates = req.body; // expect name, contact, maybe vendorId change?
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    // Check driver.vendorId is in subtree
    const userVendorId = req.user.vendorId;
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    if (!vendorIds.map(id => id.toString()).includes(driver.vendorId.toString())) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // If updating vendorId, ensure new vendorId is also in subtree
    if (updates.vendorId) {
      if (!vendorIds.map(id => id.toString()).includes(updates.vendorId)) {
        return res.status(403).json({ message: 'Cannot move driver to that vendor' });
      }
    }
    Object.assign(driver, updates);
    await driver.save();
    res.json({ message: 'Driver updated' });
  } catch (err) {
    console.error('updateDriver error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Delete driver
export async function deleteDriver(req, res) {
  try {
    const driverId = req.params.id;
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    // Check subtree
    const userVendorId = req.user.vendorId;
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    if (!vendorIds.map(id => id.toString()).includes(driver.vendorId.toString())) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // If assigned to a vehicle, unassign
    if (driver.assignedVehicleId) {
      await Vehicle.findByIdAndUpdate(driver.assignedVehicleId, { assignedDriverId: null, status: 'AVAILABLE' });
    }    await Driver.deleteOne({ _id: driver._id });
    res.json({ message: 'Driver deleted' });
  } catch (err) {
    console.error('deleteDriver error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Update driver status
export async function updateDriverStatus(req, res) {
  try {
    const driverId = req.params.id;
    const { status } = req.body; // expect one of enum
    if (!['AVAILABLE','ON_DUTY','MAINTENANCE','INACTIVE'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });
    // Check subtree
    const userVendorId = req.user.vendorId;
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    if (!vendorIds.map(id => id.toString()).includes(driver.vendorId.toString())) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // If setting to AVAILABLE or ON_DUTY, check compliance first
    if ((status === 'AVAILABLE' || status === 'ON_DUTY') && !driver.checkCompliance()) {
      return res.status(400).json({ 
        message: 'Cannot set status to AVAILABLE or ON_DUTY: Driver is not compliant with document requirements',
        complianceStatus: driver.complianceStatus
      });
    }
    
    // If going to unavailable and assignedVehicleId, unassign
    if (status !== 'AVAILABLE' && driver.assignedVehicleId) {
      await Vehicle.findByIdAndUpdate(driver.assignedVehicleId, { assignedDriverId: null, status: 'AVAILABLE' });
      driver.assignedVehicleId = null;
    }
    driver.status = status;
    await driver.save();
    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error('updateDriverStatus error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Assign/unassign vehicle
export async function assignVehicleToDriver(req, res) {
  try {
    const driverId = req.params.id;
    const { vehicleId, forceAssignment } = req.body; // may be null to unassign, forceAssignment flag for override
    console.log(`Assigning vehicle ${vehicleId || 'none'} to driver ${driverId}, force=${forceAssignment}`);
    
    const driver = await Driver.findById(driverId);
    if (!driver) {
      console.error(`Driver not found with ID: ${driverId}`);
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    // Check subtree
    const userVendorId = req.user.vendorId;
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    if (!vendorIds.map(id => id.toString()).includes(driver.vendorId.toString())) {
      console.error(`Permission denied: User vendor ${userVendorId} trying to access driver ${driverId} with vendor ${driver.vendorId}`);
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Unassign existing vehicle if any
    if (driver.assignedVehicleId) {
      console.log(`Unassigning existing vehicle ${driver.assignedVehicleId} from driver ${driverId}`);
      await Vehicle.findByIdAndUpdate(driver.assignedVehicleId, { assignedDriverId: null, status: 'AVAILABLE' });
      driver.assignedVehicleId = null;
    }
    
    if (vehicleId) {
      // Check vehicle exists and in subtree
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        console.error(`Vehicle not found with ID: ${vehicleId}`);
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      
      if (!vendorIds.map(id => id.toString()).includes(vehicle.vendorId.toString())) {
        console.error(`Cannot assign vehicle ${vehicleId} outside subtree to driver ${driverId}`);
        return res.status(403).json({ message: 'Cannot assign vehicle outside subtree' });
      }
      
      if (vehicle.assignedDriverId && vehicle.assignedDriverId.toString() !== driverId) {
        console.error(`Vehicle ${vehicleId} is already assigned to driver ${vehicle.assignedDriverId}`);
        return res.status(400).json({ message: 'Vehicle already assigned to another driver' });
      }

      if (forceAssignment) {
        // Force approval of compliance for both driver and vehicle
        if (!driver.complianceStatus) {
          driver.complianceStatus = {};
        }
        if (!driver.complianceStatus.overall) {
          driver.complianceStatus.overall = {};
        }
        driver.complianceStatus.overall.manuallyApproved = true;
        driver.complianceStatus.overall.compliant = true;
        driver.complianceStatus.overall.lastChecked = new Date();

        if (!vehicle.complianceStatus) {
          vehicle.complianceStatus = {};
        }
        if (!vehicle.complianceStatus.overall) {
          vehicle.complianceStatus.overall = {};
        }
        vehicle.complianceStatus.overall.manuallyApproved = true;
        vehicle.complianceStatus.overall.compliant = true;  
        vehicle.complianceStatus.overall.lastChecked = new Date();
      } else {
        // Check driver compliance before assignment if not forcing
        if (!driver.checkCompliance()) {
          console.error(`Driver ${driverId} is not compliant for assignment`);
          return res.status(400).json({ 
            message: 'Cannot assign vehicle: Driver is not compliant with document requirements',
            complianceStatus: driver.complianceStatus
          });
        }
        
        // Check vehicle compliance before assignment if not forcing
        if (!vehicle.checkCompliance()) {
          console.error(`Vehicle ${vehicleId} is not compliant for assignment`);
          return res.status(400).json({ 
            message: 'Cannot assign vehicle: Vehicle is not compliant with document requirements',
            complianceStatus: vehicle.complianceStatus
          });
        }
      }
      
      // Assign
      console.log(`Assigning vehicle ${vehicleId} to driver ${driverId}`);
      vehicle.assignedDriverId = driver._id;
      vehicle.status = 'IN_SERVICE';
      await vehicle.save();
      driver.assignedVehicleId = vehicle._id;
      driver.status = 'ON_DUTY';
    }
    
    await driver.save();
    res.json({ 
      message: 'Assignment updated',
      driverId: driver._id,
      vehicleId: driver.assignedVehicleId,
      status: driver.status
    });
  } catch (err) {
    console.error('assignVehicleToDriver error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}
