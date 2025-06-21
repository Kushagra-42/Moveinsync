// import axios from 'axios';

// // Use import.meta.env.VITE_API_URL, fallback if undefined
// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
// });

import api from './apiClient';

export function setToken(token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
export function clearToken() {
  delete api.defaults.headers.common['Authorization'];
}

export async function login({ email, password }) {
  const res = await api.post('/auth/login', { email, password });
  // expect res.data = { token }
  return res.data;
}

export async function getProfile() {
  const res = await api.get('/auth/me');
  // expect res.data = { userId, role, vendorId, permissions }
  return res.data;
}

export default { login, getProfile, setToken, clearToken };
