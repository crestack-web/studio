import React from 'react';

export function DollarIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 80 70" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="28" fill="#5F2EEA" />
      <text
        x="30"
        y="31"
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight="700"
        fontSize="26"
        fill="white"
        fontFamily="'Inter', 'Segoe UI', sans-serif"
      >
        $
      </text>
      <circle
        cx="52"
        cy="42"
        r="24"
        fill="white"
        stroke="#5F2EEA"
        strokeWidth="3"
      />
      <text
        x="52"
        y="43"
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight="700"
        fontSize="24"
        fill="#5F2EEA"
        fontFamily="'Inter', 'Segoe UI', sans-serif"
      >
        $
      </text>
    </svg>
  );
}
