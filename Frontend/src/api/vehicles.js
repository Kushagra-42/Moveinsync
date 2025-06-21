// import axios from 'axios';
// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
// });

import api from './apiClient';

// Fetch vehicles under a vendor subtree
// List vehicles, optionally filtering by status, region, and city
export async function fetchVehicles(params = {}) {
  const res = await api.get('/vehicles', { params });
  return res.data;
}

export async function createVehicle(data) {
  // data: { regNumber, model, capacity, fuelType, vehicleType, manufacturingYear, color, city, region, vendorId }
  const res = await api.post('/vehicles', data);
  return res.data;
}

export async function updateVehicle(id, data) {
  const res = await api.put(`/vehicles/${id}`, data);
  return res.data;
}

export async function deleteVehicle(id) {
  const res = await api.delete(`/vehicles/${id}`);
  return res.data;
}

export async function updateVehicleStatus(id, status) {
  const res = await api.patch(`/vehicles/${id}/status`, { status });
  return res.data;
}

export async function assignDriverToVehicle(id, driverId, forceAssignment = true) {
  const res = await api.patch(`/vehicles/${id}/assign-driver`, { driverId, forceAssignment });
  return res.data;
}

// Fetch vehicles for a specific vendor
export async function fetchVehiclesByVendor(vendorId, params = {}) {
  const queryParams = { ...params, vendorId };
  const res = await api.get('/vehicles', { params: queryParams });
  return res.data;
}

// Get vehicle details by ID
export async function getVehicleById(id) {
  const res = await api.get(`/vehicles/${id}`);
  return res.data;
}

// Get vehicle statistics for a vendor
export async function getVehicleStats(vendorId) {
  const res = await api.get(`/vehicles/stats/${vendorId || 'current'}`);
  return res.data;
}
