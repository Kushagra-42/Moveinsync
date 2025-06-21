import { useEffect, useRef } from 'react';
import useAuthStore from './store/authStore';
import AppRoutes from './AppRoutes';
import './styles/global.css';

function App() {
  // Use useRef for initialization tracking to avoid state updates during render
  const initRef = useRef(false);
  const errorRef = useRef(null);
  
  // Get minimal auth state from store
  const initialize = useAuthStore(state => state.initialize);
  const isInitializing = useAuthStore(state => state.isInitializing);
  const initialized = useAuthStore(state => state.initialized);
  
  useEffect(() => {
    // This ensures initialize is called exactly once
    const initAuth = async () => {
      if (!initRef.current) {
        initRef.current = true;
        try {
          await initialize();
        } catch (error) {
          console.error("Failed to initialize auth:", error);
          errorRef.current = "Authentication failed. Please try refreshing the page.";
        }
      }
    };
    
    initAuth();
    
    // No dependencies to avoid re-running
  }, []);
  
  // Show loading indicator while checking authentication
  if (isInitializing || !initialized) {
    return (
      <div className="loading-screen">
        <div className="loading-indicator">
          {errorRef.current || "Loading..."}
        </div>
      </div>
    );
  }
  
  return <AppRoutes />;
}

export default App;
