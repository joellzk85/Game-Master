import React from "react";
import drumstickImg from "../assets/images/texas_fried_drumstick_1788485497573.jpg";

interface TexasDrumstickBadgeProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showBorder?: boolean;
}

export default function TexasDrumstickBadge({
  size = "md",
  className = "",
  showBorder = true,
}: TexasDrumstickBadgeProps) {
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-9 h-9",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden ${
        showBorder ? "border-2 border-[#F9B800] bg-[#14110F] shadow-md shadow-[#BE2403]/30" : ""
      } ${sizeClasses[size]} ${className}`}
    >
      <img
        src={drumstickImg}
        alt="Texas Chicken Fried Drumstick"
        className="w-full h-full object-cover select-none"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
