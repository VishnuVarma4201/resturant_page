
import React, { useState } from "react";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Banknote, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const Checkout = () => {
  const { cartItems, getCartTotal, placeOrder } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Format price in Indian Rupees
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handlePlaceOrder = () => {
    if (!address) {
      toast.error("Please enter your delivery address");
      return;
    }
    
    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }
    
    if (paymentMethod === "card" || paymentMethod === "upi") {
      setShowOtp(true);
      // Simulate sending OTP to user's phone
      toast.info("OTP sent to your phone number", {
        description: "Use 1234 for demo purposes"
      });
    } else {
      completeOrder();
    }
  };
  
  const verifyOtp = () => {
    setIsProcessing(true);
    setTimeout(() => {
      if (otp === "1234") {
        completeOrder();
      } else {
        toast.error("Invalid OTP. Please try again.");
        setIsProcessing(false);
      }
    }, 1500);
  };
  
  const completeOrder = () => {
    setIsProcessing(true);
    setTimeout(() => {
      placeOrder(user.email, cartItems, getCartTotal(), address, phone, paymentMethod);
      toast.success("Order placed successfully!");
      navigate("/delivery-tracking");
    }, 1500);
  };

  if (cartItems.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen pt-24 pb-16">
          <div className="container-custom">
            <SectionHeading title="Checkout" subtitle="Review Your Order" />
            <div className="text-center py-10">
              <p className="text-gray-500">Your cart is empty. <Link to="/menu" className="text-burgundy hover:underline">Browse our menu</Link> to add items.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container-custom">
          <SectionHeading title="Checkout" subtitle="Review Your Order" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            {/* Order Summary */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4">Order Summary</h3>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded overflow-hidden">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {item.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                      <TableCell className="text-right">{formatPrice(item.price * item.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal:</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee:</span>
                  <span>{formatPrice(50)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>{formatPrice(getCartTotal() * 0.05)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-burgundy">{formatPrice(getCartTotal() + 50 + (getCartTotal() * 0.05))}</span>
                </div>
              </div>
            </div>
            
            {/* Contact & Payment Information */}
            <div>
              {!showOtp ? (
                <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                  <h3 className="text-xl font-bold mb-4">Delivery & Payment</h3>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center">
                      <MapPin size={18} className="mr-2" /> Delivery Address
                    </h4>
                    <Input 
                      placeholder="Enter your full address" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center">
                      <Phone size={18} className="mr-2" /> Contact Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input 
                          value={user?.name || ""}
                          readOnly
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Name</p>
                      </div>
                      <div>
                        <Input 
                          value={user?.email || ""}
                          readOnly
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email</p>
                      </div>
                    </div>
                    <div>
                      <Input 
                        placeholder="Phone Number" 
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">For delivery updates and OTP</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Payment Method</h4>
                    <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
                      <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="cash" className="flex items-center justify-center">
                          <Banknote size={16} className="mr-2" /> Cash on Delivery
                        </TabsTrigger>
                        <TabsTrigger value="card" className="flex items-center justify-center">
                          <CreditCard size={16} className="mr-2" /> Card/UPI
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="cash" className="mt-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-sm">Pay with cash upon delivery. Our delivery executive will carry change.</p>
                          <div className="mt-2 flex items-start gap-2 text-xs text-gray-600">
                            <span className="inline-block mt-0.5 bg-green-100 rounded-full w-1.5 h-1.5"></span>
                            <span>No extra charges for Cash on Delivery</span>
                          </div>
                          <div className="mt-1 flex items-start gap-2 text-xs text-gray-600">
                            <span className="inline-block mt-0.5 bg-green-100 rounded-full w-1.5 h-1.5"></span>
                            <span>Delivery person will verify OTP at the time of delivery</span>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="card" className="mt-4 space-y-4">
                        <RadioGroup defaultValue="card" className="space-y-3">
                          <div className="flex items-center space-x-2 border rounded-md p-3">
                            <RadioGroupItem value="card" id="card-payment" />
                            <Label htmlFor="card-payment" className="font-normal cursor-pointer flex-1">
                              Credit/Debit Card
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-md p-3">
                            <RadioGroupItem value="upi" id="upi-payment" />
                            <Label htmlFor="upi-payment" className="font-normal cursor-pointer flex-1">
                              UPI Payment
                            </Label>
                          </div>
                        </RadioGroup>
                        
                        <div className="space-y-3">
                          <Input placeholder="Card Number / UPI ID" />
                          <div className="grid grid-cols-2 gap-3">
                            <Input placeholder="MM/YY" />
                            <Input placeholder="CVV" />
                          </div>
                          <p className="text-xs text-gray-500">Secure payment processing. You'll receive an OTP for verification.</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  <div className="pt-4 space-y-3">
                    <Button className="w-full" onClick={handlePlaceOrder} disabled={isProcessing}>
                      {isProcessing ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </div>
                      ) : (
                        "Place Order"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
                  <h3 className="text-xl font-bold mb-4">OTP Verification</h3>
                  <p className="text-gray-600">Enter the OTP sent to your phone number to complete the payment.</p>
                  
                  <div className="space-y-3 flex flex-col items-center">
                    <Label htmlFor="otp" className="self-start">One-Time Password (OTP)</Label>
                    <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                    </InputOTP>
                    <p className="text-xs text-gray-500 self-start mt-2">For demo, use: 1234</p>
                  </div>
                  
                  <div className="pt-4 space-y-3">
                    <Button className="w-full" onClick={verifyOtp} disabled={isProcessing}>
                      {isProcessing ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verifying...
                        </div>
                      ) : (
                        "Verify & Complete Order"
                      )}
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setShowOtp(false)} disabled={isProcessing}>
                      Back to Payment
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
