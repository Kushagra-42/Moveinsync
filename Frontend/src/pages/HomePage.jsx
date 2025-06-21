// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../api/stats';
import useAuthStore from '../store/authStore';
import '../styles/dashboard.css';

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showTree, setShowTree] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);
  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      
      // Sanitize the data to ensure no objects are directly rendered
      // This is to prevent "Objects are not valid as React child" errors
      if (data && typeof data === 'object') {
        // Make sure counts is an object, not something that might be accidentally rendered
        if (!data.counts) data.counts = {};
        if (!data.vendor) data.vendor = { name: 'Vendor', level: 'Unknown' };
        if (!data.directSubvendors) data.directSubvendors = [];
      }
      
      setStats(data);
      setError('');
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };
  // Handle selecting a vendor from the tree
  const handleVendorSelect = (vendor) => {
    // Don't select if vendor is just a statistics object
    if (vendor && typeof vendor === 'object' && 
        !vendor.hasOwnProperty('total') && 
        !vendor.hasOwnProperty('byVendorLevel') && 
        vendor.name && vendor._id) {
      setSelectedVendor(vendor);
    }
    // Here you could also fetch stats for the selected vendor if needed
  };

  if (loading) {
    return <div className="loading-indicator">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={loadStats} className="refresh-button">Retry</button>
      </div>
    );
  }
  if (!stats || typeof stats !== 'object') {
    return <div className="empty-state">No statistics available</div>;
  }

  // Safely destructure with default values to prevent errors
  const { 
    vendor = { name: 'Dashboard', level: 'Unknown' }, 
    counts = {}, 
    directSubvendors = [] 
  } = stats;

  return (
    <div className="home-page">      <div className="dashboard-header">
        <div>
          <h2>Dashboard: {vendor && typeof vendor === 'object' ? vendor.name || 'Unknown' : 'Dashboard'}</h2>
          <p className="vendor-meta">
            {vendor && typeof vendor === 'object' ? vendor.level || '' : ''}
            {vendor && typeof vendor === 'object' && vendor.region ? ` • ${vendor.region}` : ''}
            {vendor && typeof vendor === 'object' && vendor.city ? ` • ${vendor.city}` : ''}
          </p>
        </div>
        <div className="dashboard-actions">
          <button onClick={() => setShowTree(!showTree)} className="toggle-tree-button">
            {showTree ? "Hide Tree" : "Show Tree"}
          </button>
          <button onClick={loadStats} className="refresh-button">
            ↻ Refresh
          </button>
        </div>
      </div>
        <div className="home-content">
        {showTree && (
          <div className="vendor-tree-section">
            <div className="section-title">
              <h3>Vendor Hierarchy</h3>
            </div>
            <div className="home-vendor-tree">
              <div className="vendor-tree-placeholder">
                <p>Tree view temporarily disabled.</p>
                <p>View vendor list in the Vendors section.</p>
              </div>
            </div>
          </div>
        )}

        <div className="stats-section">
          {selectedVendor ? (
            <div className="selected-vendor-info">
              <div className="section-title">
                <h3>Selected: {selectedVendor.name}</h3>
                <button onClick={() => setSelectedVendor(null)} className="back-button">
                  Back to My Stats
                </button>
              </div>
              <div className="vendor-details">
                <p><strong>Level:</strong> {selectedVendor.level}</p>
                {selectedVendor.region && <p><strong>Region:</strong> {selectedVendor.region}</p>}
                {selectedVendor.city && <p><strong>City:</strong> {selectedVendor.city}</p>}
                <p><strong>Email:</strong> {selectedVendor.email}</p>
              </div>
            </div>
          ) : (
            <div className="stats-grid">
              <div className="stats-card vendors-card">
                <h3>Vendors</h3>
                <div className="stats-number">{counts?.subvendors || 0}</div>
                <div className="stats-label">Total in Hierarchy</div>
                <div className="stats-breakdown">
                  <div className="breakdown-item">
                    <span className="label">Regional:</span>
                    <span className="value">{counts?.regionalVendors || 0}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="label">City:</span>
                    <span className="value">{counts?.cityVendors || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="stats-card drivers-card">
                <h3>Drivers</h3>
                <div className="stats-number">{counts?.drivers || 0}</div>
                <div className="stats-label">Total Drivers</div>
                <div className="stats-breakdown">
                  <div className="breakdown-item">
                    <span className="label">Active:</span>
                    <span className="value">{counts?.activeDrivers || 0}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="label">Inactive:</span>
                    <span className="value">{counts?.inactiveDrivers || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="stats-card vehicles-card">
                <h3>Fleet</h3>
                <div className="stats-number">{counts?.vehicles || 0}</div>
                <div className="stats-label">Total Vehicles</div>
                <div className="stats-breakdown">
                  <div className="breakdown-item">
                    <span className="label">Active:</span>
                    <span className="value">{counts?.activeVehicles || 0}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="label">Maintenance:</span>
                    <span className="value">{counts?.maintenanceVehicles || 0}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="label">Unassigned:</span>
                    <span className="value">{counts?.unassignedVehicles || 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="stats-card compliance-card">
                <h3>Compliance</h3>
                <div className="stats-number">{counts?.compliantVehicles || 0}/{counts?.vehicles || 0}</div>
                <div className="stats-label">Vehicles Compliant</div>
                <div className="stats-breakdown">
                  <div className="breakdown-item">
                    <span className="label">Documents Valid:</span>
                    <span className="value">{counts?.validDocuments || 0}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="label">Documents Expired:</span>
                    <span className="value">{counts?.expiredDocuments || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
