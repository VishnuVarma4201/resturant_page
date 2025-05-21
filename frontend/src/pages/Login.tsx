
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { User, KeyRound, Mail, UserPlus, AlertCircle, Shield, Truck } from "lucide-react";

const Login = () => {
  const { login, register, isAuthenticated, isAdmin, isDeliveryBoy } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("login");
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Form processing state
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      if (isAdmin) {
        navigate("/admin");
      } else if (isDeliveryBoy) {
        navigate("/delivery-dashboard");
      } else {
        navigate("/menu");
      }
    }
  }, [isAuthenticated, navigate, isAdmin, isDeliveryBoy]);
  
  const handleLogin = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    if (!loginEmail || !loginPassword) {
      toast.error("Please enter both email and password");
      setIsProcessing(false);
      return;
    }
    
    setTimeout(() => {
      const success = login(loginEmail, loginPassword);
      setIsProcessing(false);
      
      if (success) {
        // Navigate handled by the useEffect above
      }
    }, 800);
  };
  
  const handleRegister = (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    if (!registerName || !registerEmail || !registerPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      setIsProcessing(false);
      return;
    }
    
    if (registerPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      setIsProcessing(false);
      return;
    }
    
    setTimeout(() => {
      const success = register(registerName, registerEmail, registerPassword);
      setIsProcessing(false);
      
      if (success) {
        // Navigate handled by the useEffect above
      }
    }, 800);
  };
  
  const isDeliveryBoyEmail = (email) => {
    return email.toLowerCase().endsWith('@delivery.com');
  };
  
  const handleDemoAccountClick = (email, password) => {
    setLoginEmail(email);
    setLoginPassword(password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="py-8 px-8">
          <h2 className="text-center text-3xl font-serif font-bold text-burgundy mb-2">Culinary Canvas</h2>
          <p className="text-center text-gray-600 mb-8">Sign in to your account</p>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-8">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound size={18} className="text-gray-400" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit"
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
              
              <div className="mt-8">
                <p className="text-sm text-gray-600 text-center mb-3">Demo Accounts</p>
                <div className="space-y-2 bg-gray-50 rounded-md p-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center">
                      <Shield size={16} className="text-burgundy mr-2" />
                      <div className="text-sm">
                        <p className="font-medium">Admin:</p>
                        <p className="text-gray-500 text-xs">admin@example.com / admin123</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDemoAccountClick("admin@example.com", "admin123")}
                    >
                      Use
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center">
                      <User size={16} className="text-burgundy mr-2" />
                      <div className="text-sm">
                        <p className="font-medium">User:</p>
                        <p className="text-gray-500 text-xs">user@example.com / password</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDemoAccountClick("user@example.com", "password")}
                    >
                      Use
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <Truck size={16} className="text-burgundy mr-2" />
                      <div className="text-sm">
                        <p className="font-medium">Delivery:</p>
                        <p className="text-gray-500 text-xs">delivery@example.com / delivery123</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDemoAccountClick("delivery@example.com", "delivery123")}
                    >
                      Use
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="register-email" className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="your@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  
                  {registerEmail && isDeliveryBoyEmail(registerEmail) && (
                    <div className="flex items-center mt-1 text-xs text-blue-600">
                      <Truck size={14} className="mr-1" />
                      <span>You will be registered as a delivery partner</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="register-password" className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound size={18} className="text-gray-400" />
                    </div>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <KeyRound size={18} className="text-gray-400" />
                    </div>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-10 ${confirmPassword && registerPassword !== confirmPassword ? 'border-red-500' : ''}`}
                      required
                    />
                  </div>
                  
                  {confirmPassword && registerPassword !== confirmPassword && (
                    <div className="flex items-center mt-1 text-xs text-red-600">
                      <AlertCircle size={14} className="mr-1" />
                      <span>Passwords do not match</span>
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit"
                  className="w-full"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <UserPlus size={16} className="mr-2" />
                      Create Account
                    </div>
                  )}
                </Button>
              </form>
              
              <div className="mt-8">
                <div className="text-sm text-gray-600 text-center">
                  <p>Note: Use <strong>@delivery.com</strong> domain for delivery partner accounts</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Login;
