// src/api/fleet.js
// import axios from 'axios';
// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
// });

import api from './apiClient';

// Example: fetch vehicles in subtree
export async function fetchVehicles(vendorId) {
  const res = await api.get(`/vehicles?vendorId=${vendorId}`);
  return res.data;
}

// Example: update vehicle status
export async function updateVehicleStatus(vehicleId, status) {
  const res = await api.patch(`/vehicles/${vehicleId}/status`, { status });
  return res.data;
}

// etc.
