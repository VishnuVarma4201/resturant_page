import React from "react";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import LoadingAnimation from "@/components/LoadingAnimation";
import { useCart } from "@/context/CartContext";
import { useQuery } from "@tanstack/react-query";
import { getMenuItems, categories, MenuItem, filterByCategory } from "@/services/menuService";

const Menu = () => {
  const [activeCategory, setActiveCategory] = React.useState("all");
  const { addToCart } = useCart();

  const { data: allMenuItems, isLoading, error } = useQuery<MenuItem[]>({
    queryKey: ["menu"],
    queryFn: getMenuItems,
  });

  const menuItems = React.useMemo(
    () => filterByCategory(allMenuItems || [], activeCategory),
    [allMenuItems, activeCategory]
  );
  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      id: item._id || item.id || Date.now(), // Fallback to timestamp if no id
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category,
    });
  };

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return <LoadingAnimation text="Preparing your menu..." />;
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen pt-24 pb-16">
          <div className="container-custom text-center">
            <p className="text-red-500">Failed to load menu items. Please try again later.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container-custom">
          <SectionHeading
            title="Our Menu"
            subtitle="Discover culinary excellence"
          />

          <motion.div
            className="mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Tabs defaultValue="all" onValueChange={setActiveCategory}>
              <TabsList className="flex justify-center flex-wrap mb-8">
                <TabsTrigger value="all">All</TabsTrigger>
                {Object.entries(categories).map(([key, label]) => (
                  <TabsTrigger key={key} value={key}>
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="mt-0">
                {menuItems?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No items available in this category.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems?.map((item) => (
                      <MenuCard
                        key={item.id}
                        item={item}
                        formatPrice={formatPrice}
                        addToCart={handleAddToCart}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {Object.keys(categories).map((category) => (
                <TabsContent key={category} value={category} className="mt-0">
                  {menuItems?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                        No items available in this category.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {menuItems?.map((item) => (
                        <MenuCard
                          key={item.id}
                          item={item}
                          formatPrice={formatPrice}
                          addToCart={handleAddToCart}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

interface MenuCardProps {
  item: MenuItem;
  formatPrice: (price: number) => string;
  addToCart: (item: MenuItem) => void;
}

const MenuCard: React.FC<MenuCardProps> = ({ item, formatPrice, addToCart }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="h-48 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{item.name}</CardTitle>
              <CardDescription className="mt-2">
                {item.description}
              </CardDescription>
            </div>
            <div className="text-burgundy font-bold">
              {formatPrice(item.price)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-auto">
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to={`/menu/${item.id}`} className="w-full">
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </Link>
            <Button className="w-full" onClick={() => addToCart(item)}>
              <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Menu;
