
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
}

interface AdminContextType {
  menuItems: Record<string, MenuItem[]>;
  addMenuItem: (item: Omit<MenuItem, "id">) => void;
  updateMenuItem: (item: MenuItem) => void;
  removeMenuItem: (id: number, category: string) => void;
  isInitialized: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

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

  const addMenuItem = (item: Omit<MenuItem, "id">) => {
    const newItem: MenuItem = {
      ...item,
      id: generateId()
    };

    setMenuItems(prev => ({
      ...prev,
      [item.category]: [...(prev[item.category] || []), newItem]
    }));
    
    toast.success(`${item.name} added to menu`);
  };

  const updateMenuItem = (item: MenuItem) => {
    setMenuItems(prev => {
      const updatedItems = { ...prev };
      
      Object.keys(updatedItems).forEach(category => {
        if (category === item.category) {
          updatedItems[category] = updatedItems[category].map(menuItem => 
            menuItem.id === item.id ? item : menuItem
          );
        } else {
          // Remove item from old category if it was moved
          updatedItems[category] = updatedItems[category].filter(menuItem => 
            menuItem.id !== item.id
          );
        }
      });
      
      return updatedItems;
    });
    
    toast.success(`${item.name} updated`);
  };

  const removeMenuItem = (id: number, category: string) => {
    setMenuItems(prev => {
      const updatedItems = { ...prev };
      const itemToRemove = updatedItems[category].find(item => item.id === id);
      
      if (itemToRemove) {
        updatedItems[category] = updatedItems[category].filter(item => item.id !== id);
        toast.success(`${itemToRemove.name} removed from menu`);
      }
      
      return updatedItems;
    });
  };

  return (
    <AdminContext.Provider value={{
      menuItems,
      addMenuItem,
      updateMenuItem,
      removeMenuItem,
      isInitialized
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
