'use client';

import React from 'react';

interface MoThinkingProps {
  size?: number;
}

export function MoThinking({ size = 40 }: MoThinkingProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Glow effect */}
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Body */}
      <ellipse
        cx="50"
        cy="75"
        rx="20"
        ry="12"
        fill="#1A8F8F"
        opacity="0.8"
      >
        <animate
          attributeName="ry"
          values="12;14;12"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* Main body */}
      <rect
        x="35"
        y="45"
        width="30"
        height="25"
        rx="10"
        fill="#F5C9A0"
      />

      {/* Head */}
      <circle
        cx="50"
        cy="35"
        r="18"
        fill="#F5C9A0"
      />

      {/* Hair */}
      <path
        d="M32 30 C32 20 68 20 68 30 L68 26 C68 18 32 18 32 26 Z"
        fill="#2C1A0E"
      />

      {/* Eyes */}
      <circle cx="44" cy="34" r="3.5" fill="#1A2B3C">
        <animate
          attributeName="cy"
          values="34;35;34"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="56" cy="34" r="3.5" fill="#1A2B3C">
        <animate
          attributeName="cy"
          values="34;35;34"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Eye highlights */}
      <circle cx="45" cy="33" r="1.2" fill="white" />
      <circle cx="57" cy="33" r="1.2" fill="white" />

      {/* Smile */}
      <path
        d="M44 40 Q50 45 56 40"
        stroke="#CC7A3A"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      >
        <animate
          attributeName="d"
          values="M44 40 Q50 45 56 40;M44 40 Q50 43 56 40;M44 40 Q50 45 56 40"
          dur="3s"
          repeatCount="indefinite"
        />
      </path>

      {/* Thinking bubble */}
      <circle cx="75" cy="20" r="3" fill="#6B3FE7" opacity="0.8">
        <animate
          attributeName="cy"
          values="20;18;20"
          dur="1s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.8;0.4;0.8"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="82" cy="15" r="2.5" fill="#6B3FE7" opacity="0.6">
        <animate
          attributeName="cy"
          values="15;13;15"
          dur="1.2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.6;0.2;0.6"
          dur="1.2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="88" cy="10" r="2" fill="#6B3FE7" opacity="0.4">
        <animate
          attributeName="cy"
          values="10;8;10"
          dur="1.4s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.4;0.1;0.4"
          dur="1.4s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Glow filter application */}
      <circle cx="75" cy="20" r="3" fill="#6B3FE7" filter="url(#glow)" opacity="0.6">
        <animate
          attributeName="cy"
          values="20;18;20"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
