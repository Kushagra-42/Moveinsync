// src/store/authStore.js
import { create } from 'zustand';
import { login as apiLogin, getProfile, setToken as apiSetToken, clearToken as apiClearToken } from '../api/auth';

// Super simplified auth store
const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isInitializing: false,
  initialized: false,
  
  // Login function
  login: async ({ email, password }) => {
    try {
      set({ isInitializing: true });
      const { token } = await apiLogin({ email, password });
      
      localStorage.setItem('token', token);
      apiSetToken(token);
        const profile = await getProfile();
      
      // Ensure default permissions are set if not returned from API
      if (!profile.permissions) {
        profile.permissions = {};
      }
      
      set({ 
        user: profile, 
        token, 
        isInitializing: false, 
        initialized: true 
      });
      
      return profile;
    } catch (error) {
      console.error("Login failed:", error);
      set({ 
        user: null, 
        token: null,
        isInitializing: false,
        initialized: true
      });
      throw error;
    }
  },
  
  // Logout function
  logout: () => {
    localStorage.removeItem('token');
    apiClearToken();
    set({ 
      user: null, 
      token: null,
      initialized: true,
      isInitializing: false
    });
  },
  
  // Initialize function
  initialize: async () => {
    // Avoid repeated initialization
    if (get().initialized || get().isInitializing) {
      return;
    }
    
    set({ isInitializing: true });
    
    const token = localStorage.getItem('token');
    
    if (token) {
      apiSetToken(token);
      try {        const profile = await getProfile();
        
        // Ensure default permissions are set if not returned from API
        if (!profile.permissions) {
          profile.permissions = {};
        }
        
        set({ 
          user: profile, 
          token, 
          isInitializing: false, 
          initialized: true 
        });
      } catch (error) {
        console.error("Auth initialization failed:", error);
        apiClearToken();
        localStorage.removeItem('token');
        set({ 
          user: null, 
          token: null, 
          isInitializing: false, 
          initialized: true 
        });
      }
    } else {
      set({ 
        isInitializing: false, 
        initialized: true 
      });
    }
  }
}));

export default useAuthStore;
