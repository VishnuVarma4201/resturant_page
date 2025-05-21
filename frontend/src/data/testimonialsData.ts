
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  image: string;
  quote: string;
  rating: number;
}

export const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Sophia Laurent",
    role: "Food Critic",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80",
    quote: "The truffle-infused arancini perfectly balances rich flavors with delicate textures. Culinary Canvas continually pushes boundaries while honoring classical techniques.",
    rating: 5
  },
  {
    id: "2",
    name: "James Chen",
    role: "Food Blogger",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80",
    quote: "Every dish tells a story at this exceptional establishment. From the first appetizer to the final dessert, dining here is a journey worth taking time and again.",
    rating: 5
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    role: "Local Patron",
    image: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80",
    quote: "The attention to detail is impeccable, from the artful plating to the carefully curated wine pairings. This restaurant has become our family's go-to for special celebrations.",
    rating: 4
  },
  {
    id: "4",
    name: "Michael Thompson",
    role: "Executive Chef",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80",
    quote: "As someone who works in the industry, I deeply appreciate the technical precision and creative vision evident in every aspect of the dining experience here.",
    rating: 5
  }
];
