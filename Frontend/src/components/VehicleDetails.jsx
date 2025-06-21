// Frontend/src/components/VehicleDetails.jsx
import { useState, useEffect } from 'react';
import { getVehicleDocuments } from '../api/documents';
import { updateVehicle } from '../api/vehicles';
import DocumentUploadForm from './DocumentUploadForm';
import DocumentStatus from './DocumentStatus';
import useAuthStore from '../store/authStore';
import '../styles/document.css';
import '../styles/forms.css';

export default function VehicleDetails({ vehicle, onClose }) {
  const [activeTab, setActiveTab] = useState('info');
  const [documents, setDocuments] = useState(null);
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (activeTab === 'documents' && vehicle?._id) {
      loadDocuments();
    }
  }, [activeTab, vehicle?._id]);

  const loadDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getVehicleDocuments(vehicle._id);
      setDocuments(data.documents);
      setComplianceStatus(data.complianceStatus);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading documents');
    } finally {
      setLoading(false);
    }
  };

  if (!vehicle) {
    return <div className="empty-details">Select a vehicle to view details</div>;
  }

  return (
    <div className="details-panel card">
      <div className="details-header">
        <h3>Vehicle Details</h3>
        <button 
          onClick={onClose} 
          className="close-detail-button" 
          title="Close details"
          aria-label="Close details"
        >
          ×
        </button>
      </div>
      
      <div className="detail-header-info">
        <div className="reg-number">{vehicle.regNumber}</div>
        <span className={`badge status-${vehicle.status.toLowerCase()}`}>{vehicle.status}</span>
      </div>
      
      <div className="tabs">
        <div className="tabs-nav">
          <button 
            className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Basic Info
          </button>
          <button 
            className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            Compliance & Documents
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'info' && (
            <div className="details-grid">
              <div className="details-section">
                <h4>Basic Information</h4>
                <div className="detail-item">
                  <span className="detail-label">Registration Number:</span>
                  <span className="detail-value">{vehicle.regNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Model:</span>
                  <span className="detail-value">{vehicle.model || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{vehicle.vehicleType || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Year:</span>
                  <span className="detail-value">{vehicle.manufacturingYear || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Color:</span>
                  <span className="detail-value">{vehicle.color || 'Not specified'}</span>
                </div>
              </div>
              
              <div className="details-section">
                <h4>Operation & Capacity</h4>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">
                    <span className={`badge status-${vehicle.status.toLowerCase()}`}>{vehicle.status}</span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Seating Capacity:</span>
                  <span className="detail-value">{vehicle.capacity || 4} seats</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Fuel Type:</span>
                  <span className="detail-value">{vehicle.fuelType || 'Not specified'}</span>
                </div>
              </div>
              
              <div className="details-section">
                <h4>Location & Assignment</h4>
                <div className="detail-item">
                  <span className="detail-label">Operating City:</span>
                  <span className="detail-value">{vehicle.city || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Region:</span>
                  <span className="detail-value">{vehicle.region || 'Not specified'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Assigned Driver:</span>
                  <span className="detail-value">{vehicle.assignedDriverName || 'None'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Vendor:</span>
                  <span className="detail-value">{vehicle.vendorName}</span>
                </div>
              </div>
              
              <div className="details-section">
                <h4>Compliance Status</h4>
                <div className="detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">
                    <span className={`badge ${vehicle.isCompliant ? 'status-available' : 'status-inactive'}`}>
                      {vehicle.isCompliant ? 'Compliant' : 'Non-Compliant'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'documents' && (
            <div>
              {loading ? (
                <p className="loading-indicator">Loading documents...</p>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : complianceStatus && documents ? (
                <>
                  <div className="compliance-summary">
                    <div className={`compliance-card ${complianceStatus.overall.compliant ? 'success' : 'danger'}`}>
                      <h3>Compliance Status</h3>
                      <p className="compliance-count">
                        {complianceStatus.overall.compliant ? 'Compliant ✓' : 'Non-Compliant ✗'}
                      </p>
                      <p>Last checked: {new Date(complianceStatus.overall.lastChecked).toLocaleDateString()}</p>
                    </div>
                  </div>                  <div className="document-section">
                    <h3>Vehicle Documents</h3>
                    
                    <div className="documents-grid">
                      {/* Insurance - Only required document */}
                      <div>
                        <DocumentStatus 
                          entityId={vehicle._id}
                          entityType="vehicle"
                          docType="insurance"
                          docName="Insurance"
                          document={documents.insurance}
                          complianceStatus={complianceStatus.insurance}
                          canVerify={user.permissions?.canVerifyDocuments}
                          onVerified={loadDocuments}
                        />
                        
                        {user.permissions?.canAddVehicle && (
                          <DocumentUploadForm 
                            entityId={vehicle._id}
                            entityType="vehicle"
                            docType="insurance"
                            docName="Insurance"
                            onUploaded={loadDocuments}
                          />
                        )}
                      </div>
                      
                      {/* Force Compliance Button */}
                      <div className="force-compliance">
                        {user.permissions?.canVerifyDocuments && (
                          <button 
                            className="btn-primary" 
                            onClick={async () => {
                              try {
                                // Update vehicle with forced compliance
                                const updatedVehicle = {...vehicle};
                                
                                if (!updatedVehicle.complianceStatus) {
                                  updatedVehicle.complianceStatus = {};
                                }
                                if (!updatedVehicle.complianceStatus.overall) {
                                  updatedVehicle.complianceStatus.overall = {};
                                }
                                
                                updatedVehicle.complianceStatus.overall.manuallyApproved = true;
                                updatedVehicle.complianceStatus.overall.compliant = true;
                                
                                // Save via API
                                await updateVehicle(vehicle._id, {
                                  complianceStatus: updatedVehicle.complianceStatus
                                });
                                
                                loadDocuments(); // Refresh
                              } catch (err) {
                                console.error("Error forcing compliance:", err);
                                setError("Failed to force compliance approval");
                              }
                            }}
                          >
                            Force Approve Compliance
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p>No document information available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
