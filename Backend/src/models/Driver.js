// backend/src/models/Driver.js
import mongoose from 'mongoose';

// Document schema for reuse
const documentSchema = {
  url: { type: String },
  uploadedAt: { type: Date },
  expiresAt: { type: Date },
  licenseNumber: { type: String } // Added for driving licenses
};

// Verification status schema for reuse
const verificationSchema = {
  verified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  notes: { type: String }
};

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  assignedVehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
  status: { 
    type: String, 
    enum: ['AVAILABLE','ON_DUTY','MAINTENANCE','INACTIVE'], 
    default: 'AVAILABLE' 
  },
  documents: {
    drivingLicense: documentSchema,
    permit: documentSchema,
    pollutionCertificate: documentSchema,
    // Can add more document types as needed
  },
  complianceStatus: {
    drivingLicense: verificationSchema,
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
driverSchema.methods.checkCompliance = function() {
  const now = new Date();
  // Only require driving license
  const requiredDocs = ['drivingLicense'];
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
    
    // Only check driving license
    if (!doc.url || 
        !status.verified || 
        (doc.expiresAt && doc.expiresAt < now)) {
      compliant = false;
      break;
    }
  }
  
  this.complianceStatus.overall.compliant = compliant;
  this.complianceStatus.overall.lastChecked = now;
  
  return compliant;
};

const Driver = mongoose.model('Driver', driverSchema);
export default Driver;
