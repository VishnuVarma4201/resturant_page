import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAdminStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch admin stats';
  }
};

export const getAdminOrders = async () => {
  try {
    const response = await api.get('/admin/orders');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch orders';
  }
};

export const getDeliveryBoys = async () => {
  try {
    const response = await api.get('/delivery-boy');
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Failed to fetch delivery boys';
  }
};

export const addDeliveryBoy = async (data: {
  name: string;
  email: string;
  phone: string;
  password: string;
}) => {
  try {
    const response = await api.post('/delivery-boy/register', data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Failed to add delivery boy';
  }
};

export const updateDeliveryBoyStatus = async (id: string, status: string) => {
  try {
    const response = await api.put(`/delivery-boy/${id}/status`, { status });
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Failed to update delivery boy status';
  }
};

export const getReservations = async () => {
  try {
    const response = await api.get('/reservations/admin');
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Failed to fetch reservations';
  }
};

export const updateReservation = async (id: string, data: {
  status?: string;
  tableNumber?: string;
}) => {
  try {
    const response = await api.patch(`/reservations/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Failed to update reservation';
  }
};

export const deleteReservation = async (id: string) => {
  try {
    const response = await api.delete(`/reservations/${id}`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Failed to delete reservation';
  }
};
