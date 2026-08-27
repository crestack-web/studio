import { useEffect, useState } from 'react';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Define admin user type with permissions and lastLogin
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  lastLogin?: string;
}

// Define admin roles and their permissions
export const ADMIN_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    permissions: ['all']
  },
  SUPPORT_AGENT: {
    name: 'Support Agent',
    permissions: ['support_view', 'support_reply', 'support_status']
  },
  SUPPORT_ADMIN: {
    name: 'Support Admin',
    permissions: ['support_view', 'support_reply', 'support_status']
  }
};

// Map emails to roles
export { ADMIN_EMAIL_ROLES } from '@/lib/adminEmails';

// Custom hook for admin authentication
export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Check authentication status on component mount
  useEffect(() => {
    // Skip Chatwoot initialization since we're using our own support chat
    // In a real application, this would check the actual authentication status
    // For example, by checking a token or session
    checkAuthentication();
  }, []);

  // Mock authentication check
  const checkAuthentication = async () => {
    try {
      // In a real application, this would make an API call to verify the session
      // For example: const response = await fetch('/api/admin/auth/status');
      // And then check the response
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Check authentication from localStorage
      const isAuth = localStorage.getItem('admin_authenticated') === 'true';
      const token = localStorage.getItem('admin_token');
      const storedUser = localStorage.getItem('admin_user');
      
      if (isAuth && token && storedUser) {
        // Verify token is valid (in production, verify JWT or session)
        try {
          const parsedUser = JSON.parse(storedUser);
          
          // Verify email is still in whitelist
          const ADMIN_EMAILS = [
            'taheeratorganic@gmail.com',
            'admin@busmo.io',
            'majnuncode@gmail.com',
            'sxeedtxheer@gmail.com',
            'ahmedusmus@gmail.com',
            'majnun@busmo.io',
            'victoria@busmo.io'
          ];
          
          if (ADMIN_EMAILS.includes(parsedUser.email)) {
            // Assign role based on email
            const roleKey = ADMIN_EMAIL_ROLES[parsedUser.email] || 'SUPER_ADMIN';
            const roleConfig = ADMIN_ROLES[roleKey as keyof typeof ADMIN_ROLES];
            
            // Update user with role and permissions
            parsedUser.role = roleConfig.name;
            parsedUser.permissions = roleConfig.permissions;
            
            setIsAuthenticated(true);
            setUser(parsedUser);
          } else if (parsedUser.role === 'Support Admin') {
            // Support admin added via AdminTeam — already has correct role/permissions
            setIsAuthenticated(true);
            setUser(parsedUser);
          } else {
            // Email removed from whitelist, logout
            await logout();
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          await logout();
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  // OTP-based login for whitelisted users
  const login = async (email: string, password: string) => {
    try {
      // Admin email whitelist - only these emails can access admin panel
      const ADMIN_EMAILS = [
        'taheeratorganic@gmail.com',
        'admin@busmo.io',
        'majnuncode@gmail.com',
        'sxeedtxheer@gmail.com',
        'ahmedusmus@gmail.com',
        'majnun@busmo.io',
        'victoria@busmo.io'
      ];
      
      // Check if email is in the hardcoded super admin whitelist
      const isSuperAdmin = ADMIN_EMAILS.includes(email);
      
      // If not in whitelist, check Firestore adminUsers for support_admin
      if (!isSuperAdmin) {
        try {
          const { firestore } = initializeFirebase();
          const adminUsersRef = collection(firestore, 'adminUsers');
          const q = query(adminUsersRef, where('email', '==', email), where('status', '==', 'active'));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const adminDoc = snapshot.docs[0];
            const adminData = adminDoc.data();
            if (adminData.role === 'support_admin') {
              // Support admin found in Firestore — allow login
              return { 
                success: true, 
                requiresOtp: true,
                message: 'Please check your email for OTP verification'
              };
            }
          }
        } catch (firestoreError) {
          console.warn('Firestore check failed, falling back to whitelist only:', firestoreError);
        }
      }
      
      if (!isSuperAdmin) {
        return { 
          success: false, 
          error: 'Your account doesn\'t have admin access. Please contact support if you believe this is an error.' 
        };
      }
      
      // For whitelisted users, return success and trigger OTP flow
      // Password is ignored - OTP is required for actual authentication
      return { 
        success: true, 
        requiresOtp: true,
        message: 'Please check your email for OTP verification'
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Invalid email or password' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // In a real application, this would make an API call to logout
      // For example: await fetch('/api/admin/auth/logout', { method: 'POST' });
      // 
      // Remove token or session from localStorage or cookies
      // localStorage.removeItem('admin_token');
      
      // Mock logout
      setIsAuthenticated(false);
      setUser(null);
      
      // Remove mock authentication from localStorage
      localStorage.removeItem('admin_authenticated');
      localStorage.removeItem('admin_user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Check if user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  // Check if current user is admin
  const isAdmin = (): boolean => {
    if (!user) return false;
    return user.role === 'Administrator';
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    hasPermission,
    isAdmin
  };
};

// Export standalone function for direct imports
export const checkIsAdmin = async (): Promise<boolean> => {
  const storedUser = localStorage.getItem('admin_user');
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    // Accept super admin (from whitelist) or support admin (from AdminTeam)
    if (parsedUser.role === 'Administrator' || parsedUser.role === 'Support Admin') {
      // For super admins, verify email is still in whitelist
      if (parsedUser.role === 'Administrator') {
        const ADMIN_EMAILS = [
          'taheeratorganic@gmail.com',
          'admin@busmo.io',
          'majnuncode@gmail.com',
          'sxeedtxheer@gmail.com',
          'ahmedusmus@gmail.com',
          'majnun@busmo.io',
          'victoria@busmo.io'
        ];
        return ADMIN_EMAILS.includes(parsedUser.email);
      }
      // Support admins are already validated via Firestore in AdminTeam
      return true;
    }
  }
  return false;
};

// Require admin access - throws error if not authorized
export const requireAdmin = async (): Promise<void> => {
  const hasAdminAccess = await checkIsAdmin();
  if (!hasAdminAccess) {
    throw new Error('Admin access required');
  }
};
