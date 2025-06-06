import React, { useState, useEffect } from "react";
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

const Admin = () => {
  const { menuItems, orders = [], updateOrderStatus, assignDeliveryBoy, stats, addMenuItem, updateMenuItem, removeMenuItem } = useAdmin();
  const { user, users = [], fetchDeliveryBoys } = useAuth();
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

  // Fetch delivery boys when component mounts
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDeliveryBoys();
    }
  }, [user]);

  // Filter delivery boy users from all users
  const deliveryBoys = users.filter(user => user.role === 'delivery');

  // Filter orders by status
  const pendingOrders = orders.filter(order => order.status === 'placed');
  const processingOrders = orders.filter(order => ['accepted', 'assigned'].includes(order.status));
  const completedOrders = orders.filter(order => order.status === 'delivered');
  const cancelledOrders = orders.filter(order => order.status === 'cancelled');

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      setLoading(true);
      await updateOrderStatus(orderId, status);
      toast.success(`Order ${orderId} updated to ${status}`);
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
      await assignDeliveryBoy(selectedOrder.id, selectedDeliveryBoy);
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
  };  const handleAddItem = async () => {
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

  // Render the orders table
  const renderOrdersTable = (orders: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Items</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (                <TableRow key={order._id}>
            <TableCell>{order._id}</TableCell>
            <TableCell>{order.email}</TableCell>
            <TableCell>{order.items?.length || 0} items</TableCell>
            <TableCell>₹{order.totalAmount}</TableCell>
            <TableCell>
              <Badge>{order.status}</Badge>
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
        ))}
      </TableBody>
    </Table>
  );

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
                <SelectContent>                  <SelectItem value="Starters">Starters</SelectItem>
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
    </Layout>
  );
};

export default Admin;
