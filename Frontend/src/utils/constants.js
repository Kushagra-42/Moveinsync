export const Roles = {
  SUPER: 'SuperVendor',
  REGIONAL: 'RegionalVendor',
  CITY: 'CityVendor',
  DRIVER: 'Driver',
};

// Numeric representation of hierarchy levels
export const HierarchyLevels = {
  SUPER_VENDOR: 1,
  REGIONAL_VENDOR: 2,
  CITY_VENDOR: 3,
  DRIVER: 4,
};

// Human-readable hierarchy levels
export const HierarchyLabels = {
  [HierarchyLevels.SUPER_VENDOR]: 'Super Vendor',
  [HierarchyLevels.REGIONAL_VENDOR]: 'Regional Vendor',
  [HierarchyLevels.CITY_VENDOR]: 'City Vendor',
  [HierarchyLevels.DRIVER]: 'Driver',
};

// Map string roles to numeric levels
export const RoleToLevelMap = {
  [Roles.SUPER]: HierarchyLevels.SUPER_VENDOR,
  [Roles.REGIONAL]: HierarchyLevels.REGIONAL_VENDOR,
  [Roles.CITY]: HierarchyLevels.CITY_VENDOR,
  [Roles.DRIVER]: HierarchyLevels.DRIVER,
};

// Map numeric levels to string roles
export const LevelToRoleMap = {
  [HierarchyLevels.SUPER_VENDOR]: Roles.SUPER,
  [HierarchyLevels.REGIONAL_VENDOR]: Roles.REGIONAL,
  [HierarchyLevels.CITY_VENDOR]: Roles.CITY,
  [HierarchyLevels.DRIVER]: Roles.DRIVER,
};

// Dashboard routes for each role - now using the unified dashboard
export const DashboardRoutes = {
  [Roles.SUPER]: '/dashboard',
  [Roles.REGIONAL]: '/dashboard',
  [Roles.CITY]: '/dashboard',
  [Roles.DRIVER]: '/dashboard',
};

// Permission definitions for UI components
export const PermissionMap = {
  VENDORS_VIEW: [
    'canCreateSubVendor',
    'canEditSubVendor',
    'canDeleteSubVendor',
    'canEditPermissions',
  ],
  FLEET_VIEW: ['canManageFleet', 'canViewFleet'],
  DRIVERS_VIEW: [
    'canAddDriver',
    'canEditDriver',
    'canDeleteDriver',
    'canViewDrivers',
  ],
  VEHICLES_VIEW: [
    'canAddVehicle',
    'canEditVehicle',
    'canDeleteVehicle',
    'canViewVehicles',
    'canAssignDriver',
  ],
  DOCUMENTS_VIEW: [
    'canUploadDocument',
    'canVerifyDocument',
    'canDeleteDocument',
    'canViewDocuments',
  ],
};

// Default permissions for each role
export const DefaultPermissions = {
  [Roles.SUPER]: {
    canCreateSubVendor: true,
    canEditSubVendor: true,
    canDeleteSubVendor: true,
    canEditPermissions: true,
    canManageFleet: true,
    canViewFleet: true,
    canAddDriver: true,
    canEditDriver: true,
    canDeleteDriver: true,
    canViewDrivers: true,
    canAddVehicle: true,
    canEditVehicle: true,
    canDeleteVehicle: true,
    canViewVehicles: true,
    canAssignDriver: true,
    canUploadDocument: true,
    canVerifyDocument: true,
    canDeleteDocument: true,
    canViewDocuments: true,
  },
  [Roles.REGIONAL]: {
    canCreateSubVendor: true,
    canEditSubVendor: true,
    canDeleteSubVendor: false,
    canEditPermissions: false,
    canManageFleet: true,
    canViewFleet: true,
    canAddDriver: true,
    canEditDriver: true,
    canDeleteDriver: true,
    canViewDrivers: true,
    canAddVehicle: true,
    canEditVehicle: true,
    canDeleteVehicle: false,
    canViewVehicles: true,
    canAssignDriver: true,
    canUploadDocument: true,
    canVerifyDocument: false,
    canDeleteDocument: false,
    canViewDocuments: true,
  },
  [Roles.CITY]: {
    canCreateSubVendor: false,
    canEditSubVendor: false,
    canDeleteSubVendor: false,
    canEditPermissions: false,
    canManageFleet: false,
    canViewFleet: true,
    canAddDriver: true,
    canEditDriver: true,
    canDeleteDriver: false,
    canViewDrivers: true,
    canAddVehicle: true,
    canEditVehicle: true,
    canDeleteVehicle: false,
    canViewVehicles: true,
    canAssignDriver: true,
    canUploadDocument: true,
    canVerifyDocument: false,
    canDeleteDocument: false,
    canViewDocuments: true,
  },
  [Roles.DRIVER]: {
    canCreateSubVendor: false,
    canEditSubVendor: false,
    canDeleteSubVendor: false,
    canEditPermissions: false,
    canManageFleet: false,
    canViewFleet: false,
    canAddDriver: false,
    canEditDriver: false,
    canDeleteDriver: false,
    canViewDrivers: false,
    canAddVehicle: false,
    canEditVehicle: false,
    canDeleteVehicle: false,
    canViewVehicles: false,
    canAssignDriver: false,
    canUploadDocument: true,
    canVerifyDocument: false,
    canDeleteDocument: false,
    canViewDocuments: true,
  },
};
