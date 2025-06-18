import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

export interface MenuItem {
  _id: string;  // MongoDB document ID
  id?: number;    // Keep both for backward compatibility during migration
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  createdAt?: string; // Add createdAt field
}

interface Order {
  _id: string;
  items: any[];
  total: number;
  status: string;
  date: string;
  email: string;
  deliveryAddress: string;
  phone: string;
  deliveryBoyId?: string;
}

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface DeliveryBoy {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  rating: number;
  totalDeliveries: number;
}

interface AdminContextType {
  menuItems: Record<string, MenuItem[]>;
  addMenuItem: (item: Omit<MenuItem, "id">) => Promise<any>;
  updateMenuItem: (item: MenuItem) => Promise<any>;
  removeMenuItem: (id: string, category: string) => Promise<void>;
  isInitialized: boolean;
  orders: Order[];
  stats: Stats;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  assignDeliveryBoy: (orderId: string, deliveryBoyId: string) => Promise<void>;
  deliveryBoys: DeliveryBoy[];
  fetchDeliveryBoys: () => Promise<void>;
  updateDeliveryBoyStatus: (id: string, status: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const initialState = {
  menuItems: { starters: [], mainCourse: [], desserts: [], beverages: [] },
  addMenuItem: () => {},
  updateMenuItem: () => {},
  removeMenuItem: () => {},
  isInitialized: false,
  orders: [],
  stats: {
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  },
  updateOrderStatus: async () => {},
  assignDeliveryBoy: async () => {}
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState<boolean>(() => {
    return localStorage.getItem("menuInitialized") === "true";
  });
  
  // Initialize menuItems from localStorage if available, otherwise use empty categories
  const [menuItems, setMenuItems] = useState<Record<string, MenuItem[]>>(() => {
    const savedMenuItems = localStorage.getItem("menuItems");
    return savedMenuItems ? JSON.parse(savedMenuItems) : { starters: [], mainCourse: [], desserts: [], beverages: [] };
  });

  // Save menuItems to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("menuItems", JSON.stringify(menuItems));
  }, [menuItems]);

  // Mark as initialized (but don't load any initial data)
  useEffect(() => {
    if (!isInitialized) {
      localStorage.setItem("menuInitialized", "true");
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const generateId = (): number => {
    const allItems = Object.values(menuItems).flat();
    return allItems.length > 0 
      ? Math.max(...allItems.map(item => item.id)) + 1 
      : 1;
  };
  const addMenuItem = async (item: Omit<MenuItem, "id">) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await axios.post(
        'http://localhost:5000/api/menu',
        {
          ...item,
          // Ensure proper category case
          category: item.category.charAt(0).toUpperCase() + item.category.slice(1),
          // Ensure price is a number
          price: parseFloat(item.price as any),
          // Ensure strings are properly trimmed
          name: item.name.trim(),
          description: item.description.trim(),
          image: item.image.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token.replace('Bearer ', '').trim()}`
          }
        }
      );

      // The API returns the item directly, not wrapped in a success property
      const newItem = response.data;
      setMenuItems(prev => ({
        ...prev,
        [newItem.category]: [...(prev[newItem.category] || []), newItem]
      }));
      return newItem;
    } catch (error: any) {
      console.error('Error adding menu item:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to add menu item');
    }
  };

  const updateMenuItem = async (item: MenuItem) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await axios.put(
        `http://localhost:5000/api/menu/items/${item._id}`,
        {
          name: item.name.trim(),
          description: item.description.trim(),
          image: item.image.trim(),
          price: parseFloat(item.price as any),
          category: item.category
        },
        {
          headers: {
            Authorization: `Bearer ${token.replace('Bearer ', '').trim()}`
          }
        }
      );

      const updatedItem = response.data;
      setMenuItems(prev => {
        const updatedItems = { ...prev };
        
        Object.keys(updatedItems).forEach(category => {
          if (category === updatedItem.category) {
            updatedItems[category] = updatedItems[category].map(menuItem => 
              menuItem._id === updatedItem._id ? updatedItem : menuItem
            );
          } else {
            // Remove item from old category if it was moved
            updatedItems[category] = updatedItems[category].filter(menuItem => 
              menuItem._id !== updatedItem._id
            );
          }
        });
        
        return updatedItems;
      });
      
      toast.success(`${updatedItem.name} updated successfully`);
      return updatedItem;
    } catch (error: any) {
      console.error('Error updating menu item:', error);
      const errorMsg = error.response?.data?.message || 'Failed to update menu item';
      toast.error(errorMsg);
      throw error;
    }
  };
  const removeMenuItem = async (id: string, category: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      await axios.delete(
        `http://localhost:5000/api/menu/items/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token.replace('Bearer ', '').trim()}`
          }
        }
      );

      setMenuItems(prev => {
        const updatedItems = { ...prev };
        const itemToRemove = updatedItems[category].find(item => item._id === id);
        
        if (itemToRemove) {
          updatedItems[category] = updatedItems[category].filter(item => item._id !== id);
          toast.success(`${itemToRemove.name} removed from menu`);
        }
        
        return updatedItems;
      });
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item');
      throw error;
    }
  };

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>(initialState.stats);
  const [error, setError] = useState<string | null>(null);  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/admin/orders/${orderId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token?.replace('Bearer ', '').trim()}`
          }
        }
      );
      
      if (response.data.success) {
        setOrders(prev => prev.map(order => 
          (order._id === orderId) ? { ...order, status } : order
        ));
        toast.success('Order status updated successfully');
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    }
  };  const assignDeliveryBoy = async (orderId: string, deliveryBoyId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/admin/orders/${orderId}/assign`,
        { deliveryBoyId },
        {
          headers: {
            Authorization: `Bearer ${token?.replace('Bearer ', '').trim()}`
          }
        }
      );
      
      if (response.data.success) {
        const updatedOrder = response.data.order;
        setOrders(prev => prev.map(order => 
          order._id === orderId ? { ...order, assignedTo: updatedOrder.assignedTo, status: updatedOrder.status } : order
        ));
        toast.success('Delivery boy assigned successfully');      }
    } catch (error: any) {
      console.error('Failed to assign delivery boy:', error);
      const errorMessage = error.response?.data?.message || 'Failed to assign delivery boy';
      toast.error(errorMessage);
      throw error;
    }
  };

  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);

  const fetchDeliveryBoys = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/delivery-boy', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setDeliveryBoys(response.data);
    } catch (error: any) {
      console.error('Error fetching delivery boys:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch delivery boys');
    }
  };

  // Add this inside useEffect in the AdminProvider:
  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  // Add to the context value:
  const value = {
    menuItems,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    isInitialized,
    orders,
    stats,
    updateOrderStatus,
    assignDeliveryBoy,
    deliveryBoys,
    fetchDeliveryBoys,
    updateDeliveryBoyStatus: async (id: string, status: string) => {
      try {
        await axios.put(
          `http://localhost:5000/api/delivery-boy/${id}/status`,
          { status },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        await fetchDeliveryBoys();
        toast.success('Delivery boy status updated successfully');
      } catch (error: any) {
        console.error('Error updating delivery boy status:', error);
        toast.error(error.response?.data?.message || 'Failed to update status');
      }
    }
  };

  useEffect(() => {
    // Fetch initial orders and stats
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || token === 'null' || token === 'undefined') {
          setError('No authentication token found');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/admin/dashboard', {
          headers: {
            Authorization: `Bearer ${token.replace('Bearer ', '').trim()}`
          }
        });

        if (response.data) {
          setOrders(response.data.orders || []);
          setStats(response.data.stats || initialState.stats);
          setError(null);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            setError('Please login with admin credentials');
          } else {
            setError('Failed to fetch admin data. Please try again.');
          }
        }
        console.error('Failed to fetch admin data:', error);
      }
    };

    fetchData();
  }, []);
  return (
    <AdminContext.Provider value={{
      menuItems,
      addMenuItem,
      updateMenuItem,
      removeMenuItem,
      isInitialized,
      orders,
      stats,
      updateOrderStatus,
      assignDeliveryBoy,
      deliveryBoys,
      fetchDeliveryBoys,
      updateDeliveryBoyStatus: async (id: string, status: string) => {
        try {
          await axios.put(
            `http://localhost:5000/api/delivery-boy/${id}/status`,
            { status },
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          );
          await fetchDeliveryBoys();
          toast.success('Delivery boy status updated successfully');
        } catch (error: any) {
          console.error('Error updating delivery boy status:', error);
          toast.error(error.response?.data?.message || 'Failed to update status');
        }
      }
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};
