import React from "react";

export default function CuemathLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 40 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* North Star */}
      <path 
        d="M32 6L33.5 10.5L38 12L33.5 13.5L32 18L30.5 13.5L26 12L30.5 10.5L32 6Z" 
        fill="#FFD700" 
      />
      
      {/* Rocket Fins */}
      <path d="M14 28L8 34V38L14 36V28Z" fill="#002E6E" />
      <path d="M26 28L32 34V38L26 36V28Z" fill="#002E6E" />
      
      {/* Rocket Body */}
      <path 
        d="M20 4C20 4 12 16 12 28C12 34 15.5 37 20 37C24.5 37 28 34 28 28C28 16 20 4 20 4Z" 
        fill="#0070FF" 
      />
      
      {/* Rocket Window */}
      <ellipse cx="20" cy="24" rx="3" ry="5" fill="white" />
      
      {/* Engine Flame (subtle) */}
      <path d="M18 37L20 40L22 37H18Z" fill="#FF5C00" />
    </svg>
  );
}
