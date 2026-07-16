import { useEffect, useState } from 'react';

// Define admin user type with permissions and lastLogin
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  lastLogin?: string;
}

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
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock authentication status
      const mockIsAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
      
      setIsAuthenticated(mockIsAuthenticated);
      
      if (mockIsAuthenticated) {
        // Get user data from localStorage
        const storedUser = localStorage.getItem('admin_user');
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
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
  const login = async (email: string, password: string) => {
    try {
      // In a real application, this would make an API call to login
      // For example: const response = await fetch('/api/admin/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Login failed');
      // }
      // 
      // const data = await response.json();
      // 
      // // Set authentication status and user
      // setIsAuthenticated(true);
      // setUser(data.user);
      // 
      // // Store token or session in localStorage or cookies
      // localStorage.setItem('admin_token', data.token);
      
      // Admin email whitelist - only these emails can access admin panel
      const ADMIN_EMAILS = [
        'taheeratorganic@gmail.com',
        'admin@busmo.io',
        'majnuncode@gmail.com',
        'sxeedtxheer@gmail.com'
      ];
      
      if (!ADMIN_EMAILS.includes(email)) {
        return { 
          success: false, 
          error: 'Your account doesn\'t have admin access. Please contact support if you believe this is an error.' 
        };
      }
      
      // Mock login success
      setIsAuthenticated(true);
      
      const mockUser: AdminUser = {
        id: 'admin_123',
        name: 'Busmo Admin',
        email,
        role: 'Administrator',
        permissions: ['read_support', 'write_support', 'read_users', 'write_users'],
        lastLogin: new Date().toISOString()
      };
      
      setUser(mockUser);
      
      // Store mock authentication in localStorage
      localStorage.setItem('admin_authenticated', 'true');
      localStorage.setItem('admin_user', JSON.stringify(mockUser));
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setIsAuthenticated(false);
      setUser(null);
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

// Check if user has admin role
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
  // Simulate checking admin status from storage
  const storedUser = localStorage.getItem('admin_user');
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    return parsedUser.role === 'Administrator';
  }
  return false;
};
