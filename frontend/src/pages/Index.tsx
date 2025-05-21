
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Star, Calendar, Utensils } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/context/AdminContext";

const HeroSection = () => {
  const { isAuthenticated, isAdmin, isDeliveryBoy } = useAuth();
  
  return (
    <div className="relative h-screen">
      <div className="absolute inset-0 z-0">
        {/* <img
          src="/images/hero-bg.jpg"
          alt="Restaurant Hero"
          className="w-full h-full object-cover"
        /> */}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      
      <div className="relative z-10 h-full flex flex-col justify-center container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">
            Experience Culinary Excellence
          </h1>
          
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            Indulge in a symphony of flavors with our chef-crafted dishes made from the freshest ingredients
          </p>
          
          {isAuthenticated ? (
            <div className="flex flex-wrap gap-4">
              {!isAdmin && !isDeliveryBoy && (
                <>
                  <Button asChild size="lg" className="bg-burgundy hover:bg-burgundy/90">
                    <Link to="/menu">View Our Menu</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                    <Link to="/reservations">Book a Table</Link>
                  </Button>
                </>
              )}
              
              {isAdmin && (
                <Button asChild size="lg" className="bg-burgundy hover:bg-burgundy/90">
                  <Link to="/admin">Admin Dashboard</Link>
                </Button>
              )}
              
              {isDeliveryBoy && (
                <Button asChild size="lg" className="bg-burgundy hover:bg-burgundy/90">
                  <Link to="/delivery-dashboard">Delivery Dashboard</Link>
                </Button>
              )}
            </div>
          ) : (
            <Button asChild size="lg" className="bg-burgundy hover:bg-burgundy/90">
              <Link to="/login">Sign In to Order</Link>
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const SpecialDishes = () => {
  const { menuItems } = useAdmin();
  const { isAuthenticated, isAdmin, isDeliveryBoy } = useAuth();
  
  // Get some featured items from the menu
  const getSpecialItems = () => {
    let specials = [];
    
    if (menuItems) {
      // Get items from different categories
      for (const category in menuItems) {
        if (menuItems[category] && menuItems[category].length > 0) {
          // Get the first 1-2 items from each category until we have at least 4 items
          const items = menuItems[category].slice(0, 2);
          specials = [...specials, ...items];
          if (specials.length >= 4) break;
        }
      }
    }
    
    // Return at most 4 special items
    return specials.slice(0, 4);
  };
  
  const specialItems = getSpecialItems();
  
  return (
    <div className="py-20 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Our Special Dishes
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our chef's selection of extraordinary dishes that combine innovative techniques with traditional flavors
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {specialItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow duration-300">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm ml-1">4.9</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-burgundy">₹{item.price}</span>
                    {isAuthenticated && !isAdmin && !isDeliveryBoy && (
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/menu/${item.id}`}>View Details</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {isAuthenticated && !isAdmin && !isDeliveryBoy && (
          <div className="text-center mt-12">
            <Button asChild size="lg">
              <Link to="/menu" className="flex items-center">
                Explore Full Menu <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoSection = () => {
  const { isAuthenticated, isAdmin, isDeliveryBoy } = useAuth();
  
  return (
    <div className="py-20 bg-white">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img 
              src="/images/restaurant-interior.jpg" 
              alt="Restaurant Interior" 
              className="rounded-lg shadow-lg"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              A Culinary Journey Like No Other
            </h2>
            
            <p className="text-gray-600 mb-4">
              At Culinary Canvas, we blend traditional recipes with modern techniques to create 
              unforgettable dining experiences. Our chefs use only the finest ingredients, 
              sourced locally when possible, to craft dishes that celebrate flavor and creativity.
            </p>
            
            <p className="text-gray-600 mb-6">
              Whether you're joining us for a romantic dinner, family celebration, or business lunch, 
              our attentive staff and elegant ambiance provide the perfect backdrop for any occasion.
            </p>
            
            <div className="flex flex-wrap gap-4">
              {isAuthenticated && !isAdmin && !isDeliveryBoy && (
                <Button asChild variant="outline" className="flex items-center">
                  <Link to="/reservations">
                    <Calendar className="mr-2 h-4 w-4" />
                    Reserve a Table
                  </Link>
                </Button>
              )}
              
              <Button asChild variant="outline" className="flex items-center">
                <Link to="/about">
                  <Utensils className="mr-2 h-4 w-4" />
                  About Us
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <Layout hidePadding>
      <HeroSection />
      <SpecialDishes />
      <InfoSection />
    </Layout>
  );
};

export default Index;
