// src/api/stats.js
import api from './apiClient';

// Get dashboard statistics
export async function getDashboardStats() {
  const res = await api.get('/stats/dashboard');
  return res.data;
}
