
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import LoadingAnimation from "@/components/LoadingAnimation";
import { useCart } from "@/context/CartContext";

const Cart = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart();
  
  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Format price in Indian Rupees
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checking out.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate processing delay before navigating to checkout
    setTimeout(() => {
      setIsProcessing(false);
      navigate("/checkout");
    }, 500);
  };
  
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  
  const tax = subtotal * 0.05; // 5% GST
  const deliveryFee = subtotal > 0 ? 50 : 0; // ₹50 delivery fee
  const total = subtotal + tax + deliveryFee;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100 
      }
    }
  };

  if (isLoading) {
    return <LoadingAnimation text="Loading your cart..." />;
  }

  return (
    <Layout>
      <div className="w-full min-h-screen pt-24 pb-16">
        <div className="container-custom">
          <SectionHeading
            title="Your Cart"
            subtitle="Review your items before checkout"
          />
          
          {cartItems.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div className="lg:col-span-2" variants={itemVariants}>
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold">Cart Items</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearCart}
                        disabled={cartItems.length === 0}
                      >
                        Clear Cart
                      </Button>
                    </div>
                    
                    <div className="space-y-6">
                      {cartItems.map((item) => (
                        <motion.div
                          key={item.id}
                          className="flex items-center justify-between border-b border-gray-200 pb-4"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ type: "spring", stiffness: 100 }}
                        >
                          <div className="flex items-center">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded mr-4"
                            />
                            <div>
                              <h4 className="font-semibold">{item.name}</h4>
                              <p className="text-burgundy">{formatPrice(item.price)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="flex items-center mr-4">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="mx-2">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500"
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <div className="bg-white shadow-lg rounded-lg overflow-hidden p-6">
                  <h3 className="text-xl font-bold mb-6">Order Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>GST (5%)</span>
                      <span>{formatPrice(tax)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span>{formatPrice(deliveryFee)}</span>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                    </div>
                    
                    <Button
                      className="w-full mt-6"
                      onClick={proceedToCheckout}
                      disabled={isProcessing || cartItems.length === 0}
                    >
                      {isProcessing ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </div>
                      ) : "Proceed to Checkout"}
                    </Button>
                    
                    <Link to="/menu">
                      <Button variant="outline" className="w-full">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground" />
              <h3 className="text-xl font-semibold mt-4 mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">Add items to your cart to proceed with checkout</p>
              <Link to="/menu">
                <Button>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Browse Menu
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
