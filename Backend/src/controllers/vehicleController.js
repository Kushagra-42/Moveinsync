// backend/src/controllers/vehicleController.js
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Vendor from '../models/Vendor.js';
import { getSubtreeVendorIds } from '../utils/subtree.js';

// List vehicles under subtree with hierarchical data
export async function listVehicles(req, res) {
  try {
    const userVendorId = req.user.vendorId;
    // Check if user has permission to view fleet
    const userVendor = await Vendor.findById(userVendorId);
    if (!userVendor.permissions.canViewFleet && !userVendor.permissions.canManageFleet) {
      return res.status(403).json({ message: 'You do not have permission to view the fleet' });
    }
    
    // Get all vendors in subtree
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    const filter = { vendorId: { $in: vendorIds } };
    
    // Apply status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    // Add location filters if provided
    if (req.query.region) {
      filter.region = req.query.region;
    }
    
    if (req.query.city) {
      filter.city = req.query.city;
    }
      const vehicles = await Vehicle.find(filter)
      .populate({ path: 'vendorId', select: 'name level region city parentVendorId' })
      .populate({ path: 'assignedDriverId', select: 'name contact' })
      .lean();
    
    // Fetch additional vendor info if needed for breadcrumb/hierarchy
    const vendorMap = new Map();
    for (const vehicle of vehicles) {
      if (vehicle.vendorId && !vendorMap.has(vehicle.vendorId._id.toString())) {
        const vendorWithAncestors = await Vendor.findById(vehicle.vendorId._id)
          .populate({ path: 'ancestors', select: 'name level region city' })
          .lean();
        
        vendorMap.set(vehicle.vendorId._id.toString(), vendorWithAncestors);
      }
    }
    
    const result = vehicles.map(v => ({
      _id: v._id,
      regNumber: v.regNumber,
      model: v.model,
      capacity: v.capacity || 4,
      fuelType: v.fuelType || 'PETROL',
      vehicleType: v.vehicleType || 'SEDAN',
      manufacturingYear: v.manufacturingYear,
      color: v.color,
      city: v.city || '',
      region: v.region || '',
      vendorId: v.vendorId._id,
      vendorName: v.vendorId.name,
      vendorLevel: v.vendorId.level,
      vendorHierarchy: vendorMap.get(v.vendorId._id.toString())?.ancestors?.map(a => ({
        id: a._id,
        name: a.name,
        level: a.level
      })) || [],
      assignedDriverId: v.assignedDriverId?._id || null,
      assignedDriverName: v.assignedDriverId?.name || null,
      assignedDriverPhone: v.assignedDriverId?.phone || null,
      status: v.status,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      isCompliant: v.complianceStatus?.overall?.compliant || false,
      // Add editing permissions based on user's vendor permissions
      canEdit: userVendor.permissions.canEditVehicle,
      canAssign: userVendor.permissions.canAssignDriver,
      canUpdateStatus: userVendor.permissions.canUpdateVehicleStatus
    }));
    
    res.json(result);
  } catch (err) {
    console.error('listVehicles error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}


// Create vehicle
export async function createVehicle(req, res) {
  try {
    const { 
      regNumber, 
      model, 
      capacity, 
      fuelType, 
      vehicleType, 
      manufacturingYear, 
      color,
      city,
      region,
      vendorId // Optional: Allow assigning to a sub-vendor directly
    } = req.body;
    
    if (!regNumber) return res.status(400).json({ message: 'Registration Number is required' });
    if (!model) return res.status(400).json({ message: 'Vehicle Model is required' });
    
    const userVendorId = req.user.vendorId;
    const userVendor = await Vendor.findById(userVendorId);
    
    if (!userVendor.permissions.canAddVehicle) {
      return res.status(403).json({ message: 'You do not have permission to add vehicles' });
    }
    
    // Check if registration number is unique
    const exists = await Vehicle.findOne({ regNumber });
    if (exists) return res.status(400).json({ message: 'Registration Number must be unique' });
    
    // Determine which vendor to assign the vehicle to
    let vehicleVendorId = userVendorId;
    
    // If a vendorId was specified and it's not the user's vendor, verify it's in subtree
    if (vendorId && vendorId !== userVendorId.toString()) {
      const vendorIds = await getSubtreeVendorIds(userVendorId);
      if (!vendorIds.map(id => id.toString()).includes(vendorId.toString())) {
        return res.status(403).json({ message: 'Cannot assign vehicle to vendor outside your subtree' });
      }
      vehicleVendorId = vendorId;
      
      // Get the target vendor to get region/city if not provided
      const targetVendor = await Vendor.findById(vendorId);
      if (targetVendor) {
        // Use target vendor's region/city if not provided
        if (!region && targetVendor.region) {
          req.body.region = targetVendor.region;
        }
        if (!city && targetVendor.city) {
          req.body.city = targetVendor.city;
        }
      }
    }
    
    // Create vehicle with assigned vendor
    const vehicle = new Vehicle({ 
      vendorId: vehicleVendorId, 
      regNumber, 
      model,
      capacity: capacity || 4,
      fuelType: fuelType || 'PETROL',
      vehicleType: vehicleType || 'SEDAN',
      manufacturingYear,
      color,
      city: req.body.city || city,
      region: req.body.region || region,
      status: 'INACTIVE' // New vehicles start as inactive until assigned
    });
    await vehicle.save();
    
    res.status(201).json({ 
      message: 'Vehicle created', 
      vehicleId: vehicle._id,
      status: vehicle.status
    });
  } catch (err) {
    console.error('createVehicle error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}


// Update vehicle details
export async function updateVehicle(req, res) {
  try {
    const vehicleId = req.params.id;
    const updates = req.body;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    
    const userVendorId = req.user.vendorId;
    const userVendor = await Vendor.findById(userVendorId);
    
    if (!userVendor.permissions.canEditVehicle) {
      return res.status(403).json({ message: 'You do not have permission to edit vehicles' });
    }
    
    // Check if vehicle is in user's subtree
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    if (!vendorIds.map(id => id.toString()).includes(vehicle.vendorId.toString())) {
      return res.status(403).json({ message: 'Forbidden: Vehicle not in your subtree' });
    }
    
    // If trying to change vendorId, verify the new vendor is in subtree
    if (updates.vendorId && updates.vendorId !== vehicle.vendorId.toString()) {
      if (!vendorIds.map(id => id.toString()).includes(updates.vendorId)) {
        return res.status(403).json({ message: 'Cannot move vehicle to a vendor outside your subtree' });
      }
    }
    
    // Check for unique registration number if changing
    if (updates.regNumber && updates.regNumber !== vehicle.regNumber) {
      const exists = await Vehicle.findOne({ regNumber: updates.regNumber });
      if (exists) return res.status(400).json({ message: 'Registration Number must be unique' });
    }
    
    // Apply updates
    Object.assign(vehicle, updates);
    await vehicle.save();
    
    res.json({ message: 'Vehicle updated', vehicle: vehicle });
  } catch (err) {
    console.error('updateVehicle error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Delete vehicle
export async function deleteVehicle(req, res) {
  try {
    const vehicleId = req.params.id;
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    
    const userVendorId = req.user.vendorId;
    const userVendor = await Vendor.findById(userVendorId);
    
    if (!userVendor.permissions.canRemoveVehicle) {
      return res.status(403).json({ message: 'You do not have permission to remove vehicles' });
    }
    
    // Check if vehicle is in user's subtree
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    if (!vendorIds.map(id => id.toString()).includes(vehicle.vendorId.toString())) {
      return res.status(403).json({ message: 'Forbidden: Vehicle not in your subtree' });
    }
    
    // If vehicle has an assigned driver, unassign it
    if (vehicle.assignedDriverId) {
      await Driver.findByIdAndUpdate(vehicle.assignedDriverId, { 
        assignedVehicleId: null, 
        status: 'AVAILABLE' 
      });
    }
    
    await Vehicle.findByIdAndDelete(vehicleId);
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    console.error('deleteVehicle error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Update vehicle status
export async function updateVehicleStatus(req, res) {
  try {
    const vehicleId = req.params.id;
    const { status } = req.body;
    
    console.log(`Updating vehicle status: ${vehicleId} to ${status}`);
    
    if (!['AVAILABLE','IN_SERVICE','MAINTENANCE','INACTIVE'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      console.error(`Vehicle not found with ID: ${vehicleId}`);
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    const userVendorId = req.user.vendorId;
    const userVendor = await Vendor.findById(userVendorId);
    
    // Check if user has permission to update vehicle status
    // Allow the operation if user has canEditVehicle OR canUpdateVehicleStatus OR canManageFleet
    if (!userVendor.permissions.canEditVehicle && 
        !userVendor.permissions.canUpdateVehicleStatus &&
        !userVendor.permissions.canManageFleet) {
      console.error(`User ${req.user._id} does not have permission to update vehicle status`);
      return res.status(403).json({ message: 'You do not have permission to update vehicle status' });
    }
    
    // Check if vehicle is in user's subtree
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    if (!vendorIds.map(id => id.toString()).includes(vehicle.vendorId.toString())) {
      return res.status(403).json({ message: 'Forbidden: Vehicle not in your subtree' });
    }
    
    // If setting to AVAILABLE or IN_SERVICE, check compliance first
    if ((status === 'AVAILABLE' || status === 'IN_SERVICE') && !vehicle.checkCompliance()) {
      return res.status(400).json({ 
        message: 'Cannot set status to AVAILABLE or IN_SERVICE: Vehicle is not compliant with document requirements',
        complianceStatus: vehicle.complianceStatus
      });
    }
    
    // If making unavailable and vehicle has an assigned driver, unassign the driver
    if (status !== 'AVAILABLE' && status !== 'IN_SERVICE' && vehicle.assignedDriverId) {
      await Driver.findByIdAndUpdate(vehicle.assignedDriverId, { 
        assignedVehicleId: null, 
        status: 'AVAILABLE' 
      });
      vehicle.assignedDriverId = null;
    }
    
    vehicle.status = status;
    await vehicle.save();
    
    res.json({ message: 'Status updated', status: vehicle.status });
  } catch (err) {
    console.error('updateVehicleStatus error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Assign/unassign driver
export async function assignDriverToVehicle(req, res) {
  try {
    const vehicleId = req.params.id;
    const { driverId, forceAssignment } = req.body; // may be null for unassignment, forceAssignment to bypass compliance checks
    
    console.log(`Assigning driver to vehicle: Vehicle ID ${vehicleId}, Driver ID ${driverId || 'none (unassignment)'}, force=${forceAssignment}`);
    
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      console.error(`Vehicle not found with ID: ${vehicleId}`);
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    const userVendorId = req.user.vendorId;
    const userVendor = await Vendor.findById(userVendorId);
    
    // Check if user has permission to assign drivers
    // Allow if user has canAssignDrivers OR canManageFleet OR canEditVehicle
    if (!userVendor.permissions.canAssignDrivers && 
        !userVendor.permissions.canEditVehicle &&
        !userVendor.permissions.canManageFleet) {
      console.error(`User ${req.user._id} does not have permission to assign drivers`);
      return res.status(403).json({ message: 'You do not have permission to assign drivers' });
    }
    
    // Check if vehicle is in user's subtree
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    if (!vendorIds.map(id => id.toString()).includes(vehicle.vendorId.toString())) {
      return res.status(403).json({ message: 'Forbidden: Vehicle not in your subtree' });
    }
    
    // Additional check: If vehicle is not AVAILABLE, cannot assign a driver
    if (driverId && vehicle.status !== 'AVAILABLE') {
      return res.status(400).json({ 
        message: `Vehicle must be in AVAILABLE status to assign a driver. Current status: ${vehicle.status}`
      });
    }
    
    // Unassign current driver if any
    if (vehicle.assignedDriverId) {
      await Driver.findByIdAndUpdate(vehicle.assignedDriverId, { 
        assignedVehicleId: null, 
        status: 'AVAILABLE' 
      });
      vehicle.assignedDriverId = null;
    }
      // If assigning a new driver
    if (driverId) {
      const driver = await Driver.findById(driverId);
      if (!driver) {
        console.error(`Driver not found with ID: ${driverId}`);
        return res.status(404).json({ message: 'Driver not found' });
      }
      
      // Check if driver is in user's subtree
      if (!vendorIds.map(id => id.toString()).includes(driver.vendorId.toString())) {
        console.error(`Cannot assign driver ${driverId} outside subtree to vehicle ${vehicleId}`);
        return res.status(403).json({ message: 'Forbidden: Cannot assign driver from outside your subtree' });
      }
      
      // Check if driver is already assigned to another vehicle
      if (driver.assignedVehicleId && driver.assignedVehicleId.toString() !== vehicleId) {
        console.error(`Driver ${driverId} is already assigned to vehicle ${driver.assignedVehicleId}`);
        return res.status(400).json({ message: 'Driver is already assigned to another vehicle' });
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
        // Check driver compliance only if not forcing assignment
        if (!driver.checkCompliance()) {
          console.error(`Driver ${driverId} is not compliant for assignment`);
          return res.status(400).json({ 
            message: 'Cannot assign driver: Driver is not compliant with document requirements',
            complianceStatus: driver.complianceStatus
          });
        }
        
        // Check vehicle compliance only if not forcing assignment
        if (!vehicle.checkCompliance()) {
          console.error(`Vehicle ${vehicleId} is not compliant for assignment`);
          return res.status(400).json({ 
            message: 'Cannot assign driver: Vehicle is not compliant with document requirements',
            complianceStatus: vehicle.complianceStatus
          });
        }
      }
      
      // Check for region/city match for better operation
      if (vehicle.region && driver.region && vehicle.region !== driver.region) {
        // Just a warning, not a hard error
        console.warn(`Warning: Driver from region ${driver.region} assigned to vehicle in ${vehicle.region}`);
      }
      
      if (vehicle.city && driver.city && vehicle.city !== driver.city) {
        // Just a warning, not a hard error
        console.warn(`Warning: Driver from city ${driver.city} assigned to vehicle in ${vehicle.city}`);
      }
      
      // Assign driver to vehicle
      vehicle.assignedDriverId = driver._id;
      vehicle.status = 'IN_SERVICE';
      await vehicle.save();
      
      // Update driver status
      driver.assignedVehicleId = vehicle._id;
      driver.status = 'ON_DUTY';
      await driver.save();
    } else {
      // Just unassigned - vehicle becomes available if it was in service
      if (vehicle.status === 'IN_SERVICE') {
        vehicle.status = 'AVAILABLE';
      }
      await vehicle.save();
    }
    
    res.json({ 
      message: driverId ? 'Driver assigned successfully' : 'Driver unassigned successfully',
      status: vehicle.status
    });
  } catch (err) {
    console.error('assignDriverToVehicle error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

// Function to get vehicle statistics for a vendor subtree
export async function getVehicleStats(req, res) {
  try {
    console.log('getVehicleStats called with params:', req.params);
    const { vendorId } = req.params;
    let targetVendorId;

    // If 'current', use the requesting user's vendorId
    if (vendorId === 'current') {
      targetVendorId = req.user.vendorId;
      console.log('Using current user vendorId:', targetVendorId);
    } else {
      targetVendorId = vendorId;
      console.log('Using provided vendorId:', targetVendorId);
      
      // Only do permission check if provided vendorId is different from user's vendorId
      if (targetVendorId.toString() !== req.user.vendorId.toString()) {
        const userVendorId = req.user.vendorId;
        const accessibleVendors = await getSubtreeVendorIds(userVendorId);
        console.log('Accessible vendors:', accessibleVendors);
        
        // Check if target vendor ID is in the list of accessible vendors (string comparison)
        const accessibleVendorIds = accessibleVendors.map(id => id.toString());
        if (!accessibleVendorIds.includes(targetVendorId.toString())) {
          console.log('Permission denied for vendorId:', targetVendorId);
          return res.status(403).json({ message: 'You do not have permission to view stats for this vendor' });
        }
      }
    }

    // Get all vendors in target subtree
    const vendorIds = await getSubtreeVendorIds(targetVendorId);
    console.log('Vendor subtree IDs:', vendorIds);

    // Count vehicles by status
    const stats = {
      total: 0,
      active: 0, // Both AVAILABLE and IN_SERVICE
      maintenance: 0,
      inactive: 0,
      unassigned: 0 // AVAILABLE but no driver assigned
    };
    
    // Query all vehicles in vendor subtree
    const vehicles = await Vehicle.find({ vendorId: { $in: vendorIds } });
    console.log('Found vehicles:', vehicles.length);
    
    stats.total = vehicles.length;
    
    // Calculate status counts
    vehicles.forEach(vehicle => {
      console.log('Vehicle status:', vehicle.regNumber, vehicle.status);
      if (vehicle.status === 'MAINTENANCE') {
        stats.maintenance++;
      } else if (vehicle.status === 'INACTIVE') {
        stats.inactive++;
      } else {
        // Either AVAILABLE or IN_SERVICE counts as active
        stats.active++;
      }
      
      if (vehicle.status === 'AVAILABLE' && !vehicle.assignedDriverId) {
        stats.unassigned++;
      }
    });
    
    console.log('Final stats:', stats);
    return res.json(stats);
    
  } catch (error) {
    console.error('Error getting vehicle stats:', error);
    return res.status(500).json({ message: 'Failed to get vehicle statistics' });
  }
}
