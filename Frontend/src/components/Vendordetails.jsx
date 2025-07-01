// src/components/VendorDetails.jsx
import { useState, useEffect } from 'react';
import { updateVendor, deleteVendor } from '../api/vendors';
import useAuthStore from '../store/authStore';
import { HierarchyLevels } from '../utils/constants';
import VendorPermissionsManager from './VendorPermissionsManager';
import '../styles/form.css';

export default function VendorDetails({ 
  node, 
  onUpdated, 
  canEdit = false, 
  canDelete = false, 
  canManagePermissions = false 
}) {
  const [vendorData, setVendorData] = useState({
    name: '',
    region: '',
    city: '',
  });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const user = useAuthStore(state => state.user);

  // Update form data when node changes
  useEffect(() => {
    if (node) {
      setVendorData({
        name: node.name || '',
        region: node.region || '',
        city: node.city || '',
        level: node.level || '',    // Preserve the level field
        levelValue: node.levelValue // Preserve the levelValue field
      });
      setEditing(false);
      setError('');
      setSuccess('');
      setIsDeleting(false);
    }
  }, [node]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVendorData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Updating vendor:', { id: node._id, data: vendorData });
      // Ensure levelValue is set correctly
      if (!vendorData.levelValue && vendorData.level) {
        // Add levelValue based on level if it's missing
        if (vendorData.level === 'SuperVendor') {
          vendorData.levelValue = 1;
        } else if (vendorData.level === 'RegionalVendor') {
          vendorData.levelValue = 2;
        } else if (vendorData.level === 'CityVendor') {
          vendorData.levelValue = 3;
        }
      }
      await updateVendor(node._id, vendorData);
      setEditing(false);
      setSuccess('Vendor updated successfully');
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Vendor update error:', err);
      
      if (err.response?.data?.requiredPermission) {
        // Handle permission-specific error
        setError(`You don't have the required permission: ${err.response.data.requiredPermission}`);
      } else if (err.response?.data?.details && err.response?.data?.details.includes('Validation')) {
        setError(`Validation error: ${err.response?.data?.details}`);
      } else {
        setError(err.response?.data?.message || 'Error updating vendor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isDeleting) {
      setIsDeleting(true);
      setError('');
      setSuccess('');
      return;
    }
    
    setIsLoading(true);
    try {
      await deleteVendor(node._id);
      setSuccess('Vendor deleted successfully');
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting vendor');
      setIsDeleting(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!node) {
    return <div className="no-vendor-selected">No vendor selected</div>;
  }

  return (
    <div className="vendor-details-container">
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          {error.includes('permission') && (
            <div className="permission-note">
              Note: You may need additional permissions to edit this vendor.
            </div>
          )}
        </div>
      )}
      {success && <div className="success-message">{success}</div>}
      
      <div className="vendor-tabs">
        <button 
          className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        {canManagePermissions && (
          <button 
            className={`tab-button ${activeTab === 'permissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('permissions')}
          >
            Permissions
          </button>
        )}
      </div>
      
      {activeTab === 'details' && (
        <div className="tab-content">
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              {editing ? (
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={vendorData.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              ) : (
                <div className="info-display">
                  {node.name}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="level">Level</label>
              <div className="info-display">
                {node.level}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="region">Region</label>
              {editing ? (
                <input
                  id="region"
                  type="text"
                  name="region"
                  value={vendorData.region}
                  onChange={handleChange}
                  className="form-input"
                />
              ) : (
                <div className="info-display">
                  {node.region || 'N/A'}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="city">City</label>
              {editing ? (
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={vendorData.city}
                  onChange={handleChange}
                  className="form-input"
                />
              ) : (
                <div className="info-display">
                  {node.city || 'N/A'}
                </div>
              )}
            </div>

            {editing ? (
              <div className="form-actions">
                <button type="submit" className="primary-btn" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setEditing(false);
                    setVendorData({
                      name: node.name || '',
                      region: node.region || '',
                      city: node.city || ''
                    });
                  }} 
                  className="secondary-btn"
                >
                  Cancel
                </button>
              </div>
            ) : canEdit ? (
              <button 
                type="button" 
                onClick={() => setEditing(true)} 
                className="primary-btn"
              >
                Edit Vendor
              </button>
            ) : null}
          </form>
          
          {canDelete && (
            <div className="delete-section">
              {!isDeleting ? (
                <button 
                  type="button" 
                  onClick={handleDelete} 
                  className="delete-btn"
                >
                  Delete Vendor
                </button>
              ) : (
                <div className="confirm-delete">
                  <p>Are you sure? This will reassign all children, drivers and vehicles to the parent vendor.</p>
                  <div className="confirm-actions">
                    <button 
                      type="button"
                      onClick={handleDelete} 
                      className="delete-confirm-btn" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Deleting...' : 'Yes, Delete'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsDeleting(false)} 
                      className="delete-cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}      {activeTab === 'permissions' && canManagePermissions && (
        <div className="tab-content">
          <div className="permissions-tab-content">
            {node && (
              <VendorPermissionsManager 
                vendorId={node._id} 
                onChange={() => {
                  setSuccess('Permissions updated successfully');
                  setTimeout(() => setSuccess(''), 3000);
                  if (onUpdated) onUpdated();
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
