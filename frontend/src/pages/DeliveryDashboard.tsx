import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { useAuth } from "@/context/AuthContext";
import { useCart, Order as CartOrder } from "@/context/CartContext";
import axios from "axios";
import { socket } from "@/lib/socket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Truck, PhoneCall, CheckCircle, Clock, X, Calendar, AlertTriangle, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface DeliveryMetrics {
  totalDeliveries: number;
  completionRate: number;
  averageRating: number;
  totalEarnings: number;
  todayEarnings: number;
  onTimeRate: number;
}

type Order = CartOrder;

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const { getDeliveryBoyOrders, updateOrderStatus, verifyDeliveryOtp } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [deliveryOtp, setDeliveryOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DeliveryMetrics>({
    totalDeliveries: 0,
    completionRate: 0,
    averageRating: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    onTimeRate: 0
  });
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    if (user?.id) {
      // Connect to socket with error handling
      try {
        socket.auth = { token: localStorage.getItem("token"), role: "delivery" };
        socket.connect();

        // Listen for new orders
        socket.on("new_delivery_order", (newOrder: Order) => {
          setOrders(prev => [...prev, newOrder]);
          toast.info(`New delivery order #${newOrder.id} received!`);
        });

        // Listen for order updates
        socket.on("order_status_update", ({ orderId, status }: { orderId: string; status: Order["status"] }) => {
          setOrders(prev => prev.map(order => 
            order.id === orderId ? { ...order, status } : order
          ));
        });

        // Handle socket connection errors
        socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error);
          toast.error("Failed to connect to real-time updates");
        });

        // Initial data fetch
        fetchInitialData();
      } catch (error) {
        console.error("Socket initialization error:", error);
        toast.error("Failed to initialize real-time updates");
      }
    }

    return () => {
      socket.off("new_delivery_order");
      socket.off("order_status_update");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, [user]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchOrders(),
        fetchMetrics()
      ]);
    } catch (error) {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      if (!user?.email) throw new Error("User email not found");
      const deliveryOrders = await getDeliveryBoyOrders(user.email);
      setOrders(deliveryOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw new Error("Failed to fetch orders");
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await axios.get("/api/delivery/stats/dashboard");
      setMetrics(response.data);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      throw new Error("Failed to fetch metrics");
    }
  };

  const handleDeliverOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOtpVerification(true);
    setDeliveryOtp("");
  };

  const verifyOtp = async () => {
    if (!selectedOrder || !user?.email) {
      toast.error("Order information not found");
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await verifyDeliveryOtp(selectedOrder.id, deliveryOtp);
      if (isValid) {
        setShowOtpVerification(false);
        setSelectedOrder(null);
        toast.success("Delivery completed successfully!");
        // Refresh orders list
        await fetchOrders();
      } else {
        toast.error("Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Failed to verify OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchInitialData}>Retry</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status: Order["status"]) => {
    const statusConfig = {
      placed: { class: "bg-yellow-100 text-yellow-800", text: "Placed" },
      accepted: { class: "bg-blue-100 text-blue-800", text: "Accepted" },
      assigned: { class: "bg-purple-100 text-purple-800", text: "Assigned" },
      delivering: { class: "bg-indigo-100 text-indigo-800", text: "Delivering" },
      delivered: { class: "bg-green-100 text-green-800", text: "Delivered" },
      cancelled: { class: "bg-red-100 text-red-800", text: "Cancelled" }
    };

    const config = statusConfig[status];
    return (
      <Badge variant="outline" className={config.class}>
        {config.text}
      </Badge>
    );
  };

  const getOrdersByStatus = (statuses: Order["status"][]) => {
    return orders.filter(order => statuses.includes(order.status));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <SectionHeading 
          title="Delivery Dashboard"
          subtitle="Manage your deliveries and track your performance"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{metrics.todayEarnings}</p>
              <p className="text-sm text-muted-foreground">
                From {orders.filter(o => o.status === "delivered").length} deliveries
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Completion Rate</span>
                  <span className="font-medium">{metrics.completionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>On-time Rate</span>
                  <span className="font-medium">{metrics.onTimeRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Rating</span>
                  <span className="font-medium">{metrics.averageRating.toFixed(1)} ⭐</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Total Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Deliveries</span>
                  <span className="font-medium">{metrics.totalDeliveries}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Earnings</span>
                  <span className="font-medium">₹{metrics.totalEarnings}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="active" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="active" className="font-medium">
              Active Orders
            </TabsTrigger>
            <TabsTrigger value="history" className="font-medium">
              Delivery History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            {getOrdersByStatus(["placed", "accepted", "assigned", "delivering"]).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No active orders found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getOrdersByStatus(["placed", "accepted", "assigned", "delivering"]).map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                            <img src="/default-avatar.png" alt={order.email} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{order.email}</p>
                            <p className="text-xs text-muted-foreground">{order.deliveryPhone}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {`${order.deliveryAddress.street}, ${order.deliveryAddress.city}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        <p className="text-sm font-medium">{formatPrice(order.total)}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        {order.status === "delivering" ? (
                          <Button variant="default" size="sm" onClick={() => handleDeliverOrder(order)}>
                            Confirm Delivery
                          </Button>
                        ) : (
                          <Button variant="link" size="sm" onClick={() => setSelectedOrder(order)}>
                            View Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          <TabsContent value="history">
            {getOrdersByStatus(["delivered", "cancelled"]).length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No delivery history found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getOrdersByStatus(["delivered", "cancelled"]).map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                            <img src="/default-avatar.png" alt={order.email} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{order.email}</p>
                            <p className="text-xs text-muted-foreground">{order.deliveryPhone}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {`${order.deliveryAddress.street}, ${order.deliveryAddress.city}`}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        <p className="text-sm font-medium">{formatPrice(order.total)}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="link" size="sm" onClick={() => setSelectedOrder(order)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={showOtpVerification} onOpenChange={setShowOtpVerification}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Verify Delivery OTP
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Please enter the OTP to verify the delivery.
            </p>
            <InputOTP
              value={deliveryOtp}
              onChange={setDeliveryOtp}
              maxLength={4}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
            <Button 
              onClick={verifyOtp} 
              className="w-full"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </div>
              ) : (
                "Verify OTP"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default DeliveryDashboard;
