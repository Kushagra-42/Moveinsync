// Frontend/src/pages/DriverDocumentsPage.jsx
import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { getDriverDocuments } from '../api/documents';
import DocumentUploadForm from '../components/DocumentUploadForm';
import DocumentStatus from '../components/DocumentStatus';
import '../styles/document.css';
import '../styles/driver.css';

export default function DriverDocumentsPage() {
  const user = useAuthStore(state => state.user);
  const [documents, setDocuments] = useState(null);
  const [complianceStatus, setComplianceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (user && user.role === 'DRIVER' && user.driverId) {
      loadDocuments();
    }
  }, [user]);
  
  const loadDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDriverDocuments(user.driverId);
      setDocuments(data.documents);
      setComplianceStatus(data.complianceStatus);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading documents');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to refresh data after upload
  const handleDocumentUpload = () => {
    loadDocuments();
  };
  
  if (!user || user.role !== 'DRIVER' || !user.driverId) {
    return <div className="error-message">Access denied or driver profile not found.</div>;
  }
  
  return (
    <div className="driver-documents-page">
      <h2>My Documents</h2>

      {loading ? (
        <p>Loading documents...</p>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          {complianceStatus && complianceStatus.overall && (
            <div className="compliance-summary">
              <div className={`compliance-card ${complianceStatus.overall.compliant ? '' : 'danger'}`}>
                <h3>My Compliance Status</h3>
                <p className="compliance-count">
                  {complianceStatus.overall.compliant ? 'Compliant ✓' : 'Non-Compliant ✗'}
                </p>
                <p>Last checked: {new Date(complianceStatus.overall.lastChecked).toLocaleDateString()}</p>
                
                {!complianceStatus.overall.compliant && (
                  <p className="compliance-warning">
                    Please upload or renew the required documents below to maintain compliance.
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div className="document-section">
            <div className="documents-grid">
              <div className="document-card">
                <h4>Driving License</h4>
                <DocumentStatus 
                  entityId={user.driverId}
                  entityType="driver"
                  docType="drivingLicense"
                  docName="Driving License"
                  document={documents?.drivingLicense}
                  complianceStatus={complianceStatus?.drivingLicense}
                  canVerify={false}
                />
                <DocumentUploadForm
                  entityId={user.driverId}
                  entityType="driver"
                  docType="drivingLicense"
                  docName="Driving License"
                  onUploaded={handleDocumentUpload}
                />
              </div>
              
              <div className="document-card">
                <h4>Permit</h4>
                <DocumentStatus 
                  entityId={user.driverId}
                  entityType="driver"
                  docType="permit"
                  docName="Permit"
                  document={documents?.permit}
                  complianceStatus={complianceStatus?.permit}
                  canVerify={false}
                />
                <DocumentUploadForm
                  entityId={user.driverId}
                  entityType="driver"
                  docType="permit"
                  docName="Permit"
                  onUploaded={handleDocumentUpload}
                />
              </div>
              
              <div className="document-card">
                <h4>Pollution Certificate</h4>
                <DocumentStatus 
                  entityId={user.driverId}
                  entityType="driver"
                  docType="pollutionCertificate"
                  docName="Pollution Certificate"
                  document={documents?.pollutionCertificate}
                  complianceStatus={complianceStatus?.pollutionCertificate}
                  canVerify={false}
                />
                <DocumentUploadForm
                  entityId={user.driverId}
                  entityType="driver"
                  docType="pollutionCertificate"
                  docName="Pollution Certificate"
                  onUploaded={handleDocumentUpload}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
