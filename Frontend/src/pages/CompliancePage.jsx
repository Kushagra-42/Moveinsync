// Frontend/src/pages/CompliancePage.jsx
import { useState, useEffect } from 'react';
import { getComplianceSummary, getExpiringDocuments } from '../api/documents';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import '../styles/document.css';
import '../styles/compliance.css';
import '../styles/table.css';
import '../styles/forms.css';

export default function CompliancePage() {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [expiringDocs, setExpiringDocs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [expiryDays, setExpiryDays] = useState(30);

  useEffect(() => {
    if (user && user.permissions?.canViewAnalytics) {
      loadSummary();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'expiring' && user && user.permissions?.canViewAnalytics) {
      loadExpiringDocuments(expiryDays);
    }
  }, [activeTab, expiryDays, user]);

  const loadSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getComplianceSummary();
      setSummary(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading compliance summary');
    } finally {
      setLoading(false);
    }
  };

  const loadExpiringDocuments = async (days) => {
    setLoading(true);
    setError('');
    try {
      const data = await getExpiringDocuments(days);
      setExpiringDocs(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading expiring documents');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Compliance Dashboard</h2>
        <button onClick={handleBack} className="secondary-button close-button">
          <span className="icon">×</span> Close
        </button>
      </div>

      {!user || !user.permissions?.canViewAnalytics ? (
        <div className="access-denied">
          <p>You do not have permission to access the compliance dashboard.</p>
          <button onClick={handleBack} className="primary-button">
            Go Back
          </button>
        </div>
      ) : (
        <>
          <div className="tabs">
            <div className="tabs-nav">
              <button
                className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
              >
                Compliance Summary
              </button>
              <button
                className={`tab-button ${activeTab === 'expiring' ? 'active' : ''}`}
                onClick={() => setActiveTab('expiring')}
              >
                Expiring Documents
              </button>
            </div>

            <div className="tab-content">
              {loading ? (
                <div className="loading-indicator">Loading data...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : (
                <>
                  {activeTab === 'summary' && summary && (
                    <div className="compliance-summary-container">
                      <div className="compliance-card-grid">
                        <div className={`compliance-card ${summary.summary.pendingDriverDocsCount > 0 ? 'warning' : 'success'}`}>
                          <h3>Pending Driver Verifications</h3>
                          <p className="compliance-count">{summary.summary.pendingDriverDocsCount}</p>
                          <p>Driver documents waiting for verification</p>
                        </div>

                        <div className={`compliance-card ${summary.summary.pendingVehicleDocsCount > 0 ? 'warning' : 'success'}`}>
                          <h3>Pending Vehicle Verifications</h3>
                          <p className="compliance-count">{summary.summary.pendingVehicleDocsCount}</p>
                          <p>Vehicle documents waiting for verification</p>
                        </div>

                        <div className={`compliance-card ${summary.summary.nonCompliantDriversCount > 0 ? 'danger' : 'success'}`}>
                          <h3>Non-Compliant Drivers</h3>
                          <p className="compliance-count">{summary.summary.nonCompliantDriversCount}</p>
                          <p>Drivers with missing or expired documents</p>
                        </div>

                        <div className={`compliance-card ${summary.summary.nonCompliantVehiclesCount > 0 ? 'danger' : 'success'}`}>
                          <h3>Non-Compliant Vehicles</h3>
                          <p className="compliance-count">{summary.summary.nonCompliantVehiclesCount}</p>
                          <p>Vehicles with missing or expired documents</p>
                        </div>
                      </div>

                      {summary.expiringDocuments && (
                        <div className="expiring-documents-preview">
                          <h3>Documents Expiring Soon (Next 30 Days)</h3>
                          
                          {summary.expiringDocuments.drivers.length > 0 || 
                           summary.expiringDocuments.vehicles.length > 0 ? (
                            <div className="expiring-lists">
                              {summary.expiringDocuments.drivers.length > 0 && (
                                <div className="expiring-list">
                                  <h4>Driver Documents</h4>
                                  <ul>
                                    {summary.expiringDocuments.drivers.map(driver => (
                                      <li key={driver._id}>
                                        <strong>{driver.name}</strong>
                                        {Object.entries(driver.documents).map(([docType, doc]) => 
                                          doc?.expiresAt ? (
                                            <span key={docType} className="expiry-item">
                                              {docType} expires {new Date(doc.expiresAt).toLocaleDateString()}
                                            </span>
                                          ) : null
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                  {summary.expiringDocuments.drivers.length >= 10 && (
                                    <p><em>Showing first 10 results. Switch to Expiring Documents tab to see more.</em></p>
                                  )}
                                </div>
                              )}
                              
                              {summary.expiringDocuments.vehicles.length > 0 && (
                                <div className="expiring-list">
                                  <h4>Vehicle Documents</h4>
                                  <ul>
                                    {summary.expiringDocuments.vehicles.map(vehicle => (
                                      <li key={vehicle._id}>
                                        <strong>{vehicle.regNumber}</strong>
                                        {Object.entries(vehicle.documents).map(([docType, doc]) => 
                                          doc?.expiresAt ? (
                                            <span key={docType} className="expiry-item">
                                              {docType} expires {new Date(doc.expiresAt).toLocaleDateString()}
                                            </span>
                                          ) : null
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                  {summary.expiringDocuments.vehicles.length >= 10 && (
                                    <p><em>Showing first 10 results. Switch to Expiring Documents tab to see more.</em></p>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p>No documents expiring in the next 30 days.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'expiring' && expiringDocs && (
                    <div className="expiring-documents-container">
                      <div className="filter-controls">
                        <label>
                          Show documents expiring in the next:
                          <select 
                            value={expiryDays} 
                            onChange={(e) => setExpiryDays(Number(e.target.value))}
                            className="days-selector"
                          >
                            <option value={7}>7 days</option>
                            <option value={30}>30 days</option>
                            <option value={60}>60 days</option>
                            <option value={90}>90 days</option>
                          </select>
                        </label>
                        <button onClick={() => loadExpiringDocuments(expiryDays)} className="refresh-button">
                          Refresh
                        </button>
                      </div>

                      <div className="expiring-documents-detail">
                        <div className="expiring-section">
                          <h3>Driver Documents</h3>
                          {expiringDocs.expiringDocuments.drivers.length > 0 ? (
                            <table className="table">
                              <thead>
                                <tr>
                                  <th>Driver</th>
                                  <th>Document Type</th>
                                  <th>Expires</th>
                                  <th>Days Remaining</th>
                                </tr>
                              </thead>
                              <tbody>
                                {expiringDocs.expiringDocuments.drivers.flatMap(driver => {
                                  // Flatten the documents objects into rows
                                  const rows = [];
                                  if (driver.documents.drivingLicense) {
                                    rows.push({
                                      driverId: driver._id,
                                      driverName: driver.name,
                                      docType: 'Driving License',
                                      expiresAt: driver.documents.drivingLicense.expiresAt,
                                      daysRemaining: driver.documents.drivingLicense.daysRemaining
                                    });
                                  }
                                  if (driver.documents.permit) {
                                    rows.push({
                                      driverId: driver._id,
                                      driverName: driver.name,
                                      docType: 'Permit',
                                      expiresAt: driver.documents.permit.expiresAt,
                                      daysRemaining: driver.documents.permit.daysRemaining
                                    });
                                  }
                                  if (driver.documents.pollutionCertificate) {
                                    rows.push({
                                      driverId: driver._id,
                                      driverName: driver.name,
                                      docType: 'Pollution Certificate',
                                      expiresAt: driver.documents.pollutionCertificate.expiresAt,
                                      daysRemaining: driver.documents.pollutionCertificate.daysRemaining
                                    });
                                  }
                                  return rows;
                                }).map((row, index) => (
                                  <tr key={`${row.driverId}-${row.docType}-${index}`}>
                                    <td>{row.driverName}</td>
                                    <td>{row.docType}</td>
                                    <td>{new Date(row.expiresAt).toLocaleDateString()}</td>
                                    <td className={row.daysRemaining < 7 ? 'urgent-expiry' : ''}>
                                      {row.daysRemaining} days
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>No driver documents expiring in the next {expiryDays} days.</p>
                          )}
                        </div>

                        <div className="expiring-section">
                          <h3>Vehicle Documents</h3>
                          {expiringDocs.expiringDocuments.vehicles.length > 0 ? (
                            <table className="table">
                              <thead>
                                <tr>
                                  <th>Vehicle</th>
                                  <th>Document Type</th>
                                  <th>Expires</th>
                                  <th>Days Remaining</th>
                                </tr>
                              </thead>
                              <tbody>
                                {expiringDocs.expiringDocuments.vehicles.flatMap(vehicle => {
                                  // Flatten the documents objects into rows
                                  const rows = [];
                                  if (vehicle.documents.registrationCertificate) {
                                    rows.push({
                                      vehicleId: vehicle._id,
                                      vehicleReg: vehicle.regNumber,
                                      docType: 'Registration Certificate',
                                      expiresAt: vehicle.documents.registrationCertificate.expiresAt,
                                      daysRemaining: vehicle.documents.registrationCertificate.daysRemaining
                                    });
                                  }
                                  if (vehicle.documents.insurance) {
                                    rows.push({
                                      vehicleId: vehicle._id,
                                      vehicleReg: vehicle.regNumber,
                                      docType: 'Insurance',
                                      expiresAt: vehicle.documents.insurance.expiresAt,
                                      daysRemaining: vehicle.documents.insurance.daysRemaining
                                    });
                                  }
                                  if (vehicle.documents.permit) {
                                    rows.push({
                                      vehicleId: vehicle._id,
                                      vehicleReg: vehicle.regNumber,
                                      docType: 'Permit',
                                      expiresAt: vehicle.documents.permit.expiresAt,
                                      daysRemaining: vehicle.documents.permit.daysRemaining
                                    });
                                  }
                                  if (vehicle.documents.pollutionCertificate) {
                                    rows.push({
                                      vehicleId: vehicle._id,
                                      vehicleReg: vehicle.regNumber,
                                      docType: 'Pollution Certificate',
                                      expiresAt: vehicle.documents.pollutionCertificate.expiresAt,
                                      daysRemaining: vehicle.documents.pollutionCertificate.daysRemaining
                                    });
                                  }
                                  return rows;
                                }).map((row, index) => (
                                  <tr key={`${row.vehicleId}-${row.docType}-${index}`}>
                                    <td>{row.vehicleReg}</td>
                                    <td>{row.docType}</td>
                                    <td>{new Date(row.expiresAt).toLocaleDateString()}</td>
                                    <td className={row.daysRemaining < 7 ? 'urgent-expiry' : ''}>
                                      {row.daysRemaining} days
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>No vehicle documents expiring in the next {expiryDays} days.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .compliance-page {
          padding: 20px 0;
        }
        
        .compliance-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .expiring-lists {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 20px;
        }
        
        .expiring-list {
          background-color: #fff;
          border-radius: 4px;
          padding: 15px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .expiry-item {
          display: block;
          margin: 5px 0 5px 15px;
          color: #f57f17;
        }
        
        .filter-controls {
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .days-selector {
          padding: 8px;
          border-radius: 4px;
          border: 1px solid #ddd;
          margin-left: 10px;
        }
        
        .refresh-button {
          padding: 8px 16px;
        }
        
        .urgent-expiry {
          color: #d32f2f;
          font-weight: bold;
        }
        
        .access-denied {
          text-align: center;
          padding: 50px 0;
          color: #d32f2f;
        }

        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .close-button {
          background-color: transparent;
          border: none;
          cursor: pointer;
          font-size: 16px;
          color: #007bff;
        }

        .tabs {
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .tabs-nav {
          display: flex;
          border-bottom: 1px solid #ddd;
        }

        .tab-button {
          flex: 1;
          padding: 15px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          color: #333;
          position: relative;
        }

        .tab-button.active {
          font-weight: bold;
          color: #007bff;
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 2px;
          bottom: -2px;
          left: 0;
          background: #007bff;
        }

        .tab-content {
          padding: 20px;
        }

        .loading-indicator {
          text-align: center;
          padding: 50px 0;
          color: #007bff;
        }

        .error-message {
          color: #d32f2f;
          text-align: center;
          padding: 20px 0;
        }
      `}</style>
    </div>
  );
}
