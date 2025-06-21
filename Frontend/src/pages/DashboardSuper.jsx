// src/pages/DashboardSuper.jsx (example)
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import SuperHomePage from './SuperHomePage';
import VendorsPage from './VendorsPage';
import FleetPage from './FleetPage';
import DriversPage from './DriversPage';
import VehiclesPage from './VehiclesPage';
import CompliancePage from './CompliancePage';
import AnalyticsPage from './AnalyticsPage';
import NotFound from './NotFound';
import '../styles/layout.css';

export default function DashboardSuper() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="" element={<Navigate to="home" replace />} />
          <Route path="home" element={<SuperHomePage />} />
          <Route path="vendors/*" element={<VendorsPage />} />
          <Route path="fleet" element={<FleetPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="compliance" element={<CompliancePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}
