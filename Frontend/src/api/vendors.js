// src/api/vendors.js
import api from './apiClient';

export async function fetchSubtree(vendorId) {
  try {
    const res = await api.get(`/vendors/${vendorId}/subtree`);
    
    if (!res.data || !res.data.tree) {
      throw new Error('Invalid response format');
    }
    
    return res.data;
  } catch (err) {
    console.error('Error fetching vendor subtree:', err);
    throw err;
  }
}

export async function createSubVendor(parentVendorId, data) {
  try {
    console.log('API: Creating sub-vendor for', parentVendorId, 'with data:', {
      ...data,
      password: data.password ? '[MASKED]' : '[MISSING]'
    });
    
    const res = await api.post(`/vendors/${parentVendorId}/sub-vendors`, data);
    console.log('API: Sub-vendor creation successful, response:', res.data);
    return res.data;
  } catch (err) {
    console.error('API: Error creating sub-vendor:', err);
    console.error('API: Error response:', err.response?.data);
    throw err;
  }
}

export async function updateVendor(vendorId, data) {
  try {
    const res = await api.put(`/vendors/${vendorId}`, data);
    return res.data;
  } catch (err) {
    console.error('Error updating vendor:', err);
    throw err;
  }
}

export async function deleteVendor(vendorId) {
  try {
    const res = await api.delete(`/vendors/${vendorId}`);
    return res.data;
  } catch (err) {
    console.error('Error deleting vendor:', err);
    throw err;
  }
}

export async function getVendorPermissions(vendorId) {
  try {
    const res = await api.get(`/vendors/${vendorId}/permissions`);
    return res.data;
  } catch (err) {
    console.error('Error fetching vendor permissions:', err);
    throw err;
  }
}

export async function updateVendorPermissions(vendorId, permissions) {
  try {
    const res = await api.put(`/vendors/${vendorId}/permissions`, { permissions });
    return res.data;
  } catch (err) {
    console.error('Error updating vendor permissions:', err);
    throw err;
  }
}

export async function getVendorById(vendorId) {
  try {
    const res = await api.get(`/vendors/${vendorId}`);
    return res.data;
  } catch (err) {
    console.error('Error fetching vendor:', err);
    throw err;
  }
}

export async function fetchVendorsForDropdown(options = {}) {
  try {
    const { level, region, city } = options;
    const params = {};
    
    if (level) params.level = level;
    if (region) params.region = region;
    if (city) params.city = city;
    
    const res = await api.get('/vendors/list', { params });
    return res.data;
  } catch (err) {
    console.error('Error fetching vendors for dropdown:', err);
    throw err;
  }
}

export async function fetchDirectChildren(vendorId) {
  try {
    const res = await api.get(`/vendors/${vendorId}/children`);
    return res.data;
  } catch (err) {
    console.error('Error fetching direct children:', err);
    throw err;
  }
}

export async function fetchVendorStats(vendorId) {
  try {
    const res = await api.get(`/vendors/${vendorId}/stats`);
    return res.data;
  } catch (err) {
    console.error('Error fetching vendor stats:', err);
    throw err;
  }
}

export async function fetchVendorsUnderUser() {
  try {
    const res = await api.get('/vendors/under-user');
    return res.data;
  } catch (err) {
    console.error('Error fetching vendors under user:', err);
    throw err;
  }
}
