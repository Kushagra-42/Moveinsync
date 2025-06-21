// Frontend/src/components/DriverDetails.jsx
import { useState, useEffect } from 'react';
import { getDriverDocuments } from '../api/documents';
import { updateDriver } from '../api/drivers';
import DocumentUploadForm from './DocumentUploadForm';
import DocumentStatus from './DocumentStatus';
import useAuthStore from '../store/authStore';
import '../styles/document.css';

export default function DriverDetails({ driver }) {
  const [activeTab, setActiveTab] = useState('info');
  const [documents, setDocuments] = useState(null);
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (activeTab === 'documents' && driver?._id) {
      loadDocuments();
    }
  }, [activeTab, driver?._id]);

  const loadDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDriverDocuments(driver._id);
      setDocuments(data.documents);
      setComplianceStatus(data.complianceStatus);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading documents');
    } finally {
      setLoading(false);
    }
  };

  if (!driver) {
    return <div>Select a driver to view details</div>;
  }

  return (
    <div className="driver-details">
      <h3>Driver Details: {driver.name}</h3>
      
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
        
        <div className="tab-content">          {activeTab === 'info' && (
            <div>
              <p><strong>Name:</strong> {driver.name}</p>
              <p><strong>Contact:</strong> {driver.contact || driver.phone || driver.email || 'Not provided'}</p>
              <p><strong>Status:</strong> <span className={`badge status-${(driver.status || '').toLowerCase()}`}>{driver.status || 'Unknown'}</span></p>
              <p><strong>Assigned Vehicle:</strong> {
                driver.assignedVehicle 
                  ? driver.assignedVehicle.regNumber 
                  : driver.assignedVehicleReg || 'None'
              }</p>
              <p><strong>Vendor:</strong> {driver.vendorName || 'Unknown'}</p>
            </div>
          )}
          
          {activeTab === 'documents' && (
            <div>
              {loading ? (
                <p>Loading documents...</p>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : complianceStatus && documents ? (
                <>
                  <div className="compliance-summary">
                    <div className={`compliance-card ${complianceStatus.overall.compliant ? '' : 'danger'}`}>
                      <h3>Compliance Status</h3>
                      <p className="compliance-count">
                        {complianceStatus.overall.compliant ? 'Compliant ✓' : 'Non-Compliant ✗'}
                      </p>
                      <p>Last checked: {new Date(complianceStatus.overall.lastChecked).toLocaleDateString()}</p>
                    </div>
                  </div>                  <div className="document-section">
                    <h3>Driver Documents</h3>
                    
                    <div className="documents-grid">
                      {/* Driving License - Only required document */}
                      <div>
                        <DocumentStatus 
                          entityId={driver._id}
                          entityType="driver"
                          docType="drivingLicense"
                          docName="Driving License"
                          document={documents.drivingLicense}
                          complianceStatus={complianceStatus.drivingLicense}
                          canVerify={user.permissions?.canVerifyDocuments}
                          onVerified={loadDocuments}
                        />
                        
                        {user.permissions?.canAddDriver && (
                          <DocumentUploadForm 
                            entityId={driver._id}
                            entityType="driver"
                            docType="drivingLicense"
                            docName="Driving License"
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
                                // Update driver with forced compliance
                                const updatedDriver = {...driver};
                                
                                if (!updatedDriver.complianceStatus) {
                                  updatedDriver.complianceStatus = {};
                                }
                                if (!updatedDriver.complianceStatus.overall) {
                                  updatedDriver.complianceStatus.overall = {};
                                }
                                
                                updatedDriver.complianceStatus.overall.manuallyApproved = true;
                                updatedDriver.complianceStatus.overall.compliant = true;
                                
                                // Save via API
                                await updateDriver(driver._id, {
                                  complianceStatus: updatedDriver.complianceStatus
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
