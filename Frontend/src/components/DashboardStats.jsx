// src/components/DashboardStats.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../api/stats';
import VendorTree from './VendorTree';
import '../styles/dashboard.css';

export default function DashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
      setError('');
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-indicator">Loading dashboard statistics...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={loadStats} className="refresh-button">Retry</button>
      </div>
    );
  }

  if (!stats) {
    return <div className="empty-state">No statistics available</div>;
  }

  const { vendor, counts, directSubvendors } = stats;

  return (
    <div className="dashboard-stats-container">
      <div className="dashboard-header">
        <div>
          <h2>Dashboard: {vendor.name}</h2>
          <p className="vendor-meta">
            {vendor.level}
            {vendor.region && ` • ${vendor.region}`}
            {vendor.city && ` • ${vendor.city}`}
          </p>
        </div>
        <button onClick={loadStats} className="refresh-button">
          ↻ Refresh
        </button>
      </div>

      <div className="stats-grid">
        <div className="stats-card vendors-card">
          <h3>Vendors</h3>
          <div className="stat-value">{counts.vendors}</div>
          <div className="stat-label">Total vendors in network</div>
          <Link to="/vendors" className="stat-link">View all vendors</Link>
        </div>

        <div className="stats-card vehicles-card">
          <h3>Vehicles</h3>
          <div className="stat-value">{counts.vehicles.total}</div>
          <div className="stat-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">Available:</span>
              <span className="breakdown-value">{counts.vehicles.available}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">In Service:</span>
              <span className="breakdown-value">{counts.vehicles.inService}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Maintenance:</span>
              <span className="breakdown-value">{counts.vehicles.maintenance}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Non-Compliant:</span>
              <span className="breakdown-value">{counts.vehicles.nonCompliant}</span>
            </div>
          </div>
          <Link to="/vehicles" className="stat-link">View all vehicles</Link>
        </div>

        <div className="stats-card drivers-card">
          <h3>Drivers</h3>
          <div className="stat-value">{counts.drivers.total}</div>
          <div className="stat-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">Available:</span>
              <span className="breakdown-value">{counts.drivers.available}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">On Duty:</span>
              <span className="breakdown-value">{counts.drivers.onDuty}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Off Duty:</span>
              <span className="breakdown-value">{counts.drivers.offDuty}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Non-Compliant:</span>
              <span className="breakdown-value">{counts.drivers.nonCompliant}</span>
            </div>
          </div>
          <Link to="/drivers" className="stat-link">View all drivers</Link>
        </div>

        <div className="stats-card compliance-card">
          <h3>Compliance</h3>
          <div className="compliance-stats">
            <div className="compliance-item">
              <span className="compliance-number">{counts.vehicles.nonCompliant}</span>
              <span className="compliance-label">Non-compliant vehicles</span>
            </div>
            <div className="compliance-item">
              <span className="compliance-number">{counts.drivers.nonCompliant}</span>
              <span className="compliance-label">Non-compliant drivers</span>
            </div>
          </div>
          <Link to="/compliance" className="stat-link">View compliance dashboard</Link>
        </div>
      </div>

      <div className="vendor-hierarchy-section">
        <h3>Vendor Structure</h3>
        <div className="vendor-hierarchy-container">
          <div className="vendor-tree-container">
            <VendorTree onSelect={setSelectedVendor} />
          </div>
          
          {selectedVendor && (
            <div className="vendor-detail">
              <h4>{selectedVendor.name}</h4>
              <p>Level: {selectedVendor.level}</p>
              {selectedVendor.region && <p>Region: {selectedVendor.region}</p>}
              {selectedVendor.city && <p>City: {selectedVendor.city}</p>}
              {/* Add more details as needed */}
            </div>
          )}
        </div>
      </div>

      {directSubvendors && directSubvendors.length > 0 && (
        <div className="direct-subvendors-section">
          <h3>Direct Sub-Vendors</h3>
          <div className="subvendors-grid">
            {directSubvendors.map(subvendor => (
              <div key={subvendor._id} className="subvendor-card">
                <h4>{subvendor.name}</h4>
                <p>Level: {subvendor.level}</p>
                {subvendor.region && <p>Region: {subvendor.region}</p>}
                {subvendor.city && <p>City: {subvendor.city}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
