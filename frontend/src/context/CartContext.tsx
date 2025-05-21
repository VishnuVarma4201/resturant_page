
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  category: string;
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
  status: "pending" | "processing" | "out_for_delivery" | "completed" | "cancelled";
  otp: string;
  deliveryBoyId: string | null;
  deliveryAddress: string;
  phone: string;
  paymentMethod: string;
  review?: OrderReview;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartTotal: () => number;
  placeOrder: (email: string, items: CartItem[], total: number, address: string, phone: string, paymentMethod: string) => void;
  orders: Order[];
  getUserOrders: (email: string) => Order[];
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  assignDeliveryBoy: (orderId: string, deliveryBoyId: string) => void;
  getDeliveryBoyOrders: (deliveryBoyId: string) => Order[];
  verifyDeliveryOtp: (orderId: string, enteredOtp: string) => boolean;
  addOrderReview: (orderId: string, rating: number, comment: string, tip: number) => void;
  getPendingOrders: () => Order[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [orders, setOrders] = useState<Order[]>(() => {
    const savedOrders = localStorage.getItem("orders");
    return savedOrders ? JSON.parse(savedOrders) : [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

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

  const removeFromCart = (id: number) => {
    setCartItems(prevItems => {
      const itemToRemove = prevItems.find(item => item.id === id);
      const updatedItems = prevItems.filter(item => item.id !== id);
      
      if (itemToRemove) {
        toast.info(`${itemToRemove.name} removed from cart`);
      }
      
      return updatedItems;
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
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

  // Generate a random 4-digit OTP
  const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const placeOrder = (email: string, items: CartItem[], total: number, address: string, phone: string, paymentMethod: string) => {
    if (items.length === 0) {
      toast.error("Cannot place an empty order");
      return;
    }
    
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      email,
      items: [...items],
      date: new Date().toISOString(),
      total,
      status: "pending",
      otp: generateOTP(),
      deliveryBoyId: null,
      deliveryAddress: address,
      phone,
      paymentMethod
    };
    
    setOrders(prevOrders => [...prevOrders, newOrder]);
    clearCart();
    
    toast.success("Order placed successfully!");
    
    // In a real app, we would send an SMS with the OTP and order confirmation
    // For now, just show in toast
    toast.info("Order confirmation and OTP would be sent to your phone", {
      description: `Your OTP for order ${newOrder.id} is ${newOrder.otp}`
    });
  };

  const getUserOrders = (email: string) => {
    // Filter orders by user email - ensure users only see their own orders
    return orders.filter(order => order.email === email);
  };
  
  const getPendingOrders = () => {
    // Get all pending orders for admin to process
    return orders.filter(order => order.status === "pending");
  };

  const getDeliveryBoyOrders = (deliveryBoyId: string) => {
    // Filter orders assigned to this delivery boy or ready for pickup
    return orders.filter(order => 
      order.deliveryBoyId === deliveryBoyId || 
      // Also show orders that are processing and not yet assigned to any delivery boy
      (order.status === "processing" && !order.deliveryBoyId)
    );
  };

  const updateOrderStatus = (id: string, status: Order["status"]) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === id ? { ...order, status } : order
      )
    );
    
    const statusMessages = {
      "pending": "Order marked as pending",
      "processing": "Order is now being processed",
      "out_for_delivery": "Order is out for delivery",
      "completed": "Order has been completed",
      "cancelled": "Order has been cancelled"
    };
    
    toast.success(statusMessages[status]);
  };

  const assignDeliveryBoy = (orderId: string, deliveryBoyId: string) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, deliveryBoyId, status: "out_for_delivery" } : order
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
      // Update the order status to completed
      updateOrderStatus(orderId, "completed");
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

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
