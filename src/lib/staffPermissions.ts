/**
 * Staff Permission System
 * Maps business types and roles to recommended permissions
 */

export interface PermissionConfig {
  key: string;
  label: string;
  description: string;
  category: 'sales' | 'inventory' | 'reporting' | 'management' | 'financial';
}

export interface RoleConfig {
  label: string;
  description: string;
  recommendedPermissions: string[];
}

export interface BusinessTypeConfig {
  label: string;
  recommendedRoles: string[];
  criticalPermissions: string[];
}

// All available permissions mapped to actual staff portal pages
export const PERMISSIONS: Record<string, PermissionConfig> = {
  sale: {
    key: 'sale',
    label: 'Record Sales',
    description: 'Create and process sales transactions',
    category: 'sales',
  },
  inv: {
    key: 'inv',
    label: 'View Inventory',
    description: 'View products, stock levels, and suppliers',
    category: 'inventory',
  },
  hist: {
    key: 'hist',
    label: 'History & Reports',
    description: 'View sales history, customers, and reports',
    category: 'reporting',
  },
  atd: {
    key: 'atd',
    label: 'Attendance',
    description: 'Clock in/out and track your shifts',
    category: 'management',
  },
  msg: {
    key: 'msg',
    label: 'Messages',
    description: 'Chat with the owner and your team',
    category: 'management',
  },
};

// Role configurations with recommended permissions and business-specific use cases
export const ROLES: Record<string, RoleConfig> = {
  cashier: {
    label: 'Cashier',
    description: 'Processes sales at the register and handles payments. Best for retail stores, restaurants, and pharmacies.',
    recommendedPermissions: ['sale', 'hist', 'atd', 'msg'],
  },
  sales_associate: {
    label: 'Sales Associate',
    description: 'Assists customers, processes sales, and checks inventory. Best for retail, fashion, and electronics stores.',
    recommendedPermissions: ['sale', 'hist', 'inv', 'atd', 'msg'],
  },
  inventory_manager: {
    label: 'Inventory Manager',
    description: 'Manages stock levels, products, and suppliers. Essential for retail, grocery, and manufacturing.',
    recommendedPermissions: ['inv', 'hist', 'atd', 'msg'],
  },
  store_manager: {
    label: 'Store Manager',
    description: 'Oversees daily operations, sales, inventory, and team. Suitable for all business types.',
    recommendedPermissions: ['sale', 'inv', 'hist', 'atd', 'msg'],
  },
  accountant: {
    label: 'Accountant',
    description: 'Views sales history and reports for financial tracking. Critical for all businesses.',
    recommendedPermissions: ['hist', 'inv', 'atd'],
  },
  supervisor: {
    label: 'Supervisor',
    description: 'Supervises operations, reviews sales history, and manages team communication.',
    recommendedPermissions: ['sale', 'inv', 'hist', 'atd', 'msg'],
  },
  warehouse_staff: {
    label: 'Warehouse Staff',
    description: 'Handles stock, inventory, and attendance tracking. Essential for wholesale and manufacturing.',
    recommendedPermissions: ['inv', 'hist', 'atd', 'msg'],
  },
  customer_service: {
    label: 'Customer Service',
    description: 'Handles customer inquiries and communicates with the team.',
    recommendedPermissions: ['hist', 'msg', 'inv'],
  },
  assistant_manager: {
    label: 'Assistant Manager',
    description: 'Assists with operations, sales, inventory, and team management.',
    recommendedPermissions: ['sale', 'inv', 'hist', 'atd', 'msg'],
  },
  general_staff: {
    label: 'General Staff',
    description: 'Basic access to sales, attendance, and team chat.',
    recommendedPermissions: ['sale', 'hist', 'atd', 'msg'],
  },
  chef: {
    label: 'Chef/Kitchen Staff',
    description: 'Manages ingredients, kitchen stock, and shift attendance.',
    recommendedPermissions: ['inv', 'hist', 'atd', 'msg'],
  },
  waiter: {
    label: 'Waiter/Server',
    description: 'Takes orders, records sales, and clocks in/out.',
    recommendedPermissions: ['sale', 'hist', 'atd', 'msg'],
  },
  bartender: {
    label: 'Bartender',
    description: 'Handles sales, inventory checks, and shift tracking.',
    recommendedPermissions: ['sale', 'inv', 'hist', 'atd', 'msg'],
  },
  delivery_staff: {
    label: 'Delivery Staff',
    description: 'Records deliveries, views history, and tracks shifts.',
    recommendedPermissions: ['sale', 'hist', 'atd', 'msg'],
  },
};

// Business type configurations with recommended roles and critical permissions
export const BUSINESS_TYPES: Record<string, BusinessTypeConfig> = {
  retail: {
    label: 'Retail Store',
    recommendedRoles: ['cashier', 'sales_associate', 'inventory_manager', 'store_manager', 'supervisor'],
    criticalPermissions: ['sale', 'inv', 'hist'],
  },
  restaurant: {
    label: 'Restaurant/Food Service',
    recommendedRoles: ['cashier', 'chef', 'waiter', 'bartender', 'delivery_staff', 'inventory_manager', 'store_manager'],
    criticalPermissions: ['sale', 'inv', 'hist'],
  },
  pharmacy: {
    label: 'Pharmacy',
    recommendedRoles: ['cashier', 'inventory_manager', 'store_manager', 'accountant'],
    criticalPermissions: ['sale', 'inv', 'hist'],
  },
  grocery: {
    label: 'Grocery Store',
    recommendedRoles: ['cashier', 'sales_associate', 'inventory_manager', 'store_manager', 'warehouse_staff'],
    criticalPermissions: ['sale', 'inv', 'hist'],
  },
  fashion: {
    label: 'Fashion/Clothing Store',
    recommendedRoles: ['sales_associate', 'inventory_manager', 'store_manager', 'customer_service'],
    criticalPermissions: ['sale', 'inv', 'hist'],
  },
  electronics: {
    label: 'Electronics Store',
    recommendedRoles: ['sales_associate', 'inventory_manager', 'store_manager', 'customer_service'],
    criticalPermissions: ['sale', 'inv', 'hist'],
  },
  manufacturing: {
    label: 'Manufacturing',
    recommendedRoles: ['inventory_manager', 'warehouse_staff', 'store_manager', 'accountant'],
    criticalPermissions: ['inv', 'hist'],
  },
  services: {
    label: 'Service Business',
    recommendedRoles: ['customer_service', 'store_manager', 'accountant'],
    criticalPermissions: ['sale', 'hist'],
  },
  wholesale: {
    label: 'Wholesale/Distribution',
    recommendedRoles: ['inventory_manager', 'warehouse_staff', 'store_manager', 'accountant'],
    criticalPermissions: ['inv', 'hist'],
  },
  other: {
    label: 'Other',
    recommendedRoles: ['cashier', 'sales_associate', 'store_manager'],
    criticalPermissions: ['sale', 'hist', 'inv'],
  },
};

/**
 * Get recommended permissions for a specific role
 */
export function getRecommendedPermissions(role: string): string[] {
  return ROLES[role]?.recommendedPermissions || ROLES.general_staff.recommendedPermissions;
}

/**
 * Get recommended roles for a specific business type
 */
export function getRecommendedRoles(businessType: string): string[] {
  return BUSINESS_TYPES[businessType]?.recommendedRoles || BUSINESS_TYPES.other.recommendedRoles;
}

/**
 * Get critical permissions for a specific business type
 */
export function getCriticalPermissions(businessType: string): string[] {
  return BUSINESS_TYPES[businessType]?.criticalPermissions || BUSINESS_TYPES.other.criticalPermissions;
}

/**
 * Get all available roles
 */
export function getAllRoles(): Array<{ id: string; config: RoleConfig }> {
  return Object.entries(ROLES).map(([id, config]) => ({ id, config }));
}

/**
 * Get all available permissions grouped by category
 */
export function getPermissionsByCategory(): Record<string, PermissionConfig[]> {
  const grouped: Record<string, PermissionConfig[]> = {};
  
  Object.entries(PERMISSIONS).forEach(([key, config]) => {
    if (!grouped[config.category]) {
      grouped[config.category] = [];
    }
    grouped[config.category].push({ ...config, key } as any);
  });
  
  return grouped;
}

/**
 * Create default permissions object from permission list
 */
export function createPermissionsObject(permissionList: string[]): Record<string, boolean> {
  const permissions: Record<string, boolean> = {};
  Object.keys(PERMISSIONS).forEach(key => {
    permissions[key] = permissionList.includes(key);
  });
  return permissions;
}
