// src/pages/DashboardCity.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import VendorTree from '../components/VendorTree';
import SubVendorForm from '../components/SubVendorForm';
import HomePage from './CityHomePage';
import DriversPage from './DriversPage';
import VehiclesPage from './VehiclesPage';
import CompliancePage from './CompliancePage';
import FleetManagement from '../components/FleetManagement'; // if allowed
import NotFound from './NotFound';
import useAuthStore from '../store/authStore';

export default function DashboardCity() {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '16px' }}>
        <Routes>
          <Route path="" element={<Navigate to="home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="vendors" element={
            <div>
              <h2>My Sub-Vendors</h2>
              <VendorTree />
              <SubVendorForm parentVendorId={useAuthStore(state => state.user.vendorId)} onCreated={() => {}} />
            </div>
          }/>
          <Route path="fleet" element={<FleetManagement />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="compliance" element={<CompliancePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
