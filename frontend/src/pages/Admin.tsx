import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileCheck, Upload, Package, Check, XCircle, Search, ShoppingCart, UserPlus, Utensils, Edit } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { useReservation } from "@/context/ReservationContext";
import { format } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import DeliveryBoyForm from "@/components/forms/DeliveryBoyForm";

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  location: [number, number];
  popupContent?: string;
}

const OrderMap = ({ location, popupContent }: MapProps) => (
  <div className="h-[200px] w-full rounded-lg overflow-hidden">
    <MapContainer
      center={location}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={location}>
        {popupContent && <Popup>{popupContent}</Popup>}
      </Marker>
    </MapContainer>
  </div>
);

interface DeliveryBoy {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  isAvailable: boolean;
  currentLocation?: {
    coordinates: [number, number];
  };
  rating: number;
  totalDeliveries: number;
}

const Admin = () => {
  const { menuItems, updateOrderStatus, assignDeliveryBoy, addMenuItem, updateMenuItem, removeMenuItem } = useAdmin();
  const { user, fetchDeliveryBoys: fetchDeliveryBoysFromAuth } = useAuth();
  const { reservations = [], updateReservationStatus } = useReservation();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState("");
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showEditItemDialog, setShowEditItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    category: 'Starters'
  });
  const [showDeliveryBoyForm, setShowDeliveryBoyForm] = useState(false);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [isLoadingDeliveryBoys, setIsLoadingDeliveryBoys] = useState(false);

  const handleDeliveryBoySuccess = useCallback(() => {
    setShowDeliveryBoyForm(false);
    toast.success('Delivery boy added successfully');
    // Refetch delivery boys list
    fetchDeliveryBoysFromAuth().then(data => {
      const transformedDeliveryBoys = data.deliveryBoys.map(boy => ({
        ...boy,
        status: 'active' as const,
        isAvailable: true,
        rating: 0,
        totalDeliveries: 0
      }));
      setDeliveryBoys(transformedDeliveryBoys);
    });
  }, [fetchDeliveryBoysFromAuth]);
  const [deliveryBoyFilter, setDeliveryBoyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add loading states for delivery boy actions
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Fetch orders using react-query
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const orders = ordersData || [];

  // Fetch delivery boys using react-query
  const { data: deliveryBoysData } = useQuery({
    queryKey: ['deliveryBoys'],
    queryFn: async () => {
      if (user?.role !== 'admin') return { deliveryBoys: [] };
      return fetchDeliveryBoysFromAuth();
    },
    enabled: user?.role === 'admin'
  });

  const deliveryBoysList = deliveryBoysData?.deliveryBoys || [];

  // Filter orders by status
  const pendingOrders = orders.filter(order => order.status === 'placed');
  const processingOrders = orders.filter(order => ['accepted', 'assigned'].includes(order.status));
  const completedOrders = orders.filter(order => order.status === 'delivered');
  const cancelledOrders = orders.filter(order => order.status === 'cancelled');
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      setLoading(true);
      await updateOrderStatus(orderId, status);
      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };
  const handleAssignDeliveryBoy = async () => {
    if (!selectedDeliveryBoy || !selectedOrder) {
      toast.error('Please select a delivery boy');
      return;
    }
    
    try {
      setLoading(true);
      await assignDeliveryBoy(selectedOrder._id, selectedDeliveryBoy);
      toast.success('Delivery boy assigned successfully');
      setShowAssignDialog(false);
      setSelectedOrder(null);
      setSelectedDeliveryBoy("");
    } catch (error) {
      console.error('Error assigning delivery boy:', error);
      toast.error('Failed to assign delivery boy');
    } finally {
      setLoading(false);
    }
  };const handleAddItem = async () => {
    // Validate required fields
    if (!newItem.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!newItem.price || isNaN(parseFloat(newItem.price))) {
      toast.error('Please enter a valid price');
      return;
    }
    if (!newItem.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!newItem.image.trim()) {
      toast.error('Image URL is required');
      return;
    }
    if (!newItem.category) {
      toast.error('Please select a category');
      return;
    }

    try {
      setLoading(true);
      await addMenuItem({
        _id: '', // Add empty string as placeholder, will be replaced by MongoDB
        name: newItem.name.trim(),
        description: newItem.description.trim(),
        image: newItem.image.trim(),
        price: parseFloat(newItem.price),
        category: newItem.category
      });
      
      setShowAddItemDialog(false);
      setNewItem({
        name: '',
        price: '',
        description: '',
        image: '',
        category: 'Starters'
      });
      toast.success('Menu item added successfully');
    } catch (error: any) {
      console.error('Error adding menu item:', error);
      const errorMsg = error.message || 'Failed to add menu item';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = async () => {
    if (!editingItem) return;

    // Validate required fields
    if (!editingItem.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!editingItem.price || isNaN(parseFloat(editingItem.price))) {
      toast.error('Please enter a valid price');
      return;
    }
    if (!editingItem.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!editingItem.image.trim()) {
      toast.error('Image URL is required');
      return;
    }
    if (!editingItem.category) {
      toast.error('Please select a category');
      return;
    }

    try {
      setLoading(true);
      await updateMenuItem(editingItem);
      setShowEditItemDialog(false);
      setEditingItem(null);
      toast.success('Menu item updated successfully');
    } catch (error: any) {
      console.error('Error updating menu item:', error);
      const errorMsg = error.message || 'Failed to update menu item';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteItem = async (id: string | number, category: string) => {
    try {
      setLoading(true);
      // Convert number id to string if needed
      const stringId = typeof id === 'number' ? id.toString() : id;
      await removeMenuItem(stringId, category);
      toast.success('Menu item deleted successfully');
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item');
    } finally {
      setLoading(false);
    }
  };

  // Update the OrderType interface
interface OrderType {
  _id: string;
  createdAt: string;
  currentLocation: {
    type: string;
    coordinates: [number, number];
  };
  deliveryAddress: {
    location: {
      type: string;
      coordinates: [number, number];
    };
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  deliveryCharge: number;
  deliveryPhone: string;
  estimatedDeliveryTime: {
    start: string;
    end: string;
  };
  items: Array<{
    _id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  locationHistory: Array<{
    type: string;
    coordinates: [number, number];
    timestamp: string;
  }>;
  otp: string;
  paymentId: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  subTotal: number;
  tax: number;
  totalAmount: number;
  user: string;
}

// Add memo for expensive computations
const memoizedOrders = useMemo(() => {
  return {
    pending: orders.filter(order => order.status === 'placed'),
    processing: orders.filter(order => ['accepted', 'assigned'].includes(order.status)),
    completed: orders.filter(order => order.status === 'delivered'),
    cancelled: orders.filter(order => order.status === 'cancelled')
  };
}, [orders]);

  // Update the renderOrdersTable function
  const renderOrdersTable = useCallback((orders: OrderType[]) => {
    if (ordersLoading) {
      return (
        <div className="text-center py-4">Loading orders...</div>
      );
    }

    if (!orders || orders.length === 0) {
      return (
        <div className="text-center py-4">No orders found</div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <React.Fragment key={order._id}>
              <TableRow>
                <TableCell className="font-medium">
                  #{order._id.slice(-6)}
                  <div className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div>{order.deliveryPhone}</div>
                  <div className="text-xs text-muted-foreground">
                    {`${order.deliveryAddress.street}, ${order.deliveryAddress.city}`}
                  </div>
                </TableCell>
                <TableCell>
                  <div>{order.items.length} items</div>
                  <div className="text-xs text-muted-foreground">
                    {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                  </div>
                </TableCell>
                <TableCell>
                  <div>₹{order.totalAmount}</div>
                  <div className="text-xs text-muted-foreground">
                    Tax: ₹{order.tax}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={order.paymentStatus === "pending" ? "outline" : "default"}>
                    {order.paymentMethod} - {order.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      order.status === "accepted" ? "bg-green-100 text-green-800" :
                      order.status === "placed" ? "bg-yellow-100 text-yellow-800" :
                      order.status === "assigned" ? "bg-blue-100 text-blue-800" :
                      order.status === "delivered" ? "bg-purple-100 text-purple-800" :
                      "bg-gray-100 text-gray-800"
                    }
                  >
                    {order.status}
                    {order.status === "assigned" && order.otp && 
                      <span className="ml-1 text-xs">OTP: {order.otp}</span>
                    }
                  </Badge>
                </TableCell>
                <TableCell>
                  {order.status === 'placed' && (
                    <>                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order._id, 'accepted')}
                      disabled={loading}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </>
                  )}
                  {order.status === 'accepted' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowAssignDialog(true);
                      }}
                      disabled={loading}
                    >
                      Assign Delivery
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              {(order.status === 'assigned' || order.status === 'accepted') && (
                <TableRow>
                  <TableCell colSpan={7} className="p-4">
                    <OrderMap
                      location={order.deliveryAddress.location.coordinates.reverse() as [number, number]}
                      popupContent={`${order.deliveryAddress.street}, ${order.deliveryAddress.city}`}
                    />
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    );
  }, [ordersLoading]);

  // Define MenuItem type if not already imported
  type MenuItem = {
    _id?: string;
    id?: string | number;
    name: string;
    description: string;
    image: string;
    price: number;
    category: string;
    createdAt?: string;
    [key: string]: any;
  };

  const getSortValue = (item: MenuItem): number => {
    if (item.createdAt) {
      return new Date(item.createdAt).getTime();
    }
    // Fallback: use id/MongoDB id, converted to timestamp
    const idStr = String(item._id || item.id);
    // Convert the first 8 characters of the ID to a timestamp
    return parseInt(idStr.substring(0, 8), 16) * 1000;
  };

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

  // Fetch delivery boys
  useEffect(() => {
    const loadDeliveryBoys = async () => {
      setIsLoadingDeliveryBoys(true);
      try {
        const data = await fetchDeliveryBoysFromAuth();
        const transformedDeliveryBoys = data.deliveryBoys.map(boy => ({
          ...boy,
          status: 'active' as const,
          isAvailable: true,
          rating: 0,
          totalDeliveries: 0
        }));
        setDeliveryBoys(transformedDeliveryBoys);
      } catch (error) {
        toast.error("Failed to load delivery boys");
      } finally {
        setIsLoadingDeliveryBoys(false);
      }
    };

    loadDeliveryBoys();
  }, [fetchDeliveryBoysFromAuth]);

  const handleStatusChange = async (deliveryBoyId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    setUpdatingStatus(deliveryBoyId);
    try {
      await fetch(`/api/delivery-boy/${deliveryBoyId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      setDeliveryBoys(prev => 
        prev.map(db => db.id === deliveryBoyId ? { ...db, status: newStatus } : db)
      );
      toast.success("Status updated successfully");
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredDeliveryBoys = useMemo(() => {
    return deliveryBoys.filter(db => {
      const matchesFilter = deliveryBoyFilter === 'all' || db.status === deliveryBoyFilter;
      const matchesSearch = searchQuery === '' || 
        db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        db.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        db.phone.includes(searchQuery);
      return matchesFilter && matchesSearch;
    });
  }, [deliveryBoys, deliveryBoyFilter, searchQuery]);

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
                <TabsTrigger value="deliveryBoys">Delivery Boys</TabsTrigger>
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
                      {renderOrdersTable(orders)}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="menu">
                <Card>                  <CardHeader>                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle>Menu Items</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">Showing 10 most recently added items</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Search menu items..." className="pl-8 w-full" />
                        </div>
                        <Button className="w-full sm:w-auto" onClick={() => setShowAddItemDialog(true)}>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </div>
                    </div>
                  </CardHeader>                  <CardContent>
                    <Tabs defaultValue="all" className="w-full">                      <TabsList className="flex mb-6 overflow-x-auto pb-1 no-scrollbar">
                        <TabsTrigger value="all" className="min-w-max">
                          All Items
                        </TabsTrigger>
                        {['Starters', 'Main Course', 'Desserts', 'Beverages'].map((category) => (
                          <TabsTrigger key={category} value={category} className="min-w-max">
                            {category}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                        <TabsContent value="all">
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
                            </TableHeader>                            <TableBody>                              {Object.values(menuItems).flat()
                                .sort((a, b) => {
                                  return getSortValue(b) - getSortValue(a);
                                })
                                .slice(0, 10)
                                .map((item) => (
                                <TableRow key={item._id || item.id}>
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
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                          setEditingItem(item);
                                          setShowEditItemDialog(true);
                                        }}
                                        disabled={loading}
                                      >
                                        <Edit className="h-4 w-4" />
                                        <span className="sr-only">Edit</span>
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteItem(item._id || item.id, item.category)}
                                        disabled={loading}
                                      >
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
                      
                      {['Starters', 'Main Course', 'Desserts', 'Beverages'].map((category) => (
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
                              </TableHeader>                              <TableBody>                                {(menuItems[category] || [])
                                  .sort((a, b) => {
                                    return getSortValue(b) - getSortValue(a);
                                  })
                                  .slice(0, 10)
                                  .map((item) => (
                                  <TableRow key={item._id || item.id}>
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
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => {
                                            setEditingItem(item);
                                            setShowEditItemDialog(true);
                                          }}
                                          disabled={loading}
                                        >
                                          <Edit className="h-4 w-4" />
                                          <span className="sr-only">Edit</span>
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => handleDeleteItem(item._id || item.id, item.category)}
                                          disabled={loading}
                                        >
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
                        <TableBody>                          {reservations && reservations.length > 0 ? (
                            reservations.map((reservation) => (
                              <TableRow key={reservation._id || reservation.id}>
                                <TableCell className="font-medium">{reservation.name}</TableCell>
                                <TableCell>{reservation.email}</TableCell>
                                <TableCell>{formatDate(reservation.date)}</TableCell>
                                <TableCell>{reservation.time}</TableCell>
                                <TableCell>{reservation.partySize}</TableCell>
                                <TableCell>{reservation.tableNumber || "—"}</TableCell>
                                <TableCell>
                                  <Badge className={
                                    reservation.status === "approved" 
                                      ? "bg-green-100 text-green-800 hover:bg-green-100" 
                                      : reservation.status === "rejected" 
                                      ? "bg-red-100 text-red-800 hover:bg-red-100" 
                                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
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
                                          onClick={() => updateReservationStatus(reservation._id || reservation.id, "approved")}
                                        >
                                          <Check className="h-4 w-4 mr-1" />
                                          Approve
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => updateReservationStatus(reservation._id || reservation.id, "rejected")}
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

              <TabsContent value="deliveryBoys" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Manage Delivery Boys</h2>
                  <Button onClick={() => setShowDeliveryBoyForm(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Delivery Boy
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Boys List</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingDeliveryBoys ? (
                      <div className="flex justify-center p-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Deliveries</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deliveryBoys.map((boy) => (
                            <TableRow key={boy.id}>
                              <TableCell>{boy.name}</TableCell>
                              <TableCell>{boy.email}</TableCell>
                              <TableCell>{boy.phone}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                      boy.status === 'active' 
                                        ? 'default' 
                                        : boy.status === 'inactive' 
                                        ? 'secondary' 
                                        : 'destructive'
                                    }
                                >
                                  {boy.status.charAt(0).toUpperCase() + boy.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <span className="mr-1">{boy.rating.toFixed(1)}</span>
                                  <span className="text-yellow-400">★</span>
                                </div>
                              </TableCell>
                              <TableCell>{boy.totalDeliveries}</TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Handle edit action
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>      {/* Add Menu Item Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby="add-menu-item-description">
          <DialogHeader>
            <DialogTitle>Add New Menu Item</DialogTitle>
            <p id="add-menu-item-description" className="text-sm text-muted-foreground">
              Fill in the details below to add a new item to the menu.
            </p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">Name</label>
              <Input
                id="name"
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="price" className="text-right">Price</label>
              <Input
                id="price"
                type="number"
                value={newItem.price}
                onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="description" className="text-right">Description</label>
              <Input
                id="description"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="image" className="text-right">Image URL</label>
              <Input
                id="image"
                value={newItem.image}
                onChange={(e) => setNewItem(prev => ({ ...prev, image: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="category" className="text-right">Category</label>
              <Select 
                value={newItem.category}
                onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starters">Starters</SelectItem>
                  <SelectItem value="Main Course">Main Course</SelectItem>
                  <SelectItem value="Desserts">Desserts</SelectItem>
                  <SelectItem value="Beverages">Beverages</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem} disabled={loading}>
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Delivery Boy Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Delivery Boy</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>                <p className="text-sm font-medium mb-1">Order:</p>
                <p className="text-gray-700">#{selectedOrder?._id}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Customer:</p>
                <p className="text-gray-700">{selectedOrder?.email}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium mb-1">Select Delivery Boy:</p>                <Select value={selectedDeliveryBoy} onValueChange={setSelectedDeliveryBoy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery boy" />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryBoysList?.map((boy) => (
                      <SelectItem key={boy.id} value={boy.id}>
                        {boy.name} ({boy.email})
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

      {/* Edit Menu Item Dialog */}
      <Dialog open={showEditItemDialog} onOpenChange={setShowEditItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <p className="text-sm text-gray-600">
              Update the details below to modify this menu item.
            </p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-name" className="text-right">Name</label>
              <Input
                id="edit-name"
                value={editingItem?.name || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-price" className="text-right">Price</label>
              <Input
                id="edit-price"
                type="number"
                value={editingItem?.price || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev, price: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-description" className="text-right">Description</label>
              <Input
                id="edit-description"
                value={editingItem?.description || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-image" className="text-right">Image URL</label>
              <Input
                id="edit-image"
                value={editingItem?.image || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev, image: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit-category" className="text-right">Category</label>
              <Select
                value={editingItem?.category || ''}
                onValueChange={(value) => setEditingItem(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starters">Starters</SelectItem>
                  <SelectItem value="Main Course">Main Course</SelectItem>
                  <SelectItem value="Desserts">Desserts</SelectItem>
                  <SelectItem value="Beverages">Beverages</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditItemDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem} disabled={loading}>
              {loading ? 'Updating...' : 'Update Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Delivery Boy Dialog */}
      <Dialog open={showDeliveryBoyForm} onOpenChange={setShowDeliveryBoyForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Delivery Boy</DialogTitle>
          </DialogHeader>
          <DeliveryBoyForm onSuccess={handleDeliveryBoySuccess} />
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Admin;
