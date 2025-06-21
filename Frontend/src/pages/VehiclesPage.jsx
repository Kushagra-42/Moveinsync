// src/pages/VehiclesPage.jsx
import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import {
  fetchVehicles,
  updateVehicleStatus,
  assignDriverToVehicle,
  getVehicleStats
} from '../api/vehicles';
import { fetchDrivers } from '../api/drivers';
import CreateVehicleForm from '../components/CreateVehicleForm';
import VehicleDetails from '../components/VehicleDetails';
import '../styles/table.css';
import '../styles/forms.css';
import '../styles/modal.css';
import '../styles/assignments.css';

export default function VehiclesPage() {
  const user = useAuthStore(state => state.user);
  const [vehicles, setVehicles] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [assigningVehicleId, setAssigningVehicleId] = useState(null);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    if (user) {
      loadVehicles();
      loadVehicleStats();
    }
  }, [user, filterStatus, filterRegion, filterCity]);
  
  // Extract unique regions and cities from vehicles data
  useEffect(() => {
    if (vehicles.length > 0) {
      // Extract unique regions
      const uniqueRegions = [...new Set(vehicles
        .filter(v => v.region)
        .map(v => v.region))];
      
      setRegions(uniqueRegions);
      
      // Extract unique cities based on selected region
      const uniqueCities = [...new Set(vehicles
        .filter(v => v.city && (!filterRegion || v.region === filterRegion))
        .map(v => v.city))];
      
      setCities(uniqueCities);
      
      // Reset city filter if region changes and current city isn't in new region
      if (filterRegion && filterCity) {
        const cityInRegion = vehicles.some(v => 
          v.region === filterRegion && v.city === filterCity);
        
        if (!cityInRegion) {
          setFilterCity('');
        }
      }
    }
  }, [vehicles, filterRegion]);
  const loadVehicleStats = async () => {
    try {
      const vehicleStats = await getVehicleStats(user.vendorId);
      
      // Ensure vehicleStats is valid and contains numeric values
      if (vehicleStats && typeof vehicleStats === 'object') {
        // Convert any non-numeric values to 0
        const sanitizedStats = {
          total: typeof vehicleStats.total === 'number' ? vehicleStats.total : 0,
          active: typeof vehicleStats.active === 'number' ? vehicleStats.active : 0,
          maintenance: typeof vehicleStats.maintenance === 'number' ? vehicleStats.maintenance : 0,
          inactive: typeof vehicleStats.inactive === 'number' ? vehicleStats.inactive : 0,
          unassigned: typeof vehicleStats.unassigned === 'number' ? vehicleStats.unassigned : 0
        };
        setStats(sanitizedStats);
      } else {
        // Set default stats if response is invalid
        setStats({ total: 0, active: 0, maintenance: 0, inactive: 0, unassigned: 0 });
      }
    } catch (err) {
      console.error('Error loading vehicle stats:', err);
      // Set default stats on error
      setStats({ total: 0, active: 0, maintenance: 0, inactive: 0, unassigned: 0 });
    }
  };

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterRegion) params.region = filterRegion;
      if (filterCity) params.city = filterCity;
      
      const fetchedVehicles = await fetchVehicles(params);
      
      // Filter vehicles based on user's vendor subtree permissions
      // The backend API should already filter results based on permissions
      setVehicles(fetchedVehicles);
      
      // Update selected vehicle if it exists in the new list
      if (selectedVehicle) {
        const updatedVehicle = fetchedVehicles.find(v => v._id === selectedVehicle._id);
        if (updatedVehicle) {
          setSelectedVehicle(updatedVehicle);
        } else {
          setSelectedVehicle(null);
        }
      }
      
      setError('');
    } catch (err) {
      console.error('Error loading vehicles:', err);
      setError(err.response?.data?.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };
  
  // Add the missing clearFilters function
  const clearFilters = () => {
    setFilterStatus('');
    setFilterRegion('');
    setFilterCity('');
  };
    const loadAvailableDrivers = async () => {
    try {
      setError('');
      console.log('Loading available drivers...');
      const drivers = await fetchDrivers(undefined, 'AVAILABLE');
      console.log(`${drivers.length} available drivers found:`, drivers);
      setAvailableDrivers(drivers);
    } catch (err) {
      console.error('Error loading available drivers:', err);
      setError('Error loading available drivers. Please try again.');
    }
  };
  const handleChangeStatus = async (vehicleId, newStatus) => {
    try {
      console.log(`Updating vehicle ${vehicleId} status to ${newStatus}`);
      const result = await updateVehicleStatus(vehicleId, newStatus);
      console.log("Status update result:", result);
      loadVehicles();
      setError('');
    } catch (err) {
      console.error("Error updating vehicle status:", err);
      setError(err.response?.data?.message || 'Error updating vehicle status');
    }
  };

  const handleAssignDriver = async (vehicleId, driverId) => {
    if (!driverId) {
      setError('Please select a driver');
      return;
    }
    
    try {
      await assignDriverToVehicle(vehicleId, driverId);
      setAssigningVehicleId(null);
      loadVehicles();
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error assigning driver');
    }
  };
  const startAssign = (vehicleId) => {
    setAssigningVehicleId(vehicleId);
    loadAvailableDrivers();
  };
    const confirmAssign = async (vehicleId, driverId) => {
    try {
      setError('');
      console.log(`Assigning driver ${driverId || 'none'} to vehicle ${vehicleId} with force=true`);
      await assignDriverToVehicle(vehicleId, driverId || null, true);
      setAssigningVehicleId(null);
      loadVehicles();
      loadVehicleStats();
    } catch (err) {
      console.error('Error assigning driver:', err);
      setError(err.response?.data?.message || 'Error assigning driver');
    }
  };
  
  const cancelAssign = () => {
    setAssigningVehicleId(null);
  };
  const handleStatusChange = (vehicle) => {
    // Create a modal-like dialog using confirm instead of prompt for better UX
    const statusOptions = ['AVAILABLE', 'IN_SERVICE', 'MAINTENANCE', 'INACTIVE'];
    const currentStatus = vehicle.status || 'AVAILABLE';
    
    console.log("Changing status for vehicle:", vehicle);
    
    // Show dialog with status options
    const message = `Current status: ${currentStatus}\n\nSelect a new status for vehicle ${vehicle.regNumber}:\n` +
      `1. AVAILABLE (can be assigned to drivers)\n` +
      `2. IN_SERVICE (currently assigned to a driver)\n` +
      `3. MAINTENANCE (temporarily unavailable)\n` +
      `4. INACTIVE (out of service)\n`;
    
    if (confirm(message)) {
      // Using another prompt for selection since confirm only gives yes/no
      const selection = prompt(
        `Enter number (1-4) or status name for ${vehicle.regNumber}:\n` +
        `1. AVAILABLE\n2. IN_SERVICE\n3. MAINTENANCE\n4. INACTIVE`,
        currentStatus
      );
      
      if (!selection) return; // User cancelled
      
      let newStatus;
      // Convert number selection to status
      if (selection === '1') newStatus = 'AVAILABLE';
      else if (selection === '2') newStatus = 'IN_SERVICE';
      else if (selection === '3') newStatus = 'MAINTENANCE';
      else if (selection === '4') newStatus = 'INACTIVE';
      else newStatus = selection.toUpperCase(); // Direct status input
      
      if (statusOptions.includes(newStatus)) {
        handleChangeStatus(vehicle._id, newStatus);
      } else {
        alert('Invalid status. Please use AVAILABLE, IN_SERVICE, MAINTENANCE, or INACTIVE');
      }
    }
  };
  
  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
  };
  
  const closeVehicleDetails = () => {
    setSelectedVehicle(null);
  };

  const handleVehicleCreated = () => {
    setShowAddVehicleModal(false);
    loadVehicles();
    loadVehicleStats();
  };
  // Calculate status counts based on standardized status values
  const statusCounts = {
    active: vehicles.filter(v => v.status === 'IN_SERVICE' || v.status === 'AVAILABLE').length,
    maintenance: vehicles.filter(v => v.status === 'MAINTENANCE').length,
    inactive: vehicles.filter(v => v.status === 'INACTIVE').length,
    unassigned: vehicles.filter(v => v.status === 'AVAILABLE' && !v.assignedDriverId).length
  };

  return (
    <div className="vehicles-page">
      <div className="page-header">
        <h1>Fleet Management</h1>
        {user.permissions?.canAddVehicle && (
          <button 
            className="add-button" 
            onClick={() => setShowAddVehicleModal(true)}
          >
            + Add Vehicle
          </button>
        )}
      </div>      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-title">Total Vehicles</div>
          <div className="stat-value">
            {typeof stats?.total === 'number' ? stats.total : vehicles.length}
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-title">Active</div>
          <div className="stat-value">
            {typeof stats?.active === 'number' ? stats.active : statusCounts.active}
          </div>
        </div>
        <div className="stat-card maintenance">
          <div className="stat-title">In Maintenance</div>
          <div className="stat-value">
            {typeof stats?.maintenance === 'number' ? stats.maintenance : statusCounts.maintenance}
          </div>
        </div>
        <div className="stat-card inactive">
          <div className="stat-title">Inactive</div>
          <div className="stat-value">
            {typeof stats?.inactive === 'number' ? stats.inactive : statusCounts.inactive}
          </div>
        </div>
        <div className="stat-card unassigned">
          <div className="stat-title">Unassigned</div>
          <div className="stat-value">
            {typeof stats?.unassigned === 'number' ? stats.unassigned : statusCounts.unassigned}
          </div>
        </div>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
          >                <option value="">All</option>
                <option value="AVAILABLE">Available</option>
                <option value="IN_SERVICE">In Service</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        
        {regions.length > 0 && (
          <div className="filter-group">
            <label>Region:</label>
            <select 
              value={filterRegion} 
              onChange={e => {
                setFilterRegion(e.target.value);
                setFilterCity('');
              }}
            >
              <option value="">All</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        )}
        
        {cities.length > 0 && (
          <div className="filter-group">
            <label>City:</label>
            <select 
              value={filterCity} 
              onChange={e => setFilterCity(e.target.value)}
              disabled={!filterRegion}
            >
              <option value="">All</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Add Vehicle Modal */}
      {showAddVehicleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New Vehicle</h3>
              <button 
                className="close-button" 
                onClick={() => setShowAddVehicleModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <CreateVehicleForm 
                onCreated={() => {
                  loadVehicles();
                  setShowAddVehicleModal(false);
                }} 
                onCancel={() => setShowAddVehicleModal(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="page-layout">
        <div className="list-section">
          <div className="action-header">
            <h3>Vehicles</h3>
            {user?.permissions?.canAddVehicle && (
              <button 
                className="primary-button add-button"
                onClick={() => setShowAddVehicleModal(true)}
              >
                <span>+</span> Add New Vehicle
              </button>
            )}
          </div>
          
          <div className="filters-bar">
            <div className="filter-group">
              <label>Status:</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All</option>
                <option value="AVAILABLE">Available</option>
                <option value="IN_SERVICE">In Service</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Region:</label>
              <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
                <option value="">All Regions</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>City:</label>
              <select 
                value={filterCity} 
                onChange={e => setFilterCity(e.target.value)}
                disabled={!filterRegion}
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            <button onClick={clearFilters} className="secondary-button">
              Clear
            </button>
            
            <button onClick={loadVehicles} className="refresh-button">
              ↻ Refresh
            </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          {loading ? (
            <div className="loading-indicator">Loading vehicles...</div>
          ) : vehicles.length === 0 ? (
            <div className="empty-state">
              <p>No vehicles found with current filters</p>
              {user?.permissions?.canAddVehicle ? (
                <button 
                  className="primary-button" 
                  onClick={() => setShowAddVehicleModal(true)}
                >
                  Add New Vehicle
                </button>
              ) : (
                <p>Contact your vendor administrator to add vehicles.</p>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Reg. Number</th>
                    <th>Model / Type</th>
                    <th>Capacity / Fuel</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Assigned Driver</th>
                    <th>Compliance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map(vehicle => (
                    <tr 
                      key={vehicle._id}
                      className={selectedVehicle && selectedVehicle._id === vehicle._id ? 'selected-row' : ''}
                      onClick={() => handleSelectVehicle(vehicle)}
                    >
                      <td>{vehicle.regNumber}</td>
                      <td>
                        <div>{vehicle.model || '-'}</div>
                        <small className="text-muted">{vehicle.vehicleType || 'SEDAN'}</small>
                      </td>
                      <td>
                        <div>{vehicle.capacity || 4} seats</div>
                        <small className="text-muted">{vehicle.fuelType || 'PETROL'}</small>
                      </td>
                      <td>
                        <div>{vehicle.city || '-'}</div>
                        {vehicle.region && (
                          <small className="text-muted">{vehicle.region}</small>
                        )}
                      </td>
                      <td>
                        <span className={`badge status-${vehicle.status.toLowerCase()}`}>
                          {vehicle.status}
                        </span>
                      </td>                      <td>
                        <div>{vehicle.assignedDriverName || 'None'}</div>
                      </td>
                      <td>
                        <span className={`badge ${vehicle.isCompliant ? 'status-available' : 'status-inactive'}`}>
                          {vehicle.isCompliant ? 'Compliant' : 'Non-Compliant'}
                        </span>
                      </td>                      <td>
                        <div className="action-buttons">
                          {/* Use canUpdateStatus OR canUpdateVehicle OR canManageFleet permission to allow status change */}
                          {(user?.permissions?.canUpdateVehicleStatus || 
                            user?.permissions?.canEditVehicle || 
                            user?.permissions?.canManageFleet) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(vehicle);
                              }}
                              className="action-btn status"
                              title="Change status"
                            >
                              ⚙️
                            </button>
                          )}
                          
                          {/* Use canAssignDrivers OR canEditVehicle OR canManageFleet permission to allow driver assignment */}
                          {(user?.permissions?.canAssignDrivers || 
                           user?.permissions?.canEditVehicle || 
                           user?.permissions?.canManageFleet) && vehicle.status === 'AVAILABLE' && !vehicle.assignedDriverId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startAssign(vehicle._id);
                              }}
                              className="action-btn assign"
                              title="Assign driver"
                            >
                              👤
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
          {selectedVehicle && (
          <div className="detail-section">
            <VehicleDetails
              vehicle={selectedVehicle}
              onClose={closeVehicleDetails}
            />
          </div>
        )}
      </div>
      
      {/* Driver Assignment Modal */}
      {assigningVehicleId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Assign Driver to Vehicle</h3>
              <button 
                className="close-button" 
                onClick={cancelAssign}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {availableDrivers.length === 0 ? (
                <div className="info-message">
                  <p>No available drivers found. Drivers must be in 'AVAILABLE' status to be assigned.</p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="driver-select">Select a driver to assign:</label>
                    <select 
                      id="driver-select" 
                      className="form-select"
                    >
                      <option value="">-- Select driver --</option>
                      {availableDrivers.map(driver => (
                        <option key={driver._id} value={driver._id}>
                          {driver.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              
              <div className="modal-actions">
                <button
                  onClick={() => confirmAssign(
                    assigningVehicleId,
                    document.getElementById('driver-select')?.value
                  )}
                  className="primary-button"
                  disabled={availableDrivers.length === 0}
                >
                  Assign Driver
                </button>
                
                {vehicles.find(v => v._id === assigningVehicleId)?.assignedDriverId && (
                  <button
                    onClick={() => confirmAssign(assigningVehicleId, null)}
                    className="secondary-button"
                  >
                    Unassign Current Driver
                  </button>
                )}
                
                <button
                  onClick={cancelAssign}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
