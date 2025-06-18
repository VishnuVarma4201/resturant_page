import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import type { LoginFormData } from '@/types/auth';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string, isDeliveryBoy?: boolean) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDeliveryBoy: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check token validity on mount
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/validate', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const userData = response.data.data;
          setUser({
            ...userData,
            token,
            role: userData.role || 'user'
          });
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Token validation error:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, []);

  const login = async (email: string, password: string, isDeliveryBoy = false) => {
    try {
      const endpoint = isDeliveryBoy ? '/delivery-boy/login' : '/auth/login';
      const response = await api.post(endpoint, { email, password });
      const { token, user: userData, deliveryBoy } = response.data;

      localStorage.setItem('token', token);
      const userInfo = isDeliveryBoy ? {
        ...deliveryBoy,
        role: 'delivery'
      } : {
        ...userData,
        role: userData.role || 'user'
      };

      setUser({
        ...userInfo,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const googleLogin = async (credential: string) => {
    try {
      const response = await api.post('/auth/google', { credential });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      setUser({
        ...userData,
        token,
        role: userData.role || 'user'
      });
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const value = {
    user,
    login,
    googleLogin,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDeliveryBoy: user?.role === 'delivery',
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
