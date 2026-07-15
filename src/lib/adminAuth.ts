// src/lib/adminAuth.ts
import { useEffect, useState } from 'react';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminAuth {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// In a real application, this would connect to an authentication service
export function useAdminAuth(): AdminAuth {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on component mount
  useEffect(() => {
    // In a real app, this would check a token or session
    // For demo purposes, we'll just use a timeout
    setTimeout(() => {
      // Check if user is already logged in (e.g., from localStorage)
      const storedUser = localStorage.getItem('adminUser');
      
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      
      setIsLoading(false);
    }, 500);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // In a real application, this would call an authentication API
    // For demo purposes, we'll just use a mock authentication
    
    setIsLoading(true);
    
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock successful login
        if (email === 'admin@example.com' && password === 'password') {
          const mockUser: AdminUser = {
            id: 'admin_1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin'
          };
          
          setUser(mockUser);
          localStorage.setItem('adminUser', JSON.stringify(mockUser));
          setIsLoading(false);
          resolve(true);
        } else {
          // Mock failed login
          setIsLoading(false);
          resolve(false);
        }
      }, 1000);
    });
  };

  const logout = () => {
    // In a real application, this would invalidate the token/session
    setUser(null);
    localStorage.removeItem('adminUser');
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  };
}