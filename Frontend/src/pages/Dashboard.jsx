import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SimpleDashboard from './SimpleDashboard'; // Import the new simplified dashboard
import VendorsPage from './VendorsPage';
import FleetPage from './FleetPage';
import DriversPage from './DriversPage';
import VehiclesPage from './VehiclesPage';
import CompliancePage from './CompliancePage';
import AnalyticsPage from './AnalyticsPage';
import VerificationPage from './VerificationPage';
import NotFound from './NotFound';
import useAuthStore from '../store/authStore';
import { Roles } from '../utils/constants';
import '../styles/layout.css';

export default function Dashboard() {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Routes>          <Route path="" element={<Navigate to="home" replace />} />
          <Route path="home" element={<SimpleDashboard />} />
          <Route path="vendors/*" element={<VendorsPage />} />
          <Route path="fleet" element={<FleetPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="compliance" element={<CompliancePage />} />
          {user.role === Roles.SUPER && (
            <Route path="analytics" element={<AnalyticsPage />} />
          )}
          {user.role === Roles.DRIVER && (
            <Route path="verification" element={<VerificationPage />} />
          )}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}
