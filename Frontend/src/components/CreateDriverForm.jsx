import { useState, useEffect } from 'react';
import { createDriver } from '../api/drivers';
import useAuthStore from '../store/authStore';
import { fetchVendorsUnderUser } from '../api/vendors';
import FileUpload from './FileUpload';
import '../styles/upload.css';

export default function CreateDriverForm({ onCreated, onCancel }) {  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    vendorId: '',
    licenseNumber: '',
    licenseExpiry: '',
    licenseUrl: ''
  });
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const user = useAuthStore(state => state.user);
  
  useEffect(() => {
    if (user?.permissions?.canViewVendors) {
      loadVendors();
    }
  }, [user]);

  const loadVendors = async () => {
    try {
      const vendorsList = await fetchVendorsUnderUser();
      setVendors(vendorsList);
      
      // If user has only one vendor in subtree, select it by default
      if (vendorsList.length === 1) {
        setFormData(prev => ({ ...prev, vendorId: vendorsList[0]._id }));
      }
    } catch (err) {
      console.error('Error loading vendors', err);
      setError('Could not load vendors for assignment');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    try {      // Only include vendorId if it's specified and not the current user's vendor
      const payload = { 
        name: formData.name, 
        contact: formData.contact,
        licenseNumber: formData.licenseNumber || undefined,
        licenseExpiry: formData.licenseExpiry || undefined,
        licenseUrl: formData.licenseUrl || undefined
      };
      
      // Only include vendorId if it's different from the user's default vendor
      if (formData.vendorId && formData.vendorId !== user.vendorId) {
        payload.vendorId = formData.vendorId;
      }
      
      await createDriver(payload);      setFormData({
        name: '',
        contact: '',
        vendorId: '',
        licenseNumber: '',
        licenseExpiry: '',
        licenseUrl: ''
      });
      
      if (onCreated) onCreated();
    } catch (err) {
      console.error('Error creating driver:', err);
      setError(err.response?.data?.message || 'Error creating driver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="driver-form">
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Driver Name*:</label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full name"
            required
          />
        </div>
          <div className="form-group">
          <label htmlFor="contact">Contact Information:</label>
          <input
            id="contact"
            name="contact"
            type="text"
            value={formData.contact}
            onChange={handleChange}
            placeholder="Phone number or email"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="licenseNumber">Driver's License Number:</label>
          <input
            id="licenseNumber"
            name="licenseNumber"
            type="text"
            value={formData.licenseNumber}
            onChange={handleChange}
            placeholder="License number"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="licenseExpiry">License Expiry Date:</label>
          <input
            id="licenseExpiry"
            name="licenseExpiry"
            type="date"
            value={formData.licenseExpiry}
            onChange={handleChange}
          />
        </div>
          <div className="form-group">
          <label htmlFor="licenseUrl">License Document:</label>
          <FileUpload 
            onUpload={(url) => {
              setFormData(prev => ({ ...prev, licenseUrl: url }));
            }}
          />
          {formData.licenseUrl && (
            <div className="uploaded-file-info">
              <span>Document uploaded successfully! ✓</span>
              <small className="text-muted">URL: {formData.licenseUrl}</small>
            </div>
          )}
        </div>
        
        {user?.permissions?.canManageVendors && vendors.length > 1 && (
          <div className="form-group">
            <label htmlFor="vendorId">Assign to Vendor:</label>
            <select
              id="vendorId"
              name="vendorId"
              value={formData.vendorId}
              onChange={handleChange}
            >
              <option value="">Select Vendor</option>
              {vendors.map(vendor => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Driver'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
