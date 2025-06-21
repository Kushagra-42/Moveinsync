// Frontend/src/api/documents.js
import api from './apiClient';

// Driver document functions
export async function uploadDriverDocument(driverId, docType, file, expiresAt) {
  const formData = new FormData();
  formData.append('file', file);
  if (expiresAt) {
    formData.append('expiresAt', expiresAt);
  }

  const res = await api.post(`/drivers/${driverId}/documents/${docType}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
}

export async function getDriverDocuments(driverId) {
  const res = await api.get(`/drivers/${driverId}/documents`);
  return res.data;
}

export async function verifyDriverDocument(driverId, docType, verified, notes) {
  const res = await api.patch(`/drivers/${driverId}/documents/${docType}/verify`, {
    verified,
    notes
  });
  return res.data;
}

// Vehicle document functions
export async function uploadVehicleDocument(vehicleId, docType, file, expiresAt) {
  const formData = new FormData();
  formData.append('file', file);
  if (expiresAt) {
    formData.append('expiresAt', expiresAt);
  }

  const res = await api.post(`/vehicles/${vehicleId}/documents/${docType}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
}

export async function getVehicleDocuments(vehicleId) {
  const res = await api.get(`/vehicles/${vehicleId}/documents`);
  return res.data;
}

export async function verifyVehicleDocument(vehicleId, docType, verified, notes) {
  const res = await api.patch(`/vehicles/${vehicleId}/documents/${docType}/verify`, {
    verified,
    notes
  });
  return res.data;
}

// Compliance summary
export async function getComplianceSummary() {
  const res = await api.get(`/compliance/summary`);
  return res.data;
}

// Expiring documents
export async function getExpiringDocuments(days = 30) {
  const res = await api.get(`/compliance/expiring`, { params: { days } });
  return res.data;
}
