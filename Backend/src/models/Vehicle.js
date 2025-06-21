// backend/src/models/Vehicle.js
import mongoose from 'mongoose';

// Document schema for reuse
const documentSchema = {
  url: { type: String },
  uploadedAt: { type: Date },
  expiresAt: { type: Date }
};

// Verification status schema for reuse
const verificationSchema = {
  verified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  notes: { type: String }
};

const vehicleSchema = new mongoose.Schema({
  regNumber: { type: String, required: true, unique: true },
  model: { type: String, required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  assignedDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  city: { type: String },
  region: { type: String },
  capacity: { type: Number, default: 4 }, // Seating capacity
  fuelType: { type: String, enum: ['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID'], default: 'PETROL' },
  vehicleType: { type: String, enum: ['SEDAN', 'SUV', 'HATCHBACK', 'VAN', 'BUS', 'OTHER'], default: 'SEDAN' },
  manufacturingYear: { type: Number },
  color: { type: String },
  status: { 
    type: String, 
    enum: ['AVAILABLE','IN_SERVICE','MAINTENANCE','INACTIVE'], 
    default: 'AVAILABLE' 
  },
  documents: {
    registrationCertificate: documentSchema,
    insurance: documentSchema,
    permit: documentSchema,
    pollutionCertificate: documentSchema,
    // Can add more document types as needed
  },
  complianceStatus: {
    registrationCertificate: verificationSchema,
    insurance: verificationSchema,
    permit: verificationSchema,
    pollutionCertificate: verificationSchema,
    overall: {
      compliant: { type: Boolean, default: false },
      lastChecked: { type: Date, default: Date.now }
    }
  }
}, {
  timestamps: true
});

// Method to check if all required docs are valid
vehicleSchema.methods.checkCompliance = function() {
  const now = new Date();
  // Only require insurance
  const requiredDocs = ['insurance'];
  let compliant = true;
  
  // Initialize documents and complianceStatus if they don't exist
  if (!this.documents) {
    this.documents = {};
  }
  
  if (!this.complianceStatus) {
    this.complianceStatus = {
      overall: { compliant: false, lastChecked: now }
    };
  } else if (!this.complianceStatus.overall) {
    this.complianceStatus.overall = { compliant: false, lastChecked: now };
  }
  
  // Check if manually marked as compliant
  if (this.complianceStatus.overall && this.complianceStatus.overall.manuallyApproved) {
    compliant = true;
    this.complianceStatus.overall.compliant = true;
    this.complianceStatus.overall.lastChecked = now;
    return true;
  }
  
  // A document is compliant if:
  // 1. It exists (has URL)
  // 2. It's verified
  // 3. It's not expired
  for (const docType of requiredDocs) {
    // Initialize if needed
    if (!this.documents[docType]) {
      this.documents[docType] = {};
    }
    if (!this.complianceStatus[docType]) {
      this.complianceStatus[docType] = { verified: false };
    }
    
    const doc = this.documents[docType];
    const status = this.complianceStatus[docType];
    
    // Only check insurance
    if (!doc?.url || 
        !status?.verified || 
        (doc.expiresAt && doc.expiresAt < now)) {
      compliant = false;
      break;
    }
  }
  
  this.complianceStatus.overall.compliant = compliant;
  this.complianceStatus.overall.lastChecked = now;
  
  return compliant;
};

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
