import React from "react";

export function DashboardLogo(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 400"
      width={props.width || 40}
      height={props.height || 40}
      style={props.style}
      className={props.className}
    >
      {/* Background removed for transparency */}
      
      {/* Purple circle (back) */}
      <circle cx="140" cy="140" r="130" fill="#6B20FF"/>
      
      {/* White circle (front) */}
      <circle cx="260" cy="260" r="120" fill="white" stroke="#6B20FF" strokeWidth="3"/>
      
      {/* Dollar sign (white) on purple circle */}
      <text x="140" y="165" fontFamily="Arial, sans-serif" fontSize="120" fontWeight="bold" fill="white" textAnchor="middle">$</text>
      
      {/* Dollar sign (purple) on white circle */}
      <text x="260" y="285" fontFamily="Arial, sans-serif" fontSize="110" fontWeight="bold" fill="#6B20FF" textAnchor="middle">$</text>
    </svg>
  );
}
