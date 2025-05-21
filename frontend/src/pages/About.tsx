
import React from "react";
import Layout from "@/components/Layout";
import SectionHeading from "@/components/SectionHeading";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const AboutPage = () => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingAnimation />;
  }

  return (
    <Layout>
      <div className="min-h-screen pt-24 pb-16">
        <div className="container-custom">
          <SectionHeading
            title="Our Story"
            subtitle="The passion behind Culinary Canvas"
          />
          
          <motion.div 
            className="grid md:grid-cols-2 gap-8 mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-6">
              <motion.h3 
                className="text-2xl font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Our Beginning
              </motion.h3>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Founded in 2010 by Chef Arjun Kapoor, Culinary Canvas began as a small family restaurant in the heart of Mumbai. With a passion for creating artistic culinary experiences, Chef Arjun combined traditional Indian flavors with modern cooking techniques.
              </motion.p>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                What started as an intimate 20-seat restaurant quickly gained popularity among locals and tourists alike, leading to our expansion to our current location in 2015.
              </motion.p>
              
              <motion.h3 
                className="text-2xl font-bold pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Our Philosophy
              </motion.h3>
              <motion.p 
                className="text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                At Culinary Canvas, we believe that food is an art form. Each dish we create is a carefully crafted masterpiece, designed to delight all your senses. We source only the finest local ingredients, supporting Indian farmers and producers who share our commitment to quality and sustainability.
              </motion.p>
            </div>
            
            <motion.div
              className="relative h-[400px] md:h-full rounded-lg overflow-hidden shadow-xl"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                alt="Restaurant interior" 
                className="w-full h-full object-cover"
              />
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8 mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <motion.div 
              className="bg-white p-6 rounded-lg shadow-md"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h4 className="text-xl font-bold mb-4">Quality Ingredients</h4>
              <p className="text-muted-foreground">We source the finest ingredients from local farms and markets, ensuring freshness and supporting our community.</p>
            </motion.div>
            <motion.div 
              className="bg-white p-6 rounded-lg shadow-md"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h4 className="text-xl font-bold mb-4">Artistic Presentation</h4>
              <p className="text-muted-foreground">Each dish is meticulously plated, turning simple ingredients into visual masterpieces that are as beautiful as they are delicious.</p>
            </motion.div>
            <motion.div 
              className="bg-white p-6 rounded-lg shadow-md"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h4 className="text-xl font-bold mb-4">Cultural Heritage</h4>
              <p className="text-muted-foreground">We honor India's rich culinary traditions while embracing innovation, creating dishes that tell the story of our heritage.</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

// Restaurant-themed loading animation component
const LoadingAnimation = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="relative w-32 h-32">
        <motion.div
          className="absolute top-0 left-0 w-full h-full border-8 border-burgundy rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
            rotate: 360
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16"
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <img
            src="https://img.icons8.com/ios-filled/100/9C3648/dining-room.png"
            alt="Restaurant Icon"
            className="w-16 h-16"
          />
        </motion.div>
      </div>
      <motion.p
        className="mt-4 text-xl font-medium text-burgundy"
        animate={{
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        Setting the table...
      </motion.p>
    </div>
  );
};

export default AboutPage;
