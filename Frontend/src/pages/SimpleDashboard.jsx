// src/pages/SimpleDashboard.jsx
// A simplified version of the dashboard that doesn't rely on complex data structures
import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../api/stats';
import useAuthStore from '../store/authStore';
import '../styles/dashboard.css';

export default function SimpleDashboard() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorLevel, setVendorLevel] = useState('');
  const [vendorRegion, setVendorRegion] = useState('');
  const [vendorCity, setVendorCity] = useState('');  const [counts, setCounts] = useState({
    vendors: 0,
    drivers: 0,
    vehicles: 0,
    documents: 0
  });
  
  const [vehicleStatus, setVehicleStatus] = useState({
    available: 0,
    inService: 0,
    maintenance: 0,
    inactive: 0,
    nonCompliant: 0
  });
  
  const [driverStatus, setDriverStatus] = useState({
    available: 0,
    onDuty: 0,
    offDuty: 0,
    nonCompliant: 0
  });

  useEffect(() => {
    loadStats();
  }, []);
  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      console.log('Dashboard stats:', data);
      
      // Safely extract and set the data
      if (data && data.vendor) {
        setVendorName(data.vendor.name || 'Unknown');
        setVendorLevel(data.vendor.level || '');
        setVendorRegion(data.vendor.region || '');
        setVendorCity(data.vendor.city || '');
      }
        if (data && data.counts) {
        // Calculate compliant documents count (subtract non-compliant from total)
        const compliantVehicles = (data.counts.vehicles?.total || 0) - (data.counts.vehicles?.nonCompliant || 0);
        const compliantDrivers = (data.counts.drivers?.total || 0) - (data.counts.drivers?.nonCompliant || 0);
        const compliantDocs = compliantVehicles + compliantDrivers;
        
        setCounts({
          vendors: data.counts.vendors || 0,
          drivers: data.counts.drivers?.total || 0,
          vehicles: data.counts.vehicles?.total || 0,
          documents: compliantDocs // Estimated compliant documents
        });
        
        // Set vehicle status breakdown
        setVehicleStatus({
          available: data.counts.vehicles?.available || 0,
          inService: data.counts.vehicles?.inService || 0,
          maintenance: data.counts.vehicles?.maintenance || 0,
          inactive: data.counts.vehicles?.inactive || 0,
          nonCompliant: data.counts.vehicles?.nonCompliant || 0
        });
        
        // Set driver status breakdown
        setDriverStatus({
          available: data.counts.drivers?.available || 0,
          onDuty: data.counts.drivers?.onDuty || 0,
          offDuty: data.counts.drivers?.offDuty || 0,
          nonCompliant: data.counts.drivers?.nonCompliant || 0
        });
      }
      
      setError('');
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="home-page">
      <div className="dashboard-header">
        <div>
          <h2>Dashboard: {vendorName}</h2>
          <p className="vendor-meta">
            {vendorLevel}
            {vendorRegion && ` • ${vendorRegion}`}
            {vendorCity && ` • ${vendorCity}`}
          </p>
        </div>
        <div className="dashboard-actions">
          <button onClick={loadStats} className="refresh-button">
            ↻ Refresh
          </button>
        </div>
      </div>
        <div className="home-content">
        <div className="stats-section">          <div className="stats-section-header">
            <h3>Overview</h3>
          </div>
          <div className="stats-grid">
            <div className="stats-card vendors-card">
              <h3>Vendors</h3>
              <div className="stats-number">{counts.vendors || 0}</div>
              <div className="stats-label">Total in Hierarchy</div>
            </div>
            
            <div className="stats-card drivers-card">
              <h3>Drivers</h3>
              <div className="stats-number">{counts.drivers || 0}</div>
              <div className="stats-label">Total Drivers</div>
            </div>
            
            <div className="stats-card vehicles-card">
              <h3>Fleet</h3>
              <div className="stats-number">{counts.vehicles || 0}</div>
              <div className="stats-label">Total Vehicles</div>
            </div>
            
            <div className="stats-card compliance-card">
              <h3>Compliance</h3>
              <div className="stats-number">{counts.documents || 0}</div>
              <div className="stats-label">Compliant Documents</div>
            </div>
          </div>
          
          <div className="stats-section-header">
            <h3>Fleet Status</h3>
          </div>
          <div className="stats-grid">
            <div className="stats-card status-card">
              <h3>Available Vehicles</h3>
              <div className="stats-number available">{vehicleStatus.available || 0}</div>
              <div className="stats-label">Ready for service</div>
            </div>
            
            <div className="stats-card status-card">
              <h3>In Service</h3>
              <div className="stats-number in-service">{vehicleStatus.inService || 0}</div>
              <div className="stats-label">Currently on duty</div>
            </div>
            
            <div className="stats-card status-card">
              <h3>Maintenance</h3>
              <div className="stats-number maintenance">{vehicleStatus.maintenance || 0}</div>
              <div className="stats-label">Under repair</div>
            </div>
            
            <div className="stats-card status-card">
              <h3>Non-Compliant</h3>
              <div className="stats-number non-compliant">{vehicleStatus.nonCompliant || 0}</div>
              <div className="stats-label">Require document updates</div>
            </div>
          </div>
          
          <div className="stats-section-header">
            <h3>Driver Status</h3>
          </div>
          <div className="stats-grid">
            <div className="stats-card status-card">
              <h3>Available</h3>
              <div className="stats-number available">{driverStatus.available || 0}</div>
              <div className="stats-label">Ready for assignment</div>
            </div>
            
            <div className="stats-card status-card">
              <h3>On Duty</h3>
              <div className="stats-number on-duty">{driverStatus.onDuty || 0}</div>
              <div className="stats-label">Currently driving</div>
            </div>
            
            <div className="stats-card status-card">
              <h3>Off Duty</h3>
              <div className="stats-number off-duty">{driverStatus.offDuty || 0}</div>
              <div className="stats-label">Not on shift</div>
            </div>
            
            <div className="stats-card status-card">
              <h3>Non-Compliant</h3>
              <div className="stats-number non-compliant">{driverStatus.nonCompliant || 0}</div>
              <div className="stats-label">Need document verification</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
