import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, ChefHat } from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { GoogleLogin } from '@react-oauth/google';
import { toast } from "sonner";
import './Login.module.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, googleLogin, twitterLogin, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

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

    setLoading(true);
    try {
      const response = await login(formData.email, formData.password);
      if (response.success) {
        toast.success("Welcome back! You've successfully logged in.", {
          duration: 3000,
        });
        navigate("/");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || "Invalid credentials. Please try again.";
      toast.error(errorMessage, {
        duration: 4000,
      });

      // Handle specific error cases
      if (errorMessage.toLowerCase().includes('password')) {
        setErrors(prev => ({ ...prev, password: errorMessage }));
      } else if (errorMessage.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: errorMessage }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      await googleLogin(credentialResponse.credential);
      toast.success("Successfully logged in with Google!");
      navigate('/');
    } catch (error) {
      toast.error("Failed to login with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTwitterLogin = async () => {
    try {
      // Redirect to Twitter OAuth flow
      window.location.href = 'http://localhost:5000/api/auth/twitter';
    } catch (error) {
      toast.error("Failed to initiate Twitter login. Please try again.");
    }
  };

  // If we're authenticated, don't render the form
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Optimized Background Image */}
      <div 
        className="absolute inset-0 z-0 animate-background-pan"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-amber-200/50 animate-fade-in">
            {/* Logo & Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg animate-float">
                <ChefHat className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-fade-in">Welcome Back</h1>
              <p className="text-gray-600 animate-fade-in-up">Sign in to continue</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2 animate-slide-in-left" style={{ animationDelay: '200ms' }}>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-amber-600 transition-colors duration-300" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                    placeholder="Email address"
                    className={`w-full h-14 pl-12 pr-4 border-2 ${
                      errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-amber-600'
                    } rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 ${
                      errors.email ? 'focus:ring-red-200' : 'focus:ring-amber-200'
                    } transition-all duration-300 group-hover:border-amber-200`}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm pl-4 animate-shake">{errors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2 animate-slide-in-right" style={{ animationDelay: '400ms' }}>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-amber-600 transition-colors duration-300" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: "" });
                    }}
                    placeholder="Password"
                    className={`w-full h-14 pl-12 pr-12 border-2 ${
                      errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-amber-600'
                    } rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 ${
                      errors.password ? 'focus:ring-red-200' : 'focus:ring-amber-200'
                    } transition-all duration-300 group-hover:border-amber-200`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors duration-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm pl-4 animate-shake">{errors.password}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 transition-colors duration-300"
                  />
                  <span className="text-gray-600 group-hover:text-gray-900 transition-colors duration-300">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-amber-600 hover:text-amber-700 font-medium transition-colors duration-300"
                  onClick={() => toast.info("Password reset functionality coming soon!")}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group animate-fade-in-up relative overflow-hidden"
                style={{ animationDelay: '800ms' }}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                    <div className="absolute bottom-0 left-0 h-1 bg-white/20 loading-bar"></div>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </button>

              {/* Sign Up Link */}
              <div className="text-center animate-fade-in-up" style={{ animationDelay: '1000ms' }}>
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="text-amber-600 hover:text-amber-700 font-semibold transition-colors duration-300"
                  >
                    Sign up
                  </button>
                </p>
              </div>
            </div>
          </form>

          {/* Social Login Section */}
          <div className="mt-6 text-center">
            <div className="text-gray-500 mb-4">OR</div>
            <div className="flex flex-col gap-4">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  toast.error('Google Login Failed');
                }}
                theme="filled_black"
                shape="pill"
                width="280px"
              />
              
              <button
                type="button"
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                onClick={handleTwitterLogin}
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Continue with Twitter</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;