// backend/src/models/Vendor.js
import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  level: {
    type: String,
    enum: ['SuperVendor','RegionalVendor','CityVendor'],
    required: true
  },
  // Adding numeric levelValue for easier hierarchy operations
  levelValue: {
    type: Number,
    enum: [1, 2, 3], // 1=Super, 2=Regional, 3=City
    required: true
  },
  parentVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
  ancestors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }],
  region: { type: String }, // Added for regional vendors
  city: { type: String }, // Added for city vendors
  permissions: {
    // Vendor management
    canCreateSubVendor: { type: Boolean, default: false },
    canDeleteSubVendor: { type: Boolean, default: false },
    canEditSubVendor: { type: Boolean, default: false },
    
    // Fleet management
    canManageFleet: { type: Boolean, default: false },
    canViewFleet: { type: Boolean, default: false }, // View-only access to fleet
    
    // Driver management
    canAddDriver: { type: Boolean, default: false },
    canEditDriver: { type: Boolean, default: false },
    canRemoveDriver: { type: Boolean, default: false },
    canAssignDrivers: { type: Boolean, default: false },
    
    // Vehicle management
    canAddVehicle: { type: Boolean, default: false },
    canEditVehicle: { type: Boolean, default: false },
    canRemoveVehicle: { type: Boolean, default: false },
    canAssignVehicles: { type: Boolean, default: false },
    
    // Document and compliance
    canVerifyDocuments: { type: Boolean, default: false },
    canUploadDocuments: { type: Boolean, default: false },
    
    // Analytics and reporting
    canViewAnalytics: { type: Boolean, default: false },
    
    // Permission management
    canEditPermissions: { type: Boolean, default: false },
  }
}, {
  timestamps: true
});

// Pre-save hook to set ancestors when creating a new Vendor
vendorSchema.pre('save', async function(next) {
  if (this.isNew) {
    if (this.parentVendorId) {
      const parent = await mongoose.model('Vendor').findById(this.parentVendorId).select('ancestors');
      if (parent) {
        this.ancestors = [...parent.ancestors, this.parentVendorId];
      }
    } else {
      this.ancestors = [];
    }
  }
  next();
});

const Vendor = mongoose.model('Vendor', vendorSchema);
export default Vendor;
