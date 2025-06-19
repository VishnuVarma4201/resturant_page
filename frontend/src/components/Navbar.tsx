import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, ShoppingCart, User, ShieldCheck, LogOut, Truck, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { getCartCount } = useCart();
  const { isAuthenticated, isAdmin, isDeliveryBoy, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = getCartCount();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  const navigateHome = () => {
    navigate("/");
    closeMenu();
  };

  // Get role-specific navigation links
  const getNavigationLinks = () => {
    // For non-authenticated users, show only Home
    if (!isAuthenticated) {
      return [
        { to: "/", label: "Home", icon: Home }
      ];
    }
    
    // For admin users
    if (isAdmin) {
      return [
        { to: "/", label: "Home", icon: Home },
        { to: "/about", label: "About" },
        { to: "/contact", label: "Contact" },
        { to: "/admin", label: "Dashboard", icon: ShieldCheck }
      ];
    }
    
    // For delivery users
    if (isDeliveryBoy) {
      return [
        { to: "/", label: "Home", icon: Home },
        { to: "/delivery-dashboard", label: "Deliveries", icon: Truck }
      ];
    }
    
    // For regular users
    return [
      { to: "/", label: "Home", icon: Home },
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
      { to: "/menu", label: "Menu" },
      { to: "/reservations", label: "Reservations" },
      { to: "/delivery-tracking", label: "Track Order" }
    ];
  };
  
  const navigationLinks = getNavigationLinks();

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-md py-2"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container-custom flex justify-between items-center">
        <button onClick={navigateHome} className="font-serif text-2xl md:text-3xl font-bold text-burgundy">
          Culinary Canvas
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navigationLinks.map((link) => (
            <Link 
              key={link.to} 
              to={link.to} 
              className="hover:text-burgundy transition-colors flex items-center gap-1"
            >
              {link.icon && <link.icon size={18} />}
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {/* Show cart only for regular users */}
              {!isAdmin && !isDeliveryBoy && (
                <Link to="/cart" className="relative">
                  <ShoppingCart className="hover:text-burgundy transition-colors" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-burgundy text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}
              
              {/* <Link to="/profile">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <User size={16} /> {user?.name || 'Profile'}
                </Button>
              </Link> */}
              
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ShieldCheck size={16} /> Admin
                  </Button>
                </Link>
              )}
              
              {isDeliveryBoy && (
                <Link to="/delivery-dashboard">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Truck size={16} /> Deliveries
                  </Button>
                </Link>
              )}
              
              <Button variant="ghost" size="sm" onClick={handleLogout} className="flex items-center gap-2">
                <LogOut size={16} /> Logout
              </Button>
            </>
          ) : (
            <>
              {location.pathname !== "/login" && (
                <Link to="/login">
                  <Button variant="default" size="sm">
                    Sign In
                  </Button>
                </Link>
              )}
              <Link to="/register" className="btn-secondary">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center">
          {isAuthenticated && !isAdmin && !isDeliveryBoy && (
            <Link to="/cart" className="relative mr-4">
              <ShoppingCart />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-burgundy text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          )}
          <button onClick={toggleMenu} className="text-burgundy">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed top-[60px] left-0 right-0 bg-background/95 backdrop-blur-md shadow-md transition-all duration-300 overflow-hidden ${
          isOpen ? "max-h-[600px] p-4" : "max-h-0"
        }`}
      >
        <div className="flex flex-col space-y-4 px-4">
          {navigationLinks.map((link) => (
            <Link 
              key={link.to}
              to={link.to} 
              onClick={closeMenu} 
              className="py-2 flex items-center gap-2 hover:text-burgundy transition-colors"
            >
              {link.icon && <link.icon size={18} />}
              {link.label}
            </Link>
          ))}
          
          {isAuthenticated && (
            <>
              <Link to="/profile" onClick={closeMenu} className="py-2 hover:text-burgundy transition-colors">
                Profile
              </Link>
              
              <button 
                onClick={handleLogout} 
                className="py-2 text-left hover:text-burgundy transition-colors"
              >
                Logout
              </button>
            </>
          )}
          
          {!isAuthenticated && (
            <>
              {location.pathname !== "/login" && (
                <Link to="/login" onClick={closeMenu} className="py-2 hover:text-burgundy transition-colors">
                  Sign In
                </Link>
              )}
              <Link to="/register" onClick={closeMenu} className="py-2 hover:text-burgundy transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
