// Frontend/src/components/DocumentStatus.jsx
import { useState } from 'react';
import { verifyDriverDocument, verifyVehicleDocument } from '../api/documents';
import '../styles/document.css';

export default function DocumentStatus({ entityId, entityType, docType, docName, document, complianceStatus, canVerify, onVerified }) {
  const [verifying, setVerifying] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString();
  };

  const handleVerify = async (verified) => {
    setVerifying(true);
    setError('');
    setSuccess('');

    try {
      if (entityType === 'driver') {
        await verifyDriverDocument(entityId, docType, verified, notes);
      } else {
        await verifyVehicleDocument(entityId, docType, verified, notes);
      }

      setSuccess(`Document ${verified ? 'verified' : 'rejected'} successfully`);
      setNotes('');

      // Notify parent component 
      if (onVerified) onVerified();
    } catch (err) {
      setError(err.response?.data?.message || 'Error verifying document');
    } finally {
      setVerifying(false);
    }
  };

  // Function to determine status badge class
  const getStatusClass = () => {
    if (!document || !document.url) return 'status-missing';
    
    const status = complianceStatus || {};
    
    if (status.verified === false) return 'status-rejected';
    if (!status.verified) return 'status-pending';
    
    // Check if expired
    if (document.expiresAt && new Date(document.expiresAt) < new Date()) {
      return 'status-expired';
    }
    
    return 'status-verified';
  };

  // Function to determine status text
  const getStatusText = () => {
    if (!document || !document.url) return 'Missing';
    
    const status = complianceStatus || {};
    
    if (status.verified === false) return 'Rejected';
    if (!status.verified) return 'Pending Verification';
    
    // Check if expired
    if (document.expiresAt && new Date(document.expiresAt) < new Date()) {
      return 'Expired';
    }
    
    return 'Verified';
  };

  // Check how many days until expiry
  const getDaysUntilExpiry = () => {
    if (!document || !document.expiresAt) return null;
    
    const expiryDate = new Date(document.expiresAt);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <div className="document-status">
      <div className="document-header">
        <h4>{docName}</h4>
        <div className={`status-badge ${getStatusClass()}`}>
          {getStatusText()}
        </div>
      </div>
      
      <div className="status-container">
        {document && document.url ? (
          <div className="document-details">
            <div className="document-actions-row">
              <span className="document-info">
                Document uploaded on {formatDate(document.uploadedAt)}
              </span>
              
              {!complianceStatus?.verified && canVerify && (
                <button 
                  className="quick-verify-btn"
                  onClick={() => handleVerify(true)}
                >
                  ✓ Approve
                </button>
              )}
            </div>
            {document.expiresAt && (
              <p className={daysUntilExpiry < 0 ? 'expired' : daysUntilExpiry < 30 ? 'expiring-soon' : ''}>
                Expires: {formatDate(document.expiresAt)}
                {daysUntilExpiry > 0 && ` (in ${daysUntilExpiry} days)`}
                {daysUntilExpiry < 0 && ` (expired ${Math.abs(daysUntilExpiry)} days ago)`}
              </p>
            )}
            
            {complianceStatus && complianceStatus.verifiedBy && (
              <p>Verified by: {complianceStatus.verifiedBy.email || 'Unknown'}</p>
            )}
            
            {complianceStatus && complianceStatus.notes && (
              <p>Notes: {complianceStatus.notes}</p>
            )}
          </div>
        ) : (
          <div className="document-details">
            <p>No document uploaded yet</p>
          </div>
        )}
      </div>

      {canVerify && document && document.url && !complianceStatus?.verified && (
        <div className="verification-container">
          <textarea
            placeholder="Add verification notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            disabled={verifying}
            rows={2}
          />
          
          <div className="verification-buttons">
            <button 
              onClick={() => handleVerify(true)} 
              disabled={verifying}
              className="approve-button"
            >
              {verifying ? 'Processing...' : 'Approve'}
            </button>
            <button 
              onClick={() => handleVerify(false)} 
              disabled={verifying}
              className="reject-button"
            >
              {verifying ? 'Processing...' : 'Reject'}
            </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </div>
      )}
    </div>
  );
}
