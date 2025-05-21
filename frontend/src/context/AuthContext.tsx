
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

interface User {
  email: string;
  name: string;
  isAdmin: boolean;
  isDeliveryBoy: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  register: (name: string, email: string, password: string) => boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isDeliveryBoy: boolean;
  users: { name: string; email: string; password: string; isAdmin: boolean; isDeliveryBoy: boolean }[];
  updateUserProfile: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<{ name: string; email: string; password: string; isAdmin: boolean; isDeliveryBoy: boolean }[]>(() => {
    const savedUsers = localStorage.getItem("users");
    const initialUsers = savedUsers ? JSON.parse(savedUsers) : [];
    
    // Ensure admin exists in the users list
    if (!initialUsers.some(user => user.email === "admin@example.com")) {
      initialUsers.push({
        name: "Admin",
        email: "admin@example.com",
        password: "admin123",
        isAdmin: true,
        isDeliveryBoy: false
      });
    }
    
    // Add a delivery boy account if it doesn't exist
    if (!initialUsers.some(user => user.email === "delivery@example.com")) {
      initialUsers.push({
        name: "Delivery Boy",
        email: "delivery@example.com",
        password: "delivery123",
        isAdmin: false,
        isDeliveryBoy: true
      });
    }
    
    // Ensure regular user exists
    if (!initialUsers.some(user => user.email === "user@example.com")) {
      initialUsers.push({
        name: "User",
        email: "user@example.com",
        password: "password",
        isAdmin: false,
        isDeliveryBoy: false
      });
    }
    
    return initialUsers;
  });
  
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("users", JSON.stringify(users));
  }, [users]);

  const login = (email: string, password: string): boolean => {
    // Find user in users array
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      setUser({
        email: foundUser.email,
        name: foundUser.name,
        isAdmin: foundUser.isAdmin,
        isDeliveryBoy: foundUser.isDeliveryBoy
      });
      
      toast.success(`Welcome back, ${foundUser.name}!`);
      return true;
    }
    
    toast.error("Invalid credentials");
    return false;
  };

  const register = (name: string, email: string, password: string): boolean => {
    // Check if email already exists
    if (users.some(u => u.email === email)) {
      toast.error("This email is already registered");
      return false;
    }
    
    // Check if this is a delivery boy email (ends with @delivery.com)
    const isDeliveryBoyEmail = email.toLowerCase().endsWith('@delivery.com');
    
    // Add new user
    const newUser = {
      name,
      email,
      password,
      isAdmin: false,
      isDeliveryBoy: isDeliveryBoyEmail
    };
    
    setUsers(prev => [...prev, newUser]);
    
    // Auto login after registration
    setUser({
      email: newUser.email,
      name: newUser.name,
      isAdmin: newUser.isAdmin,
      isDeliveryBoy: newUser.isDeliveryBoy
    });
    
    toast.success("Registration successful!");
    return true;
  };

  const logout = () => {
    setUser(null);
    toast.info("Logged out successfully");
  };
  
  const updateUserProfile = (name: string) => {
    if (!user) return;
    
    // Update the current user's name
    setUser({
      ...user,
      name
    });
    
    // Also update in the users array for persistence
    setUsers(prevUsers => 
      prevUsers.map(u => 
        u.email === user.email ? { ...u, name } : u
      )
    );
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      register,
      isAuthenticated: !!user,
      isAdmin: user?.isAdmin || false,
      isDeliveryBoy: user?.isDeliveryBoy || false,
      users,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
