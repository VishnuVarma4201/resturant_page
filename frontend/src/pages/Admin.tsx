
import React, { useState } from "react";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileCheck, Upload, Package, Check, XCircle, Search, ShoppingCart, UserPlus, Utensils, Edit } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { useReservation } from "@/context/ReservationContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";

const Admin = () => {
  const { menuItems } = useAdmin();
  const { orders, updateOrderStatus, assignDeliveryBoy } = useCart();
  const { users } = useAuth();
  const { reservations, updateReservationStatus } = useReservation();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState("");
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Filter delivery boy users
  const deliveryBoys = users.filter(user => user.isDeliveryBoy);

  const handleUpdateOrderStatus = (orderId, status) => {
    updateOrderStatus(orderId, status);
  };

  const handleAssignDeliveryBoy = () => {
    if (!selectedDeliveryBoy || !selectedOrder) {
      return;
    }
    
    assignDeliveryBoy(selectedOrder.id, selectedDeliveryBoy);
    setShowAssignDialog(false);
    setSelectedOrder(null);
    setSelectedDeliveryBoy("");
  };

  const openAssignDialog = (order) => {
    setSelectedOrder(order);
    setSelectedDeliveryBoy("");
    setShowAssignDialog(true);
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

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container-custom">
          <SectionHeading
            title="Admin Dashboard"
            subtitle="Manage menu, orders, reservations and more"
          />
          
          <div className="mt-8">
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="flex justify-center mb-8">
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="menu">Menu</TabsTrigger>
                <TabsTrigger value="reservations">Reservations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Recent Orders</CardTitle>
                      <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search orders..." className="pl-8" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Delivery Boy</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.length > 0 ? (
                            orders.map((order) => (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">#{order.id.toString().split('-')[0]}</TableCell>
                                <TableCell>{order.email}</TableCell>
                                <TableCell>{formatDate(order.date)}</TableCell>
                                <TableCell>{order.items.length} items</TableCell>
                                <TableCell>{formatPrice(order.total)}</TableCell>
                                <TableCell>
                                  <Badge className={
                                    order.status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-100" : 
                                    order.status === "cancelled" ? "bg-red-100 text-red-800 hover:bg-red-100" :
                                    order.status === "processing" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                                    order.status === "out_for_delivery" ? "bg-purple-100 text-purple-800 hover:bg-purple-100" :
                                    "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                  }>
                                    {order.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {order.deliveryBoyId ? (
                                    <span className="text-sm">
                                      {users.find(u => u.email === order.deliveryBoyId)?.name || "Assigned"}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-400">Not assigned</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {order.status === "pending" && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleUpdateOrderStatus(order.id, "processing")}
                                      >
                                        <Package className="h-4 w-4 mr-1" />
                                        Process
                                      </Button>
                                    )}
                                    
                                    {order.status === "processing" && !order.deliveryBoyId && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => openAssignDialog(order)}
                                      >
                                        <UserPlus className="h-4 w-4 mr-1" />
                                        Assign
                                      </Button>
                                    )}
                                    
                                    {order.status !== "completed" && order.status !== "cancelled" && (
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Cancel
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-4">
                                No orders found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="menu">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Menu Items</CardTitle>
                      <div className="flex items-center gap-4">
                        <div className="relative w-64">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Search menu items..." className="pl-8" />
                        </div>
                        <Button>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="appetizers" className="w-full">
                      <TabsList className="flex mb-6 overflow-x-auto pb-1 no-scrollbar">
                        {Object.keys(menuItems).map((category) => (
                          <TabsTrigger key={category} value={category} className="min-w-max">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      
                      {Object.keys(menuItems).map((category) => (
                        <TabsContent key={category} value={category}>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[80px]">Image</TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead>Price</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {menuItems[category].map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>
                                      <div className="w-12 h-12 rounded overflow-hidden">
                                        <img 
                                          src={item.image} 
                                          alt={item.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>
                                      <div className="max-w-xs truncate">{item.description}</div>
                                    </TableCell>
                                    <TableCell>{formatPrice(item.price)}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm">
                                          <Edit className="h-4 w-4" />
                                          <span className="sr-only">Edit</span>
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                          <XCircle className="h-4 w-4 text-red-500" />
                                          <span className="sr-only">Delete</span>
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reservations">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Reservations</CardTitle>
                      <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search reservations..." className="pl-8" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Party Size</TableHead>
                            <TableHead>Table</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reservations && reservations.length > 0 ? (
                            reservations.map((reservation) => (
                              <TableRow key={reservation.id}>
                                <TableCell className="font-medium">{reservation.name}</TableCell>
                                <TableCell>{reservation.email}</TableCell>
                                <TableCell>{formatDate(reservation.date)}</TableCell>
                                <TableCell>{reservation.time}</TableCell>
                                <TableCell>{reservation.partySize}</TableCell>
                                <TableCell>{reservation.tableNumber || "—"}</TableCell>
                                <TableCell>
                                  <Badge className={
                                    reservation.status === "approved" ? "bg-green-100 text-green-800 hover:bg-green-100" : 
                                    reservation.status === "rejected" ? "bg-red-100 text-red-800 hover:bg-red-100" :
                                    "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                  }>
                                    {reservation.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {reservation.status === "pending" && (
                                      <>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => updateReservationStatus(reservation.id, "approved")}
                                        >
                                          <Check className="h-4 w-4 mr-1" />
                                          Approve
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => updateReservationStatus(reservation.id, "rejected")}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <XCircle className="h-4 w-4 mr-1" />
                                          Reject
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-4">
                                No reservations found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Assign Delivery Boy Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Delivery Boy</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Order:</p>
                <p className="text-gray-700">#{selectedOrder?.id.toString().split('-')[0]}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Customer:</p>
                <p className="text-gray-700">{selectedOrder?.email}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium mb-1">Select Delivery Boy:</p>
                <Select value={selectedDeliveryBoy} onValueChange={setSelectedDeliveryBoy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery boy" />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryBoys.map((boy) => (
                      <SelectItem key={boy.email} value={boy.email}>
                        {boy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignDeliveryBoy} disabled={!selectedDeliveryBoy}>
                  Assign
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Admin;
