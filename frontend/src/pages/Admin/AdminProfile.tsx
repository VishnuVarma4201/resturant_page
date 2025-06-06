import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { User, UserResponse, transformUser } from "@/types/user";
import { useMutation, useQuery, useQueryClient, QueryFilters } from "@tanstack/react-query";

interface AdminProfileProps {
  user: UserResponse;
}

export const AdminProfile = ({ user }: AdminProfileProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: profile, isLoading, error } = useQuery<UserResponse>({
    queryKey: ['adminProfile'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/admin/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data: User = await response.json();
      return transformUser(data);
    },
    initialData: user
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Add useEffect to update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await fetch('http://localhost:5000/api/admin/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update profile');
      const userData: User = await response.json();
      return transformUser(userData);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['adminProfile'], data);
      queryClient.invalidateQueries({
        queryKey: ['adminProfile']
      });
      toast({ description: "Profile updated successfully" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({ 
        description: "Name and email are required", 
        variant: "destructive" 
      });
      return;
    }
    updateMutation.mutate(formData);
  };

  if (error) {
    return <div>Error loading profile</div>;
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Admin Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button 
              type="button"
              onClick={() => queryClient.refetchQueries({ queryKey: ['adminProfile'] } as QueryFilters)}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Refresh"}
            </Button>
            <Button 
              type="submit"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
