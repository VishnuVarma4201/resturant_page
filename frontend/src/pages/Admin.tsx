import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { getDeliveryBoys, updateDeliveryBoyStatus } from "@/services/adminService";

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
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  isAvailable: boolean;
  rating?: number;
  totalRatings?: number;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

const Admin = () => {
  const { updateOrderStatus, assignDeliveryBoy, addMenuItem, updateMenuItem, removeMenuItem } = useAdmin();
  const { user, fetchDeliveryBoys: fetchDeliveryBoysFromAuth } = useAuth();
  const { reservations = [], updateReservationStatus } = useReservation();
  const queryClient = useQueryClient();
  
  // State for menu items
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    category: 'Starters'
  });
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  
  // State for delivery boy assignment
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState("");
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showEditItemDialog, setShowEditItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showDeliveryBoyForm, setShowDeliveryBoyForm] = useState(false);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [isLoadingDeliveryBoys, setIsLoadingDeliveryBoys] = useState(false);
  const [deliveryBoyFilter, setDeliveryBoyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch menu items
  const { data: menuItemsData = {}, isLoading: menuLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/menu', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch menu items');
      const data = await response.json();
      // Group items by category
      return data.reduce((acc: Record<string, any[]>, item: any) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {});
    }
  });

  // Fetch delivery boys with proper error handling and response parsing
  const { data: deliveryBoysData = [], isLoading: deliveryBoysLoading } = useQuery({
    queryKey: ['deliveryBoys'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/delivery-boy', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      // If we get an array directly, use it
      if (Array.isArray(data)) {
        return data;
      }
      
      // If we get an object with deliveryBoys property, use that
      if (data.deliveryBoys) {
        return data.deliveryBoys;
      }
      
      // If we get an error message in the response
      if (data.message && !response.ok) {
        throw new Error(data.message);
      }
      
      // Return empty array as fallback
      return [];
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Fetch orders
  const { data: ordersData = [], isLoading: ordersLoading } = useQuery({
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

  // Filter delivery boys

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

  // Add loading states for delivery boy actions
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

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
        <TableBody>{orders.map((order) => (
          <TableRow key={order._id}>
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateOrderStatus(order._id, 'accepted')}
                    disabled={loading}
                  >Accept</Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')}
                    disabled={loading}
                  >Cancel</Button>
                </div>
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
                >Assign Delivery</Button>
              )}
            </TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    );
  }, [loading, handleUpdateOrderStatus, setSelectedOrder, setShowAssignDialog]);

  const renderMenuItemsTable = useCallback((category: string, menuItems: Record<string, MenuItem[]>) => {
    return (
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
        <TableBody>{(menuItems[category] || [])
          .sort((a, b) => getSortValue(b) - getSortValue(a))
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
          ))}</TableBody>
      </Table>
    );
  }, [loading, handleDeleteItem, setEditingItem, setShowEditItemDialog]);

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

  // Filter delivery boys based on search and filter
  const filteredDeliveryBoys = useMemo(() => {
    return (deliveryBoysData || []).filter(boy => {
      const matchesSearch = searchQuery === '' ||
        boy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        boy.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        boy.phone.includes(searchQuery);

      const matchesFilter = 
        deliveryBoyFilter === 'all' ||
        (deliveryBoyFilter === 'active' && boy.status === 'active') ||
        (deliveryBoyFilter === 'inactive' && boy.status === 'inactive');

      return matchesSearch && matchesFilter;
    });
  }, [deliveryBoysData, searchQuery, deliveryBoyFilter]);

  // Update delivery boy status
  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'inactive') => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/delivery-boy/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      queryClient.invalidateQueries({ queryKey: ['deliveryBoys'] });
      toast.success(`Delivery boy ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Render delivery boys table
  const renderDeliveryBoysTable = useCallback(() => {
    if (deliveryBoysLoading) {
      return <div className="text-center py-4">Loading delivery boys...</div>;
    }

    if (!filteredDeliveryBoys?.length) {
      return (
        <div className="text-center py-4">
          No delivery boys found
          {searchQuery && <div className="text-sm text-muted-foreground">Clear search to see all delivery boys</div>}
          {deliveryBoyFilter !== 'all' && 
            <div className="text-sm text-muted-foreground">Clear filter to see all delivery boys</div>
          }
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{filteredDeliveryBoys.map(boy => (
          <TableRow key={boy._id}>
            <TableCell className="font-medium">{boy.name}</TableCell>
            <TableCell>
              <div>{boy.phone}</div>
              <div className="text-xs text-muted-foreground">{boy.email}</div>
            </TableCell>
            <TableCell>
              <Badge variant={boy.status === 'active' ? 'default' : 'secondary'}>
                {boy.status}
              </Badge>
            </TableCell>
            <TableCell>
              {boy.rating?.toFixed(1) || '0.0'} ({boy.totalRatings || 0})
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus(boy._id, boy.status === 'active' ? 'inactive' : 'active')}
                disabled={loading}
              >
                {boy.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            </TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    );
  }, [filteredDeliveryBoys, deliveryBoysLoading, loading, handleUpdateStatus, searchQuery, deliveryBoyFilter]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <SectionHeading 
            title="Admin Dashboard"
            subtitle="Manage orders, menu items, and delivery staff"
          />

          <Tabs defaultValue="orders" className="w-full">
            <TabsList>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="menu">Menu Items</TabsTrigger>
              <TabsTrigger value="deliveryBoys">Delivery Boys</TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Orders Management</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="text-center py-4">Loading orders...</div>
                  ) : (
                    renderOrdersTable(ordersData)
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="menu">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Menu Items</CardTitle>
                  <Button onClick={() => setShowAddItemDialog(true)}>
                    Add New Item
                  </Button>
                </CardHeader>
                <CardContent>
                  {menuLoading ? (
                    <div className="text-center py-4">Loading menu items...</div>
                  ) : !Object.keys(menuItemsData).length ? (
                    <div className="text-center py-4">No menu items found</div>
                  ) : (
                    Object.keys(menuItemsData).map(category => (
                      <div key={category} className="mb-8">
                        <h3 className="text-lg font-semibold mb-4">{category}</h3>
                        {renderMenuItemsTable(category, menuItemsData)}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deliveryBoys">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Delivery Boys</CardTitle>
                  <Button onClick={() => setShowDeliveryBoyForm(true)}>
                    Add New Delivery Boy
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-4">
                    <Input
                      placeholder="Search delivery boys..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="max-w-sm"
                    />
                    <Select value={deliveryBoyFilter} onValueChange={setDeliveryBoyFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {renderDeliveryBoysTable()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add Menu Item Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Menu Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <label htmlFor="name" className="text-right">Name</label>
              <Input
                id="name"
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <label htmlFor="price" className="text-right">Price</label>
              <Input
                id="price"
                type="number"
                value={newItem.price}
                onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <label htmlFor="description" className="text-right">Description</label>
              <Input
                id="description"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <label htmlFor="image" className="text-right">Image URL</label>
              <Input
                id="image"
                value={newItem.image}
                onChange={(e) => setNewItem(prev => ({ ...prev, image: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                Add Item
              </Button>
            </DialogFooter>
          </form>
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

      {/* Assign Delivery Boy Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Delivery Boy</DialogTitle>
          </DialogHeader>
          <Select value={selectedDeliveryBoy} onValueChange={setSelectedDeliveryBoy}>
            <SelectTrigger>
              <SelectValue placeholder="Select a delivery boy" />
            </SelectTrigger>
            <SelectContent>
              {deliveryBoysData
                .filter(boy => boy.status === 'active' && boy.isAvailable)
                .map(boy => (
                  <SelectItem key={boy._id} value={boy._id}>
                    {boy.name} - {boy.phone}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              onClick={handleAssignDeliveryBoy}
              disabled={loading || !selectedDeliveryBoy}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Admin;
