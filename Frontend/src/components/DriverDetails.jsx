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
      {/* Title removed from here as it's already shown in the modal */}
      
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
              
              <div className="status-field">
                <strong>Status: </strong>
                {user.permissions?.canEditDriver ? (
                  <select 
                    className={`status-select select-${(driver.status || 'inactive').toLowerCase()}`}
                    value={driver.status || 'INACTIVE'}
                    onChange={async (e) => {
                      try {
                        setLoading(true);
                        const newStatus = e.target.value;
                        await updateDriver(driver._id, { status: newStatus });
                        // Force refresh driver data by reloading document info
                        await loadDocuments();
                        setError('');
                      } catch (err) {
                        setError(err.response?.data?.message || 'Cannot change status. Driver may not be compliant.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="ON_DUTY">ON DUTY</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                ) : (
                  <span className={`badge status-${(driver.status || '').toLowerCase()}`}>{driver.status || 'Unknown'}</span>
                )}
              </div>
              
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
                    
                    <div className="document-controls">
                      {/* Add Document Button removed as it was not useful */}
                      
                      {user.permissions?.canVerifyDocuments && documents.drivingLicense?.url && !complianceStatus.drivingLicense?.verified && (
                        <button 
                          className="verify-document-btn"
                          onClick={async () => {
                            try {
                              setLoading(true);
                              // Directly verify the document
                              await updateDriver(driver._id, {
                                complianceStatus: {
                                  ...driver.complianceStatus,
                                  drivingLicense: {
                                    verified: true,
                                    verifiedAt: new Date(),
                                    verifiedBy: user._id,
                                    notes: 'Verified from driver details'
                                  }
                                }
                              });
                              loadDocuments();
                              setError('');
                            } catch (err) {
                              setError('Failed to verify document');
                              console.error(err);
                            } finally {
                              setLoading(false);
                            }
                          }}
                        >
                          ✓ Verify Document
                        </button>
                      )}
                    </div>
                    
                    <div className="documents-grid">
                      {/* Driving License - Only required document */}
                      <div>
                        {/* Show upload form first if no document exists */}
                        {(!documents.drivingLicense || !documents.drivingLicense.url) && user.permissions?.canAddDriver && (
                          <div className="missing-document-card">
                            <div className="missing-document-header">
                              <h4>Missing Required Document</h4>
                              <div className="status-badge status-missing">Required</div>
                            </div>
                            <p className="missing-document-message">This driver doesn't have a driving license uploaded yet.</p>
                            <div className="document-upload-section">
                              <h4>Upload Driving License</h4>
                              <DocumentUploadForm 
                                entityId={driver._id}
                                entityType="driver"
                                docType="drivingLicense"
                                docName="Driving License"
                                onUploaded={loadDocuments}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Show document status if document exists */}
                        {documents.drivingLicense && documents.drivingLicense.url && (
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
                        )}
                        
                        {/* Upload form for updating existing document */}
                        <div id="license-upload-form" className={(documents.drivingLicense && documents.drivingLicense.url) ? "document-actions upload-form-container" : "document-actions upload-form-container visible"}>
                          {user.permissions?.canAddDriver && documents.drivingLicense && documents.drivingLicense.url && (
                            <div className="document-upload-section">
                              <h4>Update Driving License</h4>
                              <DocumentUploadForm 
                                entityId={driver._id}
                                entityType="driver"
                                docType="drivingLicense"
                                docName="Driving License"
                                onUploaded={loadDocuments}
                              />
                              <p className="document-help-text">Upload a new version of the driving license if needed.</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Force Compliance Button */}
                      <div className="force-compliance">
                        {user.permissions?.canVerifyDocuments && (
                          <button 
                            className="btn-primary" 
                            onClick={async () => {
                              try {
                                setLoading(true);
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
                                
                                // Save via API with status update to AVAILABLE
                                await updateDriver(driver._id, {
                                  complianceStatus: updatedDriver.complianceStatus,
                                  status: 'AVAILABLE' // Set to available when forcing compliance
                                });
                                
                                loadDocuments(); // Refresh
                                setError(''); // Clear any errors
                              } catch (err) {
                                console.error("Error forcing compliance:", err);
                                setError("Failed to force compliance approval");
                              } finally {
                                setLoading(false);
                              }
                            }}
                          >
                            Force Approve Compliance & Set Available
                          </button>
                        )}
                        
                        {/* Remove Forced Compliance Button - Only visible if compliance is currently forced */}
                        {user.permissions?.canVerifyDocuments && complianceStatus.overall.manuallyApproved && (
                          <button 
                            className="btn-secondary" 
                            onClick={async () => {
                              try {
                                setLoading(true);
                                // Update driver to remove forced compliance
                                await updateDriver(driver._id, {
                                  complianceStatus: {
                                    ...driver.complianceStatus,
                                    overall: {
                                      ...driver.complianceStatus.overall,
                                      manuallyApproved: false,
                                      compliant: false // Set to non-compliant if manually approved is removed
                                    }
                                  },
                                  status: 'INACTIVE' // Optionally set status to INACTIVE
                                });
                                
                                loadDocuments(); // Refresh
                                setError(''); // Clear any errors
                              } catch (err) {
                                console.error("Error removing forced compliance:", err);
                                setError("Failed to remove forced compliance");
                              } finally {
                                setLoading(false);
                              }
                            }}
                          >
                            Remove Forced Compliance
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
