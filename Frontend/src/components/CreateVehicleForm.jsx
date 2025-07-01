import { useState, useEffect } from 'react';
import { createVehicle } from '../api/vehicles';
import { fetchVendorsForDropdown } from '../api/vendors';
import useAuthStore from '../store/authStore';
import DocumentUploadForm from './DocumentUploadForm';
import '../styles/table.css';
import '../styles/forms.css';

export default function CreateVehicleForm({ onCreated, onCancel, includeDocuments = true }) {
  const user = useAuthStore(state => state.user);
  const [formData, setFormData] = useState({
    regNumber: '',
    model: '',
    capacity: 4,
    fuelType: 'PETROL',
    vehicleType: 'SEDAN',
    manufacturingYear: new Date().getFullYear(),
    color: '',
    city: '',
    region: '',
    vendorId: '' // For assigning to specific vendor in subtree
  });
  
  // Updated documents state to only include required documents: permit and insurance
  const [documentFiles, setDocumentFiles] = useState({
    insurance: null,
    permit: null
  });
  
  // Updated expiry dates for documents
  const [documentExpiryDates, setDocumentExpiryDates] = useState({
    insurance: '',
    permit: ''
  });
  
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDocUpload, setShowDocUpload] = useState(true);
  const [createdVehicleId, setCreatedVehicleId] = useState(null);

  // Load vendors for the dropdown when component mounts
  useEffect(() => {
    if (user && (user.role === 'SuperVendor' || user.role === 'RegionalVendor')) {
      loadVendors();
    }
  }, [user]);
  
  const loadVendors = async () => {
    try {
      setLoading(true);
      const vendorsList = await fetchVendorsForDropdown();
      setVendors(vendorsList);
    } catch (err) {
      console.error("Error loading vendors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if any document files have been selected
    const hasAnyDocument = Object.values(documentFiles).some(doc => doc !== null);
    setHasDocuments(hasAnyDocument);
  }, [documentFiles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle document file selection
  const handleDocumentChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setDocumentFiles(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  // Handle document expiry date change
  const handleExpiryDateChange = (e) => {
    const { name, value } = e.target;
    setDocumentExpiryDates(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.regNumber) newErrors.regNumber = 'Registration number is required';
    if (!formData.model) newErrors.model = 'Model is required';
    if (!formData.color) newErrors.color = 'Color is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.region) newErrors.region = 'Region is required';
    
    // Only validate documents if we're showing the document upload section
    if (showDocUpload) {
      if (documentFiles.permit && !documentExpiryDates.permit) {
        newErrors.permitExpiry = 'Permit expiry date is required';
      }
      if (documentFiles.insurance && !documentExpiryDates.insurance) {
        newErrors.insuranceExpiry = 'Insurance expiry date is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadDocuments = async (vehicleId) => {
    try {
      // Import document upload function
      const { uploadVehicleDocument } = await import('../api/documents');
      const documentUploadPromises = [];

      // Only upload permit and insurance if they exist
      if (documentFiles.permit) {
        documentUploadPromises.push(
          uploadVehicleDocument(
            vehicleId, 
            'permit', 
            documentFiles.permit,
            documentExpiryDates.permit
          )
        );
      }

      if (documentFiles.insurance) {
        documentUploadPromises.push(
          uploadVehicleDocument(
            vehicleId, 
            'insurance', 
            documentFiles.insurance,
            documentExpiryDates.insurance
          )
        );
      }

      if (documentUploadPromises.length > 0) {
        await Promise.all(documentUploadPromises);
        console.log('All documents uploaded successfully');
        return true;
      }
      return true; // No documents to upload
    } catch (error) {
      console.error('Error uploading documents:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      console.log('Creating vehicle with data:', formData);
      const vehicleResponse = await createVehicle(formData);
      console.log('Vehicle created successfully:', vehicleResponse);
      
      const vehicleId = vehicleResponse.id || vehicleResponse._id;
      setCreatedVehicleId(vehicleId);
      
      // If document upload is enabled and we have documents, upload them now
      if (showDocUpload && hasDocuments) {
        const documentsUploaded = await uploadDocuments(vehicleId);
        if (documentsUploaded) {
          setUploadSuccess(true);
          setTimeout(() => {
            onCreated();
          }, 2000);
        }
      } else {
        // No documents to upload, just complete the process
        setUploadSuccess(true);
        setTimeout(() => {
          onCreated();
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating vehicle:', error);
      setErrors({ submit: 'Failed to create vehicle. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleDocumentUpload = () => {
    setShowDocUpload(!showDocUpload);
    // If turning off document upload, clear any selected documents
    if (showDocUpload) {
      setDocumentFiles({
        insurance: null,
        permit: null
      });
      setDocumentExpiryDates({
        insurance: '',
        permit: ''
      });
    }
  };

  // Count how many documents are selected in the inline form
  const selectedDocumentCount = Object.values(documentFiles).filter(file => file !== null).length;

  // Decide whether to show document upload form or success message
  if (uploadSuccess) {
    return (
      <div className="success-container">
        <div className="success-message">
          <h3>Vehicle Created Successfully!</h3>
          <p>The vehicle has been added to the system.</p>
          {hasDocuments && <p>All documents have been uploaded.</p>}
          <button className="btn btn-primary" onClick={onCreated}>Close</button>
        </div>
      </div>
    );
  }

  // Show document upload form after vehicle creation if direct upload wasn't used
  if (showDocumentForm && createdVehicleId) {
    return (
      <div className="document-upload-step">
        <h3>Upload Required Documents</h3>
        <DocumentUploadForm 
          entityId={createdVehicleId} 
          entityType="vehicle" 
          onComplete={() => {
            setUploadSuccess(true);
            setTimeout(() => {
              onCreated();
            }, 2000);
          }}
        />
        <button className="btn btn-secondary" onClick={onCreated}>Skip</button>
      </div>
    );
  }
  
  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h4>Vehicle Details</h4>
          
          <div className="form-field">
            <label htmlFor="regNumber">Registration Number*</label>
            <input
              type="text"
              id="regNumber"
              name="regNumber"
              value={formData.regNumber}
              onChange={handleChange}
              placeholder="e.g., KA01AB1234"
              className={errors.regNumber ? 'input-error' : ''}
            />
            {errors.regNumber && <div className="error-text">{errors.regNumber}</div>}
          </div>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="model">Model*</label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="e.g., Toyota Innova"
                className={errors.model ? 'input-error' : ''}
              />
              {errors.model && <div className="error-text">{errors.model}</div>}
            </div>
            
            <div className="form-field">
              <label htmlFor="color">Color</label>
              <input
                type="text"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="e.g., White"
                className={errors.color ? 'input-error' : ''}
              />
              {errors.color && <div className="error-text">{errors.color}</div>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="capacity">Seating Capacity</label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="2"
                max="50"
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="fuelType">Fuel Type</label>
              <select 
                id="fuelType"
                name="fuelType" 
                value={formData.fuelType} 
                onChange={handleChange}
              >
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="ELECTRIC">Electric</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="vehicleType">Vehicle Type</label>
              <select 
                id="vehicleType"
                name="vehicleType" 
                value={formData.vehicleType} 
                onChange={handleChange}
              >
                <option value="SEDAN">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="HATCHBACK">Hatchback</option>
                <option value="VAN">Van</option>
                <option value="BUS">Bus</option>
              </select>
            </div>
            
            <div className="form-field">
              <label htmlFor="manufacturingYear">Manufacturing Year</label>
              <input
                type="number"
                id="manufacturingYear"
                name="manufacturingYear"
                value={formData.manufacturingYear}
                onChange={handleChange}
                min="2000"
                max={new Date().getFullYear()}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={errors.city ? 'input-error' : ''}
              />
              {errors.city && <div className="error-text">{errors.city}</div>}
            </div>
            
            <div className="form-field">
              <label htmlFor="region">Region</label>
              <input
                type="text"
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                className={errors.region ? 'input-error' : ''}
              />
              {errors.region && <div className="error-text">{errors.region}</div>}
            </div>
          </div>
          
          {user && user.role !== 'vendor' && (
            <div className="form-field">
              <label htmlFor="vendorId">Assign to Vendor</label>
              <select 
                id="vendorId"
                name="vendorId" 
                value={formData.vendorId} 
                onChange={handleChange}
              >
                <option value="">Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.id || vendor._id} value={vendor.id || vendor._id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Document Upload Toggle Section */}
        {includeDocuments && (
          <div className="form-section">
            <div className="section-header">
              <h4>Vehicle Documents</h4>
              <div className="toggle-section">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={showDocUpload}
                    onChange={toggleDocumentUpload}
                  />
                  <span>Include Documents</span>
                </label>
              </div>
            </div>
            
            {showDocUpload && (
              <div className="document-upload-inline">
                <p className="document-info">Upload required vehicle documents now to ensure compliance.</p>
                
                {/* Permit Document */}
                <div className="document-field">
                  <h5>Permit <span className="required-doc">Required</span></h5>
                  <div className="document-input-group">
                    <input
                      type="file"
                      id="permit"
                      name="permit"
                      onChange={handleDocumentChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="document-file-input"
                    />
                    <label htmlFor="permit" className="document-file-label">
                      {documentFiles.permit ? 
                        documentFiles.permit.name :
                        'Choose File'}
                    </label>
                    <div className="document-expiry">
                      <label>Expiry Date:</label>
                      <input
                        type="date"
                        name="permit"
                        value={documentExpiryDates.permit}
                        onChange={handleExpiryDateChange}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.permitExpiry && <div className="error-text">{errors.permitExpiry}</div>}
                    </div>
                  </div>
                </div>
                
                {/* Insurance Document */}
                <div className="document-field">
                  <h5>Insurance <span className="required-doc">Required</span></h5>
                  <div className="document-input-group">
                    <input
                      type="file"
                      id="insurance"
                      name="insurance"
                      onChange={handleDocumentChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="document-file-input"
                    />
                    <label htmlFor="insurance" className="document-file-label">
                      {documentFiles.insurance ? 
                        documentFiles.insurance.name :
                        'Choose File'}
                    </label>
                    <div className="document-expiry">
                      <label>Expiry Date:</label>
                      <input
                        type="date"
                        name="insurance"
                        value={documentExpiryDates.insurance}
                        onChange={handleExpiryDateChange}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.insuranceExpiry && <div className="error-text">{errors.insuranceExpiry}</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {errors.submit && <div className="error-text submit-error">{errors.submit}</div>}
        
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
}
