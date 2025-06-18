import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

export interface CartItem {
  id: string | number;  // Support both MongoDB _id and numeric id
  name: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
}

export interface OrderReview {
  rating: number;
  comment: string;
  tip: number;
}

export interface Order {
  id: string;
  email: string;
  items: CartItem[];
  date: string;
  total: number;
  status: "placed" | "accepted" | "assigned" | "delivering" | "delivered" | "cancelled";
  otp: string;
  assignedTo?: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    location?: {
      type: string;
      coordinates: [number, number];
    };
  };
  currentLocation?: {
    type: string;
    coordinates: [number, number];
    lastUpdated: Date;
  };
  locationHistory?: {
    coordinates: [number, number];
    timestamp: Date;
  }[];
  deliveryPhone: string;
  paymentMethod: string;
  paymentStatus: "pending" | "completed";
  estimatedDeliveryTime?: {
    start: Date;
    end: Date;
  };
  review?: OrderReview;
  deliveredAt?: Date;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartTotal: () => number;
  placeOrder: (email: string, items: CartItem[], total: number, address: { street: string; city: string; state: string; zipCode: string }, phone: string, paymentMethod: string) => void;
  orders: Order[];
  getUserOrders: (email: string) => Promise<Order[]>;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  assignDeliveryBoy: (orderId: string, deliveryBoyId: string) => void;
  getDeliveryBoyOrders: (deliveryBoyId: string) => Promise<Order[]>;
  verifyDeliveryOtp: (orderId: string, enteredOtp: string) => boolean;
  addOrderReview: (orderId: string, rating: number, comment: string, tip: number) => void;
  getPendingOrders: () => Promise<Order[]>;
}



const CartContext = createContext<CartContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:5000/api/orders';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  return { 
    Authorization: `Bearer ${token.trim()}`,
    'Content-Type': 'application/json'
  };
};

const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch orders when component mounts
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const headers = getAuthHeader();
        if (!headers || !user) return;

        let endpoint = `${API_BASE_URL}/myorders`; // Default for regular users
        if (user.role === 'admin') {
          endpoint = API_BASE_URL; // Admin endpoint for all orders
        }

        const response = await axios.get(endpoint, { headers });
        setOrders(response.data.orders || response.data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        if (axios.isAxiosError(error) && error.response?.status === 403) {
          toast.error('Not authorized to view these orders');
        }
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);


  // Update placeOrder function
  const placeOrder = async (email: string, items: CartItem[], total: number, address1 , phone: string, paymentMethod: string,) => {
    console.log(items);
    const address2 = address1.split(',');
    const address = {
      street: address2[0]?.trim() || '',
      city: address2[1]?.trim() || '',
      state: address2[2]?.trim() || '',
      zipCode: address2[3]?.trim() || ''
    };
    setIsLoading(true);
    try {
      const headers = getAuthHeader();
      if (!headers) {
        toast.error('Please login to place an order');
        return;
      }

      // Validate address components
      if (!address.street || !address.city || !address.state || !address.zipCode) {
        toast.error('All address fields are required');
        return;
      }      const orderPayload = {
        items: items.map(item => ({
          id: item.id.toString(), // Ensure id is a string
          menuItem: typeof item.id === 'string' ? item.id : String(item.id), // Use the ID directly if it's a string (MongoDB _id)
          quantity: item.quantity
        })),
        deliveryAddress: address,
        deliveryPhone: phone,
        paymentMethod: paymentMethod.toLowerCase(),
        totalAmount: total
      };

      const response = await axios.post(
        `${API_BASE_URL}/place`,
        orderPayload,
        { headers }
      );

      if (response.data) {
        const newOrder: Order = {
          id: response.data._id,
          email,
          items,
          date: response.data.createdAt,
          total: response.data.totalAmount,
          status: response.data.status || 'pending',
          otp: response.data.otp || '',
          assignedTo: response.data.assignedTo || undefined,
          deliveryAddress: address,
          deliveryPhone: phone.startsWith('+91') ? phone : `+91${phone}`,
          paymentMethod: response.data.paymentMethod,
          paymentStatus: response.data.paymentStatus || 'pending'
        };
        
        setOrders(prevOrders => [...prevOrders, newOrder]);
        clearCart();
        toast.success("Order placed successfully!");
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      if (error.response?.data?.errors) {
        // Show specific validation errors
        const validationErrors = error.response.data.errors
          .map((err: any) => err.msg)
          .join('\n• ');
        toast.error(`Validation errors:\n• ${validationErrors}`);
      } else {
        toast.error(error.response?.data?.message || 'Failed to place order');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update getUserOrders
  const getUserOrders = async (email: string) => {
    try {
      const headers = getAuthHeader();
      if (!headers) {
        toast.error('Please login to view orders');
        return [];
      }

      const response = await axios.get(`${API_BASE_URL}/myorders`, { headers });
      return response.data.orders || [];
    } catch (error) {
      console.error('Error fetching user orders:', error);
      toast.error('Failed to fetch orders');
      return [];
    }
  };

  // Update how we handle orders in components that use this context
  useEffect(() => {
    const fetchOrders = async () => {
      if (user?.email) {
        await getUserOrders(user.email);
      }
    };
    fetchOrders();
  }, [user]);

  // Update getPendingOrders to fetch from API
  const getPendingOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await axios.get(`${API_BASE_URL}/pending`, { headers: { Authorization: `Bearer ${token}` } });
      return response.data.orders || [];
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        toast.error('Not authorized to view pending orders');
      } else {
        toast.error('Failed to fetch pending orders');
      }
      return [];
    }
  };

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingItemIndex !== -1) {
        // Item already exists, update quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, { ...item, quantity: 1 }];
      }
    });
    
    toast.success(`${item.name} added to cart`);
  };
  const removeFromCart = (id: string | number) => {
    setCartItems(prevItems => {
      const itemToRemove = prevItems.find(item => item.id === id);
      const updatedItems = prevItems.filter(item => item.id !== id);
      
      if (itemToRemove) {
        toast.info(`${itemToRemove.name} removed from cart`);
      }
      
      return updatedItems;
    });
  };
  const updateQuantity = (id: string | number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    toast.info("Cart cleared");
  };

  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      await axios.put(`${API_BASE_URL}/status/${id}`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === id ? { ...order, status } : order
        )
      );
      
      toast.success(`Order ${status}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const assignDeliveryBoy = (orderId: string, deliveryBoyId: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, assignedTo: deliveryBoyId, status: "delivering" } : order
      )
    );
    
    toast.success("Delivery boy assigned to order");
  };

  const verifyDeliveryOtp = (orderId: string, enteredOtp: string) => {
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      toast.error("Order not found");
      return false;
    }
    
    if (order.otp === enteredOtp) {
      // Update the order status to delivered
      updateOrderStatus(orderId, "delivered");
      toast.success("OTP verified and order marked as delivered!");
      return true;
    } else {
      toast.error("Invalid OTP. Please try again.");
      return false;
    }
  };
  
  const addOrderReview = (orderId: string, rating: number, comment: string, tip: number) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              review: { rating, comment, tip } 
            } 
          : order
      )
    );
    
    toast.success("Thank you for your review!");
  };
  const getDeliveryBoyOrders = async (deliveryBoyId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await axios.get(`http://localhost:5000/api/delivery-boy/orders/${deliveryBoyId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching delivery boy orders:', error);
      toast.error('Failed to fetch delivery orders');
      return [];
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartCount,
      getCartTotal,
      placeOrder,
      orders,
      getUserOrders,
      updateOrderStatus,
      assignDeliveryBoy,
      getDeliveryBoyOrders,
      verifyDeliveryOtp,
      addOrderReview,
      getPendingOrders
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Fix the useCart export to be compatible with Fast Refresh
function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export { useCart, CartProvider };
