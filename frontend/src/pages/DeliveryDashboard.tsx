
import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Package, 
  Truck, 
  PhoneCall, 
  CheckCircle,
  Clock, 
  X,
  Calendar,
  AlertTriangle,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const { getDeliveryBoyOrders, updateOrderStatus, verifyDeliveryOtp } = useCart();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [deliveryOtp, setDeliveryOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState({ lat: 28.6139, lng: 77.2090 }); // Default location (New Delhi)

  useEffect(() => {
    if (user?.email) {
      const deliveryOrders = getDeliveryBoyOrders(user.email);
      setOrders(deliveryOrders);
    }
  }, [user, getDeliveryBoyOrders]);

  // Simulating location updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate moving location for demonstration
      setDeliveryLocation(prev => ({
        lat: prev.lat + (Math.random() * 0.001 - 0.0005),
        lng: prev.lng + (Math.random() * 0.001 - 0.0005)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handlePickupOrder = (order) => {
    updateOrderStatus(order.id, "out_for_delivery");
    toast.success(`You have picked up order #${order.id}`);
  };

  const handleDeliverOrder = (order) => {
    setSelectedOrder(order);
    setShowOtpVerification(true);
    setDeliveryOtp("");
  };

  const verifyOtp = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const isValid = verifyDeliveryOtp(selectedOrder.id, deliveryOtp);
      if (isValid) {
        setShowOtpVerification(false);
        setSelectedOrder(null);
        
        // Refresh orders list
        if (user?.email) {
          const deliveryOrders = getDeliveryBoyOrders(user.email);
          setOrders(deliveryOrders);
        }
      }
      setIsVerifying(false);
    }, 1000);
  };

  // Format price in Indian Rupees
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Ready for Pickup</Badge>;
      case "out_for_delivery":
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 hover:bg-purple-100">Out for Delivery</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Delivered</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container-custom">
          <SectionHeading 
            title="Delivery Dashboard" 
            subtitle={`Welcome, ${user?.name || 'Delivery Partner'}`}
          />

          <div className="mt-8">
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="pending">Ready for Pickup</TabsTrigger>
                <TabsTrigger value="active">Active Deliveries</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending">
                <div className="space-y-6">
                  {orders.filter(order => order.status === "processing").length === 0 ? (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="flex flex-col items-center justify-center py-8">
                          <Package className="h-12 w-12 text-gray-300 mb-4" />
                          <h3 className="text-xl font-medium text-gray-900 mb-1">No orders to pick up</h3>
                          <p className="text-gray-500">There are no orders ready for pickup at the moment.</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    orders
                      .filter(order => order.status === "processing")
                      .map(order => (
                        <Card key={order.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>Order #{order.id.split('-')[0]}</CardTitle>
                                <CardDescription>{formatDate(order.date)}</CardDescription>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-lg text-burgundy">{formatPrice(order.total)}</div>
                                {getStatusBadge(order.status)}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start space-x-2">
                                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-sm">Delivery Address</p>
                                    <p className="text-sm text-gray-500">{order.deliveryAddress}</p>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <PhoneCall className="h-5 w-5 text-gray-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-sm">Customer Phone</p>
                                    <p className="text-sm text-gray-500">{order.phone}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <p className="font-medium text-sm mb-2">Order Items</p>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Item</TableHead>
                                      <TableHead className="text-right">Qty</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {order.items.map((item) => (
                                      <TableRow key={`${order.id}-${item.id}`}>
                                        <TableCell className="font-medium">
                                          <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded overflow-hidden">
                                              <img 
                                                src={item.image} 
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                              />
                                            </div>
                                            <span className="text-sm">{item.name}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-right">{item.quantity}x</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>Ready for pickup</span>
                            </div>
                            <Button onClick={() => handlePickupOrder(order)}>
                              <Truck className="h-4 w-4 mr-2" /> Pick Up Order
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="active">
                <div className="space-y-6">
                  {orders.filter(order => order.status === "out_for_delivery").length === 0 ? (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="flex flex-col items-center justify-center py-8">
                          <Truck className="h-12 w-12 text-gray-300 mb-4" />
                          <h3 className="text-xl font-medium text-gray-900 mb-1">No active deliveries</h3>
                          <p className="text-gray-500">You don't have any orders out for delivery.</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    orders
                      .filter(order => order.status === "out_for_delivery")
                      .map(order => (
                        <Card key={order.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>Order #{order.id.split('-')[0]}</CardTitle>
                                <CardDescription>{formatDate(order.date)}</CardDescription>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-lg text-burgundy">{formatPrice(order.total)}</div>
                                {getStatusBadge(order.status)}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                                <div className="flex items-center">
                                  <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
                                  <p className="text-amber-800 text-sm font-medium">Ask the customer for the OTP to verify delivery</p>
                                </div>
                                <p className="text-xs text-amber-700 mt-1 ml-7">
                                  The customer needs to provide their OTP to complete the delivery
                                </p>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start space-x-2">
                                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-sm">Delivery Address</p>
                                    <p className="text-sm text-gray-500">{order.deliveryAddress}</p>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <UserCheck className="h-5 w-5 text-gray-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-sm">Payment Method</p>
                                    <p className="text-sm text-gray-500">
                                      {order.paymentMethod === "cash" 
                                        ? "Cash on Delivery (Collect ₹" + order.total + ")" 
                                        : "Already Paid Online"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-start space-x-2">
                                <PhoneCall className="h-5 w-5 text-gray-500 mt-0.5" />
                                <div>
                                  <p className="font-medium text-sm">Customer Contact</p>
                                  <p className="text-sm text-gray-500">{order.phone}</p>
                                  <Button variant="link" className="h-6 p-0 text-xs" onClick={() => toast.info("Calling customer...")}>
                                    Call Customer
                                  </Button>
                                </div>
                              </div>
                              
                              <div>
                                <p className="font-medium text-sm mb-2">Order Items</p>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Item</TableHead>
                                      <TableHead className="text-right">Qty</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {order.items.map((item) => (
                                      <TableRow key={`${order.id}-${item.id}`}>
                                        <TableCell className="font-medium">
                                          <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded overflow-hidden">
                                              <img 
                                                src={item.image} 
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                              />
                                            </div>
                                            <span className="text-sm">{item.name}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-right">{item.quantity}x</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-between">
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>Deliver today</span>
                            </div>
                            <Button onClick={() => handleDeliverOrder(order)}>
                              <CheckCircle className="h-4 w-4 mr-2" /> Verify & Complete Delivery
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="completed">
                <div className="space-y-6">
                  {orders.filter(order => order.status === "completed").length === 0 ? (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="flex flex-col items-center justify-center py-8">
                          <CheckCircle className="h-12 w-12 text-gray-300 mb-4" />
                          <h3 className="text-xl font-medium text-gray-900 mb-1">No completed deliveries</h3>
                          <p className="text-gray-500">You haven't completed any deliveries yet.</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    orders
                      .filter(order => order.status === "completed")
                      .map(order => (
                        <Card key={order.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>Order #{order.id.split('-')[0]}</CardTitle>
                                <CardDescription>{formatDate(order.date)}</CardDescription>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-lg text-burgundy">{formatPrice(order.total)}</div>
                                {getStatusBadge(order.status)}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start space-x-2">
                                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-sm">Delivery Address</p>
                                    <p className="text-sm text-gray-500">{order.deliveryAddress}</p>
                                  </div>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <UserCheck className="h-5 w-5 text-green-500 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-sm">Delivery Status</p>
                                    <p className="text-sm text-green-600">Successfully delivered</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* OTP Verification Dialog */}
      <Dialog open={showOtpVerification} onOpenChange={setShowOtpVerification}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Delivery OTP</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">Ask the customer for their delivery OTP and enter it below to complete the delivery:</p>
            
            <div className="space-y-3 flex flex-col items-center pt-2">
              <InputOTP maxLength={4} value={deliveryOtp} onChange={setDeliveryOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            {selectedOrder?.paymentMethod === "cash" && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-md mt-4">
                <p className="text-amber-800 text-sm font-medium">
                  Please collect {formatPrice(selectedOrder?.total)} from the customer
                </p>
              </div>
            )}
            
            <div className="pt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowOtpVerification(false)} disabled={isVerifying}>
                <X className="h-4 w-4 mr-2" /> Cancel
              </Button>
              <Button onClick={verifyOtp} disabled={isVerifying || deliveryOtp.length !== 4}>
                {isVerifying ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </div>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" /> Verify & Complete
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default DeliveryDashboard;
