// import axios from 'axios';
// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
// });

import api from './apiClient';

export async function fetchDrivers(vendorId, status) {
  // vendorId not needed as backend uses req.user.vendorId
  const params = {};
  if (status) params.status = status;
  const res = await api.get('/drivers', { params });
  return res.data;
}
export async function updateDriverStatus(id, status) {
  const res = await api.patch(`/drivers/${id}/status`, { status });
  return res.data;
}
export async function createDriver(data) {
  const res = await api.post('/drivers', data);
  return res.data;
}
export async function updateDriver(id, data) {
  const res = await api.put(`/drivers/${id}`, data);
  return res.data;
}
export async function deleteDriver(id) {
  const res = await api.delete(`/drivers/${id}`);
  return res.data;
}
export async function assignVehicleToDriver(id, vehicleId, forceAssignment = true) {
  const res = await api.patch(`/drivers/${id}/assign-vehicle`, { vehicleId, forceAssignment });
  return res.data;
}
