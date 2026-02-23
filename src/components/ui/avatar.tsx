"use client";
import React from "react";

type AvatarProps = {
  src?: string;
  alt?: string;
  children?: React.ReactNode;
  className?: string;
};

export function Avatar({ src, alt = "Avatar", children, className = "" }: AvatarProps) {
  return (
    <span className={`avatar ${className}`}>
      {src ? <AvatarImage src={src} alt={alt} /> : <AvatarFallback>{children}</AvatarFallback>}
    </span>
  );
}

type AvatarImageProps = {
  src: string;
  alt?: string;
  className?: string;
};

export function AvatarImage({ src, alt = "Avatar", className = "" }: AvatarImageProps) {
  return <img src={src} alt={alt} className={`avatar-img ${className}`} />;
}

type AvatarFallbackProps = {
  children?: React.ReactNode;
  className?: string;
};

export function AvatarFallback({ children, className = "" }: AvatarFallbackProps) {
  return <span className={`avatar-fallback ${className}`}>{children || "?"}</span>;
}