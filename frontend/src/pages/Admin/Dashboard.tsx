import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuManagement } from './MenuManagement';
import { ReservationManagement } from './ReservationManagement';
import { AdminProfile } from './AdminProfile';
import { DeliveryBoyManagement } from './DeliveryBoyManagement';
import { Table } from "@/components/ui/table";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading, error } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['adminOrders'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    }
  });

  if (statsLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Only render if stats exists */}
        {stats && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalOrders || 0}</p>
              </CardContent>
            </Card>
            {/* ...other stat cards... */}
          </>
        )}
      </div>

      {/* Orders Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        {orders && orders.length > 0 ? (
          <Table>
            {/* ...existing table code... */}
          </Table>
        ) : (
          <p className="text-gray-500 text-center py-4">No orders found</p>
        )}
      </div>

      <Tabs defaultValue="menu">
        <TabsList>
          <TabsTrigger value="menu">Menu Management</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="menu">
          <MenuManagement />
        </TabsContent>
        
        <TabsContent value="reservations">
          <ReservationManagement />
        </TabsContent>        <TabsContent value="delivery">
          <DeliveryBoyManagement />
        </TabsContent>
        <TabsContent value="profile">
          <AdminProfile user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
