// backend/src/routes/stats.js
import express from 'express';
import mongoose from 'mongoose';
import Vendor from '../models/Vendor.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import { authenticate } from '../middleware/authenticate.js';
import { getSubtreeVendorIds } from '../utils/subtree.js';

const router = express.Router();

// GET /api/stats/dashboard - Get statistics for a vendor's dashboard
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userVendorId = req.user.vendorId;
    console.log('Dashboard stats - User vendor ID:', userVendorId, typeof userVendorId);
    
    if (!userVendorId) {
      console.error('No vendor ID found for user');
      return res.status(400).json({ message: 'User has no associated vendor' });
    }
    
    // Get all vendors in the user's subtree
    console.log('Getting subtree for vendor ID:', userVendorId);
    const vendorIds = await getSubtreeVendorIds(userVendorId);
    console.log('Found vendor IDs in subtree:', vendorIds.length, vendorIds);
    
    // Get vendor hierarchy for the current vendor
    const currentVendor = await Vendor.findById(userVendorId)
      .select('name level region city parentVendorId ancestors')
      .lean();
      
    if (!currentVendor) {
      console.error('Vendor not found for ID:', userVendorId);
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    console.log('Current vendor:', currentVendor.name, 'Level:', currentVendor.level);
    
    // Get counts
    const [
      totalVendors,
      totalVehicles,
      totalDrivers,
      availableVehicles,
      inServiceVehicles,
      maintenanceVehicles,
      inactiveVehicles,
      availableDrivers,
      onDutyDrivers,
      offDutyDrivers,
      nonCompliantVehicles,
      nonCompliantDrivers
    ] = await Promise.all([
      Vendor.countDocuments({ _id: { $in: vendorIds } }),
      Vehicle.countDocuments({ vendorId: { $in: vendorIds } }),
      Driver.countDocuments({ vendorId: { $in: vendorIds } }),
      Vehicle.countDocuments({ vendorId: { $in: vendorIds }, status: 'AVAILABLE' }),
      Vehicle.countDocuments({ vendorId: { $in: vendorIds }, status: 'IN_SERVICE' }),
      Vehicle.countDocuments({ vendorId: { $in: vendorIds }, status: 'MAINTENANCE' }),
      Vehicle.countDocuments({ vendorId: { $in: vendorIds }, status: 'INACTIVE' }),
      Driver.countDocuments({ vendorId: { $in: vendorIds }, status: 'AVAILABLE' }),
      Driver.countDocuments({ vendorId: { $in: vendorIds }, status: 'ON_DUTY' }),
      Driver.countDocuments({ vendorId: { $in: vendorIds }, status: 'OFF_DUTY' }),
      Vehicle.countDocuments({ 
        vendorId: { $in: vendorIds }, 
        'complianceStatus.overall.compliant': false 
      }),
      Driver.countDocuments({ 
        vendorId: { $in: vendorIds }, 
        'complianceStatus.overall.compliant': false 
      })
    ]);    // Get breakdown of vehicles by vendor level
    const vehiclesByVendorLevel = await Vehicle.aggregate([
      { 
        $match: { 
          vendorId: { $in: vendorIds }
        }
      },
      {
        $lookup: {
          from: 'vendors',
          localField: 'vendorId',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $group: {
          _id: '$vendor.level',
          count: { $sum: 1 }
        }
      }
    ]);    // Get breakdown of drivers by vendor level
    const driversByVendorLevel = await Driver.aggregate([
      { 
        $match: { 
          vendorId: { $in: vendorIds }
        }
      },
      {
        $lookup: {
          from: 'vendors',
          localField: 'vendorId',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $group: {
          _id: '$vendor.level',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get direct subvendors of the current vendor for the first level of hierarchy
    const directSubvendors = await Vendor.find({ parentVendorId: userVendorId })
      .select('name level region city')
      .lean();
      
    // Convert to objects with proper names for the response
    const vehicleLevelBreakdown = {};
    vehiclesByVendorLevel.forEach(item => {
      vehicleLevelBreakdown[item._id] = item.count;
    });
    
    const driverLevelBreakdown = {};
    driversByVendorLevel.forEach(item => {
      driverLevelBreakdown[item._id] = item.count;
    });
    
    res.json({
      vendor: currentVendor,
      counts: {
        vendors: totalVendors,
        vehicles: {
          total: totalVehicles,
          available: availableVehicles,
          inService: inServiceVehicles,
          maintenance: maintenanceVehicles,
          inactive: inactiveVehicles,
          nonCompliant: nonCompliantVehicles,
          byVendorLevel: vehicleLevelBreakdown
        },
        drivers: {
          total: totalDrivers,
          available: availableDrivers,
          onDuty: onDutyDrivers,
          offDuty: offDutyDrivers,
          nonCompliant: nonCompliantDrivers,
          byVendorLevel: driverLevelBreakdown
        }
      },
      directSubvendors
    });
    
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
