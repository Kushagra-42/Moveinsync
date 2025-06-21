import { useState } from 'react';
import '../styles/upload.css';

// Simple file upload component
function FileUpload({ onUpload, className }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      // Simulate successful upload (in production, implement real upload)
      // Replace this with actual API call to upload file
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get a fake URL for demo purposes (use actual URL in production)
      const fakeUrl = `https://example.com/documents/license-${Date.now()}.pdf`;
      
      // Call the parent's onUpload with the URL
      onUpload(fakeUrl);
      
      // Clear the file input
      setFile(null);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`file-upload ${className || ''}`}>
      <label className="file-label">
        <input 
          type="file"
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg"
        />
        <span className="file-button">Choose File</span>
      </label>
      {file && (
        <div className="file-info">
          <span>{file.name}</span>
          <button 
            onClick={handleUpload}
            disabled={uploading}
            className="upload-button"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}
      {error && <div className="upload-error">{error}</div>}
    </div>
  );
}

export default FileUpload;
