import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import SubVendorForm from '../components/SubVendorForm';
import VendorDetails from '../components/Vendordetails';
import { fetchSubtree } from '../api/vendors';
import { Roles, HierarchyLevels, RoleToLevelMap, HierarchyLabels } from '../utils/constants';
import '../styles/vendors.css';

export default function VendorsPage() {
  const user = useAuthStore(state => state.user);
  const [selectedNode, setSelectedNode] = useState(null);
  const [treeKey, setTreeKey] = useState(0); // for forcing VendorTree reload
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [directChildren, setDirectChildren] = useState([]);
  const [displayMode, setDisplayMode] = useState('list'); // Default to 'list' view since tree view had issues
  const [selectedChildVendor, setSelectedChildVendor] = useState(null);
  const [grandchildren, setGrandchildren] = useState({});
  const [expandedVendors, setExpandedVendors] = useState({});
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user?.vendorId) {
      loadDirectChildren(user.vendorId);
    }
  }, [user?.vendorId]);
  const loadDirectChildren = async (vendorId) => {
    try {
      setIsLoading(true);
      setError('');
      console.log('Loading vendors for vendor ID:', vendorId);
      
      const response = await fetchSubtree(vendorId);
      console.log('Subtree response:', response);
      
      if (response.tree && Array.isArray(response.tree)) {
        // Filter to only direct children
        const children = response.tree.filter(
          vendor => vendor.parentVendorId === vendorId
        );
        console.log('Direct children found:', children.length);
        setDirectChildren(children);
      } else {
        console.warn('No tree data found in response');
        setDirectChildren([]);
      }
    } catch (err) {
      console.error("Error loading vendors:", err);
      setError('Failed to load vendors: ' + (err.response?.data?.message || err.message));
      setDirectChildren([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGrandchildren = async (childVendorId) => {
    if (grandchildren[childVendorId]) {
      // Toggle expanded state
      setExpandedVendors(prev => ({
        ...prev,
        [childVendorId]: !prev[childVendorId]
      }));
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetchSubtree(childVendorId);
      
      if (response.tree && Array.isArray(response.tree)) {
        // Filter to only direct children of this vendor
        const children = response.tree.filter(
          vendor => vendor.parentVendorId === childVendorId
        );
        
        setGrandchildren(prev => ({
          ...prev,
          [childVendorId]: children
        }));
        
        setExpandedVendors(prev => ({
          ...prev,
          [childVendorId]: true
        }));
      }
    } catch (err) {
      console.error("Error loading grandchildren:", err);
    } finally {
      setIsLoading(false);
    }
  };
  const handleUpdated = () => {
    setTreeKey(k => k + 1);
    setShowAddForm(false);
    setError('');
    setSuccessMessage('Vendor created successfully!');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
    
    if (user?.vendorId) {
      loadDirectChildren(user.vendorId);
    }
    
    // Reset grandchildren cache to force reload
    setGrandchildren({});
    
    // Reset selected vendor
    setSelectedChildVendor(null);
  };

  const userLevel = RoleToLevelMap[user.role];
  const canCreateSubVendor = user?.permissions?.canCreateSubVendor;
  const canEditSubVendor = user?.permissions?.canEditSubVendor;
  const canDeleteSubVendor = user?.permissions?.canDeleteSubVendor;
  const canEditPermissions = user?.permissions?.canEditPermissions;
  
  // Determine if user can create subvendors under selected node
  const canCreateUnderSelected = selectedNode && 
    canCreateSubVendor && 
    userLevel < HierarchyLevels.DRIVER && // Driver can't create subvendors
    (selectedNode.levelValue || RoleToLevelMap[selectedNode.level]) < HierarchyLevels.DRIVER; // Can't create under driver level
  return (
    <div className="vendors-page-container">
      <div className="vendors-page-header">
        <h2>Vendor Management</h2>
        <div className="vendors-actions">
          {canCreateSubVendor && !showAddForm && (
            <button 
              className="create-vendor-btn"
              onClick={() => {
                setShowAddForm(true);
                setSelectedChildVendor(null);
                setError('');
              }}
              disabled={showAddForm}
            >
              + Add New Vendor
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span> {error}
          <button className="dismiss-btn" onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {successMessage && (
        <div className="success-message">
          <span className="success-icon">✅</span> {successMessage}
          <button className="dismiss-btn" onClick={() => setSuccessMessage('')}>×</button>
        </div>
      )}<div className="vendors-content">
        {(
          <div className="vendors-list-container">
            <h3>Vendor Hierarchy</h3>
            {isLoading ? (
              <div className="loading-spinner">Loading vendors...</div>
            ) : directChildren.length > 0 ? (
              <div className="vendors-list">
                {directChildren.map(vendor => (
                  <div key={vendor._id} className="vendor-list-item">
                    <div 
                      className={`vendor-list-header ${selectedChildVendor?._id === vendor._id ? 'selected' : ''}`} 
                      onClick={() => setSelectedChildVendor(vendor)}
                    >
                      <div className="vendor-name">
                        <span className="vendor-icon">{vendor.level === 'RegionalVendor' ? '🌐' : vendor.level === 'CityVendor' ? '🏙️' : '📍'}</span>
                        <span className="vendor-name-text">{vendor.name}</span>
                        <span className="vendor-level-badge">{HierarchyLabels[vendor.level] || vendor.level}</span>
                        <span className="vendor-meta">
                          {vendor.region && `${vendor.region}`}
                          {vendor.city && vendor.region && ', '}
                          {vendor.city && `${vendor.city}`}
                        </span>
                      </div>
                      <div className="vendor-actions">
                        {vendor.level !== 'Driver' && (
                          <button 
                            className="expand-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadGrandchildren(vendor._id);
                            }}
                            title={expandedVendors[vendor._id] ? "Hide sub-vendors" : "Show sub-vendors"}
                          >
                            {expandedVendors[vendor._id] ? '▼' : '▶'}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {expandedVendors[vendor._id] && grandchildren[vendor._id] && (
                      <div className="grandchildren-list">
                        {grandchildren[vendor._id].length > 0 ? (
                          grandchildren[vendor._id].map(child => (
                            <div 
                              key={child._id} 
                              className={`grandchild-item ${selectedChildVendor?._id === child._id ? 'selected' : ''}`}
                              onClick={() => setSelectedChildVendor(child)}
                            >
                              <span className="vendor-icon">{child.level === 'CityVendor' ? '🏙️' : child.level === 'Driver' ? '🚗' : '📍'}</span>
                              <span className="vendor-name-text">{child.name}</span>
                              <span className="vendor-level-badge">{HierarchyLabels[child.level] || child.level}</span>
                              <span className="vendor-meta">
                                {child.city && `${child.city}`}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="no-grandchildren">No sub-vendors found</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-vendors-message">
                <p>No direct sub-vendors found</p>
              </div>
            )}
          </div>
        )}

        <div className="vendors-details-container">
          {showAddForm ? (
            <div className="vendor-form-section">
              <h3>Create New Vendor</h3>
              <SubVendorForm 
                parentVendorId={(selectedNode || selectedChildVendor)?._id || user.vendorId} 
                onCreated={handleUpdated} 
                onCancel={() => setShowAddForm(false)}
              />
            </div>          ) : (selectedChildVendor) ? (
            <div className="vendor-details-section">
              <div className="vendor-details-header">
                <h3>{selectedChildVendor.name}</h3>
                <span className="vendor-level-badge">
                  {selectedChildVendor.level || 
                   (selectedChildVendor.levelValue ? 
                    HierarchyLabels[selectedChildVendor.levelValue] || 
                    `Level ${selectedChildVendor.levelValue}` 
                    : 'Unknown')}
                </span>
              </div>
              
              <VendorDetails 
                node={selectedChildVendor}
                onUpdated={handleUpdated} 
                canEdit={canEditSubVendor}
                canDelete={canDeleteSubVendor}
                canManagePermissions={canEditPermissions}
              />
              
              {(selectedChildVendor && canCreateSubVendor && 
                (selectedChildVendor.levelValue || RoleToLevelMap[selectedChildVendor.level]) < HierarchyLevels.DRIVER) && (                <div className="vendor-action-buttons">
                  <button 
                    className="secondary-btn"
                    onClick={() => setShowAddForm(true)}
                  >
                    Create Sub-vendor under {selectedChildVendor.name}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-selection-message">
              <p>Select a vendor from the {displayMode === 'tree' ? 'hierarchy' : 'list'} to view details.</p>
              {canCreateSubVendor && (
                <button
                  className="secondary-btn"
                  onClick={() => setShowAddForm(true)}
                >
                  Create new vendor under your organization
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
