import { createContext, useContext, useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { User, UserResponse, transformUser } from '@/types/user';

interface AuthContextType {
  user: UserResponse | null;
  users: UserResponse[];
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  googleLogin: (credential: string) => Promise<AuthResponse>;
  twitterLogin: (oauthToken: string, oauthVerifier: string) => Promise<AuthResponse>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDeliveryBoy: boolean;
  loading: boolean;
  fetchDeliveryBoys: () => Promise<{ deliveryBoys: { id: string; name: string; email: string; phone: string; }[] }>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: UserResponse;
}

// Setup axios instance with base config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Configure axios interceptors
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'null' && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Don't redirect if we're already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchDeliveryBoys = async () => {
    try {      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');      const response = await api.get('/delivery-boy');
      const deliveryBoys = response.data || [];
      return {
        deliveryBoys: deliveryBoys.map((db: any) => ({
          id: db._id,
          name: db.name,
          email: db.email,
          phone: db.phone,
          status: db.status || 'active',
          isAvailable: db.isAvailable || false,
          currentLocation: db.currentLocation,
          rating: db.ratings?.average || 0,          totalDeliveries: db.performance?.totalDeliveries || 0
        }))
      };
    } catch (error) {
      console.error('Error fetching delivery boys:', error);
      throw error;
    }
  };

  const validateToken = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const { data } = await api.get<{ user: UserResponse }>('/auth/validate');

      if (data.user) {
        setUser(transformUser(data.user));
      }
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateToken();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDeliveryBoys();
    }
  }, [user?.role]);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { 
        email, 
        password 
      });

      if (!data.success || !data.token) {
        throw new Error('Invalid login response');
      }

      localStorage.setItem('token', data.token);
      setUser(transformUser(data.user));
      
      // Update axios default header
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

      return data;
    } catch (error) {
      console.error('Login error:', error);
      localStorage.removeItem('token');
      setUser(null);
      throw error;
    }
  };
  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', userData);

      if (!data.token) {
        throw new Error('Registration failed: No token received');
      }

      // Add success flag if not present
      return {
        ...data,
        success: true
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error instanceof Error ? error : new Error('Registration failed. Please try again.');
    }
  };

  const googleLogin = async (credential: string): Promise<AuthResponse> => {
    try {
      setLoading(true);
      const response = await api.post<AuthResponse>('/auth/google', { credential });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser(transformUser(response.data.user));
        return response.data;
      }
      throw new Error('No token received from server');
    } catch (error: any) {
      console.error('Google login error:', error);
      const errorMessage = error.response?.data?.message || "Failed to authenticate with Google";
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const twitterLogin = async (oauthToken: string, oauthVerifier: string): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/auth/twitter/callback', {
        oauth_token: oauthToken,
        oauth_verifier: oauthVerifier
      });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      console.error('Twitter login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  const contextValue: AuthContextType = {
    user,
    users,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDeliveryBoy: user?.role === 'delivery',
    fetchDeliveryBoys,
    googleLogin,
    twitterLogin
  };

  return (
    <AuthContext.Provider value={contextValue}>
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
