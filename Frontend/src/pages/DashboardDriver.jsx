// src/pages/DashboardDriver.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DriverHomePage from './DriverHomePage';
import DriverDocumentsPage from './DriverDocumentsPage';
import NotFound from './NotFound';

export default function DashboardDriver() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '16px' }}>
        <Routes>
          <Route path="" element={<Navigate to="home" replace />} />
          <Route path="home" element={<DriverHomePage />} />
          <Route path="documents" element={<DriverDocumentsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
