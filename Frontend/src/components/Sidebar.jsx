// src/components/Sidebar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { DashboardRoutes, Roles } from '../utils/constants';
import { useState, useEffect } from 'react';
import '../styles/layout.css';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  if (!user) return null;

  const { role, permissions } = user;
    // Define menu items with more detailed permission checks
  const menuItems = [
    { label: 'Home', to: '/dashboard/home', icon: '🏠', show: true },
    { 
      label: 'Vendors', 
      to: '/dashboard/vendors', 
      icon: '👥', 
      show: permissions?.canCreateSubVendor || permissions?.canEditSubVendor || permissions?.canEditPermissions 
    },
    { 
      label: 'Drivers', 
      to: '/dashboard/drivers', 
      icon: '👨‍✈️', 
      show: permissions?.canAddDriver || permissions?.canEditDriver || permissions?.canAssignDrivers 
    },
    { 
      label: 'Vehicles', 
      to: '/dashboard/vehicles', 
      icon: '🚗', 
      show: permissions?.canAddVehicle || permissions?.canEditVehicle || permissions?.canAssignVehicles 
    },
    { 
      label: 'Compliance', 
      to: `${DashboardRoutes[role]}/compliance`, 
      icon: '📄', 
      show: permissions?.canVerifyDocuments || permissions?.canUploadDocuments
    },
    { 
      label: 'My Documents', 
      to: `${DashboardRoutes[role]}/documents`, 
      icon: '📑', 
      show: role === Roles.DRIVER 
    },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Get role display name
  const getRoleDisplay = () => {
    switch (role) {
      case Roles.SUPER:
        return 'Super Vendor Dashboard';
      case Roles.REGIONAL:
        return 'Regional Vendor Dashboard';
      case Roles.CITY:
        return 'City Vendor Dashboard';
      case Roles.DRIVER:
        return 'Driver Dashboard';
      default:
        return 'User Dashboard';
    }
  };
  
  return (
    <div className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="collapse-button"
          title={collapsed ? 'Expand' : 'Collapse'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? '⇨' : '⇦'}
        </button>
        {!collapsed && <span className="app-title">Fleet Manager</span>}
      </div>
      
      <div className="sidebar-menu">
        {!collapsed && (
          <div className="role-indicator">
            {getRoleDisplay()}
          </div>
        )}
        <ul className="menu-list">
          {menuItems.map(item => item.show && (
            <li key={item.label} className="menu-item">
              <Link
                to={item.to}
                className={location.pathname.startsWith(item.to) ? 'active' : ''}
                title={collapsed ? item.label : ''}
              >
                <span className="icon">{item.icon}</span>
                {!collapsed && <span className="label">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-button">
          <span className="icon">🚪</span>
          {!collapsed && <span className="label">Logout</span>}
        </button>
        {!collapsed && <div className="user-info">
          Logged in as {user.email}
        </div>}
      </div>
    </div>
  );
}
