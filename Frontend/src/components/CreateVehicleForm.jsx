import { useState, useEffect } from 'react';
import { createVehicle } from '../api/vehicles';
import { fetchVendorsForDropdown } from '../api/vendors';
import useAuthStore from '../store/authStore';
import '../styles/table.css';
import '../styles/forms.css';

export default function CreateVehicleForm({ onCreated, onCancel }) {
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
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  
  // Load vendors for the dropdown when component mounts
  useEffect(() => {
    if (user && (user.role === 'SuperVendor' || user.role === 'RegionalVendor')) {
      loadVendors();
    }
  }, [user]);
  
  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      const vendorsList = await fetchVendorsForDropdown();
      setVendors(vendorsList);
    } catch (err) {
      console.error("Error loading vendors:", err);
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.regNumber) {
      setError('Registration number is required');
      return;
    }

    if (!formData.model) {
      setError('Vehicle model is required');
      return;
    }

    setLoading(true);
    try {
      // Only include vendorId if selected
      const submitData = { ...formData };
      if (!submitData.vendorId) {
        delete submitData.vendorId;
      }
      
      await createVehicle(submitData);
      
      setFormData({
        regNumber: '',
        model: '',
        capacity: 4,
        fuelType: 'PETROL',
        vehicleType: 'SEDAN',
        manufacturingYear: new Date().getFullYear(),
        color: '',
        city: '',
        region: '',
        vendorId: ''
      });
      
      setSuccess('Vehicle created successfully!');
      if (onCreated) onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      {success ? (
        <div className="success-container">
          <div className="success-message">{success}</div>
          <button 
            onClick={onCancel || (() => {})}
            className="primary-button"
          >
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="regNumber">Registration Number*</label>
              <input
                type="text"
                id="regNumber"
                name="regNumber"
                value={formData.regNumber}
                onChange={handleChange}
                placeholder="e.g., KA01AB1234"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="model">Model*</label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="e.g., Toyota Innova"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="capacity">Seating Capacity</label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                min="1"
                max="50"
                value={formData.capacity}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
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
            <div className="form-group">
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
                <option value="OTHER">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="manufacturingYear">Manufacturing Year</label>
              <input
                type="number"
                id="manufacturingYear"
                name="manufacturingYear"
                min="1990"
                max={new Date().getFullYear()}
                value={formData.manufacturingYear}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="color">Color</label>
              <input
                type="text"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="e.g., White"
              />
            </div>
          </div>
          
          <div className="form-section">
            <h4>Operating Location</h4>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="region">Region</label>
                <input
                  type="text"
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  placeholder="e.g., Uttar Pradesh"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="city">Operating City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g., Lucknow"
                />
              </div>
            </div>
          </div>
          
          {/* Vendor assignment section - only for SuperVendor or RegionalVendor */}
          {(user?.role === 'SuperVendor' || user?.role === 'RegionalVendor') && (
            <div className="form-section">
              <h4>Vendor Assignment</h4>
              <div className="form-group">
                <label htmlFor="vendorId">Assign to Vendor</label>
                <select
                  id="vendorId"
                  name="vendorId"
                  value={formData.vendorId}
                  onChange={handleChange}
                  disabled={loadingVendors}
                >
                  <option value="">-- Select Vendor (Optional) --</option>
                  {vendors.map(vendor => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.name} ({vendor.level})
                    </option>
                  ))}
                </select>
                <small className="form-text text-muted">
                  If no vendor is selected, the vehicle will be assigned to your vendor account.
                </small>
              </div>
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="secondary-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="primary-button">
              {loading ? 'Creating...' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
