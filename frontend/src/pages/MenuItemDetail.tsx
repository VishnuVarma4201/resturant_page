
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/CartContext";
import { useAdmin } from "@/context/AdminContext";

const MenuItemDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { menuItems } = useAdmin();
  const [quantity, setQuantity] = useState(1);
  // Find the item by either _id or legacy id
  const item = Object.values(menuItems)
    .flat()
    .find((item) => item._id === id || item.id?.toString() === id);

  if (!item) {
    return (
      <Layout>
        <div className="min-h-screen pt-24 pb-16">
          <div className="container-custom">
            <SectionHeading title="Menu Item Not Found" />
            <p className="text-center text-lg">
              The menu item you are looking for does not exist.
            </p>
          </div>
        </div>
      </Layout>
    );
  }
  const handleAddToCart = () => {
    const itemId = item._id || item.id || Date.now(); // Fallback to timestamp if no id
    // First add the item without quantity
    addToCart({
      id: itemId,
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category || "mainCourse", // Ensure category has a default value
    });
    
    // Then update the quantity if needed (quantity > 1)
    if (quantity > 1) {
      // Find the item and update its quantity
      for (let i = 1; i < quantity; i++) {
        addToCart({
          id: itemId,
          name: item.name,
          price: item.price,
          image: item.image,
          category: item.category || "mainCourse",
        });
      }
    }
    
    toast.success(`Added ${quantity} ${item.name} to cart`);
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      setQuantity(newQuantity);
    } else {
      // If the input is not a valid number or less than 1, reset the quantity to 1
      setQuantity(1);
    }
  };

  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container-custom">
          <SectionHeading title={item.name} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:order-2">
              <img
                src={item.image}
                alt={item.name}
                className="w-full rounded-lg shadow-md"
              />
            </div>
            <div className="md:order-1">
              <p className="text-charcoal/80 mb-4">{item.description}</p>
              <p className="text-burgundy font-semibold text-xl mb-4">
                {formatPrice(item.price)}
              </p>
              <div className="flex items-center space-x-4 mb-4">
                <Button onClick={decreaseQuantity}>-</Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-20 text-center"
                  min="1"
                />
                <Button onClick={increaseQuantity}>+</Button>
              </div>
              <Button onClick={handleAddToCart} className="w-full">
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MenuItemDetail;
