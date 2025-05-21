
import React from "react";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  dark?: boolean;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  centered = true,
  dark = false,
}) => {
  return (
    <div className={`mb-12 ${centered ? "text-center" : "text-left"}`}>
      <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${dark ? "text-cream" : "text-charcoal"}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-lg ${dark ? "text-cream/80" : "text-charcoal/80"} max-w-2xl ${centered ? "mx-auto" : ""}`}>
          {subtitle}
        </p>
      )}
      <div className={`w-24 h-1 bg-gold mt-4 ${centered ? "mx-auto" : ""}`}></div>
    </div>
  );
};

export default SectionHeading;
