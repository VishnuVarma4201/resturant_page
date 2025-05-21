
import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface FeaturedDishProps {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

const FeaturedDish: React.FC<FeaturedDishProps> = ({
  id,
  name,
  description,
  price,
  image,
  category,
}) => {
  // Format price in Indian Rupees
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const addToCart = () => {
    toast.success(`${name} added to cart`);
    // In a real app, this would update a cart state or context
  };

  return (
    <div className="group card-hover bg-white rounded-lg overflow-hidden shadow-md">
      <div className="relative h-64 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4 bg-burgundy text-white text-sm px-3 py-1 rounded-full">
          {category}
        </div>
      </div>
      <div className="p-6">
        <h3 className="font-serif text-xl font-bold mb-2">{name}</h3>
        <p className="text-charcoal/80 mb-4 line-clamp-2">{description}</p>
        <div className="flex justify-between items-center">
          <span className="text-burgundy font-semibold">{formatPrice(price)}</span>
          <div className="flex gap-3">
            <Link
              to={`/menu`}
              className="text-sm text-burgundy font-semibold hover:underline"
            >
              View Menu
            </Link>
            <button
              onClick={addToCart}
              className="bg-burgundy text-white p-2 rounded-full hover:bg-burgundy-light transition-colors"
              aria-label="Add to cart"
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedDish;
