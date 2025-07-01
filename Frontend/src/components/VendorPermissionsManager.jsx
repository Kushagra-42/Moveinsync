// src/components/VendorPermissionsManager.jsx
import React, { useState, useEffect } from 'react';
import { getVendorById, updateVendorPermissions } from '../api/vendors';
import useAuthStore from '../store/authStore';
import '../styles/permissions.css';

export default function VendorPermissionsManager({ vendorId, onChange }) {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [vendorDetails, setVendorDetails] = useState(null);
  const user = useAuthStore(state => state.user);

  // Check if current user can edit permissions
  const canEdit = user?.permissions?.canEditPermissions || false;
  
  // Check if current user can modify permissions for sub-vendors
  const canModifySubVendorPermissions = user?.permissions?.canEditPermissions && 
    user?.permissions?.canCreateSubVendor;

  useEffect(() => {
    if (vendorId) {
      loadVendorDetails();
    }
  }, [vendorId]);

  const loadVendorDetails = async () => {
    try {
      setLoading(true);
      setError('');      
      const data = await getVendorById(vendorId);
      setVendorDetails(data);
      setPermissions(data.permissions || {});
    } catch (err) {
      console.error('Error loading vendor details:', err);
      setError(err.response?.data?.message || 'Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (key) => {
    if (!canEdit) return;
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePermissions = async () => {
    try {
      setSaveLoading(true);
      setError('');
      setError('');      
      await updateVendorPermissions(vendorId, permissions);
      if (onChange) onChange();
    } catch (err) {
      console.error('Error updating permissions:', err);
      
      if (err.response?.data?.requiredPermission) {
        setError(`Permission denied: You need ${err.response.data.requiredPermission} permission`);
      } else if (err.response?.status === 403) {
        setError('Permission denied: You do not have the necessary permissions to modify this vendor');
      } else if (err.response?.data?.details) {
        setError(`${err.response.data.message}: ${err.response.data.details}`);
      } else {
        setError(err.response?.data?.message || 'Failed to update permissions');
      }
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return <div className="permissions-loader">Loading vendor details...</div>;
  }

  if (error) {
    return (
      <div className="permissions-error">
        <p>{error}</p>
        <button onClick={loadVendorDetails}>Retry</button>
      </div>
    );
  }

  if (!vendorDetails) {
    return <div className="empty-state">No vendor details available</div>;
  }

  const permissionGroups = {
    'Vendor Management': [
      'canCreateSubVendor',
      'canDeleteSubVendor',
      'canEditSubVendor',
      'canEditPermissions'
    ],
    'Driver Management': [
      'canAddDriver',
      'canEditDriver',
      'canRemoveDriver',
      'canAssignDrivers'
    ],
    'Vehicle Management': [
      'canAddVehicle',
      'canEditVehicle',
      'canRemoveVehicle',
      'canAssignVehicles',
      'canManageFleet',
      'canViewFleet'
    ],
    'Document Management': [
      'canVerifyDocuments',
      'canUploadDocuments'
    ],
    'Analytics & Reporting': [
      'canViewAnalytics'
    ]
  };

  return (
    <div className="vendor-permissions-manager">
      <h3>Permissions for {vendorDetails.name}</h3>
      
      <div className="permissions-grid">
        {Object.entries(permissionGroups).map(([group, keys]) => (
          <div key={group} className="permission-group">
            <h4>{group}</h4>
            <div className="permission-items">
              {keys.map(key => (
                <div key={key} className="permission-item">
                  <label className={!canEdit ? 'disabled' : ''}>
                    <input
                      type="checkbox"
                      checked={permissions[key] || false}
                      onChange={() => handlePermissionChange(key)}
                      disabled={!canEdit}
                    />
                    <span className="permission-label">{formatPermissionLabel(key)}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {canEdit && (
        <div className="permissions-actions">
          <button 
            onClick={handleSavePermissions} 
            disabled={saveLoading}
            className="btn-save"
          >
            {saveLoading ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      )}

      {canModifySubVendorPermissions && (
        <div className="permission-note">
          <p>
            <strong>Note:</strong> As a vendor with permission management rights, 
            you can also control whether sub-vendors can modify permissions of their own sub-vendors.
          </p>
        </div>
      )}
    </div>
  );
}

function formatPermissionLabel(key) {
  // Remove 'can' prefix and convert camelCase to words with spaces
  const withoutPrefix = key.replace(/^can/, '');
  return withoutPrefix
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}
