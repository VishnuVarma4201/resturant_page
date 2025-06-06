import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdmin } from "@/context/AdminContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingAnimation from "@/components/LoadingAnimation";
import { useNavigate } from "react-router-dom";

interface DashboardData {
  orders: Array<{
    id: string;
    status: string;
    // ...other order properties
  }>,
  stats: {
    totalOrders: number,
    totalRevenue: number,
    pendingOrders: number
  }
}

const Admin = () => {
  const { menuItems } = useAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not admin
  React.useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token');

      try {
        const response = await fetch('http://localhost:5000/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
          }
          throw new Error('Failed to fetch dashboard data');
        }

        return response.json();
      } catch (error) {
        console.error('Dashboard error:', error);
        throw error;
      }
    },
    enabled: !!user && user.role === 'admin',
    retry: false
  });

  // Safe access to data with optional chaining
  const filteredOrders = data?.orders?.filter(order => order?.status === 'pending') || [];

  if (isLoading) {
    return <LoadingAnimation text="Loading dashboard..." />;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading dashboard data</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.stats.totalOrders}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{data.stats.totalRevenue}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.stats.pendingOrders}</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Section */}
      <div className="mt-8">
        <h2>Pending Orders ({filteredOrders.length})</h2>
        {/* Add orders list here */}
      </div>

      {/* Menu Section */}
      {menuItems && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Menu Items</h2>
          {Object.entries(menuItems).map(([category, items]) => (
            <div key={category}>
              <h3>{category}</h3>
              {/* Menu items list */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;
