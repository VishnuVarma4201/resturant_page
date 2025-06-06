import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      toast({
        title: "Success",
        description: "Account created successfully! Please login.",
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error || "Registration failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://interiordesign.net/wp-content/uploads/2024/04/InteriorDesign_March2024_Brave-New-World-11-1024x768.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between p-8">
        {/* Register Form */}
        <div className="w-full max-w-md mx-auto mt-20">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-8 shadow-xl">
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Create Account
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {[
                { name: "name", type: "text", placeholder: "Full Name" },
                { name: "email", type: "email", placeholder: "Email" },
                { name: "password", type: "password", placeholder: "Password" },
                { name: "phone", type: "tel", placeholder: "Phone Number" }
              ].map((field) => (
                <Input
                  key={field.name}
                  type={field.type}
                  value={formData[field.name]}
                  onChange={(e) =>
                    setFormData({ ...formData, [field.name]: e.target.value })
                  }
                  placeholder={field.placeholder}
                  className="h-12 bg-white/80"
                  required
                />
              ))}

              <Button
                type="submit"
                className="w-full h-12 bg-burgundy hover:bg-burgundy/90"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="w-full max-w-md mx-auto text-center text-white mt-auto">
          <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
          <p className="mb-4 text-gray-200">
            Already have an account? Sign in to continue your journey.
          </p>
          <Link to="/login">
            <Button 
              variant="outline" 
              className="h-12 px-8 text-white border-white hover:bg-white/10"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
