
import React from "react";
import { Link } from "react-router-dom";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  backgroundImage: string;
  ctaText?: string;
  ctaLink?: string;
  overlay?: boolean;
  height?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  backgroundImage,
  ctaText,
  ctaLink = "/reservations",
  overlay = true,
  height = "h-[90vh]",
}) => {
  return (
    <div
      className={`relative ${height} bg-center bg-cover flex items-center`}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {overlay && (
        <div className="absolute inset-0 bg-charcoal/50"></div>
      )}
      <div className="container-custom relative z-10 text-center md:text-left">
        <div className="max-w-3xl animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            {title}
          </h1>
          <p className="text-xl md:text-2xl text-cream mb-8">
            {subtitle}
          </p>
          {ctaText && (
            <Link to={ctaLink} className="btn-primary inline-block">
              {ctaText}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
