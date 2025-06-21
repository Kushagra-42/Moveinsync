import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

// Simplified ProtectedRoute without memo
function ProtectedRoute({ children, allowedRoles }) {
  // Only get the user object from the auth store
  const user = useAuthStore(state => state.user);
  
  // If no user is logged in, redirect to login page
  if (!user) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Check if the user's role is allowed to access this route
  if (!allowedRoles.includes(user.role)) {
    console.log(`User role ${user.role} not authorized for this route`);
    // Could redirect to an "unauthorized" page instead
    return <Navigate to="/login" replace />;
  }
    // User is authenticated and authorized, render the protected component
  return children;
}

export default ProtectedRoute;
