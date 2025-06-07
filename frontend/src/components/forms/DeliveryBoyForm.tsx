import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock, Phone, Loader2 } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';

interface DeliveryBoyFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface DeliveryBoyFormProps {
  onSuccess?: () => void;
  className?: string;
}

const DeliveryBoyForm = ({ onSuccess, className }: DeliveryBoyFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DeliveryBoyFormData>({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const [errors, setErrors] = useState<Partial<DeliveryBoyFormData>>({});
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    // Clean and prepare form data
    const cleanedFormData = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone.replace(/\D/g, ''),
      password: formData.password
    };

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/delivery-boy/register', cleanedFormData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data) {
        toast.success("Delivery boy account created successfully!");
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: ''
        });
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Error creating delivery boy:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || "Failed to create delivery boy account";
      toast.error(errorMessage);
      
      // Handle validation errors
      if (error.response?.data?.required) {
        const newErrors: Partial<DeliveryBoyFormData> = {};
        error.response.data.required.forEach((field: string) => {
          newErrors[field as keyof DeliveryBoyFormData] = `${field} is required`;
        });
        setErrors(newErrors);
      }
      
      // Handle other specific errors
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Partial<DeliveryBoyFormData> = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else {
      // Remove any non-digit characters
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        newErrors.phone = 'Phone number must be 10 digits';
        isValid = false;
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format phone number if the field is phone
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '');
      if (digits.length <= 10) {
        const parts = digits.match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
        const formatted = !parts ? '' :
          (!parts[2] ? parts[1] : // only first group
            !parts[3] ? `${parts[1]}-${parts[2]}` : // first and second
            `${parts[1]}-${parts[2]}-${parts[3]}`); // all parts
        setFormData(prev => ({
          ...prev,
          [name]: formatted
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name as keyof DeliveryBoyFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4 w-full", className)}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter full name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              className={cn(
                "pl-10",
                errors.name && "border-red-500 focus-visible:ring-red-500"
              )}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </div>
          {errors.name && (
            <p id="name-error" className="text-sm text-red-500">
              {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className={cn(
                "pl-10",
                errors.email && "border-red-500 focus-visible:ring-red-500"
              )}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="text-sm text-red-500">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              className={cn(
                "pl-10",
                errors.phone && "border-red-500 focus-visible:ring-red-500"
              )}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "phone-error" : undefined}
            />
          </div>
          {errors.phone && (
            <p id="phone-error" className="text-sm text-red-500">
              {errors.phone}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              className={cn(
                "pl-10",
                errors.password && "border-red-500 focus-visible:ring-red-500"
              )}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
          </div>
          {errors.password && (
            <p id="password-error" className="text-sm text-red-500">
              {errors.password}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Creating Account...</span>
          </div>
        ) : (
          <span>Create Delivery Boy Account</span>
        )}
      </Button>
    </form>
  );
};

export default DeliveryBoyForm;