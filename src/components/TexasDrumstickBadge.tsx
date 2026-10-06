import React from "react";

interface BadgeProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showBorder?: boolean;
}

export default function TexasDrumstickBadge({
  size = "md",
  className = "",
  showBorder = true,
}: BadgeProps) {
  const sizeClasses = {
    xs: "w-5 h-5",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-16 h-16",
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 bg-[#5bc09f]/15 text-[#5bc09f] ${
        showBorder ? "border border-[#5bc09f]" : ""
      } ${sizeClasses[size]} ${className}`}
    >
      <div className="w-2 h-2 bg-[#5bc09f]" />
    </div>
  );
}
