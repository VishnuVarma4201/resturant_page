import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Phone, ArrowRight, ChefHat } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface FormData {
  name: string;
  email: string;
  password: string;
  phone: string;
}

interface FormErrors {
  name: string;
  email: string;
  password: string;
  phone: string;
}

const Register = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors: FormErrors = {
      name: "",
      email: "",
      password: "",
      phone: "",
    };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = "Please enter a valid phone number";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting");
      return;
    }

    setLoading(true);    try {
      const response = await register(formData);
      
      toast.success("Account created successfully! Redirecting to login...", {
        duration: 3000,
      });
      
      // Use a shorter timeout and clear it if component unmounts
      const timeout = setTimeout(() => {
        navigate("/login");
      }, 1500);
      
      return () => clearTimeout(timeout);
    } catch (error: any) {
      console.error('Registration error in component:', error);
      const errorMessage = error.message || "Registration failed. Please try again.";
      
      toast.error(errorMessage, {
        duration: 4000,
      });
      
      // Handle specific error cases
      if (errorMessage.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: errorMessage }));
      } else if (errorMessage.toLowerCase().includes('password')) {
        setErrors(prev => ({ ...prev, password: errorMessage }));
      } else if (errorMessage.toLowerCase().includes('phone')) {
        setErrors(prev => ({ ...prev, phone: errorMessage }));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputFields = [
    { name: "name" as const, type: "text", placeholder: "Full Name", icon: User },
    { name: "email" as const, type: "email", placeholder: "Email Address", icon: Mail },
    { name: "password" as const, type: "password", placeholder: "Create Password", icon: Lock },
    { name: "phone" as const, type: "tel", placeholder: "Phone Number", icon: Phone }
  ] as const;

  // If we're authenticated, don't render the form
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=2074&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: 'scale(1.1)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70"></div>
      </div>

      {/* Form Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-amber-200/50">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                <ChefHat className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-fade-in">Join Delicious Bite</h1>
              <p className="text-gray-600 animate-fade-in-up">Create your account to get started</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {inputFields.map((field, index) => (
                <div key={field.name} className="space-y-2 animate-fade-in-up" style={{ animationDelay: `${index * 150}ms` }}>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <field.icon className="h-5 w-5 text-gray-400 group-focus-within:text-amber-600 transition-colors duration-300" />
                    </div>
                    <input
                      type={field.type}
                      value={formData[field.name]}
                      onChange={(e) => {
                        setFormData({ ...formData, [field.name]: e.target.value });
                        if (errors[field.name]) {
                          setErrors({ ...errors, [field.name]: "" });
                        }
                      }}
                      placeholder={field.placeholder}
                      className={`w-full h-14 pl-12 pr-4 border-2 ${
                        errors[field.name] ? 'border-red-300' : 'border-gray-200'
                      } rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 ${
                        errors[field.name] ? 'focus:border-red-500 focus:ring-red-200' : 'focus:border-amber-600 focus:ring-amber-200'
                      } transition-all duration-300 group-hover:border-amber-200`}
                    />
                  </div>
                  {errors[field.name] && (
                    <p className="text-red-500 text-sm pl-4 animate-shake">{errors[field.name]}</p>
                  )}
                </div>
              ))}

              {/* Terms & Submit */}
              <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                <label className="flex items-start space-x-3 group cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="w-5 h-5 mt-1 text-amber-600 border-gray-300 rounded focus:ring-amber-500 transition-colors duration-300"
                  />
                  <span className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors duration-300">
                    I agree to the{' '}
                    <button type="button" className="text-amber-600 hover:text-amber-700 font-semibold">
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button type="button" className="text-amber-600 hover:text-amber-700 font-semibold">
                      Privacy Policy
                    </button>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating your account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </button>
              </div>

              {/* Sign In Link */}
              <div className="text-center animate-fade-in-up" style={{ animationDelay: '750ms' }}>
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-amber-600 hover:text-amber-700 font-semibold transition-colors duration-300"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;