import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, Phone, MapPin, Star, CheckCircle, XCircle } from "lucide-react";

export const DeliveryBoyManagement = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDeliveryBoy, setNewDeliveryBoy] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const queryClient = useQueryClient();

  // Fetch delivery boys
  const { data: deliveryBoys = [], isLoading } = useQuery({
    queryKey: ['deliveryBoys'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/delivery-boy', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch delivery boys');
      return response.json();
    }
  });

  // Add delivery boy mutation
  const addDeliveryBoy = useMutation({
    mutationFn: async (data: typeof newDeliveryBoy) => {
      const response = await fetch('http://localhost:5000/api/delivery-boy/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add delivery boy');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveryBoys'] });
      toast.success('Delivery boy added successfully');
      setShowAddDialog(false);
      setNewDeliveryBoy({ name: '', email: '', phone: '', password: '' });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Update delivery boy status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`http://localhost:5000/api/delivery-boy/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveryBoys'] });
      toast.success('Status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update status');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDeliveryBoy.mutate(newDeliveryBoy);
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatus.mutate({ id, status });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold">Delivery Partners</CardTitle>
          <Button onClick={() => setShowAddDialog(true)}>
            Add Delivery Boy
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="suspended">Suspended</TabsTrigger>
            </TabsList>

            {['active', 'inactive', 'suspended'].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliveryBoys
                        .filter(boy => boy.status === tab)
                        .map((boy) => (
                          <TableRow key={boy._id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <User className="h-8 w-8 text-gray-400" />
                                <div>
                                  <p className="font-medium">{boy.name}</p>
                                  <p className="text-sm text-gray-500">{boy.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm">{boy.phone}</span>
                                </div>
                                {boy.currentLocation && (
                                  <div className="flex items-center space-x-2">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">Last active: {new Date(boy.currentLocation.lastUpdated).toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 mr-1" />
                                <span>{boy.rating.toFixed(1)}</span>
                                <span className="text-gray-500 text-sm ml-1">
                                  ({boy.totalRatings} reviews)
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(boy.status)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {boy.status !== 'active' && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="text-green-600"
                                    onClick={() => handleStatusChange(boy._id, 'active')}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Activate
                                  </Button>
                                )}
                                {boy.status !== 'suspended' && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="text-red-600"
                                    onClick={() => handleStatusChange(boy._id, 'suspended')}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Suspend
                                  </Button>
                                )}
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

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Delivery Partner</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">Name</label>
                <Input
                  id="name"
                  className="col-span-3"
                  value={newDeliveryBoy.name}
                  onChange={(e) => setNewDeliveryBoy({ ...newDeliveryBoy, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="email" className="text-right">Email</label>
                <Input
                  id="email"
                  type="email"
                  className="col-span-3"
                  value={newDeliveryBoy.email}
                  onChange={(e) => setNewDeliveryBoy({ ...newDeliveryBoy, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="phone" className="text-right">Phone</label>
                <Input
                  id="phone"
                  className="col-span-3"
                  value={newDeliveryBoy.phone}
                  onChange={(e) => setNewDeliveryBoy({ ...newDeliveryBoy, phone: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="password" className="text-right">Password</label>
                <Input
                  id="password"
                  type="password"
                  className="col-span-3"
                  value={newDeliveryBoy.password}
                  onChange={(e) => setNewDeliveryBoy({ ...newDeliveryBoy, password: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={addDeliveryBoy.isPending}>
                {addDeliveryBoy.isPending ? 'Adding...' : 'Add Delivery Partner'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
