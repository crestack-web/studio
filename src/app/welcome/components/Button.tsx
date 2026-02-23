"use client";
import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
  as?: "button" | "a";
  href?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  as = "button",
  href,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "font-semibold text-sm px-6 py-2 rounded-[10px] transition focus:outline-none";
  const styles =
    variant === "primary"
      ? "bg-purple-700 text-white shadow hover:bg-purple-800"
      : "border border-gray-200 text-gray-900 hover:border-purple-700 hover:text-purple-700";
  const classes = `${base} ${styles} ${className}`.trim();

  if (as === "a" && href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}