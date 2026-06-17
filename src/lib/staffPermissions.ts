/**
 * Staff Permission System
 * Maps business types and roles to recommended permissions
 */

export interface PermissionConfig {
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

// All available permissions with descriptions
export const PERMISSIONS: Record<string, PermissionConfig> = {
  sale: {
    label: 'Record Sales',
    description: 'Create and process sales transactions',
    category: 'sales',
  },
  inv: {
    label: 'View Inventory',
    description: 'View product inventory levels',
    category: 'inventory',
  },
  hist: {
    label: 'Sale History',
    description: 'View past sales records',
    category: 'reporting',
  },
  atd: {
    label: 'Attendance',
    description: 'Clock in/out and track attendance',
    category: 'management',
  },
  msg: {
    label: 'Messages',
    description: 'Send and receive messages',
    category: 'management',
  },
  earn: {
    label: 'View Earnings',
    description: 'View personal earnings and commissions',
    category: 'financial',
  },
  products: {
    label: 'Manage Products',
    description: 'Add, edit, and delete products',
    category: 'inventory',
  },
  customers: {
    label: 'Manage Customers',
    description: 'View and manage customer information',
    category: 'management',
  },
  reports: {
    label: 'View Reports',
    description: 'Access business analytics and reports',
    category: 'reporting',
  },
  expenses: {
    label: 'Record Expenses',
    description: 'Record and track business expenses',
    category: 'financial',
  },
  suppliers: {
    label: 'Manage Suppliers',
    description: 'Manage supplier relationships and orders',
    category: 'inventory',
  },
  credit: {
    label: 'Credit Management',
    description: 'Manage customer credit and debt',
    category: 'financial',
  },
  refunds: {
    label: 'Process Refunds',
    description: 'Process refunds and returns',
    category: 'financial',
  },
  discounts: {
    label: 'Apply Discounts',
    description: 'Apply discounts to sales',
    category: 'sales',
  },
  priceEdit: {
    label: 'Edit Prices',
    description: 'Modify product prices',
    category: 'inventory',
  },
};

// Role configurations with recommended permissions
export const ROLES: Record<string, RoleConfig> = {
  cashier: {
    label: 'Cashier',
    description: 'Handles sales transactions and customer service',
    recommendedPermissions: ['sale', 'hist', 'atd', 'msg', 'discounts'],
  },
  sales_associate: {
    label: 'Sales Associate',
    description: 'Assists customers and processes sales',
    recommendedPermissions: ['sale', 'hist', 'inv', 'atd', 'msg', 'discounts'],
  },
  inventory_manager: {
    label: 'Inventory Manager',
    description: 'Manages stock levels and product catalog',
    recommendedPermissions: ['inv', 'products', 'suppliers', 'hist', 'reports', 'priceEdit'],
  },
  store_manager: {
    label: 'Store Manager',
    description: 'Oversees daily operations and staff',
    recommendedPermissions: ['sale', 'inv', 'hist', 'atd', 'msg', 'products', 'customers', 'reports', 'expenses', 'discounts', 'priceEdit'],
  },
  accountant: {
    label: 'Accountant',
    description: 'Manages financial records and reporting',
    recommendedPermissions: ['hist', 'reports', 'expenses', 'credit', 'earn'],
  },
  supervisor: {
    label: 'Supervisor',
    description: 'Supervises staff and operations',
    recommendedPermissions: ['sale', 'inv', 'hist', 'atd', 'msg', 'customers', 'reports', 'discounts'],
  },
  warehouse_staff: {
    label: 'Warehouse Staff',
    description: 'Handles stock and logistics',
    recommendedPermissions: ['inv', 'products', 'suppliers', 'hist', 'atd'],
  },
  customer_service: {
    label: 'Customer Service',
    description: 'Handles customer inquiries and support',
    recommendedPermissions: ['hist', 'msg', 'customers', 'refunds', 'discounts'],
  },
  assistant_manager: {
    label: 'Assistant Manager',
    description: 'Assists store manager with operations',
    recommendedPermissions: ['sale', 'inv', 'hist', 'atd', 'msg', 'products', 'customers', 'reports', 'expenses', 'discounts', 'priceEdit', 'refunds'],
  },
  general_staff: {
    label: 'General Staff',
    description: 'Basic staff member with limited access',
    recommendedPermissions: ['sale', 'hist', 'atd', 'msg'],
  },
};

// Business type configurations with recommended roles and critical permissions
export const BUSINESS_TYPES: Record<string, BusinessTypeConfig> = {
  retail: {
    label: 'Retail Store',
    recommendedRoles: ['cashier', 'sales_associate', 'inventory_manager', 'store_manager', 'supervisor'],
    criticalPermissions: ['sale', 'inv', 'hist', 'products'],
  },
  restaurant: {
    label: 'Restaurant/Food Service',
    recommendedRoles: ['cashier', 'sales_associate', 'inventory_manager', 'store_manager'],
    criticalPermissions: ['sale', 'inv', 'hist', 'products'],
  },
  pharmacy: {
    label: 'Pharmacy',
    recommendedRoles: ['cashier', 'inventory_manager', 'store_manager', 'accountant'],
    criticalPermissions: ['sale', 'inv', 'hist', 'products', 'credit'],
  },
  grocery: {
    label: 'Grocery Store',
    recommendedRoles: ['cashier', 'sales_associate', 'inventory_manager', 'store_manager', 'warehouse_staff'],
    criticalPermissions: ['sale', 'inv', 'hist', 'products', 'suppliers'],
  },
  fashion: {
    label: 'Fashion/Clothing Store',
    recommendedRoles: ['sales_associate', 'inventory_manager', 'store_manager', 'customer_service'],
    criticalPermissions: ['sale', 'inv', 'hist', 'products', 'customers'],
  },
  electronics: {
    label: 'Electronics Store',
    recommendedRoles: ['sales_associate', 'inventory_manager', 'store_manager', 'customer_service'],
    criticalPermissions: ['sale', 'inv', 'hist', 'products', 'credit', 'warranty'],
  },
  manufacturing: {
    label: 'Manufacturing',
    recommendedRoles: ['inventory_manager', 'warehouse_staff', 'store_manager', 'accountant'],
    criticalPermissions: ['inv', 'products', 'suppliers', 'reports', 'expenses'],
  },
  services: {
    label: 'Service Business',
    recommendedRoles: ['customer_service', 'store_manager', 'accountant'],
    criticalPermissions: ['sale', 'hist', 'customers', 'reports', 'expenses'],
  },
  wholesale: {
    label: 'Wholesale/Distribution',
    recommendedRoles: ['inventory_manager', 'warehouse_staff', 'store_manager', 'accountant'],
    criticalPermissions: ['inv', 'products', 'suppliers', 'credit', 'reports'],
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
