import axios from 'axios';

import { MenuItem } from '@/types/menu';

export const categories = {
  starters: 'Starters',
  mainCourse: 'Main Course',
  desserts: 'Desserts',
  beverages: 'Beverages'
};

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const response = await api.get<MenuItem[]>('/menu');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch menu items';
  }
};

export const getMenuItemById = async (id: number): Promise<MenuItem> => {
  try {
    const response = await api.get(`/menu/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch menu item';
  }
};

export const deleteMenuItem = async (id: number): Promise<void> => {
  try {
    await api.delete(`/menu/${id}`);
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete menu item';
  }
};

export const filterByCategory = (items: MenuItem[], category: string): MenuItem[] => {
  if (!items) return [];
  return category === 'all' ? items : items.filter(item => item.category === category);
};
