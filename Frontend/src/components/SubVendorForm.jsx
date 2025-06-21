// src/components/SubVendorForm.jsx
import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { createSubVendor } from '../api/vendors';
import { HierarchyLevels, RoleToLevelMap } from '../utils/constants';
import '../styles/form.css';

export default function SubVendorForm({ parentVendorId, onCreated, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    level: '',
    region: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const user = useAuthStore(state => state.user);

  // Determine available levels based on parent vendor level
  const [availableLevels, setAvailableLevels] = useState([]);
  
  useEffect(() => {
    determineAvailableLevels();
  }, [parentVendorId, user]);
    const determineAvailableLevels = () => {
    let levels = [];
    
    const userLevel = user.vendorLevel || RoleToLevelMap[user.role] || 0;
    
    // Check permissions for creating vendors
    const canCreateVendors = user?.permissions?.canCreateSubVendor;
    
    if (canCreateVendors) {
      // Super vendor can create regional or city vendors
      if (userLevel === HierarchyLevels.SUPER_VENDOR) {
        levels = ['RegionalVendor', 'CityVendor'];
      } 
      // Regional vendor can create city vendors
      else if (userLevel === HierarchyLevels.REGIONAL_VENDOR) {
        levels = ['CityVendor'];
      }
    }
    
    // Check permissions for creating drivers
    const canCreateDrivers = user?.permissions?.canAddDriver;
    
    // Everyone (except drivers) with proper permissions can create drivers
    if (canCreateDrivers && userLevel < HierarchyLevels.DRIVER) {
      levels.push('Driver');
    }
    
    console.log('Available levels determined:', levels);
    console.log('User level:', userLevel);
    console.log('User permissions:', user?.permissions);
    
    setAvailableLevels(levels);
    
    // Set default level if only one option is available
    if (levels.length === 1) {
      setFormData(prev => ({ ...prev, level: levels[0] }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    if (!formData.name) {
      setError('Name is required');
      return;
    }
    
    if (!formData.email) {
      setError('Email is required');
      return;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return;
    }
    
    if (!formData.level) {
      setError('Type selection is required');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
      try {
      console.log('Creating sub-vendor with data:', { 
        ...formData,
        parentVendorId,
        password: '[MASKED]' 
      });
      
      // Make sure the password is sent as a string
      const dataToSend = {
        ...formData,
        password: formData.password.toString()
      };
      
      await createSubVendor(parentVendorId, dataToSend);
      console.log('Vendor created successfully');
      if (onCreated) onCreated();
    } catch (err) {
      console.error('Error creating vendor:', err);
      // Improved error handling to show more details
      const errorMessage = err.response?.data?.message || 'Error creating vendor';
      const errorDetails = err.response?.data?.details || err.message;
      setError(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Determine if the form should show fields for a driver or vendor
  const isDriverForm = formData.level === 'Driver';

  return (
    <div className="vendor-form-container">
      <form onSubmit={handleSubmit} className="vendor-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="name">{isDriverForm ? 'Driver Name' : 'Vendor Name'}</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="form-input"
            placeholder={isDriverForm ? "Enter driver's name" : "Enter vendor name"}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="form-input"
            placeholder="Email address for login"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Initial Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="form-input"
            placeholder="Set temporary password"
          />
        </div>
        
        {availableLevels.length > 0 && (
          <div className="form-group">
            <label htmlFor="level">Type</label>
            <select
              id="level"
              name="level"
              value={formData.level}
              onChange={handleChange}
              required
              className="form-select"
            >
              <option value="">-- Select Type --</option>
              {availableLevels.map(level => (
                <option key={level} value={level}>
                  {level === 'RegionalVendor' ? 'Regional Vendor' : 
                   level === 'CityVendor' ? 'City Vendor' : 
                   level === 'Driver' ? 'Driver' : level}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {!isDriverForm && formData.level === 'RegionalVendor' && (
          <div className="form-group">
            <label htmlFor="region">Region</label>
            <input
              type="text"
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. North, South, East, West"
              required
            />
          </div>
        )}
        
        {!isDriverForm && formData.level === 'CityVendor' && (
          <>
            <div className="form-group">
              <label htmlFor="region">Region</label>
              <input
                type="text"
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. North, South, East, West"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. Mumbai, Delhi, Bangalore"
                required
              />
            </div>
          </>
        )}
        
        {isDriverForm && (
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="form-input"
              placeholder="Driver's city"
            />
          </div>
        )}
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="primary-btn" 
            disabled={loading}
          >
            {loading ? 'Creating...' : isDriverForm ? 'Add Driver' : 'Add Vendor'}
          </button>
          
          <button
            type="button"
            className="secondary-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
