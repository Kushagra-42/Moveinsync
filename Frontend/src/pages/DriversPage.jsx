// src/pages/DriversPage.jsx
import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import {
  fetchDrivers,
  updateDriverStatus,
  assignVehicleToDriver,
} from '../api/drivers';
import { fetchVehicles } from '../api/vehicles';
import CreateDriverForm from '../components/CreateDriverForm';
import DriverDetails from '../components/DriverDetails';
import '../styles/table.css';
import '../styles/drivers.css';
import '../styles/modal.css';
import '../styles/assignments.css';

export default function DriversPage() {
  const user = useAuthStore(state => state.user);
  const [drivers, setDrivers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [assigningDriverId, setAssigningDriverId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    vendorFilter: ''
  });

  useEffect(() => {
    if (user) {
      loadDrivers();
      if (user.permissions?.canAssignDrivers) {
        loadAvailableVehicles();
      }
    }
  }, [user, filters.status]);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      setError('');
      const statusParam = filters.status || undefined;
      const response = await fetchDrivers(undefined, statusParam);
      
      if (!Array.isArray(response)) {
        console.error('Invalid response format:', response);
        setError('Unexpected data format received from server');
        setLoading(false);
        return;
      }
      
      // Apply search filter locally
      const filteredDrivers = filters.search 
        ? response.filter(d => {
            const searchTerm = filters.search.toLowerCase();
            return (
              (d.name && d.name.toLowerCase().includes(searchTerm)) || 
              (d.phone && d.phone.toLowerCase().includes(searchTerm)) ||
              (d.email && d.email.toLowerCase().includes(searchTerm)) ||
              (d.contact && d.contact.toLowerCase().includes(searchTerm))
            );
          })
        : response;
      
      console.log('Drivers loaded:', filteredDrivers.length);
      setDrivers(filteredDrivers);
      
      // Update selected driver if it exists in the new list
      if (selectedDriver) {
        const updatedDriver = filteredDrivers.find(d => d._id === selectedDriver._id);
        if (updatedDriver) {
          setSelectedDriver(updatedDriver);
        } else {
          setSelectedDriver(null);
        }
      }
    } catch (err) {
      console.error('Error loading drivers:', err);
      setError(err.response?.data?.message || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };
  const loadAvailableVehicles = async () => {
    try {
      setError('');
      // Use the correct parameter format for fetchVehicles
      const vehicles = await fetchVehicles({ status: 'AVAILABLE' });
      console.log('Available vehicles loaded:', vehicles);
      setAvailableVehicles(vehicles);
    } catch (err) {
      console.error('Error loading vehicles:', err);
      setError(err.response?.data?.message || 'Error loading available vehicles');
    }
  };
  
  const handleStatusChange = async (driver, newStatus) => {
    try {
      setError('');
      setSuccess('');
      await updateDriverStatus(driver._id, newStatus);
      setSuccess(`Driver status updated to ${newStatus}`);
      loadDrivers();
    } catch (err) {
      console.error('Error updating driver status:', err);
      setError(err.response?.data?.message || 'Error updating driver status');
    }
  };

  const startAssign = async (driverId) => {
    setAssigningDriverId(driverId);
    await loadAvailableVehicles();
  };
  const confirmAssign = async (driverId, vehicleId) => {
    try {
      console.log(`Assigning vehicle ${vehicleId || 'none'} to driver ${driverId} with force=true`);
      await assignVehicleToDriver(driverId, vehicleId || null, true);
      setAssigningDriverId(null);
      setSuccess('Vehicle assignment updated successfully');
      loadDrivers();
    } catch (err) {
      console.error('Error assigning vehicle:', err);
      setError(err.response?.data?.message || 'Error assigning vehicle');
    }
  };

  const cancelAssign = () => {
    setAssigningDriverId(null);
  };
  
  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
  };

  const handleSearchChange = (e) => {
    const searchValue = e.target.value;
    setFilters(prev => ({ ...prev, search: searchValue }));
  };

  const handleDriverCreated = (newDriver) => {
    loadDrivers();
    setShowCreateForm(false);
    setSuccess('Driver created successfully');
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'AVAILABLE': return 'status-available';
      case 'ON_DUTY': return 'status-on-duty';
      case 'MAINTENANCE': return 'status-maintenance';
      case 'INACTIVE': return 'status-inactive';
      default: return '';
    }
  };

  return (
    <div className="drivers-page-container">
      <div className="drivers-page-header">
        <h2>Driver Management</h2>
        {user.permissions?.canAddDriver && (
          <button 
            className="create-driver-btn"
            onClick={() => setShowCreateForm(true)}
          >
            + Add New Driver
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="driver-search">Search:</label>
          <input
            id="driver-search"
            type="text"
            className="search-input"
            placeholder="Search by name, phone, email..."
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select 
            id="status-filter"
            className="status-select"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_DUTY">On Duty</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        
        <button 
          className="refresh-btn"
          onClick={loadDrivers}
        >
          ↻ Refresh
        </button>
      </div>
      
      <div className="full-width-table">
        {loading ? (
          <div className="loading-spinner"></div>
        ) : drivers.length === 0 ? (
          <div className="empty-state">
            <p>No drivers found</p>
            {filters.status || filters.search ? (
              <button 
                onClick={() => {
                  setFilters({ status: '', search: '', vendorFilter: '' });
                }}
                className="secondary-btn"
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="drivers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Assigned Vehicle</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(driver => (
                  <tr 
                    key={driver._id} 
                    className={`driver-row`}
                  >
                    <td className="driver-name">{driver.name || 'Unknown'}</td>
                    <td>
                      {driver.phone && <div>{driver.phone}</div>}
                      {driver.email && <div className="email">{driver.email}</div>}
                      {driver.contact && !driver.phone && !driver.email && <div>{driver.contact}</div>}
                      {!driver.phone && !driver.email && !driver.contact && <div>No contact info</div>}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(driver.status || 'INACTIVE')}`}>
                        {driver.status || 'INACTIVE'}
                      </span>
                    </td>
                    <td>{driver.assignedVehicle ? driver.assignedVehicle.regNumber : 'None'}</td>
                    <td>
                      <div className="action-buttons">
                        {user.permissions?.canEditDriver && (
                          <button 
                            className="action-btn edit"
                            onClick={() => handleSelectDriver(driver)}
                            title="View/Edit driver"
                          >
                            ✎
                          </button>
                        )}
                        {user.permissions?.canAssignDrivers && (
                          <button 
                            className="action-btn assign"
                            onClick={() => startAssign(driver._id)}
                            title="Assign vehicle"
                          >
                            🚗
                          </button>
                        )}                        {user.permissions?.canEditDriver && (
                          <button 
                            className="action-btn status"
                            onClick={() => {
                              const driver = drivers.find(d => d._id === driver._id);
                              const newStatus = window.confirm(`Change status for ${driver.name}?\n\nCurrent: ${driver.status || 'INACTIVE'}\n\nChoose:\n- AVAILABLE (can be assigned)\n- ON_DUTY (currently assigned)\n- MAINTENANCE (temporarily unavailable)\n- INACTIVE (not in service)\n\nClick OK to change or Cancel to keep current status.`);
                              
                              if (newStatus) {
                                const statusSelect = document.createElement('select');
                                statusSelect.innerHTML = `
                                  <option value="AVAILABLE" ${driver.status === 'AVAILABLE' ? 'selected' : ''}>AVAILABLE</option>
                                  <option value="ON_DUTY" ${driver.status === 'ON_DUTY' ? 'selected' : ''}>ON_DUTY</option>
                                  <option value="MAINTENANCE" ${driver.status === 'MAINTENANCE' ? 'selected' : ''}>MAINTENANCE</option>
                                  <option value="INACTIVE" ${driver.status === 'INACTIVE' ? 'selected' : ''}>INACTIVE</option>
                                `;
                                document.body.appendChild(statusSelect);
                                
                                const newStatusValue = prompt(
                                  `Enter new status for driver ${driver.name} (AVAILABLE, ON_DUTY, MAINTENANCE, INACTIVE):`, 
                                  driver.status || 'INACTIVE'
                                );
                                document.body.removeChild(statusSelect);
                                
                                if (newStatusValue && ['AVAILABLE', 'ON_DUTY', 'MAINTENANCE', 'INACTIVE'].includes(newStatusValue.toUpperCase())) {
                                  handleStatusChange(driver, newStatusValue.toUpperCase());
                                } else if (newStatusValue) {
                                  alert('Invalid status. Please use AVAILABLE, ON_DUTY, MAINTENANCE, or INACTIVE');
                                }
                              }
                            }}
                            title="Change status"
                          >
                            ⚙️
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
      
      {/* Create Driver Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Driver</h3>
            <CreateDriverForm 
              onCreated={handleDriverCreated} 
              onCancel={() => setShowCreateForm(false)}
            />
            <button 
              className="close-button" 
              onClick={() => setShowCreateForm(false)}>
              &times;
            </button>
          </div>
        </div>
      )}
      
      {/* Driver Details Modal */}
      {selectedDriver && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Driver Details: {selectedDriver.name}</h3>
            <DriverDetails 
              driver={selectedDriver} 
              onUpdated={loadDrivers}
              canEdit={user.permissions?.canEditDriver} 
            />
            <button 
              className="close-button" 
              onClick={() => setSelectedDriver(null)}>
              &times;
            </button>
          </div>
        </div>
      )}
        {/* Vehicle Assignment Modal */}
      {assigningDriverId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Assign Vehicle</h3>
            <div className="modal-body">
              {availableVehicles.length === 0 ? (
                <div className="info-message">
                  <p>No available vehicles found. Vehicles must be in 'AVAILABLE' status to be assigned.</p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="vehicle-select">Select a vehicle to assign:</label>
                    <select id="vehicle-select" className="form-select">
                      <option value="">-- Select vehicle --</option>
                      {availableVehicles.map(v => (
                        <option key={v._id} value={v._id}>
                          {v.regNumber} - {v.make || ''} {v.model || ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              
              <div className="modal-actions">
                <button
                  onClick={() => confirmAssign(
                    assigningDriverId,
                    document.getElementById('vehicle-select')?.value
                  )}
                  className="primary-button"
                  disabled={availableVehicles.length === 0}
                >
                  Assign Vehicle
                </button>
                {drivers.find(d => d._id === assigningDriverId)?.assignedVehicle && (
                  <button
                    onClick={() => confirmAssign(assigningDriverId, null)}
                    className="secondary-button"
                  >
                    Unassign Current Vehicle
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
            <button className="close-button" onClick={cancelAssign}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}
