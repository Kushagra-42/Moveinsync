// src/AppRoutes.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { Roles } from './utils/constants';
import useAuthStore from './store/authStore';
import { memo } from 'react';

// Simplified BareRoutes component
const BareRoutes = memo(({ user }) => (
  <Routes>
    {/* Redirect root to dashboard if logged in, otherwise to login page */}
    <Route 
      path="/" 
      element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
    />
    
    {/* Login page - redirect to dashboard if already logged in */}
    <Route 
      path="/login" 
      element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
    />
    
    {/* Dashboard and protected routes */}
    <Route
      path="/dashboard/*"
      element={
        <ProtectedRoute allowedRoles={[Roles.SUPER, Roles.REGIONAL, Roles.CITY, Roles.DRIVER]}>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    
    {/* Catch all route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
));

// Use memo to prevent unnecessary re-renders
const AppRoutes = () => {
  // Get only what we need from the auth store
  const user = useAuthStore((state) => state.user);
  
  return (
    <BrowserRouter>
      <BareRoutes user={user} />
    </BrowserRouter>
  );
};

export default AppRoutes;
