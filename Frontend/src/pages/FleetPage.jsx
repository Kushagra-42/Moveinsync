import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import { fetchVehicles, updateVehicleStatus, assignDriverToVehicle, deleteVehicle, updateVehicle, createVehicle } from '../api/vehicles';
import '../styles/table.css';

export default function FleetPage() {
  const user = useAuthStore(state => state.user);
  const [vehicles, setVehicles] = useState([]);
  const [sortField, setSortField] = useState('regNumber');
  const [sortAsc, setSortAsc] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) loadVehicles();
  }, [user]);

  const loadVehicles = () => {
    fetchVehicles(user.vendorId)
      .then(data => setVehicles(data))
      .catch(err => console.error(err));
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedVehicles = [...vehicles].sort((a, b) => {
    let va = a[sortField], vb = b[sortField];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleStatusChange = async (vehicle) => {
    const nextStatus = prompt(`Enter new status for vehicle ${vehicle.regNumber} (AVAILABLE, IN_SERVICE, MAINTENANCE, INACTIVE):`, vehicle.status);
    if (!nextStatus) return;
    try {
      await updateVehicleStatus(vehicle._id, nextStatus);
      loadVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleAssign = async (vehicle) => {
    const driverId = prompt('Enter driver ID to assign (leave blank to unassign):', vehicle.assignedDriverId || '');
    if (driverId === null) return;
    try {
      await assignDriverToVehicle(vehicle._id, driverId || null);
      loadVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Error assigning driver');
    }
  };

  return (
    <div>
      <h2>Fleet Management</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th onClick={() => handleSort('regNumber')}>Reg. Number</th>
            <th onClick={() => handleSort('model')}>Model</th>
            <th onClick={() => handleSort('status')}>Status</th>
            <th onClick={() => handleSort('vendorId')}>Vendor</th>
            <th>Assigned Driver</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedVehicles.map(v => (
            <tr key={v._id}>
              <td>{v.regNumber}</td>
              <td>{v.model}</td>
              <td>
                <span className={`badge status-${v.status.toLowerCase()}`}>
                  {v.status}
                </span>
              </td>
              <td>{v.vendorName || v.vendorId}</td>
              <td>{v.assignedDriverName || v.assignedDriverId || '-'}</td>
              <td>
                <button onClick={() => handleStatusChange(v)}>Change Status</button>
                <button onClick={() => handleAssign(v)} style={{ marginLeft: '8px' }}>Assign</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
