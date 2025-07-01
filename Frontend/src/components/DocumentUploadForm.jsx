// Frontend/src/components/DocumentUploadForm.jsx
import { useState } from 'react';
import { uploadDriverDocument, uploadVehicleDocument } from '../api/documents';
import '../styles/document.css';

export default function DocumentUploadForm({ entityId, entityType, docType, docName, onUploaded }) {
  const [file, setFile] = useState(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File is too large. Maximum size is 5MB.');
        setFile(null);
        e.target.value = '';
        return;
      }

      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Only PDF and image files (JPEG, PNG) are allowed.');
        setFile(null);
        e.target.value = '';
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file.');
      return;
    }

    // Validate expiry date if provided
    let expiresAt = null;
    if (expiryDate) {
      expiresAt = new Date(expiryDate);
      if (expiresAt < new Date()) {
        setError('Expiry date must be in the future.');
        return;
      }
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (entityType === 'driver') {
        await uploadDriverDocument(entityId, docType, file, expiresAt);
      } else {
        await uploadVehicleDocument(entityId, docType, file, expiresAt);
      }
      setSuccess('Document uploaded successfully!');
      setFile(null);
      setExpiryDate('');
      
      // Clear file input
      const fileInput = document.getElementById(`file-${docType}`);
      if (fileInput) fileInput.value = '';

      // Call callback if provided
      if (onUploaded) onUploaded();
    } catch (err) {
      setError(err.response?.data?.message || 'Error uploading document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="document-upload-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor={`file-${docType}`}>
            <div className="file-input-label">
              <span className="file-icon">📄</span>
              <span>Choose File (PDF, JPEG, PNG)</span>
            </div>
          </label>
          <input
            type="file"
            id={`file-${docType}`}
            onChange={handleFileChange}
            disabled={loading}
            accept=".pdf,.jpg,.jpeg,.png"
            className="file-input"
          />
          {file && (
            <div className="selected-file">
              <span className="file-name">{file.name}</span>
              <span className="file-size">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
            </div>
          )}
        </div>
        <div className="form-group">
          <label htmlFor={`expiry-${docType}`}>Expiry Date (optional):</label>
          <input
            type="date"
            id={`expiry-${docType}`}
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            disabled={loading}
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <button type="submit" className="upload-button" disabled={loading || !file}>
          {loading ? (
            <span className="loading-spinner">
              <span className="spinner"></span>
              <span>Uploading...</span>
            </span>
          ) : (
            <span className="upload-text">Upload Document</span>
          )}
        </button>
      </form>
    </div>
  );
}
