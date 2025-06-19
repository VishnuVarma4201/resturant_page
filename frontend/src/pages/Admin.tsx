import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, XCircle, Search, UserPlus, Edit } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/context/AdminContext";
import { useReservation } from "@/context/ReservationContext";
import { format } from "date-fns";
import DeliveryBoyForm from "@/components/forms/DeliveryBoyForm";
import { getDeliveryBoys, updateDeliveryBoyStatus, getReservations, updateReservation } from "@/services/adminService";

// Interface definitions
interface MenuItem {
  _id: string;
  id?: string | number;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  createdAt?: string;
  [key: string]: any;
}

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

function AdminPage() {
  const { updateOrderStatus, assignDeliveryBoy, addMenuItem, updateMenuItem, removeMenuItem } = useAdmin();
  const { user } = useAuth();
  const { updateReservationStatus } = useReservation();
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
  const [deliveryBoyFilter, setDeliveryBoyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Query hooks for data fetching
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

  const { data: deliveryBoysData, isLoading: isDeliveryBoysLoading } = useQuery({
    queryKey: ['deliveryBoys'],
    queryFn: getDeliveryBoys
  });
  const { data: reservationsData = [], isLoading: isReservationsLoading } = useQuery({
    queryKey: ['adminReservations'],
    queryFn: getReservations,
    initialData: []
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

  // Use memo to filter delivery boys
  const filteredDeliveryBoys = useMemo(() => {
    if (!deliveryBoysData) return [];
    return deliveryBoysData.filter((boy: DeliveryBoy) => {
      const matchesFilter = deliveryBoyFilter === 'all' || boy.status === deliveryBoyFilter;
      const matchesSearch = boy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          boy.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          boy.phone.includes(searchQuery);
      return matchesFilter && matchesSearch;
    });
  }, [deliveryBoysData, deliveryBoyFilter, searchQuery]);

  // Add memo for expensive computations
  const memoizedOrders = useMemo(() => {
    return {
      pending: orders.filter((order: OrderType) => order.status === 'placed'),
      processing: orders.filter((order: OrderType) => ['accepted', 'assigned'].includes(order.status)),
      completed: orders.filter((order: OrderType) => order.status === 'delivered'),
      cancelled: orders.filter((order: OrderType) => order.status === 'cancelled')
    };
  }, [orders]);

  // Helper functions
  const getSortValue = (item: MenuItem): number => {
    if (item.createdAt) {
      return new Date(item.createdAt).getTime();
    }
    // Fallback: use id/MongoDB id, converted to timestamp
    const idStr = String(item._id || item.id);
    // Convert the first 8 characters of the ID to a timestamp
    return parseInt(idStr.substring(0, 8), 16) * 1000;
  };

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

  // Event handlers
  const handleDeliveryBoySuccess = useCallback(() => {
    setShowDeliveryBoyForm(false);
    toast.success('Delivery boy added successfully');
    // Refetch delivery boys list
    queryClient.invalidateQueries({ queryKey: ['deliveryBoys'] });
  }, [queryClient]);

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
  };

  const handleAddItem = async () => {
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
      setLoading(true);      await addMenuItem({
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

  // Render functions
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
        <TableBody>
          {orders.map((order) => (
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
          ))}
        </TableBody>
      </Table>
    );
  }, [loading, handleUpdateOrderStatus]);

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
        <TableBody>
          {(menuItems[category] || [])
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
            ))}
        </TableBody>
      </Table>
    );
  }, [loading, handleDeleteItem]);

  const ReservationsTable = () => {
    const queryClient = useQueryClient();

    const handleReservationUpdate = async (id: string, status: string, tableNumber?: string) => {
      try {
        await updateReservation(id, { status, tableNumber });
        await queryClient.invalidateQueries({ queryKey: ['adminReservations'] });
        toast.success('Reservation updated successfully');
      } catch (error) {
        toast.error('Failed to update reservation');
      }
    };

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Party Size</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>          <TableBody>
            {Array.isArray(reservationsData) && reservationsData.map((reservation: any) => (
              <TableRow key={reservation._id}>
                <TableCell>{format(new Date(reservation.date), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{format(new Date(reservation.date), 'HH:mm')}</TableCell>
                <TableCell>{reservation.partySize}</TableCell>
                <TableCell>{reservation.name}</TableCell>
                <TableCell>
                  {reservation.email}<br/>{reservation.phone}
                </TableCell>
                <TableCell>
                  {reservation.status === 'confirmed' ? (
                    <Select
                      value={reservation.tableNumber || ''}
                      onValueChange={(value) => handleReservationUpdate(reservation._id, 'confirmed', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Table" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            Table {num}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    reservation.tableNumber || '-'
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    reservation.status === 'confirmed' ? 'default' :
                    reservation.status === 'pending' ? 'secondary' :
                    'destructive'
                  }>
                    {reservation.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {reservation.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReservationUpdate(reservation._id, 'confirmed')}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReservationUpdate(reservation._id, 'cancelled')}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <SectionHeading title="Admin Dashboard" subtitle="Manage orders, menu items, and delivery staff" />
        
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
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

          <TabsContent value="reservations" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Reservations</h2>
            </div>
            {isReservationsLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ReservationsTable />
            )}
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

          <TabsContent value="delivery" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Search delivery boys..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                <Select value={deliveryBoyFilter} onValueChange={setDeliveryBoyFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setShowDeliveryBoyForm(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Delivery Boy
              </Button>
            </div>

            {isDeliveryBoysLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDeliveryBoys.map((boy: DeliveryBoy) => (
                  <Card key={boy._id}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>{boy.name}</span>
                        <Badge variant={boy.status === 'active' ? 'default' : 'secondary'}>
                          {boy.status}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p><strong>Email:</strong> {boy.email}</p>
                        <p><strong>Phone:</strong> {boy.phone}</p>
                        <p><strong>Rating:</strong> {boy.rating?.toFixed(1) || 'N/A'} ({boy.totalRatings || 0} ratings)</p>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateDeliveryBoyStatus(boy._id, boy.status === 'active' ? 'inactive' : 'active')
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: ['deliveryBoys'] });
                                  toast.success('Status updated successfully');
                                })
                                .catch(() => toast.error('Failed to update status'));
                            }}
                          >
                            {boy.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Dialog open={showDeliveryBoyForm} onOpenChange={setShowDeliveryBoyForm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Delivery Boy</DialogTitle>
                </DialogHeader>
                <DeliveryBoyForm onSuccess={() => {
                  setShowDeliveryBoyForm(false);
                  queryClient.invalidateQueries({ queryKey: ['deliveryBoys'] });
                }} />
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>

        {/* Add Item Dialog */}
        <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Item name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
              <Input
                placeholder="Price"
                type="number"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
              />
              <Input
                placeholder="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              />
              <Input
                placeholder="Image URL"
                value={newItem.image}
                onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
              />
              <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starters">Starters</SelectItem>
                  <SelectItem value="Main Course">Main Course</SelectItem>
                  <SelectItem value="Desserts">Desserts</SelectItem>
                  <SelectItem value="Beverages">Beverages</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddItemDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddItem} disabled={loading}>
                  {loading ? 'Adding...' : 'Add Item'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog open={showEditItemDialog} onOpenChange={setShowEditItemDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Menu Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Item name"
                value={editingItem?.name || ''}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
              />
              <Input
                placeholder="Price"
                type="number"
                value={editingItem?.price || ''}
                onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
              />
              <Input
                placeholder="Description"
                value={editingItem?.description || ''}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              />
              <Input
                placeholder="Image URL"
                value={editingItem?.image || ''}
                onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
              />
              <Select value={editingItem?.category || ''} onValueChange={(value) => setEditingItem({ ...editingItem, category: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starters">Starters</SelectItem>
                  <SelectItem value="Main Course">Main Course</SelectItem>
                  <SelectItem value="Desserts">Desserts</SelectItem>
                  <SelectItem value="Beverages">Beverages</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditItemDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditItem} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Item'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign Delivery Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Delivery Boy</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Assign a delivery boy to this order.
              </p>
              <Select
                value={selectedDeliveryBoy}
                onValueChange={setSelectedDeliveryBoy}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select delivery boy" />
                </SelectTrigger>
                <SelectContent>
                  {filteredDeliveryBoys.map((boy: DeliveryBoy) => (
                    <SelectItem key={boy._id} value={boy._id}>
                      {boy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
        {/* <DialogFooter>
          <Button onClick={handleAssignDeliveryBoy} disabled={!selectedDeliveryBoy || !selectedOrder || loading}>
            {loading ? 'Assigning...' : ''}
          </Button>
        </DialogFooter> */}
      </div>
    </Layout>
  );
}

export default function AdminPageWrapper() {
  return (
    <AdminPage />
  );
} 