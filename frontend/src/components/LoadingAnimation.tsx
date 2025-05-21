
import React from "react";
import { motion } from "framer-motion";

const LoadingAnimation = ({ text = "Loading..." }) => {
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
        {text}
      </motion.p>
    </div>
  );
};

export default LoadingAnimation;
