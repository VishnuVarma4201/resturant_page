import { createContext, useContext, useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { User, UserResponse, transformUser } from '@/types/user';

interface AuthContextType {
  user: UserResponse | null;
  users: UserResponse[];
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDeliveryBoy: boolean;
  loading: boolean;
  fetchDeliveryBoys: () => Promise<UserResponse[]>;
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
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
}

// Setup axios instance with updated config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Configure axios
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  if (token && token !== 'null' && token !== 'undefined') {
    const cleanToken = token.replace('Bearer ', '').trim();
    config.headers.Authorization = `Bearer ${cleanToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
    try {
      const token = localStorage.getItem('token');
      if (!token) return [];      const { data } = await api.get('/users/delivery-boys', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        const deliveryBoys = data.users.map(transformUser);
        setUsers(prev => [...prev.filter(u => u.role !== 'delivery'), ...deliveryBoys]);
        return deliveryBoys;
      }
      return [];
    } catch (error) {
      console.error('Error fetching delivery boys:', error);
      return [];
    }
  };

  const validateToken = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token || token === 'null' || token === 'undefined') {
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }      const { data } = await api.get('/auth/validate', {
        headers: { Authorization: `Bearer ${token.replace('Bearer ', '').trim()}` }
      });

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
    if (user?.role === 'admin') {
      fetchDeliveryBoys();
    }
  }, [user?.role]);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { 
        email, 
        password 
      });

      if (!data.success || !data.token) {
        throw new Error('Invalid login response');
      }

      // Store clean token
      const cleanToken = data.token.replace('Bearer ', '').trim();
      localStorage.setItem('token', cleanToken);
      setUser(transformUser(data.user));

    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await api.post('/auth/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setUser(response.data.user);
        return response.data;
      }
      throw new Error('Invalid response from server');
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.data?.message) {
        throw error.response.data.message;
      }
      throw 'Registration failed. Please try again.';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      users,
      login,
      register,
      logout,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isDeliveryBoy: user?.role === 'delivery',
      fetchDeliveryBoys
    }}>
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
